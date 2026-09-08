import { createContext } from 'react'

/**
 * True while rendering inside `Screen`'s footer slot.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * `Screen` pads its footer slot with the horizontal gutter and the bottom
 * safe-area inset. `KeyboardStickyFooter` pads itself the same way, because it
 * is also meant to work standing alone. Composed — which is the obvious way to
 * use them — the padding landed TWICE: on a phone with a home indicator that
 * is roughly 80pt of dead space under the action, and the bar reads as though
 * it is floating halfway up the screen.
 *
 * The rule is that the OUTERMOST element owns the safe area. This context lets
 * the inner one find out that it is not outermost, without `Screen` having to
 * inspect what its footer is or a new prop being invented for the caller to
 * remember.
 */
export const FooterSlotContext = createContext(false)
