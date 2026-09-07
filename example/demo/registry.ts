import type { ComponentType } from 'react'

import { AccordionDemo } from './accordion'
import { ButtonDemo } from './button'
import { ContentDemo } from './content'
import { DateDemo } from './date'
import { InputDemo } from './input'
import { KeyboardDemo, KeyboardDemoFooter } from './keyboard'
import { MediaDemo } from './media'
import { ModalDemo } from './modal'
import { OtpDemo } from './otp'
import { PopoverDemo } from './popover'
import { ProgressDemo } from './progress'
import { SegmentedDemo } from './segmented'
import { SelectDemo } from './select'
import { SelectionDemo } from './selection'
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
    key: 'accordion',
    title: 'Accordion',
    subtitle: 'Disclosure rows with measured height',
    group: 'Content',
    Component: AccordionDemo,
  },
  {
    key: 'toast',
    title: 'Toast',
    subtitle: 'Tones, actions, replacement behaviour',
    group: 'Feedback',
    Component: ToastDemo,
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
    key: 'text',
    title: 'Text',
    subtitle: 'Type scale, color roles, casing',
    group: 'Foundation',
    Component: TextDemo,
  },
  {
    key: 'theme',
    title: 'Theme',
    subtitle: 'Roles, radius, spacing, shadows, color math',
    group: 'Foundation',
    Component: ThemeDemo,
  },
]
