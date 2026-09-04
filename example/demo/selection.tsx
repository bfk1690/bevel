import { useState } from 'react'
import { Checkbox, Chip, Radio, RadioGroup, Switch } from 'bevel'

import { Demo, Row, Stack } from './ui'

export function SelectionDemo() {
  const [checked, setChecked] = useState(true)
  const [partial, setPartial] = useState(false)
  const [round, setRound] = useState(false)
  const [plan, setPlan] = useState('monthly')
  const [delivery, setDelivery] = useState('fast')
  const [alerts, setAlerts] = useState(true)
  const [filters, setFilters] = useState<string[]>(['new'])

  const toggle = (key: string) =>
    setFilters((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]))

  return (
    <Stack>
      <Demo title="Checkbox">
        <Checkbox checked={checked} onChange={setChecked} label="I agree to the terms" />
        <Checkbox
          checked={false}
          indeterminate={!partial}
          onChange={() => setPartial((p) => !p)}
          label="Select all"
          description="Indeterminate when only some children are selected"
        />
        <Checkbox checked={round} onChange={setRound} shape="round" label="Round, for selection markers" />
        <Checkbox checked reversed label="Reversed, for settings rows" onChange={() => {}} />
        <Checkbox checked={false} disabled label="Disabled" />
      </Demo>

      <Demo title="Checkbox sizes" row>
        <Checkbox checked size="sm" label="sm" onChange={() => {}} />
        <Checkbox checked size="md" label="md" onChange={() => {}} />
        <Checkbox checked size="lg" label="lg" onChange={() => {}} />
      </Demo>

      <Demo
        title="Radio group"
        note="The group owns the selection, so no caller writes unset-the-others logic, and it announces 2 of 4 to a screen reader.">
        <RadioGroup
          value={plan}
          onChange={setPlan}
          options={[
            { value: 'monthly', label: 'Monthly', description: 'Cancel anytime' },
            { value: 'yearly', label: 'Yearly', description: 'Two months free' },
            { value: 'lifetime', label: 'Lifetime', disabled: true },
          ]}
        />
      </Demo>

      <Demo title="Horizontal group">
        <RadioGroup
          horizontal
          value={delivery}
          onChange={setDelivery}
          options={[
            { value: 'fast', label: 'Express' },
            { value: 'standard', label: 'Standard' },
          ]}
        />
      </Demo>

      <Demo title="Single radio">
        <Radio selected onSelect={() => {}} label="Selected" />
        <Radio selected={false} onSelect={() => {}} label="Not selected" />
        <Radio selected={false} disabled label="Disabled" />
      </Demo>

      <Demo title="Switch">
        <Switch value={alerts} onChange={setAlerts} label="Alerts" description="Push and email" />
        <Row>
          <Switch value size="sm" onChange={() => {}} />
          <Switch value size="md" onChange={() => {}} />
          <Switch value size="lg" onChange={() => {}} />
          <Switch value={false} onChange={() => {}} />
          <Switch value disabled onChange={() => {}} />
        </Row>
      </Demo>

      <Demo
        title="Chips"
        note="Selection is carried by fill AND border, so it survives greyscale and reads for users who cannot separate the two hues.">
        <Row>
          {['new', 'popular', 'sale', 'sold out'].map((key) => (
            <Chip
              key={key}
              label={key}
              selected={filters.includes(key)}
              onPress={() => toggle(key)}
              disabled={key === 'sold out'}
            />
          ))}
        </Row>
        <Row>
          {filters.map((key) => (
            <Chip key={key} label={key} selected onRemove={() => toggle(key)} />
          ))}
        </Row>
      </Demo>
    </Stack>
  )
}
