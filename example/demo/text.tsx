import { View } from 'react-native'
import { Text, upper, useTheme } from 'bevel'

import { Demo, Stack } from './ui'

const TYPE_TOKENS = [
  'display',
  'title',
  'heading',
  'body',
  'bodyStrong',
  'label',
  'caption',
  'micro',
] as const

const COLOR_ROLES = ['text', 'textMuted', 'textFaint', 'accent', 'ok', 'warning', 'danger'] as const

export function TextDemo() {
  const { type, space } = useTheme()

  return (
    <Stack>
      <Demo title="Type scale">
        {TYPE_TOKENS.map((token) => (
          <View key={token} style={{ gap: 2 }}>
            <Text variant="micro" color="textFaint">
              {`${token} - ${type[token].fontSize}/${type[token].lineHeight} - ${String(type[token].fontWeight)}`}
            </Text>
            <Text variant={token}>The quick brown fox</Text>
          </View>
        ))}
      </Demo>

      <Demo
        title="Color roles"
        note="Scale and color are independent props on purpose: the same caption can read neutral in one place and as a warning in another without a new variant.">
        {COLOR_ROLES.map((role) => (
          <Text key={role} variant="body" color={role}>
            {`color="${role}"`}
          </Text>
        ))}
        <Text variant="body" color="#8E4EC6">
          color=&quot;#8E4EC6&quot; - raw colors work anywhere a role does
        </Text>
      </Demo>

      <Demo title="Weight override" note="Change the weight without leaving the scale.">
        <Text variant="body" weight="400">
          400
        </Text>
        <Text variant="body" weight="600">
          600
        </Text>
        <Text variant="body" weight="800">
          800
        </Text>
      </Demo>

      <Demo title="Alignment">
        <Text align="left">left</Text>
        <Text align="center">center</Text>
        <Text align="right">right</Text>
      </Demo>

      <Demo
        title="Casing is locale-aware"
        note="Uppercasing is applied to the string, never through textTransform. The platform mapping is locale-blind and mangles languages where casing is not one-to-one - Turkish being the everyday case.">
        <View style={{ gap: space(2) }}>
          <Text variant="micro" color="textFaint">
            DEFAULT LOCALE
          </Text>
          <Text variant="body">{`upper('iyi ışık') -> ${upper('iyi ışık', 'default')}`}</Text>
          <Text variant="micro" color="textFaint">
            TURKISH
          </Text>
          <Text variant="body">{`upper('iyi ışık', 'tr') -> ${upper('iyi ışık', 'tr')}`}</Text>
          <Text variant="caption" color="textMuted">
            The dot on i has to survive, and the dotless one has to stay dotless. Call
            setCaseLocale once at startup and every micro label follows.
          </Text>
        </View>
      </Demo>

      <Demo title="micro uppercases itself">
        <Text variant="micro">section label</Text>
        <Text variant="body" uppercase>
          any variant can opt in
        </Text>
      </Demo>
    </Stack>
  )
}
