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

Give it your brand colour and it derives the rest:

```tsx
import { createBrandTheme } from '@bfkk/bevel'

const theme = createBrandTheme({ accent: '#00DB21', fontFamily: 'Inter' })
```

The tint behind the accent, the label colour on top of it and the version that
survives a dark background all follow from that one hex. The brand colour
itself is only moved when it cannot be **seen** — yellow on white fails the 3:1
WCAG asks of an interface component — because correcting one that already reads
is how a brand stops looking like itself.

Or write the palette out with `defineTheme`:

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
| **Primitives** | `Text` `ExpandableText` `RelativeTime` `Countdown` `Button` `SegmentedControl` `Tabs` `Input` `PasswordField` `SearchField` `Autocomplete` `Select` `DateField` `Calendar` `TimeField` `TimePicker` `Checkbox` `Radio` `RadioGroup` `Switch` `Slider` `Stepper` `OtpInput` `Rating` `Chip` `ChipGroup` `Badge` `Avatar` `AvatarGroup` `Progress` `Skeleton` `Divider` |
| **Layout** | `Screen` `Header` `LargeTitle` `TabView` `TabBar` `Card` `ListItem` `DataList` `SwipeableRow` `ReorderableList` `FileRow` `Grid` `Table` `Stat` `BarChart` `Timeline` `Steps` `StateView` `InfiniteList` `Accordion` `EmptyState` `ErrorBoundary` `Fab` `KeyboardStickyFooter` |
| **Feedback** | `Modal` `Sheet` `ActionSheet` `Menu` `Popover` `Tooltip` `Banner` `Toaster` `DialogHost` + the imperative `toast` and `dialog` |
| **Media** | `ImageShower` `Carousel` |

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

### DateField

```tsx
<DateField label="Birthday" value={date} onChange={setDate} />
<DateField label="Stay" range value={stay} onChange={setStay} />
<DateField minDate={today} maxDate={addDays(today, 14)}
           isDisabled={(d) => d.getDay() === 0} locale="tr-TR" />
```

A calendar in a sheet rather than a platform picker: the two platforms
disagree on what a date picker is, and neither answer matches a themed app.
Month and weekday names come from `Intl` where the runtime has it, falling
back to English rather than throwing.

The grid is always six rows, so paging between months does not move the
buttons underneath out from under the user's thumb. `Calendar` is exported on
its own for the times a field would be one tap too many.

### TimeField

```tsx
<TimeField label="Alarm" value={time} onChange={setTime} minuteStep={5} />
<TimeField minTime={{ hours: 9, minutes: 0 }} maxTime={{ hours: 17, minutes: 30 }} />
```

A snapping scroll wheel, not a platform picker: the native ones cannot be
themed, differ from each other, and on Android a two-number decision takes
over the whole screen.

A time is a `{ hours, minutes }` pair rather than a `Date` — carrying a full
date around for "half past two" drags a timezone and a calendar day into a
value that has neither, which is how an alarm ends up an hour off after a
clock change.

### Lists that load as they run out

```tsx
<InfiniteList data={rows} keyExtractor={(r) => r.id} renderItem={renderRow}
              loading={loading} loadingMore={loadingMore} hasMore={hasMore}
              error={error} onLoadMore={loadNext} onRetry={loadNext} />
```

`onEndReached` is not a request for the next page — it is a report that the end
is near, and it fires again on every scroll that keeps it near. The guard turns
that into one fetch per page, and it refuses to retry a failed page on its own:
scrolling near the end again would hammer a server that just said no.

**FlashList is one prop, not a dependency.** Pass
`ListComponent={FlashList}` and it draws with that instead. A bundler cannot
resolve a module conditionally, so an optional native dependency is either
forced on everyone or fails to build for whoever skipped it — the choice stays
with the app that pays for it.

### Keyboards

`Screen` keeps the focused field above the keyboard by default. On iOS the
keyboard is added as a scroll inset, which both makes room and scrolls the
field into view; on Android the window resizes and the list does the rest.

Lifting the whole screen with a padding behaviour — the usual first attempt —
does neither: it moves everything up and leaves the field wherever it was in
the list. That behaviour is now used only where there is nothing to scroll.

An app whose Android window is set to pan rather than resize should say so:

```json
{ "expo": { "android": { "softwareKeyboardLayoutMode": "resize" } } }
```

### Forms

```tsx
const form = useForm({
  initial: { email: '', password: '', confirm: '' },
  rules: (values) => ({
    email: [required('E-posta gerekli'), email('Bu adres geçerli görünmüyor')],
    confirm: [matches(() => values.password, 'Parolalar eşleşmiyor')],
  }),
  onSubmit: async (values) => api.signUp(values),
})

<Input label="E-posta" {...form.fieldProps('email')} />
<Button label="Kaydol" loading={form.submitting} onPress={form.submit} />
```

