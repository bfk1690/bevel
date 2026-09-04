import { memo, type ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { resolveColor } from '../theme/color'
import { useInsets, useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'

export type ScreenEdge = 'top' | 'bottom'

export type ScreenProps = {
  children: ReactNode
  /**
   * Fixed header, rendered OUTSIDE the scroll area.
   *
   * Passing a header as a child puts it inside the scroll view, where anything
   * it carries - a balance, a filter, a primary action - disappears as soon as
   * the user scrolls.
   */
  header?: ReactNode
  /**
   * Fixed footer, a sibling of the scroll area rather than its last child.
   *
   * As a child, an action block forces the user to scroll to the end to reach
   * it; as a sibling it also stops overlapping the content, because the scroll
   * area simply takes the space that is left.
   */
  footer?: ReactNode
  scrollable?: boolean
  /**
   * Lifts the content above the keyboard. Required on any screen with a text
   * field; skip it elsewhere so the layout does not shift for no reason.
   */
  keyboardAware?: boolean
  background?: ColorInput | 'none'
  /** Horizontal padding for the content. Defaults to `space(4)` */
  padding?: number
  /** Which safe-area edges to respect. Screens with their own full-bleed
   * header usually drop `'top'` */
  edges?: readonly ScreenEdge[]
  /** Typed off `ScrollViewProps` so the element type stays correct across React Native versions */
  refreshControl?: ScrollViewProps['refreshControl']
  contentContainerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
  scrollProps?: Omit<ScrollViewProps, 'refreshControl' | 'contentContainerStyle'>
}

const DEFAULT_EDGES: readonly ScreenEdge[] = ['top', 'bottom']

function ScreenBase({
  children,
  header,
  footer,
  scrollable = true,
  keyboardAware = false,
  background = 'canvas',
  padding,
  edges = DEFAULT_EDGES,
  refreshControl,
  contentContainerStyle,
  style,
  scrollProps,
}: ScreenProps) {
  const { colors, space } = useTheme()
  const insets = useInsets()

  const paddingHorizontal = padding ?? space(4)
  const backgroundColor =
    background === 'none' ? 'transparent' : resolveColor(colors, background, colors.canvas)

  const top = edges.includes('top') ? insets.top : 0
  const bottom = edges.includes('bottom') ? insets.bottom : 0

  const content = scrollable ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      contentContainerStyle={[
        { paddingHorizontal, paddingBottom: footer ? space(4) : bottom + space(4) },
        contentContainerStyle,
      ]}
      {...scrollProps}>
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.fill,
        { paddingHorizontal, paddingBottom: footer ? 0 : bottom },
        contentContainerStyle,
      ]}>
      {children}
    </View>
  )

  const body = (
    <>
      {header != null && <View style={{ paddingTop: top }}>{header}</View>}
      {header == null && top > 0 ? <View style={{ height: top }} /> : null}
      {content}
      {footer != null && (
        <View style={{ paddingHorizontal, paddingBottom: bottom || space(2) }}>{footer}</View>
      )}
    </>
  )

  return (
    <View style={[styles.fill, { backgroundColor }, style]}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={styles.fill}
          // Android resizes the window itself; adding padding on top of that
          // double-counts the keyboard and leaves a gap above it.
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})

export const Screen = memo(ScreenBase)
