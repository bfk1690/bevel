import { useRef, useState } from 'react'
import { View } from 'react-native'
import { Button, Card, Popover, Text, Tooltip, useTheme } from '@bfkk/bevel'

import { Demo, Row, Stack } from './ui'

export function PopoverDemo() {
  const { space } = useTheme()

  const auto = useRef<View>(null)
  const above = useRef<View>(null)
  const side = useRef<View>(null)
  const corner = useRef<View>(null)
  const wide = useRef<View>(null)

  const [open, setOpen] = useState<string | null>(null)
  const close = () => setOpen(null)

  return (
    <Stack>
      <Demo
        title="Anchored"
        note="The anchor is measured when the popover opens, not when it mounts: it may have scrolled since. Until both that measurement and the bubble's own size are in, nothing is drawn - a bubble that jumps into position is worse than one that arrives a frame late.">
        <View ref={auto} collapsable={false} style={{ alignSelf: 'flex-start' }}>
          <Button label="Open" full={false} onPress={() => setOpen('auto')} />
        </View>
        <Popover visible={open === 'auto'} onClose={close} anchorRef={auto}>
          <Text variant="bodyStrong">Anchored bubble</Text>
          <Text variant="caption" color="textMuted">
            Points at the control it explains.
          </Text>
        </Popover>
      </Demo>

      <Demo
        title="Flipping"
        note="A requested side is kept when it fits and flipped when it does not - unless its opposite is no better, in which case the request stands.">
        <View ref={above} collapsable={false} style={{ alignSelf: 'flex-start' }}>
          <Button label="Prefers above" variant="secondary" full={false} onPress={() => setOpen('top')} />
        </View>
        <Popover visible={open === 'top'} onClose={close} anchorRef={above} placement="top">
          <Text variant="caption">Above when there is room, below when there is not.</Text>
        </Popover>
      </Demo>

      <Demo title="Beside">
        <View ref={side} collapsable={false} style={{ alignSelf: 'flex-start' }}>
          <Button label="To the right" variant="secondary" full={false} onPress={() => setOpen('right')} />
        </View>
        <Popover visible={open === 'right'} onClose={close} anchorRef={side} placement="right" maxWidth={200}>
          <Text variant="caption">Centred on the anchor, offset across.</Text>
        </Popover>
      </Demo>

      <Demo
        title="Against an edge"
        note="The bubble is clamped inside the screen while the anchor stays where it is, so the arrow slides along to keep pointing - stopping short of the rounded corners.">
        <Row>
          <View ref={corner} collapsable={false}>
            <Button label="Edge" size="sm" variant="outline" full={false} onPress={() => setOpen('corner')} />
          </View>
          <View style={{ flex: 1 }} />
          <View ref={wide} collapsable={false}>
            <Button label="Other edge" size="sm" variant="outline" full={false} onPress={() => setOpen('wide')} />
          </View>
        </Row>
        <Popover visible={open === 'corner'} onClose={close} anchorRef={corner}>
          <Text variant="caption">Pinned to the left margin.</Text>
        </Popover>
        <Popover visible={open === 'wide'} onClose={close} anchorRef={wide}>
          <Text variant="caption">Pinned to the right margin.</Text>
        </Popover>
      </Demo>

      <Demo
        title="With a scrim"
        note="Off by default: a popover explains the thing it points at, and dimming that thing while explaining it works against you. Turn it on when the bubble asks for a decision.">
        <ScrimExample />
      </Demo>

      <Demo
        title="Tooltip"
        note="Opened by a LONG press. There is no hover on a touch screen, so a tap has to stay the thing the control does - stealing it for an explanation makes the control unusable to whoever wanted to use it.">
        <Row>
          <Tooltip text="Held for a moment, not tapped.">
            <Button label="Hold me" variant="secondary" full={false} />
          </Tooltip>
          <Tooltip
            text="A tooltip is a popover with a sentence in it, so it inherits the flipping and the clamping."
            placement="top">
            <Button label="Hold me too" variant="ghost" full={false} />
          </Tooltip>
        </Row>
      </Demo>

      <View style={{ height: space(20) }} />
    </Stack>
  )
}

function ScrimExample() {
  const anchor = useRef<View>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <View ref={anchor} collapsable={false} style={{ alignSelf: 'flex-start' }}>
        <Button label="Open with a scrim" variant="secondary" full={false} onPress={() => setOpen(true)} />
      </View>
      <Popover visible={open} onClose={() => setOpen(false)} anchorRef={anchor} scrim>
        <Card bg="transparent" border="transparent" shadow="none" padding={0} gap={4}>
          <Text variant="bodyStrong">Delete this draft?</Text>
          <Text variant="caption" color="textMuted">
            Tap outside to keep it.
          </Text>
          <Button label="Delete" variant="danger" size="sm" onPress={() => setOpen(false)} />
        </Card>
      </Popover>
    </>
  )
}
