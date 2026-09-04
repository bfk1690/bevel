import { useCallback, useEffect, useState } from 'react'
import { BackHandler, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import {
  BevelProvider,
  Button,
  Card,
  Header,
  ListItem,
  Screen,
  Text,
  Toaster,
  defineTheme,
  useTheme,
} from '@bfkk/bevel'

import { DEMOS } from './demo/registry'

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
          header={<Header title={demo.title} subtitle={demo.subtitle} onBack={back} divider />}
          footer={demo.Footer ? <demo.Footer /> : undefined}>
          <View style={{ paddingVertical: space(4) }}>
            <demo.Component />
          </View>
        </Screen>
      ) : (
        <Screen
          header={
            <Header
              title="bevel"
              subtitle={`${DEMOS.length} components - ${scheme} scheme`}
              right={
                <Button
                  label={scheme === 'dark' ? 'Light' : 'Dark'}
                  variant="secondary"
                  size="sm"
                  full={false}
                  onPress={() => setPreference(scheme === 'dark' ? 'light' : 'dark')}
                />
              }
            />
          }>
          <View style={{ gap: space(4), paddingVertical: space(3) }}>
            {GROUPS.map((group) => (
              <View key={group.title} style={{ gap: space(2) }}>
                <Text variant="micro" color="textFaint">
                  {group.title}
                </Text>
                <Card padding={0} gap={0}>
                  {DEMOS.filter((entry) => entry.group === group.title).map((entry, index, list) => (
                    <ListItem
                      key={entry.key}
                      title={entry.title}
                      subtitle={entry.subtitle}
                      onPress={() => setRoute(entry.key)}
                      divider={index < list.length - 1}
                      dividerInset={space(4)}
                    />
                  ))}
                </Card>
              </View>
            ))}
          </View>
        </Screen>
      )}
    </>
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
