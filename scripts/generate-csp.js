#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const POLICY_FILE = path.join(ROOT_DIR, 'scripts', 'csp-policy.json');
const NGINX_FILE = path.join(ROOT_DIR, 'frontend', 'security-headers.conf');
const VERCEL_FILE = path.join(ROOT_DIR, 'frontend', 'vercel.json');
const SECURITY_CONFIG_FILE = path.join(ROOT_DIR, 'backend', 'src', 'main', 'java', 'com', 'ascension', 'config', 'SecurityConfig.java');

function loadCanonicalCsp() {
  const raw = fs.readFileSync(POLICY_FILE, 'utf-8');
  const parsed = JSON.parse(raw);
  const directives = parsed.directives;
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

function extractFromNginx(content) {
  const match = content.match(/add_header\s+Content-Security-Policy\s+"([^"]+)"\s+always;/);
  return match ? match[1] : null;
}

function extractFromVercel(content) {
  const json = JSON.parse(content);
  for (const block of json.headers || []) {
    for (const h of block.headers || []) {
      if (h.key === 'Content-Security-Policy') {
        return h.value;
      }
    }
  }
  return null;
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
  let updatedVercelHeader = false;
  for (const block of vercelJson.headers || []) {
    for (const h of block.headers || []) {
      if (h.key === 'Content-Security-Policy') {
        h.value = csp;
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
