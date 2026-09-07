import { useState } from 'react'
import { View } from 'react-native'
import { Card, Divider, PasswordField, Text, passwordStrength, useTheme } from '@bfkk/bevel'

import { Demo, Spec, Stack } from './ui'

const EXAMPLES = [
  'password',
  'Password1!',
  'abcdefghij',
  'aaaaaaaaaaaaaaaa',
  'kQ7#zpLm2@wR',
  'quiet lantern spruce harbour',
]

export function PasswordDemo() {
  const { space } = useTheme()
  const [value, setValue] = useState('')
  const [signIn, setSignIn] = useState('')

  return (
    <Stack>
      <Demo
        title="Advice, not a gate"
        note="The meter reports and suggests; the form decides what to refuse. Length is separated from the score for exactly that reason - a minimum length is a rule, and everything else here is an opinion. Type into it and watch which single thing it asks for.">
        <PasswordField
          label="Password"
          placeholder="Choose one"
          value={value}
          onChangeText={setValue}
          blocklist={['ada@example.com', 'bevel']}
        />
        <Spec label="bits">
          <Text variant="caption" color="textMuted">
            {String(passwordStrength(value, { blocklist: ['ada@example.com'] }).bits)}
          </Text>
        </Spec>
      </Demo>

      <Demo
        title="One suggestion at a time"
        note="Five rules at once are read as a wall and answered with Password1! - which satisfies every classic requirement and is still among the first things anyone tries. Ordered by what would help most: a known word first, then length, then runs, then repetition.">
        <Card gap={space(3)}>
          {EXAMPLES.map((example, index) => {
            const result = passwordStrength(example, { blocklist: ['ada@example.com'] })
            return (
              <View key={example}>
                {index > 0 && <Divider />}
                <Text variant="label">{example}</Text>
                <Text variant="caption" color="textMuted">
                  {`${['very weak', 'weak', 'fair', 'good', 'strong'][result.score]} · ${result.bits} bits`}
                </Text>
                {result.suggestion != null && (
                  <Text variant="micro" color="textFaint">
                    {result.suggestion}
                  </Text>
                )}
              </View>
            )
          })}
        </Card>
      </Demo>

      <Demo
        title="Signing in is not being marked"
        note="No meter on a sign-in field. The password already exists; judging it while someone types it back is a comment on a decision they cannot change here, and it slows down the one screen that should be quick.">
        <PasswordField
          label="Password"
          placeholder="Your password"
          value={signIn}
          onChangeText={setSignIn}
          meter={false}
        />
      </Demo>

      <Demo
        title="What it protects cannot unlock it"
        note="The blocklist takes the person's own details and the app's name. An email is reduced to its local part on the way in: nobody's password is the domain, and punishing it would fail half a company on the same word for no gain.">
        <Card>
          <Text variant="caption" color="textMuted">
            With ada@example.com blocked, ada1988summer is scored as shorter
            than it looks. examplemistgrip42 is not touched.
          </Text>
        </Card>
      </Demo>
    </Stack>
  )
}
