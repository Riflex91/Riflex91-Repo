'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PROTECTED_MUTATION_APIS = Object.freeze([
  'attack',
  'move',
  'smart_move',
  'town',
  'use_hp',
  'use_mp',
  'use_hp_or_mp',
  'use_skill',
  'stop',
  'loot',
  'open_stand',
  'close_stand',
  'send_item',
  'send_gold',
  'sell',
  'bank_retrieve',
  'bank_store',
  'start_character',
  'stop_character',
  'send_party_invite',
  'accept_party_invite',
  'send_cm',
  'command_character'
]);

const PROTECTED = new Set(PROTECTED_MUTATION_APIS);
const BOUNDARY_FILE = path.normalize(path.join('src', 'game', 'adapter.js'));
const RAW_BINDING_HELPERS = Object.freeze(['_binding', '_function', '_readBinding', '_readFunction']);

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function normalizedRelative(rootDir, file) {
  return path.normalize(path.relative(rootDir, file));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskJavaScript(source, options = {}) {
  const preserveStrings = options.preserveStrings === true;
  const chars = [...String(source)];
  const out = chars.slice();
  let state = 'code';
  let quote = null;

  const blank = (index) => {
    if (out[index] !== '\n' && out[index] !== '\r') out[index] = ' ';
  };

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (state === 'line-comment') {
      if (ch === '\n' || ch === '\r') state = 'code';
      else blank(i);
      continue;
    }

    if (state === 'block-comment') {
      blank(i);
      if (ch === '*' && next === '/') {
        blank(i + 1);
        i += 1;
        state = 'code';
      }
      continue;
    }

    if (state === 'string') {
      if (!preserveStrings) blank(i);
      if (ch === '\\') {
        if (i + 1 < chars.length) {
          if (!preserveStrings) blank(i + 1);
          i += 1;
        }
        continue;
      }
      if (ch === quote) {
        state = 'code';
        quote = null;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      blank(i);
      blank(i + 1);
      i += 1;
      state = 'line-comment';
      continue;
    }
    if (ch === '/' && next === '*') {
      blank(i);
      blank(i + 1);
      i += 1;
      state = 'block-comment';
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      state = 'string';
      quote = ch;
      if (!preserveStrings) blank(i);
    }
  }

  return out.join('');
}

function lineColumn(source, index) {
  const before = source.slice(0, index);
  const line = before.split('\n').length;
  const lastBreak = before.lastIndexOf('\n');
  return { line, column: index - lastBreak };
}

function addViolation(violations, seen, source, fileName, index, api, kind) {
  const key = `${index}:${api}:${kind}`;
  if (seen.has(key)) return;
  seen.add(key);
  violations.push({ file: fileName, api, kind, ...lineColumn(source, index) });
}

function collectDeclaredNames(code) {
  const declared = new Set();
  const add = (name) => { if (name) declared.add(name); };
  let match;

  const namedDeclaration = /\b(?:function|class)\s+([A-Za-z_$][\w$]*)/g;
  while ((match = namedDeclaration.exec(code))) add(match[1]);

  const variableDeclaration = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g;
  while ((match = variableDeclaration.exec(code))) add(match[1]);

  const parameterLists = [
    /\bfunction(?:\s+[A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/g,
    /\(([^)]*)\)\s*=>/g
  ];
  for (const pattern of parameterLists) {
    while ((match = pattern.exec(code))) {
      for (const name of match[1].match(/[A-Za-z_$][\w$]*/g) || []) add(name);
    }
  }

  const singleArrow = /\b([A-Za-z_$][\w$]*)\s*=>/g;
  while ((match = singleArrow.exec(code))) add(match[1]);

  // Object/class method declarations such as `move(x) {}` are local symbols,
  // not Adventure Land globals. Scope precision is intentionally conservative:
  // a local declaration anywhere in the file suppresses the bare-call check for
  // that name, while raw root/parent property access is still always rejected.
  const methodDeclaration = /\b([A-Za-z_$][\w$]*)\s*\([^;{}]*\)\s*\{/g;
  while ((match = methodDeclaration.exec(code))) add(match[1]);

  return declared;
}

function findViolations(source, fileName = 'inline.js') {
  const raw = String(source);
  const code = maskJavaScript(raw, { preserveStrings: false });
  const codeWithStrings = maskJavaScript(raw, { preserveStrings: true });
  const violations = [];
  const seen = new Set();
  const declared = collectDeclaredNames(code);
  const apiAlternation = PROTECTED_MUTATION_APIS.map(escapeRegex).join('|');
  let match;

  const receiver = '(?:globalThis|window|parent|root|this\\.root|this\\.parent|[A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*\\.(?:root|parent))';
  const rawProperty = new RegExp(`\\b${receiver}\\s*\\.\\s*(${apiAlternation})\\b`, 'g');
  while ((match = rawProperty.exec(code))) {
    addViolation(violations, seen, raw, fileName, match.index, match[1], 'raw-property');
  }

  const rawElement = new RegExp(`\\b${receiver}\\s*\\[\\s*(['\"])(?:(${apiAlternation}))\\1\\s*\\]`, 'g');
  while ((match = rawElement.exec(codeWithStrings))) {
    addViolation(violations, seen, raw, fileName, match.index, match[2], 'raw-element');
  }

  const helperAlternation = RAW_BINDING_HELPERS.map(escapeRegex).join('|');
  const rawBinding = new RegExp(`(?:\\bthis\\s*\\.\\s*)?(?:${helperAlternation})\\s*\\(\\s*(['\"])(?:(${apiAlternation}))\\1`, 'g');
  while ((match = rawBinding.exec(codeWithStrings))) {
    addViolation(violations, seen, raw, fileName, match.index, match[2], 'raw-binding-helper');
  }

  const destructure = /\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*((?:globalThis|window|parent|root|this\.root|this\.parent|[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\.(?:root|parent)))\b/g;
  while ((match = destructure.exec(code))) {
    const body = match[1];
    const bodyOffset = match.index + match[0].indexOf(body);
    const names = /\b([A-Za-z_$][\w$]*)\b\s*(?=:|,|$)/g;
    let nameMatch;
    while ((nameMatch = names.exec(body))) {
      const api = nameMatch[1];
      if (PROTECTED.has(api)) addViolation(violations, seen, raw, fileName, bodyOffset + nameMatch.index, api, 'raw-destructure');
    }
  }

  const bareCall = new RegExp(`\\b(${apiAlternation})\\s*\\(`, 'g');
  while ((match = bareCall.exec(code))) {
    const api = match[1];
    const previous = match.index > 0 ? code[match.index - 1] : '';
    if (previous === '.' || previous === '$' || /[A-Za-z0-9_]/.test(previous)) continue;
    if (declared.has(api)) continue;
    addViolation(violations, seen, raw, fileName, match.index, api, 'raw-global-call');
  }

  return violations.sort((a, b) => a.line - b.line || a.column - b.column || a.api.localeCompare(b.api));
}

function scanSourceTree(projectRoot = path.resolve(__dirname, '..')) {
  const srcDir = path.join(projectRoot, 'src');
  const violations = [];
  for (const file of walkFiles(srcDir)) {
    if (normalizedRelative(projectRoot, file) === BOUNDARY_FILE) continue;
    const source = fs.readFileSync(file, 'utf8');
    violations.push(...findViolations(source, normalizedRelative(projectRoot, file)));
  }
  return violations;
}

function formatViolation(row) {
  return `${row.file}:${row.line}:${row.column} direct Adventure Land mutation '${row.api}' (${row.kind}) must use GameAdapter.command()`;
}

if (require.main === module) {
  const violations = scanSourceTree();
  if (violations.length) {
    console.error('Game command boundary guard failed:');
    for (const row of violations) console.error(` - ${formatViolation(row)}`);
    process.exitCode = 1;
  } else {
    console.log(`Game command boundary guard passed (${PROTECTED_MUTATION_APIS.length} protected APIs).`);
  }
}

module.exports = {
  PROTECTED_MUTATION_APIS,
  findViolations,
  scanSourceTree,
  formatViolation,
  maskJavaScript
};
