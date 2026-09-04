/**
 * Calendar arithmetic tests.
 *
 * Date code fails in ways that only show up on specific days - the end of a
 * month, a leap year, the week a month starts on a Sunday - so those are the
 * cases here rather than a happy path.
 */
import assert from 'node:assert/strict'

import {
  addDays,
  addMonths,
  buildMonthGrid,
  clampDate,
  daysInMonth,
  endOfMonth,
  formatMonthYear,
  fromISODate,
  isAfter,
  isBefore,
  isSameDay,
  isWithin,
  startOfDay,
  startOfMonth,
  toISODate,
  weekdayLabels,
} from '../src/utils/date.ts'

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

const d = (y, m, day) => new Date(y, m - 1, day)

test('startOfDay drops the clock but keeps the day', () => {
  const noon = new Date(2026, 1, 14, 13, 45, 30, 500)
  const start = startOfDay(noon)
  assert.equal(start.getHours(), 0)
  assert.equal(start.getDate(), 14)
  assert.equal(start.getMonth(), 1)
})

test('isSameDay ignores the time and tolerates nulls', () => {
  assert.ok(isSameDay(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 1, 0, 1)))
  assert.ok(!isSameDay(d(2026, 1, 1), d(2026, 1, 2)))
  assert.ok(!isSameDay(null, d(2026, 1, 1)))
  assert.ok(!isSameDay(undefined, undefined))
})

test('addDays crosses month and year boundaries', () => {
  assert.ok(isSameDay(addDays(d(2026, 1, 31), 1), d(2026, 2, 1)))
  assert.ok(isSameDay(addDays(d(2026, 12, 31), 1), d(2027, 1, 1)))
  assert.ok(isSameDay(addDays(d(2026, 3, 1), -1), d(2026, 2, 28)))
})

test('addMonths clamps the day instead of rolling into the next month', () => {
  // Without the clamp this lands on 3 March and paging skips February
  assert.ok(isSameDay(addMonths(d(2026, 1, 31), 1), d(2026, 2, 28)))
  assert.ok(isSameDay(addMonths(d(2026, 5, 31), 1), d(2026, 6, 30)))
  assert.ok(isSameDay(addMonths(d(2026, 3, 15), -1), d(2026, 2, 15)))
  assert.ok(isSameDay(addMonths(d(2026, 12, 15), 1), d(2027, 1, 15)))
})

test('leap years are handled by the platform, not by a table', () => {
  assert.equal(daysInMonth(2024, 1), 29)
  assert.equal(daysInMonth(2026, 1), 28)
  assert.equal(daysInMonth(2000, 1), 29)
  assert.equal(daysInMonth(1900, 1), 28)
  assert.ok(isSameDay(addMonths(d(2024, 1, 31), 1), d(2024, 2, 29)))
})

test('month bounds', () => {
  assert.ok(isSameDay(startOfMonth(d(2026, 2, 17)), d(2026, 2, 1)))
  assert.ok(isSameDay(endOfMonth(d(2026, 2, 17)), d(2026, 2, 28)))
  assert.ok(isSameDay(endOfMonth(d(2024, 2, 1)), d(2024, 2, 29)))
})

test('comparisons work on days, not milliseconds', () => {
  assert.ok(isBefore(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 2, 0, 1)))
  assert.ok(!isBefore(new Date(2026, 0, 1, 0, 1), new Date(2026, 0, 1, 23, 59)))
  assert.ok(isAfter(d(2026, 3, 2), d(2026, 3, 1)))
})

test('clampDate pulls a value inside the allowed range', () => {
  const min = d(2026, 6, 10)
  const max = d(2026, 6, 20)
  assert.ok(isSameDay(clampDate(d(2026, 6, 1), min, max), min))
  assert.ok(isSameDay(clampDate(d(2026, 6, 30), min, max), max))
  assert.ok(isSameDay(clampDate(d(2026, 6, 15), min, max), d(2026, 6, 15)))
  assert.ok(isSameDay(clampDate(d(2026, 6, 15)), d(2026, 6, 15)))
})

