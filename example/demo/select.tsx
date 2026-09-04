import { useState } from 'react'
import { Select, Text } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

const COUNTRIES = [
  { value: 'tr', label: 'Turkiye' },
  { value: 'de', label: 'Germany', description: 'Requires a visa' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'us', label: 'United States' },
  { value: 'jp', label: 'Japan' },
  { value: 'br', label: 'Brazil' },
  { value: 'za', label: 'South Africa' },
  { value: 'au', label: 'Australia', disabled: true },
]

export function SelectDemo() {
  const [single, setSingle] = useState<string | null>(null)
  const [searchable, setSearchable] = useState<string | null>('nl')
  const [many, setMany] = useState<string[]>(['design'])
  const [custom, setCustom] = useState<string | null>(null)

  return (
    <Stack>
      <Demo
        title="Single"
        note="Options open in a sheet rather than a platform picker: the two platforms disagree on what a picker looks like, and an inline list pushes the rest of the form off screen.">
        <Select
          label="Country"
          placeholder="Pick one"
          value={single}
          onChange={setSingle}
          options={COUNTRIES.slice(0, 4)}
        />
      </Demo>

      <Demo title="Searchable" note="Worth turning on past roughly a dozen options.">
        <Select
          label="Country"
          placeholder="Pick one"
          searchable
          searchPlaceholder="Type to filter"
          value={searchable}
          onChange={setSearchable}
          options={COUNTRIES}
        />
      </Demo>

      <Demo title="Multiple" note="A multi-select needs an explicit end, so it gets a done button.">
        <Select
          label="Interests"
          placeholder="Any"
          multiple
          value={many}
          onChange={setMany}
          doneLabel="Done"
          options={[
            { value: 'design', label: 'Design' },
            { value: 'code', label: 'Code' },
            { value: 'photo', label: 'Photography' },
            { value: 'music', label: 'Music' },
          ]}
        />
        <Text variant="caption" color="textMuted">
          {`selected: ${many.join(', ') || '-'}`}
        </Text>
      </Demo>

      <Demo title="States">
        <Select label="With helper" helper="Where the order will be shipped" value={null} onChange={() => {}} options={COUNTRIES.slice(0, 3)} placeholder="Pick one" />
        <Select label="Required and invalid" required error="Pick a country" value={null} onChange={() => {}} options={COUNTRIES.slice(0, 3)} placeholder="Pick one" />
        <Select label="Disabled" disabled value="tr" onChange={() => {}} options={COUNTRIES.slice(0, 3)} />
      </Demo>

      <Demo title="Variants" note="The closed control is drawn from the text field recipe, so a form does not change materials halfway down.">
        <Select variant="pill" placeholder="pill" value={custom} onChange={setCustom} options={COUNTRIES.slice(0, 3)} />
        <Select variant="plain" placeholder="plain" value={custom} onChange={setCustom} options={COUNTRIES.slice(0, 3)} />
      </Demo>
    </Stack>
  )
}
