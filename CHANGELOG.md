# Changelog

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