Every rule is given its own message, so the package ships no wording of its
own — it would be English-only or drag a translation layer in behind it.

A refused submit reports the first field that needs fixing through
`onInvalid`, in the order the fields appear on screen — pair it with
`useFieldFocus` to put the cursor there. Focusing rather than scrolling: the
platform already scrolls a focused field into view and opens the keyboard
against it, and a scroll position worked out by hand disagrees with that the
moment the keyboard changes height.

An error appears once the field has been left, or once submit has been
pressed; never while it is being typed into for the first time. Telling
someone their email is invalid after one letter is both true and useless.
After that it updates live, because by then they are correcting something and
want to see when they are done.

### Toast

```tsx
toast.success('Saved')
const id = toast.loading('Uploading…')
toast.dismiss(id)
toast.error('Could not connect', { action: { label: 'Retry', onPress: retry } })
```

Fired from anywhere — an interceptor, a queue, a catch block — because the
store lives outside React and assumes no state library.

Swipe a toast back the way it came to dismiss it early.

`toast.update(id, patch)` changes a toast that is still on screen — a loading
toast becoming a success, without a second entrance. One the user already
dismissed is not brought back.

**One slot, newest wins.** Tapping retry while a success toast is still fading
replaces it immediately, with a fresh countdown. Queueing was wrong: the
message that matters is the one that just happened, and making the user wait
for a stale one to expire is how a toast becomes noise.

### Dialog

```tsx
if (await dialog.confirm({ title: 'Delete the archive?', destructive: true })) remove()
const name = await dialog.prompt({ title: 'Rename', defaultValue: current })
```

Mount `<DialogHost />` once near the root. Raised from anywhere, like a toast,
and for the same reason: a question asked from an interceptor has no component
to live in.

**Dialogs queue where toasts replace.** Each one has somebody awaiting its
answer, so taking the screen from the one already up would leave that promise
unresolved forever — and the caller is usually holding a spinner or a
half-finished save while it waits. `dialog.clear()` answers everything as
cancelled rather than dropping it, because every caller is inside an `await`.

A rejected `prompt` value keeps the dialog up: closing it would throw away what
was typed along with the reason it was refused.

### Swipeable rows

```tsx
<SwipeableRow actions={[{ key: 'delete', label: 'Delete', onPress: remove }]} fullSwipe>
  <ListItem title={message.from} subtitle={message.preview} />
</SwipeableRow>
```

Where it lands when the finger lifts is decided by distance **and** speed: a
quick short flick is as clear an instruction as a slow long pull, and demanding
the pull as well asks the hand to do the animation's work. Closing an open row
needs less travel than opening one.

`fullSwipe` lets a long drag run the edge action outright. It is opt-in because
it quietly promotes whichever action happens to sit at the edge — right for
deleting a message, wrong when the actions are equals.

### Stat and BarChart

```tsx
<Stat label="Response time" value="340ms" delta={12.5} goodWhen="down" deltaAsPercent />
<BarChart data={week} height={140} max={3000} />
```

**Up is not the same as good.** A metric says which direction it wants; without
one the change is reported and left uncoloured. Painting every rise green is
the most common lie a dashboard tells — response time, error rate, cost per
order and churn all get worse going up. The direction is carried by an arrow as
well as a colour, because red and green are the two most likeliest to be
confused.

**The chart's scale starts at zero, and there is no way to ask it not to.**
Cutting the axis turns a 3% difference into a doubling. `max` holds two charts
to one scale, which is the only honest way to put them side by side.

Bars are views. Anything with a line or a curve wants a canvas, and a canvas
wants a dependency this package will not take.

### Reordering

```tsx
<ReorderableList data={tracks} itemHeight={64} keyExtractor={(t) => t.id}
  onReorder={setTracks}
  renderItem={(track, { dragging, handle }) => (
    <Row track={track} lifted={dragging} grip={<Grip {...handle} />} />
  )} />
```

The gap opens **during** the drag, not on release: a list that rearranges only
once the finger lifts asks the reader to hold a prediction in their head. The
swap happens as the centres cross rather than a whole row later — waiting for a
full row means the picture disagrees with where the item will land for half of
every step.

Rows are one height, deliberately. Mixed heights mean re-measuring every
neighbour on every frame, and a list somebody reorders by hand is almost always
a list of one repeated thing.

Give `handle` to a grip rather than the whole row, or the list can never be
scrolled — the first touch always becomes a drag. Spread **all** of it: it
carries a refusal to hand the gesture back, without which the scroll view takes
the drag the moment the finger moves.

