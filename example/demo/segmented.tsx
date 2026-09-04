import { useState } from 'react'
import { View } from 'react-native'
import { SegmentedControl, Text, useTheme } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

export function SegmentedDemo() {
  const [range, setRange] = useState('week')
  const [view, setView] = useState('grid')
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [tone, setTone] = useState('a')
  const { space, colors } = useTheme()

  return (
    <Stack>
      <Demo
        title="Two segments"
        note="The indicator slides between segments rather than blinking from one to the next - movement is what tells the eye these choices are one axis.">
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: 'grid', label: 'Grid' },
            { value: 'list', label: 'List' },
          ]}
        />
      </Demo>

      <Demo title="More segments">
        <SegmentedControl
          value={range}
          onChange={setRange}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ]}
        />
        <Text variant="caption" color="textMuted">
          {`selected: ${range}`}
        </Text>
      </Demo>

      <Demo title="Sizes">
        <SegmentedControl
          value={size}
          onChange={setSize}
          size={size}
          options={[
            { value: 'sm', label: 'sm' },
            { value: 'md', label: 'md' },
            { value: 'lg', label: 'lg' },
          ]}
        />
        <Text variant="caption" color="textMuted">
          The control resizes itself to whatever you pick.
        </Text>
      </Demo>

      <Demo title="Disabled segment">
        <SegmentedControl
          value={tone}
          onChange={setTone}
          options={[
            { value: 'a', label: 'Available' },
            { value: 'b', label: 'Also here' },
            { value: 'c', label: 'Locked', disabled: true },
          ]}
        />
      </Demo>

      <Demo title="Custom content" note="render replaces the label and receives the resolved size and color.">
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            {
              value: 'grid',
              label: 'Grid',
              render: ({ size: iconSize, color }) => (
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: iconSize * 0.3,
                        height: iconSize * 0.3,
                        backgroundColor: color,
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </View>
              ),
            },
            {
              value: 'list',
              label: 'List',
              render: ({ size: iconSize, color }) => (
                <View style={{ gap: 3 }}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={{ width: iconSize, height: 2, backgroundColor: color }} />
                  ))}
                </View>
              ),
            },
          ]}
        />
      </Demo>

      <Demo title="Tinted and rounded" row={false}>
        <SegmentedControl
          value={view}
          onChange={setView}
          tone="accent"
          radius="pill"
          options={[
            { value: 'grid', label: 'Grid' },
            { value: 'list', label: 'List' },
          ]}
        />
        <SegmentedControl
          value={view}
          onChange={setView}
          trackColor={colors.accentSoft}
          radius={0}
          options={[
            { value: 'grid', label: 'Grid' },
            { value: 'list', label: 'List' },
          ]}
          style={{ marginTop: space(2) }}
        />
      </Demo>

      <Demo title="Disabled">
        <SegmentedControl
          value={view}
          onChange={setView}
          disabled
          options={[
            { value: 'grid', label: 'Grid' },
            { value: 'list', label: 'List' },
          ]}
        />
      </Demo>
    </Stack>
  )
}
