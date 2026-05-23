const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const root = join(__dirname, '..');
const androidDir = join(root, 'android');
const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const npx = isWindows ? 'npx.cmd' : 'npx';
const gradle = isWindows ? 'gradlew.bat' : './gradlew';

function run(command, args, cwd) {
  const result = isWindows
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', [command, ...args].join(' ')], {
      cwd,
      stdio: 'inherit',
    })
    : spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(npm, ['run', 'build'], root);
run(npx, ['cap', 'sync', 'android'], root);
run(gradle, ['bundleRelease'], androidDir);