That refusal keeps the row but does not stop the page. On iOS the scroll view's
recogniser is native and runs *beside* the JavaScript responder system, so the
row would follow the finger while the page scrolled behind it. Inside a
`Screen` the list holds the page still for the length of the drag, through the
scroll context — `setScrollEnabled` is counted, not a flag, so two things
asking at once cannot have one switch scrolling back on while the other still
needs it off. In somebody else's scroll view, use `onDragStart` / `onDragEnd`.

### Grid

```tsx
<Grid data={photos} keyExtractor={(p) => p.id} minItemWidth={110} gap={6} aspectRatio={1}
  renderItem={(photo) => <Image source={{ uri: photo.uri }} style={fill} />} />
```

Widths are points, never percentages. Three items of 33.33% can total 100.01%
in a wrapping row, which drops the third onto its own line at some screen sizes
and not others.

Not a list — everything given to it is rendered. For a long collection put a
grid row inside `InfiniteList`.

### Sheet

```tsx
<Sheet visible={open} onClose={close} snapPoints={['25%', '55%', '90%']}>
  {nearby.map((place) => <ListItem key={place.id} {...place} />)}
</Sheet>
```

Where a `Modal` asks something and leaves, a `Sheet` is a place to live: it
stays up while the screen behind it is used, and the reader resizes it to suit
what they are doing.

A percentage is of the room the sheet **has** — under the status bar, over the
home indicator — because half of the screen is not half of what is left. The
sheet itself is one view of the tallest size, moved: animating its height would
put a layout pass on every frame of a gesture.

A flick moves **one** snap point. Thrown from peek to full, it would skip the
size the reader was reaching for. The drag is limited to the handle, because a
sheet that resizes from anywhere fights the list inside it.

### Password strength

```tsx
<PasswordField label="Password" value={value} onChangeText={setValue}
  blocklist={[email, BRAND.name]} />
```

The meter advises; the form decides what to refuse. `tooShort` is reported
separately from the score for that reason — a minimum length is a rule, and
everything else is an opinion.

Length is weighted far above character classes, because that is what actually
costs an attacker time. Demanding a symbol produces `Password1!` — a common
word with two predictable decorations, which the blocklist and common-word
checks cost more than the symbol earned.

**One suggestion at a time.** Five rules at once are read as a wall and
answered with the password above.

## Theming API

