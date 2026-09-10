import assert from 'node:assert/strict';

const base = new URL(process.argv[2] ?? 'http://127.0.0.1:8787');
assert.ok(['http:', 'https:'].includes(base.protocol), 'Use an HTTP or HTTPS URL.');
assert.ok(!base.username && !base.password, 'The test URL must not contain credentials.');

// index.html is served at /; static hosts may redirect its filename to this URL.
const resources = [
  ['/', ['text/html']],
  ['/style.css', ['text/css']],
  ['/journey.js', ['text/javascript', 'application/javascript']],
  ['/runtime.mjs', ['text/javascript', 'application/javascript']],
  ['/campaign.mjs', ['text/javascript', 'application/javascript']],
  ['/renderer-v3.mjs', ['text/javascript', 'application/javascript']],
  ...['characters', 'wudang', 'lake', 'town', 'forest', 'snow'].map(name => [
    `/assets/${name}.png`, ['image/png'],
  ]),
];

async function anonymousGet(path) {
  const response = await fetch(new URL(path, base), {
    method: 'GET',
    credentials: 'omit',
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.headers.get('www-authenticate'), null, `${path}: authentication challenge`);
  assert.equal(response.headers.get('set-cookie'), null, `${path}: unexpected cookie`);
  assert.ok(response.status < 300 || response.status >= 400, `${path}: unexpected redirect (${response.status})`);
  return response;
}

async function checkResource([path, mimeTypes]) {
  const response = await anonymousGet(path);
  assert.equal(response.status, 200, `${path}: must be accessible without login`);
  const mime = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  assert.ok(mimeTypes.includes(mime), `${path}: unexpected MIME ${mime ?? '(missing)'}`);
  const bytes = await response.arrayBuffer();
  assert.ok(bytes.byteLength > 0, `${path}: empty response`);
  if (path === '/') {
    const html = new TextDecoder().decode(bytes);
    assert.match(html, /<canvas\b[^>]*\bid=["']world["']/i, 'Homepage must contain the game canvas.');
    assert.match(html, /<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']\.\/journey\.js["']/i,
      'Homepage must load the game module.');
  }
}

const unavailablePaths = [
  '/assets/hosting-smoke-missing-file.png',
  '/wrangler.jsonc',
  '/package.json',
  '/.git/config',
  '/tests/validate-hosting.mjs',
  '/.openai/hosting.json',
];

async function checkUnavailable(path) {
  const response = await anonymousGet(path);
  await response.arrayBuffer();
  assert.equal(response.status, 404, `${path}: must not expose a file or return the game fallback`);
}

try {
  // Keep asset downloads in small batches, including when testing a public deployment.
  for (let index = 0; index < resources.length; index += 3) {
    await Promise.all(resources.slice(index, index + 3).map(checkResource));
  }
  await Promise.all(unavailablePaths.map(checkUnavailable));
  console.log(`Hosting checks passed at ${base.origin}: ${resources.length} anonymous game resources; ${unavailablePaths.length} unavailable paths.`);
} catch (error) {
  console.error(`Hosting checks failed: ${error.message}`);
  process.exitCode = 1;
}
