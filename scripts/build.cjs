const { spawnSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const path = require('node:path');

const env = { ...process.env, OFFLINE_BUILD_ID: randomUUID() };
for (const script of ['node_modules/next/dist/bin/next', 'scripts/offline-assets.cjs']) {
  const args = [path.resolve(script), ...(script.endsWith('/next') ? ['build'] : [])];
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
