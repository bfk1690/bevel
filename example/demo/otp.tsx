import { useState } from 'react'
import { OtpInput, Text, toast } from 'bevel'

import { Demo, Stack } from './ui'

export function OtpDemo() {
  const [code, setCode] = useState('')
  const [short, setShort] = useState('')
  const [secure, setSecure] = useState('')

  return (
    <Stack>
      <Demo
        title="Six digits"
        note="One hidden input backs every cell. Per-cell inputs have to hand focus around, which breaks exactly where it matters: pasting a code, deleting backwards, and SMS autofill.">
        <OtpInput value={code} onChange={setCode} onComplete={() => toast.success('Code complete')} />
        <Text variant="caption" color="textMuted">
          {`value: ${code || '-'}`}
        </Text>
      </Demo>

      <Demo title="Four digits">
        <OtpInput length={4} value={short} onChange={setShort} />
      </Demo>

      <Demo title="Masked" note="For codes that unlock money rather than sessions.">
        <OtpInput secure value={secure} onChange={setSecure} />
      </Demo>

      <Demo title="Error">
        <OtpInput value="1234" onChange={() => {}} error />
      </Demo>

      <Demo title="Sizes">
        <OtpInput size="sm" length={4} value="12" onChange={() => {}} />
        <OtpInput size="md" length={4} value="12" onChange={() => {}} />
        <OtpInput size="lg" length={4} value="12" onChange={() => {}} />
      </Demo>

      <Demo title="Disabled">
        <OtpInput length={4} value="42" onChange={() => {}} disabled />
      </Demo>
    </Stack>
  )
}
