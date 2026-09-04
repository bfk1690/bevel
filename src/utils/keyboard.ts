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
