import { memo, type ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { Text } from '../primitives/text'
import { useInsets, useTheme } from '../theme/provider'

export type ModalProps = {
  visible: boolean
  onClose: () => void
  /**
   * `sheet` rises from the bottom edge, `center` floats, `full` covers the
   * screen. Sheets keep the user's place in the page behind them, which is why
   * they suit pickers and confirmations.
   */
  variant?: 'sheet' | 'center' | 'full'
  title?: string
  children?: ReactNode
  /** Pinned below the content, outside the scroll area */
  footer?: ReactNode
  /** Tapping the scrim closes. Turn off for destructive confirmations */
  dismissOnBackdrop?: boolean
  scrollable?: boolean
  /** Adds keyboard avoidance - required when the modal contains a text field */
  keyboardAware?: boolean
  /** Drag affordance at the top of a sheet */
  handle?: boolean
  style?: StyleProp<ViewStyle>
}

function ModalBase({
  visible,
  onClose,
  variant = 'sheet',
  title,
  children,
  footer,
  dismissOnBackdrop = true,
  scrollable = false,
  keyboardAware = false,
  handle = true,
  style,
}: ModalProps) {
  const { colors, radius, space } = useTheme()
  const insets = useInsets()

  const surface: ViewStyle = {
    backgroundColor: colors.sheet,
    padding: space(4),
    gap: space(3),
  }

  const shape: ViewStyle =
    variant === 'sheet'
      ? {
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          paddingBottom: insets.bottom + space(4),
        }
      : variant === 'center'
        ? { borderRadius: radius.lg, marginHorizontal: space(5) }
        : { flex: 1, paddingTop: insets.top + space(2), paddingBottom: insets.bottom + space(4) }

  const body = (
    <View style={[surface, shape, style]}>
      {variant === 'sheet' && handle && (
        <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
      )}
      {title != null && <Text variant="heading">{title}</Text>}
      {scrollable ? (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        children
      )}
      {footer}
    </View>
  )

  return (
    <RNModal
      visible={visible}
      transparent={variant !== 'full'}
      // Native transitions rather than hand-rolled ones: they run on the OS
      // side and stay smooth while JS is busy rendering the content.
      animationType={variant === 'center' ? 'fade' : 'slide'}
      statusBarTranslucent
      onRequestClose={onClose}>
      <View
        style={[
          styles.root,
          variant === 'sheet' && styles.bottom,
          variant === 'center' && styles.centered,
          { backgroundColor: variant === 'full' ? colors.canvas : colors.overlay },
        ]}>
        {variant !== 'full' && (
          // The scrim is a sibling of the surface, not its parent: nesting them
          // would make every tap inside the modal bubble out to the dismiss.
          <Pressable
            style={StyleSheet.absoluteFill}
            disabled={!dismissOnBackdrop}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        )}
        {keyboardAware ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={variant === 'full' ? styles.fill : undefined}>
            {body}
          </KeyboardAvoidingView>
        ) : (
          body
        )}
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  bottom: { justifyContent: 'flex-end' },
  centered: { justifyContent: 'center' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center' },
})

export const Modal = memo(ModalBase)
