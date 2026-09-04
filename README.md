# @bfkk/bevel

Themeable React Native UI primitives. Every visual decision — sizes, radii,
press behaviour, the variant tables — is theme **data**, so an app adapts the
kit instead of forking it.

```bash
yarn add @bfkk/bevel
```

**Zero runtime dependencies.** `react` and `react-native` are the only peers.
Anything platform-specific — gradients, safe-area insets, iOS overlay windows —
is injected by the app rather than imported by the package.

## Setup

```tsx
import { BevelProvider, defineTheme, Toaster } from '@bfkk/bevel'

const theme = defineTheme({
  scale: 'moderate',            // or 'none' to work in raw dp
  fontFamily: 'Inter',
  schemes: {
    light: { accent: '#00DB21', onAccent: '#FFFFFF' },
    dark: { accent: '#3DDC64', canvas: '#000000' },
  },
  components: {
    Button: {
      press: 'depth',           // house style: depth | scale | opacity | none
      variants: { checkout: { bg: 'ok', fg: 'onAccent', depth: 6 } },
    },
  },
})

export default function App() {
  const insets = useSafeAreaInsets()   // optional; zeros are fine
  return (
    <BevelProvider theme={theme} insets={insets}>
      <Root />
      <Toaster />
    </BevelProvider>
  )
}
```

Only what differs is written; everything else falls back to the built-in
defaults. A theme may declare any number of schemes, not just light and dark.

## Components

| | |
| --- | --- |
| **Primitives** | `Text` `Button` `Input` `Select` `Checkbox` `Radio` `RadioGroup` `Switch` `OtpInput` `Chip` `Badge` `Avatar` `Progress` `Skeleton` `Divider` |
| **Layout** | `Screen` `Header` `Card` `ListItem` `EmptyState` `KeyboardStickyFooter` |
| **Feedback** | `Modal` `Toaster` + the imperative `toast` |
| **Media** | `ImageShower` |

### Button

```tsx
<Button label="Continue" onPress={submit} />
<Button label="Buy now" variant="checkout" size="lg" trailing="$49" />
<Button label="Delete" variant="danger" press="scale" />
<Button label="Filter" variant="outline" size="sm" full={false}
        left={({ size, color }) => <Ionicons name="filter" size={size} color={color} />} />
```

| Prop | Notes |
| --- | --- |
| `variant` | Any key in `theme.components.Button.variants` |
| `press` | `depth` · `scale` · `opacity` · `none` — per instance, per variant, or theme-wide |
| `left` / `right` | A node, or `({ size, color }) => node` so icons inherit resolved values |
| `tag` / `trailing` | Leading micro label and trailing badge |
| `bg` `fg` `border` `radius` `depth` `shadow` | Per-instance overrides |
| `loading` | Keeps the button's width — the label is hidden, not removed |
| `preventDoublePress` | On by default (400ms). Pass `false` for steppers |

- **Foreground is derived when a variant omits `fg`**, so overriding `bg` can
  never produce invisible text.
- **The bevel keeps its footprint**: pressing compresses the border and
  translates by the same amount, so neighbours never shift.
- **Small buttons keep a 44dp target** — the difference is made up with hit slop.
- **`scale` and `none` never re-render on touch** (static styles, native driver).

### Input

```tsx
<Input label="Phone" required mask="(###) ### ## ##" onChangeRaw={setPhone}
       keyboardType="number-pad" error={errors.phone} />
<Input label="Password" secureToggle />
<Input variant="pill" placeholder="Search" left={<SearchIcon />} />
```

Masks are patterns, not named formats — `#` digit, `A` letter, `*` either —
because a built-in `phone` mask is only correct in the country it was written
for. `onChangeRaw` gives the value with every literal stripped.

Focus, error and disabled are **states of one variant**, so restyling a field
means describing a single surface. `errorMode: 'compact'` folds the message
into the label row, which keeps a form from changing height as errors appear.

### ImageShower

```tsx
<ImageShower visible={open} items={urls} index={start}
             onClose={() => setOpen(false)} onIndexChange={setStart} />
```

Swipe to page, pinch to zoom, drag to pan, double tap to toggle zoom, drag down
to dismiss, single tap to hide the chrome. Built on `PanResponder` and the core
animation driver, so **pinch works on Android too** — implementations that lean
on the platform scroll view get zoom on iOS only.

**Zoom follows the focal point**, not the centre of the screen: the pixel under
your fingers stays under your fingers, and a double tap zooms towards what was
tapped. Scaling about the centre pulls the detail you reached for out from
under you — the exact moment it matters.

`renderItem` swaps in a caching image component or a video player; the package
itself decodes nothing beyond the core `Image`.

### Toast

```tsx
toast.success('Saved')
const id = toast.loading('Uploading…')
toast.dismiss(id)
toast.error('Could not connect', { action: { label: 'Retry', onPress: retry } })
```

Fired from anywhere — an interceptor, a queue, a catch block — because the
store lives outside React and assumes no state library.

**One slot, newest wins.** Tapping retry while a success toast is still fading
replaces it immediately, with a fresh countdown. Queueing was wrong: the
message that matters is the one that just happened, and making the user wait
for a stale one to expire is how a toast becomes noise.

## Theming API

| Export | Purpose |
| --- | --- |
| `defineTheme(input)` | Builds a theme; applies device scaling once |
| `BevelProvider` | Publishes the theme and resolves the active scheme |
| `useTheme()` | Tokens **and** the subscription — call it even if you read no color |
| `createThemedStyles(fn)` | `StyleSheet.create` resolved per scheme, cached and lazy |
| `darken` `lighten` `alpha` `mix` `contrast` `readableOn` | Memoized color math |
| `shadow(preset)` `platformShadow(opts)` | Per-platform shadows |
| `createMask` `applyMask` `unmask` | Pattern masking |
| `upper` `lower` `setCaseLocale` | Locale-safe casing (the platform's is not) |

```tsx
const styles = createThemedStyles(({ colors, space, radius }) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space(4) },
}))
```

### Injection points

A UI kit cannot import a native module conditionally — a bundler either
resolves it or fails the build — so anything platform-specific arrives through
the provider:

```tsx
<BevelProvider
  theme={theme}
  insets={useSafeAreaInsets()}
  renderGradient={({ colors, style }) => <LinearGradient colors={colors} style={style} />}
  renderOverlay={({ children }) => <FullWindowOverlay>{children}</FullWindowOverlay>}
/>
```

| Prop | Without it |
| --- | --- |
| `insets` | Layouts use zeros — correct on devices with no notch |
| `renderGradient` | Gradient variants render their solid `bg` |
| `renderOverlay` | Toasts render inside the app window, below native iOS modals |

Nothing here is required, and nothing throws when it is missing.

## Color roles

Roles say where a color belongs so components never guess. The surface ladder
climbs in one direction — `sunk → canvas → surface → raised → sheet` — which is
how depth is built in dark themes, where shadows are invisible.

`media` / `onMedia` stay outside the accent system on purpose: a tint bleeding
behind a photo changes how its own tones are read.

## Development

```bash
yarn verify      # typecheck + pure tests + build

cd example
yarn install
yarn ios         # or: yarn android
```

The example app is the living documentation: an index of components, and one
page per component showing every variant, state and edge case with the
reasoning next to it. Metro watches the package source, so editing a component
reloads the example without a publish step.

Tests cover the pure layer only — color math, masking, casing. Anything that
touches a native module is verified on a device rather than mocked.

## Status

Early, and moving. Shipping: the theme engine and every component listed above,
with the example app as the living reference. Next: date and time fields, a
segmented control, and screenshot coverage in CI.
