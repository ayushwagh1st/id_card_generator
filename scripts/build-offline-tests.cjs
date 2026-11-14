const { spawnSync } = require('node:child_process');
const path = require('node:path');
const env = { ...process.env, NEXT_BUILD_DIR: '.next-offline-tests' };
const build = spawnSync(process.execPath, [path.resolve('scripts/build.cjs')], { env, stdio: 'inherit' });
process.exit(build.status === 0 ? 0 : 1);
