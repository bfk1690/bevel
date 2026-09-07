# Changelog

## 0.2.0

Eleven components, and two bugs found while adding them.

### New

- **`Sheet`** — snap points. Where a modal asks something and leaves, a sheet
  is a place to live: it stays up while the screen behind it is used, and the
  reader resizes it. A percentage is of the room the sheet *has*, not of the
  screen; a flick moves one snap point, not all of them; the drag stays on the
  handle, because a sheet that resizes from anywhere fights the list inside it.
- **`dialog` + `DialogHost`** — questions raised from anywhere and awaited.
  Dialogs **queue** where toasts replace: each one has a caller inside an
  `await`, and taking the screen from the one already up leaves that promise
  unresolved forever.
- **`SwipeableRow`** — actions behind a row, not pushing it. Where it lands is
  decided by distance *and* speed. `fullSwipe` is opt-in, because it quietly
  promotes whichever action sits at the edge.
- **`PasswordField`** — a meter that advises rather than rules. Length is
  weighted far above character classes; one suggestion at a time.
- **`Grid`** — columns divided in points. Percentages in a wrapping row round
  independently and can add up to more than the row.
- **`TabBar`** — the bar along the bottom, with no opinion about routing.
  Reselecting the active tab is reported separately from changing tabs.
- **`Steps`** — markers up to a handful, a count past that. The step you are on
  does not fill the bar, because you have not finished it.
- **`Fab`** — one floating action, out of the way while the list moves. Hiding
  on scroll is a clamped difference of the offset, so it stays native-driven.
- **`Countdown`** and `useCountdown` — seconds round up, so it reaches zero
  when the time does. Ticks aim at the next second boundary rather than
  counting 1000ms at a time.
- **`RelativeTime`** — redrawn on a clock sized to the unit on screen, and not
  at all once it becomes a date.
- **`Screen`** gained `overlay`: drawn over the scroll area, inside the scroll
  context, taking none of its space.
- **`useForm`** gained `order`, `onInvalid` and `firstError`; `useFieldFocus`
  puts the cursor in the first field that needs fixing.

### Right to left

Layout is written in `start` and `end`, which mirrors itself. `textAlign` does
not — it takes physical sides — so anything trailing asks for `trailingAlign()`.
A value pinned right in Arabic sits where the line *begins*.

### Fixed

- The indeterminate progress sweep was interpolated over a fixed 200 points,
  which overshot on a wide screen and stopped short on a narrow one. It is now
  measured against the track it is in. Both modes also drive the same two
  values, so learning the real figure mid-task slides home instead of cutting.
- The newer test suites were invoked with `--import loader.mjs`, which
  registers nothing. They passed because they are pure and name their `.ts`
  extensions — the first suite to need the React Native stub loaded the real
  one instead.

## 0.1.0

First release.

### The idea

Every visual decision is theme **data** — sizes, radii, press behaviour, the
variant tables — so an app adapts the kit rather than forking it. A component
is only worth having if it also carries the decision behind it; those are
written down at the point of use, not in a wiki.

### Zero runtime dependencies

`react` and `react-native` are the only peers. Anything platform-specific —
gradients, safe-area insets, iOS overlay windows — is injected through the
provider rather than imported. A bundler cannot resolve a native module
conditionally: a dynamic `require` is rejected outright, and a literal one
fails the build for everyone who has not installed it.

### Components

- **Actions** — `Button` `SegmentedControl` `Tabs` `TabBar` `Fab`
- **Fields** — `Input` `PasswordField` `SearchField` `Autocomplete` `Select` `DateField`
  `Calendar` `TimeField` `TimePicker` `Slider` `Rating` `Checkbox` `Radio`
  `Switch` `Stepper` `OtpInput` `Chip`
- **Content** — `Card` `ListItem` `DataList` `SwipeableRow` `FileRow` `Grid`
  `Table` `Timeline` `Steps` `Accordion` `Badge` `Avatar` `AvatarGroup`
  `EmptyState` `StateView` `RelativeTime` `Countdown`
- **Feedback** — `Toast` `Dialog` `Banner` `Modal` `Sheet` `ActionSheet` `Menu`
  `Popover` `Tooltip` `Progress` `Skeleton`
- **Media** — `ImageShower` `Carousel`
- **Layout** — `Screen` `Header` `LargeTitle` `TabView` `KeyboardStickyFooter`

### The pure layer

Twenty-two suites over the pure layer, 295 tests aimed at the cases
a device only shows by accident: colour math, masking, locale-safe casing,
search folding, calendar and clock arithmetic, anchored placement, slider and
rating scales, column widths and sorting, validation, view state, swipe and
step arithmetic, relative time, grid division, sheet snapping, password
strength, text direction, the dialog queue, and the theme engine itself. The suite runs on a reference screen, a small one, and with the
platform switched, because that is where scaling and shadow rules diverge.

### Decisions worth knowing

- The maximum of a stepped slider stays reachable even when the step does not
  divide the range.
- An unticked checkbox counts as missing and a quantity of zero does not.
- Lengths count graphemes: one emoji is one character, whatever JavaScript
  says.
- A brand colour is only corrected when it cannot be **seen** — 3:1, what WCAG
  asks of an interface component — because pushing yellow until it reads as
  body text turns it brown.
- Toasts hold one slot and the newest takes it; an update keeps its place
  rather than replaying the entrance.
- A large title lives inside the scroll view, because fading one out in a fixed
  header leaves the gap it occupied.
- Search folds the two Turkish i letters together; display casing keeps them
  apart. Both are correct, for different jobs.
- Dialogs queue where toasts replace: every dialog has a caller inside an
  `await`, and a toast does not.
- A swipe is answered by speed as well as distance, and closing an open row
  asks for less travel than opening one.
- Relative time redraws on a clock sized to the unit it is showing, and stops
  entirely once it becomes a date.
- Grid columns are divided in points. Percentages in a wrapping row round
  independently and can add up to more than the row.
- The step you are on does not fill the progress bar, because you have not
  finished it.
- Password strength weighs length far above character classes, and gives one
  suggestion at a time — five at once are answered with `Password1!`.
- A sheet's flick moves one snap point, not all of them, so it cannot skip the
  size the reader was reaching for.
- Layout is written in `start`/`end`, which mirrors itself; `textAlign` is not,
  which is why the direction helpers exist.
