import { useState } from 'react'
import { View } from 'react-native'
import { Button, Input, KeyboardStickyFooter, Text, useTheme } from 'bevel'

import { Demo, Stack } from './ui'

export function KeyboardDemo() {
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const { space } = useTheme()

  return (
    <View style={{ gap: space(6) }}>
      <Stack>
        <Demo
          title="Keyboard-aware screen"
          note="Screen accepts keyboardAware, which lifts the whole content above the keyboard. Required on any screen with a field; skip it elsewhere so the layout does not shift for no reason.">
          <Input label="Try me" value={value} onChangeText={setValue} placeholder="Focus this" />
        </Demo>

        <Demo
          title="Sticky footer"
          note="A footer inside a keyboard-avoiding view moves with the whole screen, which scrolls the field being typed in out of sight. This one translates by the keyboard height alone and leaves the content where it is. Focus the field below and watch the bar.">
          <Input label="Note" value={note} onChangeText={setNote} placeholder="Type here" multiline />
        </Demo>

        <Text variant="caption" color="textFaint">
          On iOS the bar uses the system animation duration, so it moves in lockstep with the
          keyboard; Android only reports the keyboard after the fact, hence a short fixed timing.
        </Text>
      </Stack>

      <View style={{ height: space(24) }} />
    </View>
  )
}

/** Shown by the gallery as the page footer for this demo */
export function KeyboardDemoFooter() {
  return (
    <KeyboardStickyFooter>
      <Button label="Stays above the keyboard" />
    </KeyboardStickyFooter>
  )
}
