import { useState } from 'react'
import { Card, Text, TimeField, TimePicker, formatTime, type TimeValue } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

export function TimeDemo() {
  const [basic, setBasic] = useState<TimeValue | null>(null)
  const [meeting, setMeeting] = useState<TimeValue | null>({ hours: 9, minutes: 30 })
  const [shift, setShift] = useState<TimeValue | null>(null)
  const [inline, setInline] = useState<TimeValue>({ hours: 14, minutes: 0 })

  return (
    <Stack>
      <Demo
        title="Basic"
        note="A wheel rather than a platform picker: the native ones cannot be themed, differ from each other, and on Android a two-number decision takes over the whole screen.">
        <TimeField label="Alarm" placeholder="Pick a time" value={basic} onChange={setBasic} />
        <Text variant="caption" color="textMuted">
          {`value: ${basic ? formatTime(basic, undefined, false) : '-'}`}
        </Text>
      </Demo>

      <Demo
        title="Minute steps"
        note="An incoming value is snapped to the step, so the wheel never rests between two rows.">
        <TimeField label="Every 5 minutes" minuteStep={5} value={meeting} onChange={setMeeting} />
        <TimeField label="Every 15 minutes" minuteStep={15} value={meeting} onChange={setMeeting} />
      </Demo>

      <Demo title="Twelve and twenty-four hour" note="Follows the locale unless you say otherwise.">
        <TimeField label="Twelve hour" use12Hour value={meeting} onChange={setMeeting} />
        <TimeField label="Twenty-four hour" use12Hour={false} value={meeting} onChange={setMeeting} />
      </Demo>

      <Demo title="Bounds" note="Scrolling past the limit lands back on it.">
        <TimeField
          label="Opening hours"
          helper="09:00 to 17:30"
          minTime={{ hours: 9, minutes: 0 }}
          maxTime={{ hours: 17, minutes: 30 }}
          minuteStep={15}
          value={shift}
          onChange={setShift}
          defaultTime={{ hours: 9, minutes: 0 }}
        />
      </Demo>

      <Demo title="States">
        <TimeField label="Required and invalid" required error="Pick a time" value={null} onChange={() => {}} placeholder="Pick a time" />
        <TimeField label="Disabled" disabled value={{ hours: 8, minutes: 0 }} onChange={() => {}} />
        <TimeField variant="pill" placeholder="pill variant" value={null} onChange={() => {}} />
      </Demo>

      <Demo
        title="Inline picker"
        note="The wheel on its own, for a screen where a field would be one tap too many.">
        <Card>
          <TimePicker value={inline} onChange={setInline} minuteStep={5} />
          <Text variant="caption" color="textMuted" align="center">
            {formatTime(inline)}
          </Text>
        </Card>
      </Demo>
    </Stack>
  )
}
