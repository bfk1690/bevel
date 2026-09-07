import { useRef, useState } from 'react'
import { View } from 'react-native'
import { ActionSheet, Button, Menu, Text, toast, useTheme } from '@bfkk/bevel'

import { Demo, Row, Stack } from './ui'

export function MenuDemo() {
  const plain = useRef<View>(null)
  const marked = useRef<View>(null)
  const { space } = useTheme()

  const [open, setOpen] = useState<string | null>(null)
  const [sheet, setSheet] = useState<string | null>(null)
  const [sort, setSort] = useState('newest')

  return (
    <Stack>
      <Demo
        title="Menu"
        note="Choosing an item closes the menu without the caller saying so - leaving it open means dismissing something already finished with.">
        <View ref={plain} collapsable={false} style={{ alignSelf: 'flex-start' }}>
          <Button label="Actions" variant="secondary" full={false} onPress={() => setOpen('plain')} />
        </View>
        <Menu
          visible={open === 'plain'}
          onClose={() => setOpen(null)}
          anchorRef={plain}
          items={[
            { label: 'Share', onPress: () => toast.info('Shared') },
            { label: 'Duplicate', onPress: () => toast.info('Duplicated') },
            { label: 'Rename', onPress: () => toast.info('Renamed'), disabled: true },
            { label: 'Delete', onPress: () => toast.warning('Deleted'), destructive: true },
          ]}
        />
      </Demo>

      <Demo
        title="As a picker"
        note="A destructive item is coloured but not moved to the end: reordering by severity puts things somewhere different from one menu to the next, and muscle memory is worth more than the extra warning.">
        <View ref={marked} collapsable={false} style={{ alignSelf: 'flex-start' }}>
          <Button label={`Sort: ${sort}`} variant="outline" full={false} onPress={() => setOpen('sort')} />
        </View>
        <Menu
          visible={open === 'sort'}
          onClose={() => setOpen(null)}
          anchorRef={marked}
          items={['newest', 'oldest', 'name', 'size'].map((key) => ({
            label: key,
            onPress: () => setSort(key),
            right:
              key === sort ? (
                <Text variant="caption" color="accent">
                  ok
                </Text>
              ) : undefined,
          }))}
        />
      </Demo>

      <Demo
        title="Action sheet"
        note="The cancel sits apart from the actions rather than at the end of the list. Grouped with them it becomes a fourth option to read past; separated, it is where the thumb expects a way out.">
        <Row>
          <Button label="Open" variant="secondary" full={false} onPress={() => setSheet('plain')} />
          <Button label="With a warning" variant="secondary" full={false} onPress={() => setSheet('destructive')} />
          <Button label="No cancel" variant="secondary" full={false} onPress={() => setSheet('bare')} />
        </Row>
      </Demo>

      <View style={{ height: space(10) }} />

      <ActionSheet
        visible={sheet === 'plain'}
        onClose={() => setSheet(null)}
        title="Add a photo"
        actions={[
          { label: 'Take a photo', onPress: () => toast.info('Camera') },
          { label: 'Choose from library', onPress: () => toast.info('Library') },
        ]}
      />

      <ActionSheet
        visible={sheet === 'destructive'}
        onClose={() => setSheet(null)}
        title="Delete this album?"
        message="Sixteen photos will be removed. This cannot be undone."
        actions={[
          { label: 'Delete album', destructive: true, onPress: () => toast.warning('Deleted') },
          { label: 'Remove photos only', onPress: () => toast.info('Photos removed') },
        ]}
      />

      <ActionSheet
        visible={sheet === 'bare'}
        onClose={() => setSheet(null)}
        cancelLabel={null}
        actions={[{ label: 'The only way out is a tap outside', onPress: () => setSheet(null) }]}
      />
    </Stack>
  )
}
