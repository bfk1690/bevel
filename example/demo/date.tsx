import { useState } from 'react'
import { Calendar, Card, DateField, Text, addDays, toISODate, type DateRange } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

const today = new Date()

export function DateDemo() {
  const [single, setSingle] = useState<Date | null>(null)
  const [range, setRange] = useState<DateRange>({ start: null, end: null })
  const [inline, setInline] = useState<Date | null>(today)
  const [bounded, setBounded] = useState<Date | null>(null)
  const [workday, setWorkday] = useState<Date | null>(null)
  const [locale, setLocale] = useState<Date | null>(today)

  return (
    <Stack>
      <Demo
        title="Single date"
        note="The sheet closes on pick, because the choice is complete. A platform picker was not used on purpose: the two platforms disagree on what a date picker is, and neither answer matches a themed app.">
        <DateField label="Birthday" placeholder="Pick a date" value={single} onChange={setSingle} />
        <Text variant="caption" color="textMuted">
          {`ISO value: ${single ? toISODate(single) : '-'}`}
        </Text>
      </Demo>

      <Demo
        title="Range"
        note="A range needs two taps and an explicit end, so it keeps a done button. A third tap starts over - asking the user to clear first is a step nobody takes.">
        <DateField label="Stay" range placeholder="Check in - check out" value={range} onChange={setRange} />
      </Demo>

      <Demo title="Bounds" note="Paging stops at the edge instead of wandering into months nothing can be picked in.">
        <DateField
          label="Within the next two weeks"
          placeholder="Pick a date"
          value={bounded}
          onChange={setBounded}
          minDate={today}
          maxDate={addDays(today, 14)}
          helper="minDate and maxDate"
        />
      </Demo>

      <Demo title="Blocked days" note="isDisabled runs per day - weekends, holidays, sold-out slots.">
        <DateField
          label="Weekdays only"
          placeholder="Pick a working day"
          value={workday}
          onChange={setWorkday}
          isDisabled={(date) => date.getDay() === 0 || date.getDay() === 6}
        />
      </Demo>

      <Demo title="States">
        <DateField label="Required and invalid" required error="Pick a date" value={null} onChange={() => {}} placeholder="Pick a date" />
        <DateField label="Disabled" disabled value={today} onChange={() => {}} />
        <DateField variant="pill" placeholder="pill variant" value={null} onChange={() => {}} />
      </Demo>

      <Demo
        title="Locale and week start"
        note="Month and weekday names come from Intl when the runtime has it, and fall back to English rather than throwing - a wrong month name is a flaw, a crash in a date picker is a broken app.">
        <DateField label="Turkish, week starts Monday" locale="tr-TR" value={locale} onChange={setLocale} />
        <DateField label="US English, week starts Sunday" locale="en-US" weekStart={0} value={locale} onChange={setLocale} />
      </Demo>

      <Demo title="Inline calendar" note="The grid is its own component when a field would be one tap too many.">
        <Card>
          <Calendar value={inline} onChange={setInline} />
        </Card>
      </Demo>

      <Demo title="Inline range">
        <Card>
          <Calendar range={range} onRangeChange={setRange} tone="ok" />
        </Card>
      </Demo>
    </Stack>
  )
}
