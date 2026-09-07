import { StyleSheet, View } from 'react-native'

import { Button } from '../primitives/button'
import { Text } from '../primitives/text'
import { useTheme } from '../theme/provider'
import { Modal } from './modal'

export type ActionSheetAction = {
  label: string
  onPress: () => void
  destructive?: boolean
  disabled?: boolean
}

export type ActionSheetProps = {
  visible: boolean
  onClose: () => void
  title?: string
  message?: string
  actions: readonly ActionSheetAction[]
  /** Set to null to leave the sheet without an explicit way out */
  cancelLabel?: string | null
}

/**
 * A short list of things to do, from the bottom edge.
 *
 * The cancel sits apart from the actions rather than at the end of the list.
 * Grouped with them it becomes a fourth option to read past; separated, it is
 * where the thumb already expects a way out.
 *
 * Choosing an action closes the sheet first, so a handler that opens another
 * one is not fighting a sheet on its way down.
 */
export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  actions,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const { space } = useTheme()

  return (
    <Modal visible={visible} onClose={onClose} variant="sheet" handle={false}>
      {(title != null || message != null) && (
        <View style={[styles.head, { gap: space(1), paddingBottom: space(1) }]}>
          {title != null && (
            <Text variant="bodyStrong" align="center">
              {title}
            </Text>
          )}
          {message != null && (
            <Text variant="caption" color="textMuted" align="center">
              {message}
            </Text>
          )}
        </View>
      )}

      <View style={{ gap: space(2) }}>
        {actions.map((action, index) => (
          <Button
            key={`${action.label}-${index}`}
            label={action.label}
            variant={action.destructive ? 'danger' : 'secondary'}
            disabled={action.disabled}
            onPress={() => {
              onClose()
              action.onPress()
            }}
          />
        ))}
      </View>

      {cancelLabel != null && (
        <View style={{ paddingTop: space(1) }}>
          <Button label={cancelLabel} variant="ghost" onPress={onClose} />
        </View>
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  head: { alignItems: 'center' },
})
