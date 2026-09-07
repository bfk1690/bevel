import { useState } from 'react'
import { Card, FileRow, Text, formatBytes, formatCount, toast, truncateMiddle } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

export function FilesDemo() {
  const [progress, setProgress] = useState(0.35)
  const [removed, setRemoved] = useState<string[]>([])

  const gone = (name: string) => removed.includes(name)

  return (
    <Stack>
      <Demo
        title="A list of files"
        note="Names are shortened from the MIDDLE. Cutting the tail off throws away the extension - the half that says what the thing is - and in a list of uploads from one folder the front halves are often identical anyway.">
        <Card padding={0} style={{ paddingHorizontal: 16 }}>
          {!gone('quarterly-report-final-v3.pdf') && (
            <FileRow
              name="quarterly-report-final-v3.pdf"
              size={2_411_724}
              onRemove={() => setRemoved((list) => [...list, 'quarterly-report-final-v3.pdf'])}
              onPress={() => toast.info('Opened')}
            />
          )}
          <FileRow name="holiday-photo.HEIC" size={4_182_016} />
          <FileRow name="voice-memo-2026-09-04.m4a" size={812_442} />
          <FileRow name="site-backup.7z" size={1_073_741_824} />
          <FileRow name="notes" size={214} />
        </Card>
      </Demo>

      <Demo title="Uploading">
        <Card padding={0} style={{ paddingHorizontal: 16 }}>
          <FileRow name="presentation.pptx" state="uploading" progress={progress} onRemove={() => {}} />
          <FileRow name="unknown-length.mov" state="uploading" onRemove={() => {}} />
        </Card>
        <Text
          variant="caption"
          color="accent"
          onPress={() => setProgress((value) => (value >= 1 ? 0 : value + 0.2))}>
          Advance the bar
        </Text>
      </Demo>

      <Demo
        title="Failed"
        note="A failure keeps the row in place with a retry rather than removing it. A file that vanishes on error leaves the user unsure whether it was sent.">
        <Card padding={0} style={{ paddingHorizontal: 16 }}>
          <FileRow
            name="huge-video-file.mov"
            state="failed"
            error="Too large - 500 MB limit"
            onRetry={() => toast.info('Retrying')}
            onRemove={() => {}}
          />
        </Card>
      </Demo>

      <Demo title="The formatting behind it">
        <Card gap={4}>
          <Text variant="caption" color="textMuted">{`formatBytes(1536) = ${formatBytes(1536)}`}</Text>
          <Text variant="caption" color="textMuted">{`formatBytes(2048) = ${formatBytes(2048)}  (not 2.0 KB)`}</Text>
          <Text variant="caption" color="textMuted">{`formatCount(999) = ${formatCount(999)}  (not 1k)`}</Text>
          <Text variant="caption" color="textMuted">{`formatCount(1500) = ${formatCount(1500)}`}</Text>
          <Text variant="caption" color="textMuted">
            {`truncateMiddle('quarterly-report-final-v3.pdf', 20) = ${truncateMiddle('quarterly-report-final-v3.pdf', 20)}`}
          </Text>
        </Card>
      </Demo>
    </Stack>
  )
}
