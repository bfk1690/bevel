import { Keyboard } from 'react-native'

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
