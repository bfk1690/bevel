import type { ComponentType } from 'react'

import { AccordionDemo } from './accordion'
import { ButtonDemo } from './button'
import { AutocompleteDemo } from './autocomplete'
import { ContentDemo } from './content'
import { FilesDemo } from './files'
import { InfiniteDemo } from './infinite'
import { FormDemo } from './form'
import { DateDemo } from './date'
import { DialogDemo } from './dialog'
import { InputDemo } from './input'
import { KeyboardDemo, KeyboardDemoFooter } from './keyboard'
import { CarouselDemo } from './carousel'
import { MediaDemo } from './media'
import { MenuDemo } from './menu'
import { ModalDemo } from './modal'
import { OtpDemo } from './otp'
import { PopoverDemo } from './popover'
import { ProgressDemo } from './progress'
import { RatingDemo } from './rating'
import { RelativeDemo } from './relative'
import { SegmentedDemo } from './segmented'
import { SelectDemo } from './select'
import { SliderDemo } from './slider'
import { SwipeDemo } from './swipe'
import { StateDemo } from './state'
import { SelectionDemo } from './selection'
import { HooksDemo } from './hooks'
import { TableDemo } from './table'
import { TabsDemo } from './tabs'
import { TextDemo } from './text'
import { TimeDemo } from './time'
import { ThemeDemo } from './theme'
import { ToastDemo } from './toast'

export type DemoEntry = {
  key: string
  title: string
  subtitle: string
  group: string
  Component: ComponentType
  /** Rendered as the screen footer, for components that live at the bottom edge */
  Footer?: ComponentType
}

export const DEMOS: readonly DemoEntry[] = [
  {
    key: 'button',
    title: 'Button',
    subtitle: 'Variants, press behaviour, slots, states',
    group: 'Actions',
    Component: ButtonDemo,
  },
  {
    key: 'segmented',
    title: 'SegmentedControl',
    subtitle: 'A sliding indicator over one axis of choice',
    group: 'Actions',
    Component: SegmentedDemo,
  },
  {
    key: 'tabs',
    title: 'Tabs',
    subtitle: 'A line under where you already are',
    group: 'Actions',
    Component: TabsDemo,
  },
  {
    key: 'input',
    title: 'Input',
    subtitle: 'Masking, errors, secure entry, accessory bar',
    group: 'Fields',
    Component: InputDemo,
  },
  {
    key: 'autocomplete',
    title: 'Autocomplete',
    subtitle: 'Suggestions that survive a missing accent',
    group: 'Fields',
    Component: AutocompleteDemo,
  },
  {
    key: 'select',
    title: 'Select',
    subtitle: 'Single, multiple, searchable',
    group: 'Fields',
    Component: SelectDemo,
  },
  {
    key: 'date',
    title: 'DateField and Calendar',
    subtitle: 'Single, range, bounds, blocked days',
    group: 'Fields',
    Component: DateDemo,
  },
  {
    key: 'time',
    title: 'TimeField',
    subtitle: 'A wheel that can be themed',
    group: 'Fields',
    Component: TimeDemo,
  },
  {
    key: 'form',
    title: 'Forms',
    subtitle: 'Validation, and when to show it',
    group: 'Fields',
    Component: FormDemo,
  },
  {
    key: 'slider',
    title: 'Slider',
    subtitle: 'Steps, ranges, and a reachable maximum',
    group: 'Fields',
    Component: SliderDemo,
  },
  {
    key: 'rating',
    title: 'Rating',
    subtitle: 'Stars you can drag across',
    group: 'Fields',
    Component: RatingDemo,
  },
  {
    key: 'selection',
    title: 'Checkbox, Radio, Switch, Chip',
    subtitle: 'Every selection control',
    group: 'Fields',
    Component: SelectionDemo,
  },
  {
    key: 'otp',
    title: 'OtpInput',
    subtitle: 'One field behind every cell',
    group: 'Fields',
    Component: OtpDemo,
  },
  {
    key: 'keyboard',
    title: 'Keyboard',
    subtitle: 'Aware screens and a sticky footer',
    group: 'Fields',
    Component: KeyboardDemo,
    Footer: KeyboardDemoFooter,
  },
  {
    key: 'content',
    title: 'Card, ListItem, Badge, Avatar',
    subtitle: 'Surfaces, rows, markers and empty states',
    group: 'Content',
    Component: ContentDemo,
  },
  {
    key: 'swipe',
    title: 'SwipeableRow',
    subtitle: 'Actions behind a row, and a full swipe to run one',
    group: 'Content',
    Component: SwipeDemo,
  },
  {
    key: 'table',
    title: 'Table and Timeline',
    subtitle: 'Columns that scroll, events on a rail',
    group: 'Content',
    Component: TableDemo,
  },
  {
    key: 'infinite',
    title: 'InfiniteList',
    subtitle: 'One fetch per page, whoever draws it',
    group: 'Content',
    Component: InfiniteDemo,
  },
  {
    key: 'state',
    title: 'StateView',
    subtitle: 'Loading, failed, empty, content',
    group: 'Content',
    Component: StateDemo,
  },
  {
    key: 'files',
    title: 'FileRow',
    subtitle: 'Uploads, sizes and names that fit',
    group: 'Content',
    Component: FilesDemo,
  },
  {
    key: 'accordion',
    title: 'Accordion',
    subtitle: 'Disclosure rows with measured height',
    group: 'Content',
    Component: AccordionDemo,
  },
  {
    key: 'toast',
    title: 'Toast and Banner',
    subtitle: 'What just happened, and what is still true',
    group: 'Feedback',
    Component: ToastDemo,
  },
  {
    key: 'dialog',
    title: 'Dialog',
    subtitle: 'Questions raised from anywhere, and awaited',
    group: 'Feedback',
    Component: DialogDemo,
  },
  {
    key: 'menu',
    title: 'Menu and ActionSheet',
    subtitle: 'Anchored actions, and actions from the edge',
    group: 'Feedback',
    Component: MenuDemo,
  },
  {
    key: 'modal',
    title: 'Modal',
    subtitle: 'Sheet, dialog, full screen',
    group: 'Feedback',
    Component: ModalDemo,
  },
  {
    key: 'popover',
    title: 'Popover and Tooltip',
    subtitle: 'Anchored, flipped, clamped',
    group: 'Feedback',
    Component: PopoverDemo,
  },
  {
    key: 'progress',
    title: 'Progress and Skeleton',
    subtitle: 'Determinate, indeterminate, placeholders',
    group: 'Feedback',
    Component: ProgressDemo,
  },
  {
    key: 'media',
    title: 'ImageShower',
    subtitle: 'Pinch, pan, page, dismiss',
    group: 'Media',
    Component: MediaDemo,
  },
  {
    key: 'carousel',
    title: 'Carousel',
    subtitle: 'Pages, and dots that slide',
    group: 'Media',
    Component: CarouselDemo,
  },
  {
    key: 'text',
    title: 'Text',
    subtitle: 'Type scale, color roles, casing',
    group: 'Foundation',
    Component: TextDemo,
  },
  {
    key: 'relative',
    title: 'RelativeTime',
    subtitle: 'A timestamp in words, redrawn only when it changes',
    group: 'Foundation',
    Component: RelativeDemo,
  },
  {
    key: 'hooks',
    title: 'Hooks',
    subtitle: 'Debounced values and disclosure',
    group: 'Foundation',
    Component: HooksDemo,
  },
  {
    key: 'theme',
    title: 'Theme',
    subtitle: 'Roles, radius, spacing, shadows, color math',
    group: 'Foundation',
    Component: ThemeDemo,
  },
]
