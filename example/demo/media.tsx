import { useState } from 'react'
import { Image, Pressable, View } from 'react-native'
import { Card, ImageShower, Text, toast, useTheme } from '@bfkk/bevel'

import { Demo, Row, Stack } from './ui'

const PHOTOS = [
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1400',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1400',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1400',
]

export function MediaDemo() {
  const [gallery, setGallery] = useState<number | null>(null)
  const [single, setSingle] = useState(false)
  const [titled, setTitled] = useState(false)
  const { space, colors } = useTheme()

  return (
    <Stack>
      <Demo
        title="Gallery"
        note="Swipe to page, pinch to zoom, drag to pan, double tap to toggle, drag down to dismiss, single tap to hide the chrome. Zoom follows the point between your fingers. The actions sit along the bottom edge rather than the top: the viewer is held in one hand, and the top of a large phone is out of reach of the thumb holding it.">
        <Row>
          {PHOTOS.map((uri, index) => (
            <Pressable key={uri} onPress={() => setGallery(index)} style={{ flex: 1 }}>
              <View
                style={{
                  height: space(20),
                  borderRadius: space(3),
                  overflow: 'hidden',
                  backgroundColor: colors.skeleton,
                }}>
                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            </Pressable>
          ))}
        </Row>
        <Text variant="caption" color="textMuted">
          Built on PanResponder and the core animation driver, so pinch works on Android too -
          viewers that lean on the platform scroll view get zoom on iOS only.
        </Text>
      </Demo>

      <Demo
        title="Where a pinch gets lost"
        note="Worth trying deliberately, because this is the one that used to fail. Open the gallery above - the one with several pages - and pinch quickly, or land the second finger a moment after the first. The pager's scroll recogniser starts as soon as a finger drifts, and turning scrolling off cannot cancel one already running; so the page claims the gesture as the second finger lands, before any movement. Then lift one finger and carry on panning: the picture should stay under your hand rather than jumping, and a third finger landing mid-pinch should change nothing.">
        <Card onPress={() => setGallery(0)} title="Open the gallery again" />
      </Demo>

      <Demo title="Single image" note="With one item the pager and the counter disappear.">
        <Card onPress={() => setSingle(true)} title="Open one photo" />
      </Demo>

      <Demo title="Titles" note="A per-item title wins over the viewer-wide one.">
        <Card onPress={() => setTitled(true)} title="Open with captions" />
      </Demo>

      <ImageShower
        visible={gallery != null}
        index={gallery ?? 0}
        items={PHOTOS}
        onClose={() => setGallery(null)}
        onIndexChange={setGallery}
        actions={[
          { key: 'share', label: 'Share', onPress: (_, index) => toast.info(`Shared ${index + 1}`) },
          { key: 'save', label: 'Save', onPress: () => toast.success('Saved') },
          { key: 'delete', label: 'Delete', destructive: true, onPress: () => toast.warning('Deleted') },
        ]}
      />

      <ImageShower
        visible={single}
        items={[PHOTOS[1]!]}
        onClose={() => setSingle(false)}
        title="A single frame"
      />

      <ImageShower
        visible={titled}
        items={[
          { uri: PHOTOS[0]!, title: 'Forest road' },
          { uri: PHOTOS[2]!, title: 'Ridge at dawn' },
        ]}
        onClose={() => setTitled(false)}
        maxScale={6}
        doubleTapScale={3}
      />
    </Stack>
  )
}
