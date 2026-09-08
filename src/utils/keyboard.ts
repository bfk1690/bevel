import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'

/**
 * Dismiss the soft keyboard if one is open.
 *
 * Wrapped rather than called inline so pressables can dismiss without pulling
 * `Keyboard` into every component, and so the behaviour has one place to
 * change if an app swaps in a keyboard controller library.
 */
export function dismissKeyboard(): void {
  Keyboard.dismiss()
}

/**
 * Whether the keyboard is on screen.
 *
 * Used to drop the bottom safe-area inset while it is: the home indicator sits
 * in the area the keyboard now covers, so keeping its padding leaves a band of
 * dead space between the keyboard and the action it belongs to.
 *
 * iOS reports `will` events ahead of the animation, so the layout settles in
 * the same frame the keyboard starts moving; Android only reports after.
 */
/**
 * How much of the screen the keyboard is covering, in points.
 *
 * Zero when it is closed. Read from the frame the platform reports rather than
 * assumed, because it changes with the language, the suggestion strip and
 * whether a hardware keyboard is attached.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const show = Keyboard.addListener(showEvent, (event) => {
      setHeight(event?.endCoordinates?.height ?? 0)
    })
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  return height
}

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const show = Keyboard.addListener(showEvent, () => setVisible(true))
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  return visible
}

/**
 * How far a bar must rise to sit exactly on top of the keyboard.
 *
 * The full keyboard height, and nothing subtracted from it. `endCoordinates`
 * is measured from the bottom of the SCREEN, so lifting by it puts the bar's
 * bottom edge on the keyboard's top edge - whatever the home indicator is
 * doing underneath.
 *
 * Taking the safe area off here was wrong twice over. It assumed the bar was
 * padded by that inset, which is only true when it is standing alone; and the
 * screen around it drops that same padding while the keyboard is up, because
 * the keyboard covers the area it was reserving. Both subtractions landed, and
 * the bar came to rest a home indicator's worth behind the keyboard with half
 * the action unreachable.
 */
export function keyboardLift(keyboardHeight: number, offset = 0): number {
  if (!Number.isFinite(keyboardHeight) || keyboardHeight <= 0) return 0
  return keyboardHeight + Math.max(0, offset)
}

/**
 * The bar's own bottom padding.
 *
 * The safe area below is only worth reserving while it is visible. With the
 * keyboard up it is covered, and keeping the padding would leave the action
 * floating a home indicator's height above the keys for no reason.
 */
export function footerPadding(keyboardUp: boolean, safeBottom: number, base: number): number {
  return base + (keyboardUp ? 0 : Math.max(0, safeBottom))
}