test('isWithin is inclusive and order-independent', () => {
  const a = d(2026, 4, 10)
  const b = d(2026, 4, 20)
  assert.ok(isWithin(a, a, b))
  assert.ok(isWithin(b, a, b))
  assert.ok(isWithin(d(2026, 4, 15), b, a), 'a reversed range still covers its middle')
  assert.ok(!isWithin(d(2026, 4, 21), a, b))
  assert.ok(!isWithin(a, a, null))
})

test('a month grid is always six weeks', () => {
  for (let month = 0; month < 12; month += 1) {
    assert.equal(buildMonthGrid(2026, month).length, 42, `month ${month}`)
  }
  // February 2026 starts on a Sunday - the tightest fit there is
  assert.equal(buildMonthGrid(2026, 1).length, 42)
})

test('the grid starts on the configured weekday', () => {
  const monday = buildMonthGrid(2026, 8, 1)
  assert.equal(monday[0].date.getDay(), 1)
  const sunday = buildMonthGrid(2026, 8, 0)
  assert.equal(sunday[0].date.getDay(), 0)
  const saturday = buildMonthGrid(2026, 8, 6)
  assert.equal(saturday[0].date.getDay(), 6)
})

test('the grid borrows the neighbouring days and marks them', () => {
  // September 2026 starts on a Tuesday, so a Monday grid borrows one day
  const cells = buildMonthGrid(2026, 8, 1)
  assert.equal(cells[0].inMonth, false)
  assert.ok(isSameDay(cells[0].date, d(2026, 8, 31)))
  assert.equal(cells[1].inMonth, true)
  assert.ok(isSameDay(cells[1].date, d(2026, 9, 1)))
  assert.equal(cells.filter((cell) => cell.inMonth).length, 30)
})

test('a month starting exactly on the week start borrows nothing at the front', () => {
  // 1 June 2026 is a Monday
  const cells = buildMonthGrid(2026, 5, 1)
  assert.equal(cells[0].inMonth, true)
  assert.ok(isSameDay(cells[0].date, d(2026, 6, 1)))
})

test('ISO round trip stays on the same local day', () => {
  assert.equal(toISODate(d(2026, 3, 7)), '2026-03-07')
  assert.equal(toISODate(d(2026, 12, 31)), '2026-12-31')
  const parsed = fromISODate('2026-03-07')
  assert.ok(parsed && isSameDay(parsed, d(2026, 3, 7)))
  assert.equal(parsed.getHours(), 0, 'parsing must not drift into UTC')
})

test('impossible dates are rejected instead of rolling forward', () => {
  assert.equal(fromISODate('2026-02-31'), null)
  assert.equal(fromISODate('2026-13-01'), null)
  assert.equal(fromISODate('not a date'), null)
  assert.equal(fromISODate('2026-3-7'), null)
  assert.ok(fromISODate('2024-02-29'), 'a real leap day is fine')
})

test('labels fall back instead of throwing on a trimmed runtime', () => {
  assert.equal(typeof formatMonthYear(d(2026, 5, 1)), 'string')
  assert.equal(typeof formatMonthYear(d(2026, 5, 1), 'tr-TR'), 'string')
  const labels = weekdayLabels(1)
  assert.equal(labels.length, 7)
  assert.equal(new Set(labels).size, 7, 'seven distinct weekdays')
})

test('every label names the day in its own column', () => {
  // The header and the grid are generated separately, so they can drift apart
  // by a day and still look plausible on their own. This ties them together.
  const format = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
  for (const weekStart of [0, 1, 5, 6]) {
    const cells = buildMonthGrid(2026, 8, weekStart)
    const labels = weekdayLabels(weekStart, 'en-US')
    for (let column = 0; column < 7; column += 1) {
      assert.equal(
        labels[column],
        format.format(cells[column].date),
        `weekStart ${weekStart}, column ${column}`,
      )
    }
  }
})

test('the first label is the configured week start', () => {
  assert.equal(weekdayLabels(1, 'en-US')[0], 'Mon')
  assert.equal(weekdayLabels(0, 'en-US')[0], 'Sun')
  assert.equal(weekdayLabels(6, 'en-US')[0], 'Sat')
})

console.log(`date: ${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
