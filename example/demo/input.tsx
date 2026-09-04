import { useState } from 'react'
import { View } from 'react-native'
import { Input, Text, unmask, useTheme } from '@bfkk/bevel'

import { Demo, Stack } from './ui'

export function InputDemo() {
  const [plain, setPlain] = useState('')
  const [phone, setPhone] = useState('')
  const [card, setCard] = useState('')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState('')
  const [search, setSearch] = useState('')
  const [required, setRequired] = useState('')
  const { space } = useTheme()

  return (
    <Stack>
      <Demo title="Basic">
        <Input label="Name" placeholder="Ada Lovelace" value={plain} onChangeText={setPlain} />
      </Demo>

      <Demo
        title="Required"
        note="Marking what is required beats annotating what is optional: in a form where most fields are optional, (optional) on each one is noise.">
        <Input
          label="Email"
          required
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={required}
          onChangeText={setRequired}
          error={required.length > 0 && !required.includes('@') ? 'Needs an @' : null}
        />
      </Demo>

      <Demo
        title="Error presentation"
        note="compact folds the message into the label row so the form keeps its height as errors appear and go. below gives it a line of its own.">
        <Input label="Compact" error="That code is not valid" errorMode="compact" value="123" />
        <Input label="Below" error="That code is not valid" errorMode="below" value="123" />
      </Demo>

      <Demo title="Helper text">
        <Input label="Username" helper="Letters, numbers and underscores" value="ada_l" />
      </Demo>

      <Demo
        title="Masking"
        note="Patterns, not named formats: # digit, A letter, * either. A built-in phone mask is only correct in the country it was written for.">
        <Input
          label="Phone"
          mask="(###) ### ## ##"
          keyboardType="number-pad"
          value={phone}
          onChangeText={setPhone}
          placeholder="(555) 123 45 67"
        />
        <Input
          label="Card"
          mask="#### #### #### ####"
          keyboardType="number-pad"
          value={card}
          onChangeText={setCard}
          placeholder="4242 4242 4242 4242"
        />
        <View style={{ gap: space(1) }}>
          <Text variant="micro" color="textFaint">
            RAW VALUES SENT TO A SERVER
          </Text>
          <Text variant="caption" color="textMuted">
            {`phone: ${unmask(phone) || '-'}   card: ${unmask(card) || '-'}`}
          </Text>
        </View>
      </Demo>

      <Demo title="Password" note="The toggle is drawn with views, so it works before an app picks an icon set.">
        <Input label="Password" secureToggle value={password} onChangeText={setPassword} />
        <Input
          label="With your own icon"
          secureToggle={({ visible, size, color }) => (
            <Text variant="micro" style={{ color, width: size * 2 }}>
              {visible ? 'HIDE' : 'SHOW'}
            </Text>
          )}
          value={password}
          onChangeText={setPassword}
        />
      </Demo>

      <Demo title="Variants" note="Variants come from the theme, exactly like buttons.">
        <Input label="default" placeholder="A well you type into" />
        <Input variant="pill" placeholder="Search" value={search} onChangeText={setSearch} />
        <Input variant="plain" placeholder="Chromeless, for inline editing" />
      </Demo>

      <Demo title="Sizes">
        <Input size="sm" placeholder="sm" />
        <Input size="md" placeholder="md" />
        <Input size="lg" placeholder="lg" />
      </Demo>

      <Demo title="Multiline and counter">
        <Input
          label="Bio"
          multiline
          maxLength={140}
          showCount
          value={bio}
          onChangeText={setBio}
          placeholder="Up to 140 characters"
        />
      </Demo>

      <Demo title="Slots">
        <Input
          placeholder="With a leading mark"
          left={({ size, color }) => (
            <View
              style={{ width: size * 0.6, height: size * 0.6, borderRadius: size, borderWidth: 2, borderColor: color }}
            />
          )}
        />
        <Input
          placeholder="With a pressable trailing slot"
          right={({ color }) => (
            <Text variant="micro" style={{ color }}>
              CLEAR
            </Text>
          )}
          onRightPress={() => setPlain('')}
        />
      </Demo>

      <Demo title="Disabled">
        <Input label="Locked" value="Cannot be edited" editable={false} />
      </Demo>

      <Demo
        title="Keyboard accessory"
        note="iOS number pads have no return key. Passing accessory puts a bar above the keyboard so the user is not stranded.">
        <Input
          label="Amount"
          keyboardType="number-pad"
          placeholder="0"
          accessory={{ doneLabel: 'Done', nextLabel: 'Next', onNext: () => {} }}
        />
      </Demo>
    </Stack>
  )
}
