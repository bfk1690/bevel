import { useState } from 'react'
import { Image, View } from 'react-native'
import { Card, Grid, SegmentedControl, Slider, Text, useTheme } from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

const PHOTOS = Array.from({ length: 12 }, (_, index) => ({
  id: String(index),
  uri: `https://picsum.photos/seed/bevel-${index}/400/400`,
}))

const SWATCHES = [
  '#0A84FF',
  '#3DDC64',
  '#F5A623',
  '#8E4EC6',
  '#E5484D',
  '#12A594',
  '#EC4899',
  '#64748B',
]

export function GridDemo() {
  const { colors, radius, space } = useTheme()
  const [minWidth, setMinWidth] = useState(100)
  const [fixed, setFixed] = useState<number | undefined>(undefined)

  return (
    <Stack>
      <Demo
        title="As many columns as fit"
        note="Widths come back in points, never percentages. Percentage widths in a wrapping row round independently, and three items of 33.33% can total 100.01% - which drops the third onto its own line at some screen sizes and not others. This is the same bug that once put six columns in a seven-day calendar.">
        <Grid
          data={PHOTOS}
          keyExtractor={(photo) => photo.id}
          minItemWidth={minWidth}
          gap={6}
          aspectRatio={1}
          renderItem={(photo) => (
            <Image
              source={{ uri: photo.uri }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: radius.sm,
                backgroundColor: colors.sunk,
              }}
            />
          )}
        />
        <Spec label={`minItemWidth ${Math.round(minWidth)}`}>
          <View style={{ width: 160 }}>
            <Slider value={minWidth} onChange={setMinWidth} min={60} max={240} step={10} />
          </View>
        </Spec>
      </Demo>

      <Demo
        title="Or exactly as many as you say"
        note="A fixed count ignores the minimum entirely, which is what a layout wants when the design says three across and means it. Never below one: a grid with no columns is an invisible list.">
        <SegmentedControl
          value={fixed ?? 0}
          onChange={(value) => setFixed(value === 0 ? undefined : value)}
          options={[
            { value: 0, label: 'Auto' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
          ]}
        />
        <View style={{ height: space(3) }} />
        <Grid
          data={SWATCHES}
          keyExtractor={(color) => color}
          columns={fixed}
          minItemWidth={80}
          gap={8}
          aspectRatio={0.6}
          renderItem={(color) => (
            <View
              style={{
                flex: 1,
                borderRadius: radius.sm,
                backgroundColor: color,
              }}
            />
          )}
        />
      </Demo>

      <Demo
        title="Rows add up exactly"
        note="Each item is handed the layout it is being drawn into - the column count, its own width, the gap - so anything that needs to size itself against the row can, without measuring again."
      >
        <Card>
          <Grid
            data={SWATCHES.slice(0, 5)}
            keyExtractor={(color) => color}
            minItemWidth={90}
            gap={10}
            renderItem={(color, layout) => (
              <View style={{ gap: 4 }}>
                <View
                  style={{ height: 40, borderRadius: radius.sm, backgroundColor: color }}
                />
                <Text variant="micro" color="textFaint">
                  {`${Math.round(layout.itemWidth)}pt`}
                </Text>
              </View>
            )}
          />
        </Card>
        <Text variant="caption" color="textFaint">
          Widths times columns plus gaps equals the container, on every screen size.
        </Text>
      </Demo>

      <Demo
        title="What it is not"
        note="Not a list. Everything given to it is rendered, which is right for a screenful and wrong for a thousand photos. For a long collection put a grid row inside InfiniteList, where rows leave the tree as they leave the screen.">
        <Card>
          <Text variant="caption" color="textMuted">
            Twelve photos above. Twelve hundred would want the list.
          </Text>
        </Card>
      </Demo>
    </Stack>
  )
}