| Export | Purpose |
| --- | --- |
| `defineTheme(input)` | Builds a theme; applies device scaling once |
| `BevelProvider` | Publishes the theme and resolves the active scheme |
| `useTheme()` | Tokens **and** the subscription — call it even if you read no color |
| `createThemedStyles(fn)` | `StyleSheet.create` resolved per scheme, cached and lazy |
| `createBrandTheme(input)` | A whole theme from one brand colour |
| `ensureContrast(color, background)` | Nudges a colour until it can be seen |
| `darken` `lighten` `alpha` `mix` `contrast` `readableOn` | Memoized color math |
| `shadow(preset)` `platformShadow(opts)` | Per-platform shadows |
| `createMask` `applyMask` `unmask` | Pattern masking |
| `addMonths` `buildMonthGrid` `toISODate` … | Calendar arithmetic, in local time |
| `snapMinutes` `to12Hour` `parseTime` … | Time-of-day arithmetic, without a `Date` |
| `resolvePlacement` | Where an anchored bubble goes, and which way it flips |
| `snapToStep` `valueOfPosition` … | Slider arithmetic, edges included |
| `ratingFromRatio` `starFill` `dotWindow` `loopedIndex` … | Rating and paging arithmetic |
| `upper` `lower` `setCaseLocale` | Locale-safe casing (the platform's is not) |
| `foldText` `rankSuggestions` `scoreMatch` | Matching that survives a missing accent |
| `useDebouncedValue` `useDisclosure` `usePrevious` `useIsMounted` | The hooks every app rewrites |
| `useScrollToTop()` `useScrollOffset()` | What the screen's scroll view is doing |
| `useForm` `required` `email` `minLength` … | Validation, with the app's own wording |
| `resolveViewState` `errorMessage` | Which of the four faces a list shows |
| `resolveColumnWidths` `nextSort` `sortRows` | Column widths and sorting |
| `formatBytes` `formatCount` `truncateMiddle` `fileKind` | The formatting every app rewrites |

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

## Accessibility

Not a checklist item here, and a few of the decisions are load-bearing:

- A control that declares `adjustable` also implements increment and decrement.
  The role without the actions tells a screen reader the value can be changed
  and then offers no way to change it — worse than a plain view.
- A field's visible label is announced as the field's own name, and its error
  or helper follows as the hint. Nothing connects a separate label view to an
  input on its own.
- Modals and popovers mark themselves as such, so a screen reader cannot swipe
  into the page behind the scrim.
- Pickers announce what they currently hold rather than reading as an empty
  button.
- Small buttons keep a 44dp touch target through hit slop rather than growing.
- **Reduce motion is answered in two different ways.** Movement the reader set
  off — a sheet, a modal — is *shortened*, not cut: a change that happens
  between two frames is not seen happening. Movement nobody asked for — a
  carousel advancing on its own, the skeleton pulse — stops. That is the
  category the setting is really about: it happens *at* the reader and cannot
  be predicted. `useReducedMotion()` is exported for an app's own animations.
- A countdown is announced as a length of time, not as a clock face: `02:30`
  is read aloud as "two colon thirty". It is also not a live region — the label
  changes every second, and announcing that would interrupt whatever is being
  read, every second, for as long as the timer runs.
- The password meter's verdict travels with the field. Coloured bars and a word
  beside them are furniture to a screen reader, so somebody who cannot see them
  would be told nothing about a password the form is about to refuse.
- A row's swipe actions are hidden from a screen reader until the row is open,
  and reachable through the row's own accessibility actions in the meantime —
  a gesture nobody can perform is not an interface.

## Responsive

```tsx
const columns = useResponsive({ compact: 2, medium: 3, expanded: 5 }) ?? 2
const orientation = useOrientation()
```

Named widths — `compact`, `medium`, `expanded` — because a layout decision is
about how much room there is, not about a particular phone.

**It falls down the scale, never up.** A layout naming `compact` and
`expanded`, opened at `medium`, gets the compact one: the narrow answer fits in
a wide space and the wide one does not fit in a narrow space, so falling
upwards would overflow the screen rather than leave room on it. Name only
`expanded` and a phone gets nothing, deliberately — there is no safe way to
shrink a shape nobody designed.

Orientation comes from the **window**, not the device, and needs no native
module. They disagree more often than it seems: a phone lying flat has an
orientation and no useful shape, and an app in a split view is portrait-shaped
on a landscape tablet.

## Landscape

Insets are not just top and bottom. Turned on its side a phone reserves around
59pt on **each** side for the sensor housing, and anything laid out to the raw
edge is cut off there — which is invisible in portrait, where those insets are
zero, and therefore invisible on the screen anybody develops on.

Everything that pins itself to a screen edge clears it: `Screen`'s gutter,
`Header`, `Toaster`, `Fab`, `TabBar`, `Sheet`, `Modal`, `ImageShower` and
`KeyboardStickyFooter`. `sidePadding(insets, gutter)` is exported for an app's
own edge-hugging views.

The inset is **added** to the design's gutter rather than maxed with it: the
gutter is a decision about breathing room, the inset is a fact about where
pixels cannot be seen, and taking the larger of the two puts content hard
against the edge of the usable area and calls it a margin.

## Right to left

Layout properties are written as `start` and `end` rather than `left` and
`right`, so a row, an inset or an overlapping avatar stack mirrors on its own
when `I18nManager.isRTL` is set.

`textAlign` does not mirror — it takes physical sides — so anything aligned to
the trailing edge asks for it: `trailingAlign()`. A value pinned right in
Arabic sits where the line *begins*, and reads as a mistake.

`Fab` takes `start` / `end` for the same reason and defaults to `end`, with
`left` / `right` kept as the escape hatch for a layout that must not move.
Gesture components take physical sides, because a swipe is a direction of
travel rather than a side of the page.

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

The example app is the living documentation: an index of forty pages, one per
component, each showing every variant, state and edge case with the reasoning
next to it. Metro watches the package source, so editing a component
reloads the example without a publish step.

Tests cover the pure layer — thirty-three suites, 391 assertions: color math,
masking, casing, calendar and clock arithmetic, swipe and step decisions,
relative time, grid division, the dialog queue, and the theme engine itself —
how a partial theme merges into a complete one, and how style sheets resolve
and cache per scheme. The suite runs on a reference screen, a small one, and
with the platform switched, because those are the paths where scaling and
shadow rules diverge.

React Native is stubbed with four pure functions for those runs and nothing
more. Anything that needs a real native behaviour is verified on a device
instead — a mock of it would only buy confidence that does not survive contact
with a build.

## Status

0.2.2, and moving. Shipping: the theme engine and every component listed above —
date and time fields, the segmented control, tables, timelines and file rows
included — with the example app as the living reference. CI runs the whole of
`yarn verify` plus a typecheck and a Metro bundle of the example, because a
missing export and an import cycle both typecheck cleanly and only fail at
runtime. Next: screenshot coverage.
