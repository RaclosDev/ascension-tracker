import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('CSP Policy Synchronization (Single Source of Truth)', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const policyFile = path.join(rootDir, 'scripts', 'csp-policy.json');
  const nginxFile = path.join(rootDir, 'frontend', 'security-headers.conf');
  const vercelFile = path.join(rootDir, 'frontend', 'vercel.json');
  const securityConfigFile = path.join(
    rootDir,
    'backend',
    'src',
    'main',
    'java',
    'com',
    'ascension',
    'config',
    'SecurityConfig.java',
  );

  const policyJson = JSON.parse(fs.readFileSync(policyFile, 'utf-8'));
  const directives = policyJson.directives;
  const canonicalCsp = Object.entries(directives)
    .map(([key, values]) => `${key} ${(values as string[]).join(' ')}`)
    .join('; ');

  it('canonical CSP policy should not contain wildcard domains or generic https: in img-src', () => {
    const connectSrc = directives['connect-src'] as string[];
    expect(connectSrc).toBeDefined();
    for (const origin of connectSrc) {
      expect(origin).not.toContain('*.herokuapp.com');
      expect(origin).not.toContain('*.raclos.es');
      expect(origin).not.toContain('*');
    }

    const imgSrc = directives['img-src'] as string[];
    expect(imgSrc).toBeDefined();
    expect(imgSrc).not.toContain('https:');
    expect(imgSrc).toContain('https://lh3.googleusercontent.com');
    expect(imgSrc).toContain('https://images.openfoodfacts.org');
  });

  it('frontend/security-headers.conf must match the canonical CSP policy', () => {
    const nginxContent = fs.readFileSync(nginxFile, 'utf-8');
    const match = nginxContent.match(/add_header\s+Content-Security-Policy\s+"([^"]+)"\s+always;/);
    expect(match).not.toBeNull();
    const nginxCsp = match![1];
    expect(nginxCsp).toBe(canonicalCsp);
  });

  it('frontend/vercel.json must match the canonical CSP policy', () => {
    const vercelContent = fs.readFileSync(vercelFile, 'utf-8');
    const vercelJson = JSON.parse(vercelContent);
    let vercelCsp: string | null = null;
    for (const block of vercelJson.headers || []) {
      for (const h of block.headers || []) {
        if (h.key === 'Content-Security-Policy') {
          vercelCsp = h.value;
        }
      }
    }
    expect(vercelCsp).not.toBeNull();
    expect(vercelCsp).toBe(canonicalCsp);
  });

  it('backend SecurityConfig.java CSP_POLICY must match the canonical CSP policy', () => {
    const secContent = fs.readFileSync(securityConfigFile, 'utf-8');
    const match = secContent.match(/public\s+static\s+final\s+String\s+CSP_POLICY\s*=\s*"([^"]+)";/);
    expect(match).not.toBeNull();
    const javaCsp = match![1];
    expect(javaCsp).toBe(canonicalCsp);
  });
});
