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
      <Demo
        title="Pages"
        note="Wrapping is on by default. Reaching the last page and finding the swipe does nothing reads as a broken control rather than as a limit - so a copy of the last page sits before the first and a copy of the first after the last, and landing on one moves the scroll position to the real page without animation.">
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
        note="The window holds still and the active dot travels across it, shifting only when the dot reaches an edge. Re-centring on every page would pin the highlight in the middle while the indices shuffle underneath. Each dot keeps a fixed footprint and is scaled rather than resized, and its colour is a crossfade between two stacked circles - transform and opacity are what the native driver can carry, so the row stays smooth while the pager beside it is being dragged.">
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

      <Demo title="Without wrapping" note="Set loop={false} where the end of the list is the point - a tour, a set of steps.">
        <Carousel
          data={PHOTOS}
          loop={false}
          height={space(24)}
          renderItem={(uri) => (
            <View style={{ flex: 1, paddingRight: space(3) }}>
              <View style={{ flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.skeleton }}>
                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            </View>
          )}
        />
      </Demo>

      <Demo
        title="Auto-play"
        note="Touching pauses it and it picks up again once left alone - two and a half seconds here. Moving a page while it is being read is rude; never moving again after a single swipe is dead. Pass resumeAfterMs={0} where taking hold really is the end of it.">
        <Carousel
          data={PHOTOS}
          autoPlayMs={2200}
          resumeAfterMs={2500}
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
