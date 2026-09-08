import { useState } from 'react'
import { View } from 'react-native'
import { BarChart, Card, Grid, Stat, Text, toast, useTheme } from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

const WEEK = [
  { value: 1240, label: 'Mon' },
  { value: 1890, label: 'Tue' },
  { value: 1610, label: 'Wed' },
  { value: 2340, label: 'Thu' },
  { value: 2810, label: 'Fri' },
  { value: 940, label: 'Sat' },
  { value: 620, label: 'Sun' },
]

export function StatDemo() {
  const { space } = useTheme()
  const [active, setActive] = useState<number | undefined>(undefined)

  return (
    <Stack>
      <Demo
        title="Up is not the same as good"
        note="A metric has to say which direction it wants. Painting every rise green is the most common lie a dashboard tells: response time, error rate, cost per order and churn all get worse going up. A metric that has not said is reported and left uncoloured - our opinion of an unlabelled number is the thing that is neutral, not the number.">
        <Card>
          <Grid
            data={[
              { key: 'revenue', label: 'Revenue', value: '₺12,400', delta: 8.2, goodWhen: 'up' as const, caption: 'this week' },
              { key: 'response', label: 'Response time', value: '340ms', delta: 12.5, goodWhen: 'down' as const, caption: 'this week' },
              { key: 'churn', label: 'Churn', value: '2.1%', delta: -0.4, goodWhen: 'down' as const, caption: 'this week' },
              { key: 'sessions', label: 'Sessions', value: '48,209', delta: 3.1, caption: 'no opinion' },
            ]}
            keyExtractor={(item) => item.key}
            minItemWidth={140}
            gap={16}
            renderItem={(item) => (
              <Stat
                label={item.label}
                value={item.value}
                delta={item.delta}
                goodWhen={item.goodWhen}
                deltaAsPercent
                caption={item.caption}
                size="heading"
              />
            )}
          />
        </Card>
        <Text variant="caption" color="textFaint">
          Both middle tiles rose. One is good news and one is bad, and only the
          metric knows which.
        </Text>
      </Demo>

      <Demo
        title="The direction is a shape, not only a colour"
        note="Red and green are the two most common colours to confuse. A dashboard that says worse only in red says nothing to about one man in twelve, so the arrow carries the direction too. The figures are drawn with tabular digits: proportional ones are different widths, and a live count wobbles as they change under it.">
        <Card>
          <Stat label="Open calls" value="17" delta={0} caption="unchanged since Friday" />
        </Card>
      </Demo>

      <Demo
        title="Bars, drawn with views"
        note="The one chart that needs no drawing primitives, which is why it is the only one here: anything with a line or a curve wants a canvas, and a canvas wants a dependency this package will not take. The scale starts at zero and there is no way to ask it not to - cutting the axis to just under the smallest value turns a 3% difference into a doubling.">
        <Card>
          <BarChart
            data={WEEK}
            height={140}
            activeIndex={active}
            onPressBar={(index, datum) => {
              setActive(index === active ? undefined : index)
              toast.info(`${datum.label}: ${datum.value.toLocaleString('en')}`)
            }}
            formatValue={(value) => value.toLocaleString('en')}
          />
        </Card>
        <Spec label="top of scale">
          <Text variant="caption" color="textMuted">
            rounded up from 2,810 to 5,000
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="Two charts, one scale"
        note="Side by side with their own scales, two charts invite a comparison that is not there - the shorter one looks the same height as the taller. A fixed maximum is how you say they belong together.">
        <View style={{ gap: space(3) }}>
          <Card title="This week">
            <BarChart data={WEEK} max={3000} height={70} showValues={false} />
          </Card>
          <Card title="Last week">
            <BarChart
              data={WEEK.map((day) => ({ ...day, value: Math.round(day.value * 0.4) }))}
              max={3000}
              height={70}
              tone="textMuted"
            />
          </Card>
        </View>
      </Demo>
    </Stack>
  )
}
