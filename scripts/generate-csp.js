#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const POLICY_FILE = path.join(ROOT_DIR, 'scripts', 'csp-policy.json');
const NGINX_FILE = path.join(ROOT_DIR, 'frontend', 'security-headers.conf');
const VERCEL_FILE = path.join(ROOT_DIR, 'frontend', 'vercel.json');
const SECURITY_CONFIG_FILE = path.join(ROOT_DIR, 'backend', 'src', 'main', 'java', 'com', 'ascension', 'config', 'SecurityConfig.java');

function loadPolicy() {
  return JSON.parse(fs.readFileSync(POLICY_FILE, 'utf-8'));
}

function serialize(directives) {
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

function loadCanonicalCsp() {
  return serialize(loadPolicy().directives);
}

// La demo (/demo) usa la misma política salvo en quién puede enmarcarla.
function loadDemoCsp() {
  const policy = loadPolicy();
  return serialize({ ...policy.directives, ...policy.demo });
}

const isDemoBlock = (block) => block.source.startsWith('/demo');

function headerValue(block, key) {
  return (block.headers || []).find((h) => h.key === key)?.value ?? null;
}

function extractFromNginx(content) {
  const match = content.match(/add_header\s+Content-Security-Policy\s+"([^"]+)"\s+always;/);
  return match ? match[1] : null;
}

function extractFromVercel(content) {
  const json = JSON.parse(content);
  for (const block of json.headers || []) {
    if (isDemoBlock(block)) continue;
    const value = headerValue(block, 'Content-Security-Policy');
    if (value) return value;
  }
  return null;
}

// Fuera de /demo: X-Frame-Options y la política general. En /demo: sin X-Frame-Options y con la suya.
function checkVercelFraming(content, demoCsp) {
  const blocks = JSON.parse(content).headers || [];
  const general = blocks.find((block) => !isDemoBlock(block) && headerValue(block, 'Content-Security-Policy'));
  const demo = blocks.find(isDemoBlock);
  const errors = [];
  if (!general || general.source !== '/((?!demo/|demo$).*)') {
    errors.push('frontend/vercel.json: the general headers block must skip /demo (source "/((?!demo/|demo$).*)")');
  }
  if (!general || headerValue(general, 'X-Frame-Options') !== 'SAMEORIGIN') {
    errors.push('frontend/vercel.json: the general headers block must send X-Frame-Options: SAMEORIGIN');
  }
  if (!demo || demo.source !== '/demo(/.*)?') {
    errors.push('frontend/vercel.json: missing the /demo headers block (source "/demo(/.*)?")');
  } else {
    if (headerValue(demo, 'Content-Security-Policy') !== demoCsp) {
      errors.push(`frontend/vercel.json /demo block diverges from the demo policy:\n  Found:     ${headerValue(demo, 'Content-Security-Policy')}\n  Canonical: ${demoCsp}`);
    }
    if (headerValue(demo, 'X-Frame-Options') !== null) {
      errors.push('frontend/vercel.json: the /demo block must not send X-Frame-Options (the portfolio frames it)');
    }
    const shared = (block) =>
      JSON.stringify(block.headers.filter((h) => !['X-Frame-Options', 'Content-Security-Policy'].includes(h.key)));
    if (general && shared(demo) !== shared(general)) {
      errors.push('frontend/vercel.json: the /demo block must repeat the other security headers of the general block');
    }
  }
  return errors;
}

function extractFromSecurityConfig(content) {
  const match = content.match(/public\s+static\s+final\s+String\s+CSP_POLICY\s*=\s*"([^"]+)";/);
  return match ? match[1] : null;
}

function syncCsp() {
  const csp = loadCanonicalCsp();

  // 1. Update frontend/security-headers.conf
  const nginxContent = fs.readFileSync(NGINX_FILE, 'utf-8');
  const updatedNginx = nginxContent.replace(
    /add_header\s+Content-Security-Policy\s+"[^"]+"\s+always;/,
    `add_header Content-Security-Policy "${csp}" always;`
  );
  fs.writeFileSync(NGINX_FILE, updatedNginx, 'utf-8');
  console.log('✓ Updated frontend/security-headers.conf');

  // 2. Update frontend/vercel.json
  const vercelContent = fs.readFileSync(VERCEL_FILE, 'utf-8');
  const vercelJson = JSON.parse(vercelContent);
  const demoCsp = loadDemoCsp();
  let updatedVercelHeader = false;
  for (const block of vercelJson.headers || []) {
    for (const h of block.headers || []) {
      if (h.key === 'Content-Security-Policy') {
        h.value = isDemoBlock(block) ? demoCsp : csp;
        updatedVercelHeader = true;
      }
    }
  }
  if (!updatedVercelHeader) {
    throw new Error('Content-Security-Policy header entry not found in vercel.json');
  }
  fs.writeFileSync(VERCEL_FILE, JSON.stringify(vercelJson, null, 2) + '\n', 'utf-8');
  console.log('✓ Updated frontend/vercel.json');

  // 3. Update backend/src/main/java/com/ascension/config/SecurityConfig.java
  const secContent = fs.readFileSync(SECURITY_CONFIG_FILE, 'utf-8');
  const updatedSec = secContent.replace(
    /public\s+static\s+final\s+String\s+CSP_POLICY\s*=\s*"[^"]+";/,
    `public static final String CSP_POLICY = "${csp}";`
  );
  fs.writeFileSync(SECURITY_CONFIG_FILE, updatedSec, 'utf-8');
  console.log('✓ Updated backend SecurityConfig.java');
}

function checkCsp() {
  const canonical = loadCanonicalCsp();
  const errors = [];

  const nginxContent = fs.readFileSync(NGINX_FILE, 'utf-8');
  const nginxCsp = extractFromNginx(nginxContent);
  if (nginxCsp !== canonical) {
    errors.push(`frontend/security-headers.conf diverges from canonical policy:\n  Found:     ${nginxCsp}\n  Canonical: ${canonical}`);
  }

  const vercelContent = fs.readFileSync(VERCEL_FILE, 'utf-8');
  const vercelCsp = extractFromVercel(vercelContent);
  if (vercelCsp !== canonical) {
    errors.push(`frontend/vercel.json diverges from canonical policy:\n  Found:     ${vercelCsp}\n  Canonical: ${canonical}`);
  }
  errors.push(...checkVercelFraming(vercelContent, loadDemoCsp()));

  const secContent = fs.readFileSync(SECURITY_CONFIG_FILE, 'utf-8');
  const secCsp = extractFromSecurityConfig(secContent);
  if (secCsp !== canonical) {
    errors.push(`backend SecurityConfig.java diverges from canonical policy:\n  Found:     ${secCsp}\n  Canonical: ${canonical}`);
  }

  if (errors.length > 0) {
    console.error('CSP Synchronization check failed:\n');
    errors.forEach((err) => console.error(err + '\n'));
    process.exit(1);
  }

  console.log('✓ All CSP policy declarations are synchronized with scripts/csp-policy.json');
}

module.exports = {
  loadCanonicalCsp,
  loadDemoCsp,
  extractFromNginx,
  extractFromVercel,
  extractFromSecurityConfig,
  syncCsp,
  checkCsp
};

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--check')) {
    checkCsp();
  } else {
    syncCsp();
    checkCsp();
  }
}
