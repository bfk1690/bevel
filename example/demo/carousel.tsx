import { useState } from 'react'
import { Image, View } from 'react-native'
import { Carousel, Card, Text, useTheme } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

const PHOTOS = [
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900',
]

const MANY = Array.from({ length: 12 }, (_, index) => index + 1)

export function CarouselDemo() {
  const [page, setPage] = useState(0)
  const { colors, radius, space } = useTheme()

  return (
    <Stack>
      <Demo title="Pages">
        <Carousel
          data={PHOTOS}
          height={space(45)}
          onIndexChange={setPage}
          renderItem={(uri) => (
            <View style={{ flex: 1, paddingRight: space(3) }}>
              <View style={{ flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.skeleton }}>
                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            </View>
          )}
        />
        <Text variant="caption" color="textFaint">
          {`page ${page + 1} of ${PHOTOS.length}`}
        </Text>
      </Demo>

      <Demo
        title="More pages than dots"
        note="Past a handful, one dot per page is a ruler nobody reads and a row that no longer fits. The window follows the active page, and the shrinking dots at its edges say there is more that way without spelling out how much.">
        <Carousel
          data={MANY}
          height={space(24)}
          renderItem={(item, state) => (
            <View style={{ flex: 1, paddingRight: space(3) }}>
              <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="title" color={state.active ? 'accent' : 'textMuted'}>
                  {String(item)}
                </Text>
              </Card>
            </View>
          )}
        />
      </Demo>

      <Demo
        title="Auto-play"
        note="It advances on its own, and the first touch stops it for good. A page that moves again while being read is worse than one that never moved, and a user who took hold of it has said what they want.">
        <Carousel
          data={PHOTOS}
          autoPlayMs={2200}
          height={space(24)}
          tone="ok"
          renderItem={(uri) => (
            <View style={{ flex: 1, paddingRight: space(3) }}>
              <View style={{ flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.skeleton }}>
                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            </View>
          )}
        />
      </Demo>
    </Stack>
  )
}
