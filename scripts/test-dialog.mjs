/**
 * Dialog store tests.
 *
 * The queue is the whole point: every dialog has somebody awaiting its answer,
 * so a dropped one is a promise that never settles - and the caller is usually
 * holding a spinner or a half-finished save while it waits.
 */
import assert from 'node:assert/strict'

import {
  clearDialogs,
  currentDialog,
  dialog,
  dialogStore,
  resolveDialog,
} from '../src/feedback/dialog-store.ts'

let passed = 0
let failed = 0

// Collected rather than run on the spot: half of these await an answer, and a
// runner that ignored the returned promise would report a failed assertion as
// an unhandled rejection - a suite that cannot fail is worse than none
const tests = []

function test(name, run) {
  tests.push([name, run])
}

test('an answer reaches the caller', async () => {
  const answer = dialog.confirm({ title: 'Delete this?' })
  const request = currentDialog()
  assert.ok(request, 'it is on screen')
  assert.equal(request.kind, 'confirm')

  resolveDialog(request.id, true)
  assert.equal(await answer, true)
  assert.equal(currentDialog(), null, 'and it leaves')
})

test('a second question waits rather than replacing the first', async () => {
  const first = dialog.confirm({ title: 'First' })
  const second = dialog.confirm({ title: 'Second' })

  assert.equal(currentDialog().title, 'First', 'the newest does NOT take the screen')

  resolveDialog(currentDialog().id, true)
  assert.equal(await first, true)

  assert.equal(currentDialog().title, 'Second', 'and the next one comes up on its own')
  resolveDialog(currentDialog().id, false)
  assert.equal(await second, false)
})

test('answering one that has already gone does nothing', () => {
  const request = { id: 'dialog-does-not-exist' }
  resolveDialog(request.id, true)
  assert.equal(currentDialog(), null)

  dialog.confirm({ title: 'Still here' })
  resolveDialog('dialog-does-not-exist', true)
  assert.equal(currentDialog().title, 'Still here', 'the real one is untouched')
})

test('clearing answers everything instead of dropping it', async () => {
  const confirmed = dialog.confirm({ title: 'Confirm' })
  const prompted = dialog.prompt({ title: 'Prompt' })

  clearDialogs()

  // Each kind gets the answer its caller can handle: false is not a name
  assert.equal(await confirmed, false)
  assert.equal(await prompted, null)
  assert.equal(currentDialog(), null)
})

test('a prompt carries what it needs to render', () => {
  dialog.prompt({ title: 'Rename', defaultValue: 'Untitled', placeholder: 'Name' })
  const request = currentDialog()
  assert.equal(request.kind, 'prompt')
  assert.equal(request.defaultValue, 'Untitled')
  assert.equal(request.placeholder, 'Name')
})

test('subscribers hear about both directions', () => {
  let calls = 0
  const stop = dialogStore.subscribe(() => {
    calls += 1
  })

  dialog.alert({ title: 'Raised' })
  assert.equal(calls, 1, 'raising notifies')

  resolveDialog(currentDialog().id, true)
  assert.equal(calls, 2, 'answering notifies')

  stop()
  dialog.alert({ title: 'Unheard' })
  assert.equal(calls, 2, 'and unsubscribing stops it')
})

test('ids are unique, so two identical questions stay separate', () => {
  dialog.confirm({ title: 'Same' })
  dialog.confirm({ title: 'Same' })
  const { queue } = dialogStore.getSnapshot()
  assert.equal(queue.length, 2)
  assert.notEqual(queue[0].id, queue[1].id)
})

for (const [name, run] of tests) {
  try {
    clearDialogs()
    await run()
    passed += 1
  } catch (error) {
    failed += 1
    console.error(`  x ${name}\n    ${error.message}`)
  }
}

console.log(`dialog: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
