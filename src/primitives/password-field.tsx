import { forwardRef, memo, useMemo } from 'react'
import { StyleSheet, View, type TextInput } from 'react-native'

import { resolveColor } from '../theme/color'
import { useTheme } from '../theme/provider'
import type { ColorInput } from '../theme/types'
import { passwordStrength, type PasswordOptions } from '../utils/password'
import { Input, type InputProps } from './input'
import { Text } from './text'

export type PasswordFieldProps = Omit<InputProps, 'secureTextEntry'> &
  PasswordOptions & {
    /** Hides the meter, for a sign-IN field where judging the password is rude */
    meter?: boolean
    /** Names for the five levels, from unusable to strong */
    levels?: readonly [string, string, string, string, string]
    /** Colours for those levels. Defaults to danger through ok */
    tones?: readonly [ColorInput, ColorInput, ColorInput, ColorInput, ColorInput]
  }

const DEFAULT_LEVELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const
const DEFAULT_TONES = ['danger', 'danger', 'warning', 'ok', 'ok'] as const

/**
 * Password field with a strength meter.
 *
 * The meter is advice, not a gate: it reports and suggests, and the form
 * decides what to refuse. `tooShort` is separated from the score for exactly
 * that - a length rule is a rule, and everything else here is an opinion.
 *
 * Only ever ONE suggestion at a time. Five rules at once are read as a wall
 * and answered with `Password1!`, which satisfies all of them and is still the
 * first thing anyone tries.
 */
function PasswordFieldBase(
  {
    meter = true,
    minLength,
    blocklist,
    messages,
    levels = DEFAULT_LEVELS,
    tones = DEFAULT_TONES,
    value,
    ...rest
  }: PasswordFieldProps,
  ref: React.Ref<TextInput>,
) {
  const { colors, space } = useTheme()

  const assessment = useMemo(
    () => passwordStrength(value ?? '', { minLength, blocklist, messages }),
    [blocklist, messages, minLength, value],
  )

  const typed = (value ?? '').length > 0
  const tone = resolveColor(colors, tones[assessment.score], colors.danger)

  return (
    <View style={{ gap: space(2) }}>
      <Input
        {...rest}
        ref={ref}
        value={value}
        secureToggle
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        /**
         * The verdict travels with the FIELD.
         *
         * A meter drawn from coloured bars and a word beside them is furniture
         * to a screen reader: somebody who cannot see it gets told nothing at
         * all about a password the form is about to refuse. Attaching it to
         * the field means it is read where the decision is being made.
         */
        accessibilityHint={
          typed
            ? [levels[assessment.score], assessment.suggestion].filter(Boolean).join('. ')
            : rest.accessibilityHint
        }
      />

      {meter && typed && (
        // One announcement for the whole meter, and only when it settles.
        // Read as separate pieces it becomes "weak", "one", "two", "three"
        <View
          style={{ gap: space(1.5) }}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={[levels[assessment.score], assessment.suggestion]
            .filter(Boolean)
            .join('. ')}
          accessibilityValue={{ now: assessment.score, min: 0, max: 4 }}>
          <View style={[styles.track, { gap: space(1) }]} importantForAccessibility="no">
            {/* Four segments rather than a bar: a continuous fill invites the
                reader to chase the last pixel, and the difference between two
                strong passwords is not worth chasing */}
            {[0, 1, 2, 3].map((segment) => (
              <View
                key={segment}
                style={[
                  styles.segment,
                  { backgroundColor: segment < assessment.score ? tone : colors.sunk },
                ]}
              />
            ))}
          </View>

          <View style={styles.row}>
            <Text variant="micro" style={[styles.grow, { color: tone }]}>
              {levels[assessment.score]}
            </Text>
          </View>

          {assessment.suggestion != null && (
            <Text variant="caption" color="textMuted">
              {assessment.suggestion}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row' },
  segment: { flex: 1, height: 3, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
})

export const PasswordField = memo(forwardRef<TextInput, PasswordFieldProps>(PasswordFieldBase))
