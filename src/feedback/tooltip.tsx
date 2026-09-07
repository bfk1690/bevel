import { cloneElement, isValidElement, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

import { Text } from '../primitives/text'
import type { Placement } from '../utils/placement'
import { Popover } from './popover'

export type TooltipProps = {
  /** The explanation. Keep it to a line or two */
  text: string
  children: ReactNode
  placement?: Placement | 'auto'
  /** Hides itself after this long. 0 keeps it until dismissed */
  duration?: number
  maxWidth?: number
  style?: StyleProp<ViewStyle>
}

/**
 * A tooltip is a popover with a sentence in it.
 *
 * Opened by a LONG press, not a tap. On a touch screen there is no hover, so a
 * tap has to stay the thing the control does - stealing it for an explanation
 * makes the control unusable to anyone who wanted to use it.
 *
 * The trigger is wrapped rather than cloned into: measuring needs a host view,
 * and a child that forwards no ref cannot provide one.
 */
export function Tooltip({
  text,
  children,
  placement = 'auto',
  duration = 2500,
  maxWidth = 260,
  style,
}: TooltipProps) {
  const anchor = useRef<View>(null)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    setOpen(true)
    if (timer.current) clearTimeout(timer.current)
    if (duration > 0) timer.current = setTimeout(() => setOpen(false), duration)
  }

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ onLongPress?: () => void }>, {
        onLongPress: show,
      })
    : children

  return (
    <>
      <View ref={anchor} collapsable={false} style={style}>
        {child}
      </View>
      <Popover
        visible={open}
        onClose={() => setOpen(false)}
        anchorRef={anchor}
        placement={placement}
        maxWidth={maxWidth}>
        <Text variant="caption">{text}</Text>
      </Popover>
    </>
  )
}
