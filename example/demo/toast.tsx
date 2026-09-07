import { Banner, Button, Text, toast, useTheme } from '@bfkk/bevel'
import { View } from 'react-native'

import { Demo, Row, Stack } from './ui'

export function ToastDemo() {
  const { space } = useTheme()

  return (
    <Stack>
      <Demo
        title="Banner"
        note="Where a toast reports something that just happened and leaves, a banner states a condition that is still true - offline, over quota, a draft not yet published - and stays until it is not. The tone is a bar down the leading edge rather than a wash across the block: a filled panel competes with the content it sits above.">
        <Banner message="You are offline. Changes are saved on this device." />
        <Banner
          tone="warning"
          title="Storage almost full"
          message="Older exports will stop being kept."
          actionLabel="Manage storage"
          onAction={() => toast.info('Storage')}
        />
        <Banner
          tone="danger"
          title="Payment failed"
          message="The card was declined."
          actionLabel="Try another card"
          onAction={() => toast.info('Cards')}
          onDismiss={() => toast.info('Dismissed')}
        />
        <Banner tone="ok" message="Everything is up to date." onDismiss={() => toast.info('Dismissed')} />
      </Demo>

      <Demo
        title="Tones"
        note="Tap one, then immediately tap another: the newest message takes the slot and starts its own countdown. Queueing would make you wait to read the one that matters."
        row>
        <Button label="success" size="sm" full={false} onPress={() => toast.success('Saved')} />
        <Button
          label="error"
          size="sm"
          variant="danger"
          full={false}
          onPress={() => toast.error('Could not connect')}
        />
        <Button
          label="warning"
          size="sm"
          variant="secondary"
          full={false}
          onPress={() => toast.warning('Storage is almost full')}
        />
        <Button
          label="info"
          size="sm"
          variant="secondary"
          full={false}
          onPress={() => toast.info('Three items were skipped')}
        />
      </Demo>

      <Demo title="Title and message">
        <Button
          label="Show"
          variant="secondary"
          onPress={() =>
            toast.show({
              title: 'Upload finished',
              message: 'Forty-two photos were added to the shared album.',
              tone: 'success',
            })
          }
        />
      </Demo>

      <Demo title="With an action" note="The action dismisses the toast after it runs.">
        <Button
          label="Show"
          variant="secondary"
          onPress={() =>
            toast.error('Message not sent', {
              action: { label: 'Retry', onPress: () => toast.success('Sent') },
            })
          }
        />
      </Demo>

      <Demo
        title="Loading, then an answer"
        note="Updating in place keeps one event looking like one event. Raising a second toast would replace the first with a fresh countdown and a fresh entrance, which reads as two things happening. A toast the user has already dismissed is not brought back - they closed it, and the work finishing does not overrule that.">
        <Button
          label="Upload something"
          variant="secondary"
          onPress={() => {
            const id = toast.loading('Uploading')
            setTimeout(() => toast.update(id, { tone: 'success', message: 'Uploaded' }), 1800)
          }}
        />
        <Button
          label="Upload something that fails"
          variant="secondary"
          onPress={() => {
            const id = toast.loading('Uploading')
            setTimeout(
              () =>
                toast.update(id, {
                  tone: 'error',
                  message: 'Upload failed',
                  action: { label: 'Retry', onPress: () => toast.success('Uploaded') },
                }),
              1800,
            )
          }}
        />
        <Button
          label="Dismiss it before it finishes"
          variant="ghost"
          onPress={() => {
            const id = toast.loading('Swipe or tap me away')
            setTimeout(() => toast.update(id, { tone: 'success', message: 'Would have said this' }), 2500)
          }}
        />
      </Demo>

      <Demo title="Duration" row>
        <Button
          label="1s"
          size="sm"
          variant="secondary"
          full={false}
          onPress={() => toast.info('Gone in a second', { duration: 1000 })}
        />
        <Button
          label="8s"
          size="sm"
          variant="secondary"
          full={false}
          onPress={() => toast.info('Still here', { duration: 8000 })}
        />
        <Button
          label="until dismissed"
          size="sm"
          variant="secondary"
          full={false}
          onPress={() => toast.info('Tap me to close', { duration: 0 })}
        />
      </Demo>

      <Demo title="Custom tint" row note="Any role name or raw color.">
        <Button
          label="brand"
          size="sm"
          full={false}
          onPress={() => toast.show({ message: 'Tinted with the accent', tint: 'accent' })}
        />
        <Button
          label="raw"
          size="sm"
          variant="secondary"
          full={false}
          onPress={() => toast.show({ message: 'Tinted with #FF6B00', tint: '#FF6B00' })}
        />
      </Demo>

      <Demo
        title="Swipe to dismiss"
        note="Push a toast back the way it came and it goes. Waiting one out is an obstruction, and its tap target is small when it lands over a header. Dragging the other way is resisted rather than blocked, so it still feels attached to the finger.">
        <Button
          label="Show one and try it"
          variant="secondary"
          onPress={() => toast.info('Swipe me upwards', { duration: 6000 })}
        />
      </Demo>

      <Demo
        title="Position and custom rendering"
        note="Toaster takes a position and a renderToast, so an app can put its own card in the slot while keeping the queueing, timing and dismissal.">
        <Text variant="caption" color="textMuted">
          {'<Toaster position="bottom" offset={12} />'}
        </Text>
        <Text variant="caption" color="textMuted">
          {'<Toaster renderToast={(item) => <MyCard {...item} />} />'}
        </Text>
      </Demo>

      <Demo title="Dismiss">
        <View style={{ gap: space(2) }}>
          <Row>
            <Button
              label="Show one"
              size="sm"
              variant="secondary"
              full={false}
              onPress={() => toast.info('Tap dismiss', { id: 'pinned', duration: 0 })}
            />
            <Button
              label="Dismiss by id"
              size="sm"
              variant="outline"
              full={false}
              onPress={() => toast.dismiss('pinned')}
            />
            <Button label="Clear" size="sm" variant="ghost" full={false} onPress={() => toast.clear()} />
          </Row>
          <Text variant="caption" color="textMuted">
            Toasts are fired from a store outside React, so a network layer or a background task can
            raise one without being inside the tree.
          </Text>
        </View>
      </Demo>
    </Stack>
  )
}
