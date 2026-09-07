import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { Card, InfiniteList, ListItem, Text, appendPage, isLastPage, toast } from '@bfkk/bevel'

import { Demo, Row, Stack } from './ui'

type Row = { id: string; title: string; subtitle: string }

const PAGE_SIZE = 12
const TOTAL = 46

function fetchPage(page: number): Promise<Row[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const start = page * PAGE_SIZE
      const count = Math.max(0, Math.min(PAGE_SIZE, TOTAL - start))
      resolve(
        Array.from({ length: count }, (_, offset) => ({
          id: `row-${start + offset}`,
          title: `Order HJ-${88400 + start + offset}`,
          subtitle: `Page ${page + 1}`,
        })),
      )
    }, 700)
  })
}

export function InfiniteDemo() {
  const [rows, setRows] = useState<Row[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [failNext, setFailNext] = useState(false)

  const load = useCallback(
    async (next: number, first: boolean) => {
      if (first) setLoading(true)
      else setLoadingMore(true)
      setError(null)

      if (failNext && !first) {
        setTimeout(() => {
          setError(new Error('The server took too long to answer'))
          setLoadingMore(false)
          setFailNext(false)
        }, 700)
        return
      }

      const received = await fetchPage(next)
      // Servers repeat rows across pages more often than anyone expects, and
      // React answers a duplicate key with a warning and a row rendered wrong
      setRows((current) => appendPage(current, received, (row) => row.id))
      setHasMore(!isLastPage(received.length, PAGE_SIZE))
      setPage(next + 1)
      setLoading(false)
      setLoadingMore(false)
    },
    [failNext],
  )

  useState(() => {
    void load(0, true)
  })

  return (
    <Stack>
      <Demo
        title="Loading as it runs out"
        note="onEndReached is not a request for the next page - it is a report that the end is near, and it fires again on every scroll that keeps it near. The guard is what turns that into one fetch per page, and it also refuses to retry a failed page on its own: scrolling near the end again would hammer a server that just said no, with nothing on screen to say anything is being attempted.">
        <Card padding={0} style={{ height: 420, overflow: 'hidden' }}>
          <InfiniteList
            data={rows}
            keyExtractor={(row) => row.id}
            renderItem={(row, index) => (
              <View style={{ paddingHorizontal: 16 }}>
                <ListItem title={row.title} subtitle={row.subtitle} divider={index < rows.length - 1} />
              </View>
            )}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={() => load(page, false)}
            onRetry={() => load(page, rows.length === 0)}
            endLabel="That is all of them"
          />
        </Card>

        <Row>
          <Text
            variant="caption"
            color="accent"
            onPress={() => {
              setFailNext(true)
              toast.info('The next page will fail')
            }}>
            Make the next page fail
          </Text>
        </Row>
      </Demo>

      <Demo
        title="Which list draws it"
        note="FlatList by default, because it costs nothing - it is in React Native. FlashList is one prop, not a dependency: a bundler cannot resolve a module conditionally, so an optional native dependency is either forced on everyone or fails to build for whoever skipped it. The choice stays with the app that pays for it.">
        <Card gap={4}>
          <Text variant="caption" color="textMuted">{'<InfiniteList ... />'}</Text>
          <Text variant="caption" color="textMuted">{'<InfiniteList ListComponent={FlashList} ... />'}</Text>
        </Card>
      </Demo>
    </Stack>
  )
}
