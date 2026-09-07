import { useState } from 'react'
import { Checkbox, Chip, ChipGroup, Radio, RadioGroup, Stepper, Switch, Text } from '@bfkk/bevel'

import { Demo, Row, Stack } from './ui'

export function SelectionDemo() {
  const [checked, setChecked] = useState(true)
  const [partial, setPartial] = useState(false)
  const [round, setRound] = useState(false)
  const [plan, setPlan] = useState('monthly')
  const [delivery, setDelivery] = useState('fast')
  const [alerts, setAlerts] = useState(true)
  const [filters, setFilters] = useState<string[]>(['new'])
  const [quantity, setQuantity] = useState(1)
  const [guests, setGuests] = useState(2)
  const [price, setPrice] = useState(250)
  const [tags, setTags] = useState<string[]>(['kahve'])
  const [size, setSize] = useState('m')

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

      <Demo
        title="Switch"
        note="Drag it as well as tap it. The platform switch has always worked that way, and a finger that lands on the thumb and pushes is making a clear statement - waiting for a tap instead feels like the control did not notice.">
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
        title="Stepper"
        note="Hold a button and it keeps counting, faster the longer you hold. Going from one to forty by tapping is forty taps, and the alternative is a keyboard for a number the user is only nudging.">
        <Row>
          <Stepper value={quantity} onChange={setQuantity} min={1} max={99} />
          <Text variant="caption" color="textMuted">
            {`min 1, max 99`}
          </Text>
        </Row>
        <Row>
          <Stepper value={guests} onChange={setGuests} min={1} max={8} size="sm" />
          <Stepper
            value={price}
            onChange={setPrice}
            step={50}
            min={0}
            max={2000}
            size="lg"
            formatValue={(value) => `${value} TL`}
          />
        </Row>
        <Row>
          <Stepper value={1} onChange={() => {}} min={1} max={1} />
          <Text variant="caption" color="textFaint">
            Both ends reached, so both buttons dim
          </Text>
        </Row>
        <Stepper value={quantity} onChange={setQuantity} disabled />
      </Demo>

      <Demo
        title="Chip groups"
        note="Selection lives with the group, so no caller writes the same add-unless-it-is-there logic again and gets it subtly different each time. Past a limit the rest collapse behind a count: a filter row that wraps to four lines has stopped being a row and started being a screen.">
        <ChipGroup
          options={[
            { value: 's', label: 'S' },
            { value: 'm', label: 'M' },
            { value: 'l', label: 'L' },
            { value: 'xl', label: 'XL' },
          ]}
          value={size}
          onChange={setSize}
        />
        <ChipGroup
          multiple
          max={4}
          options={[
            { value: 'kahve', label: 'Kahve' },
            { value: 'tatli', label: 'Tatlı' },
            { value: 'kahvalti', label: 'Kahvaltı' },
            { value: 'vegan', label: 'Vegan' },
            { value: 'glutensiz', label: 'Glutensiz' },
            { value: 'manzara', label: 'Manzaralı' },
            { value: 'calisma', label: 'Çalışmaya uygun' },
          ]}
          value={tags}
          onChange={(next) =>
            setTags((current) =>
              current.includes(next) ? current.filter((tag) => tag !== next) : [...current, next],
            )
          }
        />
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
