/**
 * Time-of-day tests.
 *
 * The cases are the ones that bite: midnight and noon on a twelve-hour clock,
 * wrapping past the end of the day, and snapping a value the picker could not
 * otherwise display.
 */
import assert from 'node:assert/strict'

import {
  buildHourOptions,
  buildMinuteOptions,
  clampTime,
  compareTime,
  dateWithTime,
  formatTime,
  from12Hour,
  isSameTime,
  minutesToTime,
  normalizeTime,
  parseTime,
  snapMinutes,
  timeFromDate,
  timeToMinutes,
  to12Hour,
} from '../src/utils/time.ts'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed += 1
  } catch (error) {
    failed += 1
    console.error(`FAIL  ${name}\n      ${error.message}`)
  }
}

const t = (hours, minutes) => ({ hours, minutes })

test('minutes round trip', () => {
  assert.equal(timeToMinutes(t(0, 0)), 0)
  assert.equal(timeToMinutes(t(14, 30)), 870)
  assert.deepEqual(minutesToTime(870), t(14, 30))
  assert.deepEqual(minutesToTime(0), t(0, 0))
})

test('time wraps around the end of the day instead of clamping', () => {
  // Adding an hour to 23:30 belongs at 00:30, not at 23:59
  assert.deepEqual(minutesToTime(timeToMinutes(t(23, 30)) + 60), t(0, 30))
  assert.deepEqual(normalizeTime(t(25, 0)), t(1, 0))
  assert.deepEqual(normalizeTime(t(0, 90)), t(1, 30))
  assert.deepEqual(minutesToTime(-30), t(23, 30))
})

test('comparison and equality work on the clock, not the object', () => {
  assert.ok(compareTime(t(9, 0), t(17, 0)) < 0)
  assert.ok(compareTime(t(23, 59), t(0, 0)) > 0)
  assert.equal(compareTime(t(8, 15), t(8, 15)), 0)
  assert.ok(isSameTime(t(8, 15), t(8, 15)))
  assert.ok(!isSameTime(t(8, 15), null))
})

test('clampTime pulls a value inside opening hours', () => {
  const open = t(9, 0)
  const close = t(17, 30)
  assert.deepEqual(clampTime(t(7, 0), open, close), open)
  assert.deepEqual(clampTime(t(22, 0), open, close), close)
  assert.deepEqual(clampTime(t(12, 0), open, close), t(12, 0))
  assert.deepEqual(clampTime(t(12, 0)), t(12, 0))
})

test('snapMinutes rounds to a value the picker can actually show', () => {
  assert.deepEqual(snapMinutes(t(14, 3), 5), t(14, 5))
  assert.deepEqual(snapMinutes(t(14, 2), 5), t(14, 0))
  assert.deepEqual(snapMinutes(t(14, 8), 15), t(14, 15))
  assert.deepEqual(snapMinutes(t(14, 7), 1), t(14, 7))
  // Rounding up from the last step of the hour carries into the next one
  assert.deepEqual(snapMinutes(t(14, 58), 15), t(15, 0))
  // And from the last hour of the day, back to the start
  assert.deepEqual(snapMinutes(t(23, 58), 15), t(0, 0))
})

test('minute options follow the step and stay inside the hour', () => {
  assert.deepEqual(buildMinuteOptions(15), [0, 15, 30, 45])
  assert.deepEqual(buildMinuteOptions(30), [0, 30])
  assert.equal(buildMinuteOptions(1).length, 60)
  assert.equal(buildMinuteOptions(5).length, 12)
  // Nonsense steps are corrected rather than trusted
  assert.deepEqual(buildMinuteOptions(0), buildMinuteOptions(1))
  assert.deepEqual(buildMinuteOptions(-5), buildMinuteOptions(1))
})

test('hour options lead with 12 on a twelve-hour clock', () => {
  assert.deepEqual(buildHourOptions(false).slice(0, 3), [0, 1, 2])
  assert.equal(buildHourOptions(false).length, 24)
  const twelve = buildHourOptions(true)
  assert.equal(twelve.length, 12)
  assert.equal(twelve[0], 12)
  assert.equal(twelve[1], 1)
  assert.equal(twelve[11], 11)
})

test('midnight and noon survive the twelve-hour conversion', () => {
  assert.deepEqual(to12Hour(0), { hour: 12, period: 'AM' })
  assert.deepEqual(to12Hour(12), { hour: 12, period: 'PM' })
  assert.deepEqual(to12Hour(13), { hour: 1, period: 'PM' })
  assert.deepEqual(to12Hour(23), { hour: 11, period: 'PM' })
  assert.equal(from12Hour(12, 'AM'), 0)
  assert.equal(from12Hour(12, 'PM'), 12)
  assert.equal(from12Hour(1, 'PM'), 13)
  assert.equal(from12Hour(11, 'PM'), 23)
})

test('every hour round trips through the twelve-hour clock', () => {
  for (let hour = 0; hour < 24; hour += 1) {
    const { hour: display, period } = to12Hour(hour)
    assert.equal(from12Hour(display, period), hour, `hour ${hour}`)
  }
})

test('formatting pads and picks a clock', () => {
  assert.equal(formatTime(t(9, 5), undefined, false), '09:05')
  assert.equal(formatTime(t(14, 30), undefined, false), '14:30')
  assert.equal(formatTime(t(0, 0), undefined, true), '12:00 AM')
  assert.equal(formatTime(t(12, 0), undefined, true), '12:00 PM')
  assert.equal(formatTime(t(13, 7), undefined, true), '1:07 PM')
})

test('parsing accepts what people type and rejects the rest', () => {
  assert.deepEqual(parseTime('14:30'), t(14, 30))
  assert.deepEqual(parseTime(' 9.05 '), t(9, 5))
  assert.deepEqual(parseTime('2:30 pm'), t(14, 30))
  assert.deepEqual(parseTime('12:00 AM'), t(0, 0))
  assert.equal(parseTime('24:00'), null)
  assert.equal(parseTime('12:60'), null)
  assert.equal(parseTime('13:00 PM'), null, 'thirteen has no meridiem')
  assert.equal(parseTime('half past two'), null)
  assert.equal(parseTime('1430'), null)
})

test('a time is copied onto a date without moving the day', () => {
  const day = new Date(2026, 8, 4, 23, 59, 59, 999)
  const applied = dateWithTime(day, t(8, 15))
  assert.equal(applied.getFullYear(), 2026)
  assert.equal(applied.getMonth(), 8)
  assert.equal(applied.getDate(), 4, 'the calendar day must not shift')
  assert.equal(applied.getHours(), 8)
  assert.equal(applied.getMinutes(), 15)
  assert.equal(applied.getSeconds(), 0, 'seconds are cleared, not carried')
  assert.deepEqual(timeFromDate(applied), t(8, 15))
})

console.log(`time: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
