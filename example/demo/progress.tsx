import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Button, Card, Progress, Skeleton, Text, useTheme } from '@bfkk/bevel'

import { Demo, Row, Stack } from './ui'

export function ProgressDemo() {
  const [value, setValue] = useState(0.1)
  const [known, setKnown] = useState<number | undefined>(undefined)
  const { space } = useTheme()

  useEffect(() => {
    const timer = setInterval(() => setValue((v) => (v >= 1 ? 0 : v + 0.07)), 600)
    return () => clearInterval(timer)
  }, [])

  return (
    <Stack>
      <Demo
        title="Determinate"
        note="Both modes animate scaleX rather than width, which keeps them on the native driver - a bar filling during a heavy upload should not stutter because JavaScript is busy.">
        <Progress value={value} label="Uploading" showValue />
        <Progress value={0.35} />
        <Progress value={1} tone="ok" label="Done" showValue />
      </Demo>

      <Demo title="Indeterminate" note="For work with no measurable end. The sweep is measured against the track it is in rather than a fixed distance, which is what stops it overshooting on a wide screen and stopping short on a narrow one.">
        <Progress label="Connecting" />
      </Demo>

      <Demo
        title="Learning the size mid-task"
        note="The common case: work starts before anyone knows how much of it there is. Both modes drive the same two values rather than two different transforms, so the sweeping segment slides home to the left edge and settles at the real figure instead of cutting to it.">
        <Progress value={known} label="Downloading" showValue />
        <Row>
          <Button
            label={known == null ? 'Content-Length arrives' : 'Back to unknown'}
            variant="tinted"
            size="sm"
            full={false}
            onPress={() => setKnown((current) => (current == null ? 0.72 : undefined))}
          />
        </Row>
      </Demo>

      <Demo title="Thickness and tone" row={false}>
        <Progress value={0.6} height={2} />
        <Progress value={0.6} height={6} tone="warning" />
        <Progress value={0.6} height={10} tone="#8E4EC6" trackColor="accentSoft" />
      </Demo>

      <Demo
        title="Skeleton"
        note="The pulse honours the system reduce-motion setting and holds a steady tone instead.">
        <Skeleton />
        <Skeleton lines={3} />
        <Row>
          <Skeleton circle height={44} />
          <View style={{ flex: 1, gap: space(2) }}>
            <Skeleton height={12} width="60%" />
            <Skeleton height={10} width="40%" />
          </View>
        </Row>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <Skeleton height={120} radius="none" />
        </Card>
        <Text variant="caption" color="textMuted">
          The last bar of a group is shortened, which is what makes a block read as a paragraph
          rather than a table.
        </Text>
      </Demo>
    </Stack>
  )
}
