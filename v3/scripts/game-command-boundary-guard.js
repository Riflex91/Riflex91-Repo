'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

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
  'bank_store',
  'start_character',
  'stop_character',
  'send_party_invite',
  'accept_party_invite',
  'send_cm',
  'command_character'
]);

const PROTECTED = new Set(PROTECTED_MUTATION_APIS);
const RAW_BINDING_HELPERS = new Set(['_binding', '_function', '_readBinding', '_readFunction']);
const BOUNDARY_FILE = path.normalize(path.join('src', 'game', 'adapter.js'));

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

function rawReceiverText(node, sourceFile) {
  const text = node.getText(sourceFile);
  return text === 'globalThis'
    || text === 'window'
    || text === 'parent'
    || text === 'root'
    || text === 'this.root'
    || text === 'this.parent'
    || text.includes('.root')
    || text.includes('.parent');
}

function position(sourceFile, node) {
  const lc = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: lc.line + 1, column: lc.character + 1 };
}

function violation(sourceFile, node, api, kind) {
  return {
    file: sourceFile.fileName,
    api,
    kind,
    ...position(sourceFile, node)
  };
}

function collectDeclaredNames(sourceFile) {
  const declared = new Set();
  function visit(node) {
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) declared.add(node.name.text);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) declared.add(node.name.text);
    if (ts.isParameter(node) && ts.isIdentifier(node.name)) declared.add(node.name.text);
    if (ts.isImportClause(node) && node.name) declared.add(node.name.text);
    if (ts.isImportSpecifier(node)) declared.add((node.propertyName || node.name).text);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return declared;
}

function findViolations(source, fileName = 'inline.js') {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const violations = [];
  const declared = collectDeclaredNames(sourceFile);

  function visit(node) {
    if (ts.isPropertyAccessExpression(node)) {
      const api = node.name.text;
      if (PROTECTED.has(api) && rawReceiverText(node.expression, sourceFile)) {
        violations.push(violation(sourceFile, node, api, 'raw-property'));
      }
    }

    if (ts.isElementAccessExpression(node)
      && node.argumentExpression
      && (ts.isStringLiteral(node.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(node.argumentExpression))) {
      const api = node.argumentExpression.text;
      if (PROTECTED.has(api) && rawReceiverText(node.expression, sourceFile)) {
        violations.push(violation(sourceFile, node, api, 'raw-element'));
      }
    }

    if (ts.isVariableDeclaration(node)
      && ts.isObjectBindingPattern(node.name)
      && node.initializer
      && rawReceiverText(node.initializer, sourceFile)) {
      for (const element of node.name.elements) {
        const name = element.propertyName || element.name;
        if (ts.isIdentifier(name) && PROTECTED.has(name.text)) {
          violations.push(violation(sourceFile, element, name.text, 'raw-destructure'));
        }
      }
    }

    if (ts.isCallExpression(node)) {
      if (ts.isPropertyAccessExpression(node.expression)
        && RAW_BINDING_HELPERS.has(node.expression.name.text)
        && node.arguments.length
        && (ts.isStringLiteral(node.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(node.arguments[0]))) {
        const api = node.arguments[0].text;
        if (PROTECTED.has(api)) violations.push(violation(sourceFile, node, api, 'raw-binding-helper'));
      }

      if (ts.isIdentifier(node.expression)) {
        const api = node.expression.text;
        if (PROTECTED.has(api) && !declared.has(api)) {
          violations.push(violation(sourceFile, node, api, 'raw-global-call'));
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function scanSourceTree(projectRoot = path.resolve(__dirname, '..')) {
  const srcDir = path.join(projectRoot, 'src');
  const violations = [];
  for (const file of walkFiles(srcDir)) {
    if (normalizedRelative(projectRoot, file) === BOUNDARY_FILE) continue;
    const source = fs.readFileSync(file, 'utf8');
    for (const row of findViolations(source, normalizedRelative(projectRoot, file))) violations.push(row);
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
  formatViolation
};
