import { useState } from 'react'
import { View } from 'react-native'
import { Avatar, Card, ListItem, ReorderableList, Text, toast, useTheme } from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

const ROW = 64

/** Long enough to run off the screen, which is the case that needs the edges */
const PLAYLIST = [
  { id: 'a', title: 'Karaköy at six', note: '3:12' },
  { id: 'b', title: 'The long way round', note: '4:48' },
  { id: 'c', title: 'Ferry weather', note: '2:57' },
  { id: 'd', title: 'Nothing on the radio', note: '5:20' },
  { id: 'e', title: 'Back before dark', note: '3:41' },
  { id: 'f', title: 'Someone else’s summer', note: '4:02' },
  { id: 'g', title: 'Two stops early', note: '3:28' },
  { id: 'h', title: 'The tea is cold', note: '2:44' },
  { id: 'i', title: 'Everything at once', note: '5:56' },
  { id: 'j', title: 'A quiet Tuesday', note: '3:15' },
  { id: 'k', title: 'Last one home', note: '4:33' },
  { id: 'l', title: 'Morning, eventually', note: '3:07' },
]

export function ReorderDemo() {
  const { colors, radius, space } = useTheme()
  const [tracks, setTracks] = useState(PLAYLIST)
  const [lastMove, setLastMove] = useState('nothing yet')

  return (
    <Stack>
      <Demo
        title="A list whose order is the point"
        note="Take hold of the grip on the right and drag. The gap opens while you move rather than after you let go: a list that only rearranges once the finger lifts asks you to hold a prediction in your head, when it could show you the answer. The swap happens as the centres cross, not a whole row later - waiting for a full row means the picture disagrees with where the item will land for half of every step.">
        <Card padding={0} gap={0} style={{ overflow: 'hidden', paddingHorizontal: space(4) }}>
          <ReorderableList
            data={tracks}
            itemHeight={ROW}
            keyExtractor={(track) => track.id}
            onReorder={(next, from, to) => {
              setTracks(next)
              setLastMove(`${from} → ${to}`)
            }}
            renderItem={(track, { dragging, handle }) => (
              <View
                style={{
                  height: ROW,
                  justifyContent: 'center',
                  backgroundColor: dragging ? colors.raised : colors.surface,
                  borderRadius: dragging ? radius.sm : 0,
                }}>
                <ListItem
                  title={track.title}
                  subtitle={track.note}
                  left={<Avatar name={track.title} />}
                  right={
                    // The grip takes the drag, and the whole handle is spread
                    // onto it: it carries a refusal to hand the gesture back,
                    // without which the scroll view underneath takes the drag
                    // the moment the finger moves
                    <View {...handle} hitSlop={12} style={{ gap: 3, padding: 6 }}>
                      {[0, 1, 2].map((line) => (
                        <View
                          key={line}
                          style={{
                            width: 18,
                            height: 2,
                            borderRadius: 1,
                            backgroundColor: colors.textFaint,
                          }}
                        />
                      ))}
                    </View>
                  }
                />
              </View>
            )}
          />
        </Card>
        <Spec label="last move">
          <Text variant="caption" color="textMuted">
            {lastMove}
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="Carrying a row past the bottom of the screen"
        note="Hold a row against the top or bottom edge and the page comes to meet it. Without this a list longer than the screen has to be crossed in several goes: drag to the edge, let go, scroll, pick it up again. The speed ramps with how deep into the edge the finger is - one speed cannot serve both jobs, since fast enough to cross a long list is far too fast for placing a row three places down, and depth is the only thing a held finger is saying about urgency.">
        <Card>
          <Text variant="caption" color="textMuted">
            The row keeps up with the page as it moves. Its travel is measured
            against the content, not the screen: without that the content
            slides up, the row's slot goes with it, and the finger is left
            holding nothing.
          </Text>
        </Card>
      </Demo>

      <Demo
        title="Inside a scrolling page"
        note="Two separate problems, and refusing the responder only solves the first. The grip takes the touch and refuses to hand it back, so the row stays with the finger - but on iOS the scroll view's recogniser is native and runs beside the JavaScript responder system rather than under it, so the page kept scrolling behind the row anyway. The list now holds the page still for the length of the drag, through the scroll context.">
        <Card>
          <Text variant="caption" color="textMuted">
            Drag a grip up and down. The page underneath should stay exactly
            where it is, and start moving again the moment you let go.
          </Text>
        </Card>
      </Demo>

      <Demo
        title="Rows are one height, and that is on purpose"
        note="Rows of different heights would mean re-measuring every neighbour on every frame of a drag. A list somebody reorders by hand is almost always a list of one repeated thing, and supporting the rare case would cost the common one.">
        <Card>
          <Text variant="caption" color="textMuted">
            {`itemHeight is ${ROW}. Everything given to the list is rendered - right for the length of list anyone actually drags through.`}
          </Text>
        </Card>
      </Demo>

      <Demo
        title="Dropping is not springing back"
        note="The row is already over the slot it earned when you let go, and the reorder puts it there for real in the same commit - so it never appears in two places in two frames, which reads as the drop having failed.">
        <Card
          onPress={() => {
            setTracks(PLAYLIST)
            setLastMove('nothing yet')
            toast.info('Back to the original order')
          }}
          title="Put the order back"
        />
      </Demo>
    </Stack>
  )
}
