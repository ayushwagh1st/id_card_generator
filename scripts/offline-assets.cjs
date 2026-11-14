const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const base = path.resolve(__dirname, '..');
const buildRoot = path.join(base, process.env.NEXT_BUILD_DIR || '.next');
const staticRoot = path.join(buildRoot, 'static');
const build = fs.readFileSync(path.join(buildRoot, 'BUILD_ID'), 'utf8').trim();
if (!process.env.OFFLINE_BUILD_ID || build !== process.env.OFFLINE_BUILD_ID) throw new Error('Build identity mismatch. Use npm run build to prepare the complete offline release.');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}
const files = walk(staticRoot).filter(file => /\.(js|css|woff2?|ttf)$/.test(file));
const assets = files.map(file => '/_next/static/' + path.relative(staticRoot, file).split(path.sep).join('/')).sort();
if(!assets.some(asset=>asset.endsWith('.js')))throw new Error('No production JavaScript assets found. Offline preparation cannot be published.');
const revision = crypto.createHash('sha256').update(assets.join('\n')).digest('hex').slice(0, 16);
const output = path.join(staticRoot, build, 'offline-assets.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ build, revision, assets }));
const publicOutput = path.join(base, 'public', 'offline-releases', build, 'assets.json');
fs.mkdirSync(path.dirname(publicOutput), { recursive: true });
fs.writeFileSync(publicOutput, JSON.stringify({ build, revision, assets }));
console.log(`Offline manifest: ${assets.length} assets, build ${build}`);
