import {
  Button,
  Card,
  Checkbox,
  Input,
  Text,
  email,
  matches,
  minLength,
  required,
  toast,
  useFieldFocus,
  useForm,
} from '@bfkk/bevel'

import { Demo, Stack } from './ui'

type Values = {
  name: string
  email: string
  password: string
  confirm: string
  terms: boolean
}

export function FormDemo() {
  const focus = useFieldFocus<'name' | 'email' | 'password' | 'confirm'>()

  const form = useForm<Values>({
    initial: { name: '', email: '', password: '', confirm: '', terms: false },
    // The order on screen, which is not always the order of the keys
    order: ['name', 'email', 'password', 'confirm', 'terms'],
    // A refused submit that leaves the screen where it was makes the reader
    // hunt for what is wrong
    onInvalid: (first) => {
      focus.focus(first as 'name' | 'email' | 'password' | 'confirm')
    },
    // Given the current values, so a rule can compare two fields without
    // reaching for the form object that is still being built
    rules: (values) => ({
      name: [required('Adını yaz'), minLength(2, 'Çok kısa')],
      email: [required('E-posta gerekli'), email('Bu adres geçerli görünmüyor')],
      password: [required('Bir parola belirle'), minLength(8, 'En az 8 karakter')],
      confirm: [matches(() => values.password, 'Parolalar eşleşmiyor')],
      terms: [required('Koşulları kabul etmen gerekiyor')],
    }),
    onSubmit: async (values) => {
      await new Promise((resolve) => setTimeout(resolve, 900))
      toast.success(`Hoş geldin ${values.name}`)
    },
  })

  return (
    <Stack>
      <Demo
        title="When an error is allowed to appear"
        note="Not while the field is being typed into for the first time. Telling someone their email is invalid after one letter is both true and useless. A message shows once the field has been left, or once submit has been pressed - and after that it updates live, because by then they are correcting something and want to see when they are done.">
        <Card gap={16}>
          <Input
            ref={focus.register('name')}
            label="Ad"
            required
            {...form.fieldProps('name')}
            placeholder="Ada Lovelace"
          />
          <Input
            ref={focus.register('email')}
            label="E-posta"
            required
            keyboardType="email-address"
            autoCapitalize="none"
            {...form.fieldProps('email')}
            placeholder="ada@example.com"
          />
          <Input
            ref={focus.register('password')}
            label="Parola"
            required
            secureToggle
            {...form.fieldProps('password')}
          />
          <Input
            ref={focus.register('confirm')}
            label="Parola tekrar"
            secureToggle
            {...form.fieldProps('confirm')}
          />

          <Checkbox
            checked={form.values.terms}
            onChange={(next) => {
              form.setValue('terms', next)
              form.blur('terms')
            }}
            label="Koşulları kabul ediyorum"
            description={form.errors.terms ?? undefined}
          />

          <Button
            label={form.submitting ? 'Gönderiliyor' : 'Kaydol'}
            loading={form.submitting}
            onPress={form.submit}
          />
          <Button label="Sıfırla" variant="ghost" onPress={form.reset} />
        </Card>
      </Demo>

      <Demo
        title="Where a refused submit leaves you"
        note="Press submit on the empty form: the cursor goes to the first field that needs fixing, not to whichever key happened to be declared first. Focusing rather than scrolling on purpose - the platform already scrolls a focused field into view and opens the keyboard against it, and a scroll position worked out by hand disagrees with that the moment the keyboard changes height.">
        <Card gap={4}>
          <Text variant="caption" color="textMuted">
            {`first error: ${String(form.firstError() ?? 'none')}`}
          </Text>
          <Text variant="caption" color="textFaint">
            Known before it is shown: the field order decides which one, and the
            checkbox at the end cannot take a cursor, so it is simply skipped.
          </Text>
        </Card>
      </Demo>

      <Demo title="What the form knows">
        <Card gap={4}>
          <Text variant="caption" color="textMuted">{`valid: ${form.valid}`}</Text>
          <Text variant="caption" color="textMuted">
            {`touched: ${Object.keys(form.touched).filter((key) => form.touched[key as keyof Values]).join(', ') || '-'}`}
          </Text>
          <Text variant="caption" color="textMuted">
            {`visible errors: ${Object.values(form.errors).filter(Boolean).length}`}
          </Text>
        </Card>
      </Demo>

      <Demo
        title="Rules carry their own message"
        note="A kit that ships its own wording would either be English-only or drag a translation layer in behind it. Here the app keeps its voice and its language - these messages are Turkish because this form is.">
        <Card>
          <Text variant="caption" color="textMuted">
            {"required('Adını yaz'), minLength(8, 'En az 8 karakter'), matches(() => values.password, '...')"}
          </Text>
        </Card>
      </Demo>
    </Stack>
  )
}
