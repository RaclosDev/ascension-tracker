import console from 'node:console';
import process from 'node:process';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { gzipSync } from 'node:zlib';
import ts from 'typescript';

const dist = resolve(import.meta.dirname, '../dist');
const assets = await readdir(resolve(dist, 'assets'));
let failed = false;
function check(label, bytes, limit) {
  console.log(`${label}: ${bytes} / ${limit} bytes`);
  if (bytes > limit) failed = true;
}
for (const [extension, limit] of [['js', 180_000], ['css', 40_000]]) {
  const matches = assets.filter(name => new RegExp(`^index-.*\\.${extension}$`).test(name));
  if (matches.length !== 1) throw new Error(`Expected one main ${extension} asset, found ${matches.length}`);
  check(`Main ${extension} (gzip)`, gzipSync(await readFile(resolve(dist, 'assets', matches[0]))).length, limit);
}

// Read the emitted manifest, so exclusions cannot drift from the PWA build configuration.
const source = ts.createSourceFile('sw.js', await readFile(resolve(dist, 'sw.js'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const manifests = [];
function visit(node) {
  if (ts.isArrayLiteralExpression(node) && node.elements.length > 0) {
    const urls = node.elements.map(entry => {
      if (!ts.isObjectLiteralExpression(entry)) return null;
      const properties = entry.properties.filter(ts.isPropertyAssignment);
      const url = properties.find(property => property.name.getText(source).replaceAll('"', '') === 'url');
      const revision = properties.find(property => property.name.getText(source).replaceAll('"', '') === 'revision');
      return url && revision && ts.isStringLiteral(url.initializer) ? url.initializer.text : null;
    });
    if (urls.every(url => url !== null)) manifests.push(urls);
  }
  ts.forEachChild(node, visit);
}
visit(source);
if (manifests.length !== 1) throw new Error(`Expected one precache manifest, found ${manifests.length}`);
let total = 0;
for (const url of new Set(manifests[0])) {
  const file = resolve(dist, url);
  const path = relative(dist, file);
  if (path.startsWith('..') || isAbsolute(path)) throw new Error(`Precache path outside dist: ${url}`);
  total += (await stat(file)).size;
}
check('Precache (uncompressed)', total, 1_500_000);
if (failed) process.exitCode = 1;
