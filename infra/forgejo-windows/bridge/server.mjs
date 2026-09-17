import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { URL } from 'node:url';

const cfg = {
  port: Number(process.env.PORT || 8788),
  forgejoUrl: String(process.env.FORGEJO_URL || 'http://forgejo:3000').replace(/\/+$/, ''),
  forgejoToken: String(process.env.FORGEJO_TOKEN || ''),
  bridgeKey: String(process.env.BRIDGE_KEY || ''),
  mergeKey: String(process.env.MERGE_KEY || ''),
  owner: String(process.env.FORGEJO_OWNER || ''),
  repo: String(process.env.FORGEJO_REPO || ''),
  allowMerge: String(process.env.ALLOW_MERGE || 'false').toLowerCase() === 'true',
  requireGreen: String(process.env.REQUIRE_GREEN_STATUS || 'true').toLowerCase() !== 'false',
};

for (const [key, value] of Object.entries({
  FORGEJO_TOKEN: cfg.forgejoToken,
  BRIDGE_KEY: cfg.bridgeKey,
  FORGEJO_OWNER: cfg.owner,
  FORGEJO_REPO: cfg.repo,
})) {
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
}

function json(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(payload);
}

function bearer(req) {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}

function timingSafeEqualText(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('Request body too large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(text);
}

async function forgejo(path, options = {}) {
  const response = await fetch(`${cfg.forgejoUrl}${path}`, {
    ...options,
    headers: {
      accept: 'application/json',
      authorization: `token ${cfg.forgejoToken}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    const err = new Error(`Forgejo API ${response.status}`);
    err.status = response.status;
    err.details = body;
    throw err;
  }
  return body;
}

const repoBase = () =>
  `/api/v1/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`;

async function pull(index) {
  return forgejo(`${repoBase()}/pulls/${index}`);
}

function pullHeadSha(pr) {
  return pr?.head?.sha || pr?.head?.repo?.sha || pr?.head_sha || null;
}

async function combinedStatus(sha) {
  return forgejo(`${repoBase()}/commits/${encodeURIComponent(sha)}/status`);
}

function isDraft(pr) {
  return Boolean(pr?.draft) || String(pr?.title || '').startsWith('WIP:');
}

function isOpen(pr) {
  return String(pr?.state || '').toLowerCase() === 'open';
}

function isMergeable(pr) {
  // Fail closed: the bridge only merges when Forgejo explicitly reports mergeable=true.
  return pr?.mergeable === true;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    try {
      const version = await forgejo('/api/v1/version');
      return json(res, 200, {
        ok: true,
        service: 'aio-forgejo-bridge',
        forgejo: version,
        repo: `${cfg.owner}/${cfg.repo}`,
        mergeEnabled: cfg.allowMerge,
      });
    } catch (error) {
      return json(res, 503, {
        ok: false,
        service: 'aio-forgejo-bridge',
        error: error.message,
      });
    }
  }

  if (!timingSafeEqualText(bearer(req), cfg.bridgeKey)) {
    return json(res, 401, { error: 'unauthorized' });
  }

  if (req.method === 'GET' && url.pathname === '/v1/repository') {
    return json(res, 200, await forgejo(repoBase()));
  }

  if (req.method === 'GET' && url.pathname === '/v1/pulls') {
    const state = url.searchParams.get('state') || 'open';
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 100);
    return json(
      res,
      200,
      await forgejo(`${repoBase()}/pulls?state=${encodeURIComponent(state)}&limit=${limit}`),
    );
  }

  const pullMatch = url.pathname.match(/^\/v1\/pulls\/(\d+)$/);
  if (req.method === 'GET' && pullMatch) {
    const index = Number(pullMatch[1]);
    const pr = await pull(index);
    const sha = pullHeadSha(pr);
    const status = sha ? await combinedStatus(sha) : null;
    return json(res, 200, { pull: pr, headSha: sha, combinedStatus: status });
  }

  const mergeMatch = url.pathname.match(/^\/v1\/pulls\/(\d+)\/merge$/);
  if (req.method === 'POST' && mergeMatch) {
    if (!cfg.allowMerge) {
      return json(res, 403, { error: 'merge_disabled' });
    }

    const suppliedMergeKey = String(req.headers['x-merge-key'] || '');
    if (!cfg.mergeKey || !timingSafeEqualText(suppliedMergeKey, cfg.mergeKey)) {
      return json(res, 401, { error: 'merge_key_required' });
    }

    const index = Number(mergeMatch[1]);
    const body = await readBody(req);
    if (body.confirmation !== 'MERGE') {
      return json(res, 400, { error: 'confirmation_must_equal_MERGE' });
    }
    if (!body.expectedHeadSha) {
      return json(res, 400, { error: 'expectedHeadSha_required' });
    }

    const pr = await pull(index);
    const sha = pullHeadSha(pr);

    if (!isOpen(pr)) return json(res, 409, { error: 'pull_not_open' });
    if (isDraft(pr)) return json(res, 409, { error: 'pull_is_draft' });
    if (!sha || sha !== body.expectedHeadSha) {
      return json(res, 409, {
        error: 'head_sha_changed',
        expected: body.expectedHeadSha,
        actual: sha,
      });
    }
    if (!isMergeable(pr)) {
      return json(res, 409, { error: 'pull_not_mergeable' });
    }

    const status = await combinedStatus(sha);
    if (cfg.requireGreen && String(status?.state || '').toLowerCase() !== 'success') {
      return json(res, 409, {
        error: 'combined_status_not_success',
        combinedStatus: status,
      });
    }

    const method = ['merge', 'squash', 'rebase', 'rebase-merge'].includes(body.method)
      ? body.method
      : 'merge';

    const result = await forgejo(`${repoBase()}/pulls/${index}/merge`, {
      method: 'POST',
      body: JSON.stringify({
        Do: method,
        head_commit_id: sha,
      }),
    });

    return json(res, 200, {
      merged: true,
      pull: index,
      headSha: sha,
      method,
      forgejo: result,
    });
  }

  return json(res, 404, { error: 'not_found' });
}

const server = http.createServer((req, res) => {
  Promise.resolve(handle(req, res)).catch((error) => {
    console.error(error);
    json(res, error.status && error.status < 600 ? error.status : 500, {
      error: error.message || 'internal_error',
      details: error.details || undefined,
    });
  });
});

server.listen(cfg.port, '0.0.0.0', () => {
  console.log(`aio-forgejo-bridge listening on 0.0.0.0:${cfg.port}`);
  console.log(`target repo: ${cfg.owner}/${cfg.repo}`);
  console.log(`merge enabled: ${cfg.allowMerge}`);
});
