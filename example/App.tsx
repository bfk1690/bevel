import { useCallback, useEffect, useMemo, useState } from 'react'
import { BackHandler, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import {
  BevelProvider,
  DialogHost,
  Button,
  Card,
  EmptyState,
  Header,
  LargeTitle,
  ListItem,
  Screen,
  SearchField,
  Text,
  Toaster,
  defineTheme,
  rankSuggestions,
  useScrollToTop,
  useTheme,
} from '@bfkk/bevel'

import { DEMOS } from './demo/registry'
import { ThemeToggle } from './demo/theme-toggle'

/**
 * The theme an app would write.
 *
 * Only the differences from the defaults appear here: a brand accent, one
 * gradient and one extra button variant.
 */
const theme = defineTheme({
  id: 'example',
  scale: 'moderate',
  schemes: {
    light: { accent: '#0A84FF' },
    dark: { accent: '#3DDC64', canvas: '#070A08', surface: '#101512' },
  },
  gradients: {
    hero: ['#8E4EC6', '#0A84FF'],
  },
  components: {
    Button: {
      variants: {
        hero: { bg: 'accent', gradient: 'hero', fg: '#FFFFFF', press: 'scale', shadow: 'float' },
      },
    },
  },
})

export default function App() {
  return (
    <SafeAreaProvider>
      <Providers />
    </SafeAreaProvider>
  )
}

/**
 * Insets and gradients are injected rather than imported by the package.
 *
 * That is what keeps bevel dependency-free: it knows a gradient's colors and
 * the size of the safe area, and lets the app decide what draws them.
 */
function Providers() {
  const insets = useSafeAreaInsets()
  return (
    <BevelProvider
      theme={theme}
      insets={insets}
      renderGradient={({ colors, style }) => (
        <LinearGradient
          colors={colors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={style}
        />
      )}>
      <Gallery />
      <DialogHost />
      <Toaster />
    </BevelProvider>
  )
}

/**
 * Index and detail, without a navigation library.
 *
 * One page per component beats one long wall: each screen can show every
 * variant, state and edge case of one thing, with room for the reasoning.
 */
function Gallery() {
  const { scheme, setPreference, space } = useTheme()
  const [route, setRoute] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')

  /**
   * The gallery searches itself with the package's own ranking, which is the
   * cheapest test of it there is: a page it cannot find is a bug in the thing
   * being demonstrated.
   */
  const found = useMemo(
    () =>
      rankSuggestions(query, DEMOS, (entry) => `${entry.title} ${entry.subtitle} ${entry.group}`),
    [query],
  )
  const searching = query.trim().length > 0

  const back = useCallback(() => setRoute(null), [])

  useEffect(() => {
    if (route == null) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back()
      return true
    })
    return () => sub.remove()
  }, [back, route])

  const demo = DEMOS.find((entry) => entry.key === route)

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {demo ? (
        <Screen
          key={demo.key}
          header={<DemoHeader title={demo.title} subtitle={demo.subtitle} onBack={back} />}
          footer={demo.Footer ? <demo.Footer /> : undefined}>
          <View style={{ paddingVertical: space(4) }}>
            <demo.Component />
          </View>
        </Screen>
      ) : (
        <Screen
          header={<Header title="bevel" right={<ThemeToggle />} large />}
          refreshing={refreshing}
          onRefresh={() => {
            // Screen builds the RefreshControl and tints it from the theme -
            // the tint is the part that always gets forgotten otherwise
            setRefreshing(true)
            setTimeout(() => setRefreshing(false), 900)
          }}>
          <View style={{ gap: space(4), paddingTop: space(2), paddingBottom: space(3) }}>
            {/* Inside the scroll content, so it takes its space with it when
                it goes. In the header it would fade and leave the gap behind. */}
            <LargeTitle title="bevel" subtitle="Themeable primitives" />

            <SearchField
              value={query}
              onChangeText={setQuery}
              onClear={() => setQuery('')}
              placeholder={`Search ${DEMOS.length} pages`}
            />

            {searching && found.length === 0 && (
              <EmptyState compact title="Nothing matches" message="Try a component name." />
            )}

            {searching && found.length > 0 && (
              <Card padding={0} gap={0} style={{ paddingHorizontal: space(4) }}>
                {found.map((entry, index) => (
                  <ListItem
                    key={entry.key}
                    title={entry.title}
                    subtitle={entry.subtitle}
                    onPress={() => setRoute(entry.key)}
                    divider={index < found.length - 1}
                  />
                ))}
              </Card>
            )}
            {!searching &&
              GROUPS.map((group) => {
              const entries = DEMOS.filter((entry) => entry.group === group.title)
              return (
              <View key={group.title} style={{ gap: space(2) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(2) }}>
                  <Text variant="micro" color="textFaint">
                    {group.title}
                  </Text>
                  <Text variant="micro" color="textFaint" style={{ opacity: 0.6 }}>
                    {String(entries.length)}
                  </Text>
                </View>
                <Card padding={0} gap={0} style={{ paddingHorizontal: space(4) }}>
                  {entries.map((entry, index) => (
                    <ListItem
                      key={entry.key}
                      title={entry.title}
                      subtitle={entry.subtitle}
                      onPress={() => setRoute(entry.key)}
                      divider={index < entries.length - 1}
                    />
                  ))}
                </Card>
              </View>
              )
            })}
          </View>
        </Screen>
      )}
    </>
  )
}

/**
 * Tapping the title sends the page back to the top.
 *
 * It has to be its own component: `useScrollToTop` reads the screen's context,
 * and an element built in the parent is created outside it.
 */
function DemoHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string
  subtitle: string
  onBack: () => void
}) {
  const scrollToTop = useScrollToTop()
  return (
    <Header title={title} subtitle={subtitle} onBack={onBack} onTitlePress={scrollToTop} divider />
  )
}

const GROUPS = [
  { title: 'Actions' },
  { title: 'Fields' },
  { title: 'Content' },
  { title: 'Feedback' },
  { title: 'Media' },
  { title: 'Foundation' },
]
