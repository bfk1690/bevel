import { useState } from 'react'
import { Rating, Text } from '@bfkk/bevel'

import { Demo, Row, Stack } from './ui'

export function RatingDemo() {
  const [score, setScore] = useState(0)
  const [half, setHalf] = useState(2.5)

  return (
    <Stack>
      <Demo
        title="Giving a rating"
        note="Drag across the row and it keeps changing, not just on the tap. Picking four when you meant five otherwise costs a second, separate tap on a target the width of a fingertip.">
        <Rating value={score} onChange={setScore} showValue />
        <Text variant="caption" color="textFaint">
          {score === 0 ? 'Touch anywhere in the first star to give one.' : `You gave ${score}.`}
        </Text>
      </Demo>

      <Demo
        title="Halves"
        note="Anything past a star's midpoint reads as half; below it the star is empty rather than a sliver nobody can judge.">
        <Rating value={half} onChange={setHalf} allowHalf showValue />
      </Demo>

      <Demo title="Read-only" note="Without onChange the row is a score, not a question.">
        <Row>
          <Rating value={4.3} allowHalf />
          <Text variant="caption" color="textMuted">
            4.3 from 128 reviews
          </Text>
        </Row>
        <Rating value={3} size={16} />
      </Demo>

      <Demo title="Size, count and tone" row>
        <Rating value={3} size={16} />
        <Rating value={3} size={28} />
        <Rating value={7} count={10} size={14} />
        <Rating value={4} tone="danger" />
        <Rating value={4} tone="#8E4EC6" emptyTone="accentSoft" />
      </Demo>
    </Stack>
  )
}
