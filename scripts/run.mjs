/**
 * Runs every pure-layer suite.
 *
 * The list is DISCOVERED, not written down. It used to be twenty-six copies of
 * the same command in one line of package.json, and adding a suite meant
 * editing that line by hand - which is how one of them ended up invoked
 * without the module loader, passing for the wrong reason until the first test
 * that needed the React Native stub loaded the real one instead.
 *
 * A file called `scripts/test-*.mjs` is a suite, and a suite that exists runs.
 */
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'

const here = import.meta.dirname
const FLAGS = [
  '--experimental-strip-types',
  '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
  '--import',
  './scripts/register.mjs',
]

const suites = readdirSync(here)
  .filter((name) => /^test(-.+)?\.mjs$/.test(name))
  .sort()

/**
 * The theme suite runs three times.
 *
 * Scaling and shadow rules diverge by screen size and by platform, and those
 * are the paths a device only shows one of at a time.
 */
const EXTRA = [
  { file: 'test-theme.mjs', env: { BEVEL_TEST_WIDTH: '360', BEVEL_TEST_HEIGHT: '760' } },
  { file: 'test-theme.mjs', env: { BEVEL_TEST_PLATFORM: 'android' } },
]

let failed = 0
let total = 0

function run(file, env = {}) {
  const result = spawnSync(process.execPath, [...FLAGS, path.join('scripts', file)], {
    stdio: ['inherit', 'pipe', 'inherit'],
    env: { ...process.env, ...env },
    encoding: 'utf8',
  })

  const output = result.stdout ?? ''
  process.stdout.write(output)

  const counted = output.match(/(\d+) passed/)
  if (counted) total += Number(counted[1])
  if (result.status !== 0) failed += 1
}

for (const file of suites) run(file)

for (const pass of EXTRA) {
  // Named, because the suite labels itself by screen size and would otherwise
  // report the android run as an ordinary one
  console.log(`\n· ${pass.file} with ${Object.entries(pass.env).map(([key, value]) => `${key}=${value}`).join(' ')}`)
  run(pass.file, pass.env)
}

console.log(
  failed === 0
    ? `\n${suites.length} suites, ${total} assertions, all passing`
    : `\n${failed} of ${suites.length + EXTRA.length} runs FAILED`,
)
process.exit(failed === 0 ? 0 : 1)
