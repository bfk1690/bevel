import { useState } from 'react'
import { Slider, Text } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

export function SliderDemo() {
  const [volume, setVolume] = useState(60)
  const [quality, setQuality] = useState(3)
  const [price, setPrice] = useState<[number, number]>([200, 800])
  const [settled, setSettled] = useState(60)
  const [odd, setOdd] = useState(0)

  return (
    <Stack>
      <Demo title="Continuous">
        <Slider label="Volume" showValue value={volume} onChange={setVolume} />
      </Demo>

      <Demo
        title="Stepped"
        note="Steps count from the minimum, not from zero - a five-step slider starting at 2 offers 2, 7, 12, never 0, 5, 10.">
        <Slider
          label="Quality"
          value={quality}
          onChange={setQuality}
          min={1}
          max={5}
          step={1}
          showValue
          formatValue={(value) => ['Draft', 'Low', 'Medium', 'High', 'Original'][value - 1] ?? ''}
        />
      </Demo>

      <Demo
        title="A step that does not divide the range"
        note="Zero to ten in threes ends at nine. The maximum stays reachable anyway: a slider that cannot reach its own end when dragged all the way there reads as broken.">
        <Slider label="0 to 10, step 3" value={odd} onChange={setOdd} min={0} max={10} step={3} showValue />
      </Demo>

      <Demo
        title="Range"
        note="Whichever bound the finger lands nearer to is the one it drags, decided once so it cannot swap mid-gesture. A tie goes to the upper bound, so a collapsed range can still be opened.">
        <Slider
          range
          label="Price"
          value={price}
          onChange={setPrice}
          min={0}
          max={1000}
          step={50}
          showValue
          formatValue={(value) => `${value} TL`}
        />
      </Demo>

      <Demo
        title="Continuous and settled"
        note="onChange fires all the way through the drag, onSettle once when the finger lifts. Anything expensive belongs on the second.">
        <Slider
          label="Drag me"
          value={settled}
          onChange={setSettled}
          onSettle={(value) => setSettled(Math.round(value))}
          showValue
        />
        <Text variant="caption" color="textFaint">
          {`settled at ${Math.round(settled)}`}
        </Text>
      </Demo>

      <Demo title="Tone and thickness">
        <Slider value={volume} onChange={setVolume} tone="ok" height={8} />
        <Slider value={volume} onChange={setVolume} tone="#8E4EC6" height={2} />
      </Demo>

      <Demo title="Disabled">
        <Slider value={40} onChange={() => {}} disabled label="Locked" showValue />
      </Demo>
    </Stack>
  )
}
