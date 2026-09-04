/**
 * Test-only module resolution.
 *
 * Two jobs:
 *
 * 1. Redirect `react-native` to the stub. The theme layer needs Dimensions,
 *    PixelRatio, Platform and StyleSheet - four pure functions once stubbed.
 *
 * 2. Add the extension Node insists on. The source is written for a bundler,
 *    where `./scale` is a complete specifier; Node's ESM resolver requires
 *    `./scale.ts`. Rewriting every import to please the test runner would be
 *    the tail wagging the dog.
 */
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const stub = pathToFileURL(path.resolve(import.meta.dirname, 'rn-stub.mjs')).href
const CANDIDATES = ['.ts', '.tsx', '/index.ts', '/index.tsx']

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'react-native') {
    return { url: stub, shortCircuit: true }
  }

  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    if (!specifier.startsWith('.')) throw error
    for (const extension of CANDIDATES) {
      try {
        return await nextResolve(specifier + extension, context)
      } catch {
        // keep trying
      }
    }
    throw error
  }
}
