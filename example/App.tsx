import { useState, type ReactNode } from 'react'
import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import {
  Avatar,
  Badge,
  BevelProvider,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  EmptyState,
  Header,
  ImageShower,
  Input,
  ListItem,
  Modal,
  OtpInput,
  Progress,
  RadioGroup,
  Screen,
  Select,
  Skeleton,
  Switch,
  Text,
  Toaster,
  defineTheme,
  toast,
  useTheme,
} from 'bevel'

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

const PHOTOS = [
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200',
]

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
      <Showcase />
      <Toaster />
    </BevelProvider>
  )
}

function Showcase() {
  const { scheme, setPreference, space, colors } = useTheme()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [country, setCountry] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [plan, setPlan] = useState('monthly')
  const [terms, setTerms] = useState(false)
  const [alerts, setAlerts] = useState(true)
  const [filters, setFilters] = useState<string[]>(['new'])
  const [modal, setModal] = useState(false)
  const [viewer, setViewer] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const toggleFilter = (key: string) =>
    setFilters((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]))

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Screen
        header={
          <Header
            title="bevel"
            subtitle={`${scheme} scheme`}
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
        }
        footer={
          <Button
            label={loading ? 'Working' : 'Primary action'}
            variant="hero"
            loading={loading}
            onPress={() => {
              setLoading(true)
              setTimeout(() => {
                setLoading(false)
                toast.success('Done', { action: { label: 'Undo', onPress: () => {} } })
              }, 1400)
            }}
          />
        }>
        <View style={{ gap: space(8), paddingTop: space(2) }}>
          <Section title="Buttons">
            <Button label="Primary" />
            <Button label="Secondary" variant="secondary" />
            <Button label="Outline" variant="outline" />
            <Button label="Danger" variant="danger" press="scale" />
            <Button label="Ghost" variant="ghost" />
            <View style={{ flexDirection: 'row', gap: space(2) }}>
              <Button label="Small" size="sm" full={false} />
              <Button label="Flat" press="none" full={false} variant="secondary" />
              <Button label="Credits" tag="AI" trailing="49" full={false} />
            </View>
          </Section>

          <Section title="Fields">
            <Input
              label="Name"
              required
              value={name}
              onChangeText={setName}
              placeholder="Ada Lovelace"
            />
            <Input
              label="Phone"
              mask="(###) ### ## ##"
              value={phone}
              onChangeText={setPhone}
              keyboardType="number-pad"
              helper="The masked value and the raw one are separate"
            />
            <Input
              label="Password"
              secureToggle
              value={password}
              onChangeText={setPassword}
              error={password.length > 0 && password.length < 6 ? 'At least 6 characters' : null}
            />
            <Select
              label="Country"
              placeholder="Pick one"
              searchable
              value={country}
              onChange={setCountry}
              options={[
                { value: 'tr', label: 'Turkiye' },
                { value: 'de', label: 'Germany' },
                { value: 'nl', label: 'Netherlands' },
                { value: 'us', label: 'United States' },
              ]}
            />
            <Select
              label="Interests"
              placeholder="Any"
              multiple
              value={tags}
              onChange={setTags}
              options={[
                { value: 'design', label: 'Design' },
                { value: 'code', label: 'Code' },
                { value: 'photo', label: 'Photography' },
              ]}
            />
            <View style={{ gap: space(2) }}>
              <Text variant="caption" color="textMuted">
                Verification code
              </Text>
              <OtpInput
                value={code}
                onChange={setCode}
                onComplete={() => toast.info('Code ready')}
              />
            </View>
          </Section>

          <Section title="Selection">
            <RadioGroup
              value={plan}
              onChange={setPlan}
              options={[
                { value: 'monthly', label: 'Monthly', description: 'Cancel anytime' },
                { value: 'yearly', label: 'Yearly', description: 'Two months free' },
              ]}
            />
            <Checkbox checked={terms} onChange={setTerms} label="I agree to the terms" />
            <Switch
              value={alerts}
              onChange={setAlerts}
              label="Alerts"
              description="Push and email"
            />
            <View style={{ flexDirection: 'row', gap: space(2), flexWrap: 'wrap' }}>
              {['new', 'popular', 'sale'].map((key) => (
                <Chip
                  key={key}
                  label={key}
                  selected={filters.includes(key)}
                  onPress={() => toggleFilter(key)}
                />
              ))}
            </View>
          </Section>

          <Section title="Feedback">
            <View style={{ flexDirection: 'row', gap: space(2), flexWrap: 'wrap' }}>
              <Button
                label="Success"
                size="sm"
                full={false}
                onPress={() => toast.success('Saved')}
              />
              <Button
                label="Error"
                size="sm"
                variant="danger"
                full={false}
                onPress={() =>
                  toast.error('Could not connect', {
                    action: { label: 'Retry', onPress: () => {} },
                  })
                }
              />
              <Button
                label="Loading"
                size="sm"
                variant="secondary"
                full={false}
                onPress={() => {
                  const id = toast.loading('Uploading')
                  setTimeout(() => toast.dismiss(id), 1800)
                }}
              />
              <Button
                label="Sheet"
                size="sm"
                variant="outline"
                full={false}
                onPress={() => setModal(true)}
              />
            </View>
            <Progress value={0.62} label="Storage" showValue />
            <Progress label="Indeterminate" />
            <Skeleton lines={3} />
          </Section>

          <Section title="Content">
            <Card
              title="Card"
              subtitle="Surface, radius and shadow come from the theme"
              right={<Badge label="new" />}>
              <Text variant="caption" color="textMuted">
                Adding a press handler turns it into a row without changing its shape.
              </Text>
            </Card>

            <Card padding={0} gap={0}>
              <ListItem
                title="Ada Lovelace"
                subtitle="Opens the viewer"
                left={<Avatar name="Ada Lovelace" status="ok" />}
                onPress={() => setViewer(0)}
                divider
                dividerInset={space(14)}
              />
              <ListItem
                title="Notifications"
                right={<Switch value={alerts} onChange={setAlerts} size="sm" />}
                divider
                dividerInset={space(4)}
              />
              <ListItem
                title="Delete account"
                destructive
                onPress={() => toast.warning('Not really')}
              />
            </Card>

            <View style={{ flexDirection: 'row', gap: space(2) }}>
              <Badge label="soft" />
              <Badge label="solid" variant="solid" tone="ok" />
              <Badge label="outline" variant="outline" tone="danger" dot />
            </View>

            <Divider label="or" />

            <EmptyState
              compact
              title="Nothing here yet"
              message="An empty state carries the action that fixes it."
              actionLabel="Add the first one"
              onAction={() => toast.info('Tapped')}
            />
          </Section>

          <Section title="Media">
            <View style={{ flexDirection: 'row', gap: space(2) }}>
              {PHOTOS.map((uri, index) => (
                <Card
                  key={uri}
                  padding={0}
                  gap={0}
                  onPress={() => setViewer(index)}
                  style={{ flex: 1, height: space(20), overflow: 'hidden' }}>
                  <View style={{ flex: 1, backgroundColor: colors.skeleton }} />
                </Card>
              ))}
            </View>
            <Text variant="caption" color="textFaint">
              Pinch, pan, double tap, drag down to dismiss - on both platforms.
            </Text>
          </Section>
        </View>
      </Screen>

      <Modal visible={modal} onClose={() => setModal(false)} title="Sheet" variant="sheet">
        <Text variant="body" color="textMuted">
          A sheet leaves the page behind it in place, which is why it suits pickers and
          confirmations.
        </Text>
        <Button label="Close" variant="secondary" onPress={() => setModal(false)} />
      </Modal>

      <ImageShower
        visible={viewer != null}
        index={viewer ?? 0}
        items={PHOTOS}
        title="Unsplash"
        onClose={() => setViewer(null)}
      />
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { space } = useTheme()
  return (
    <View style={{ gap: space(3) }}>
      <Text variant="micro" color="textFaint">
        {title}
      </Text>
      {children}
    </View>
  )
}
