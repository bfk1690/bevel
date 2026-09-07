import { useCallback, useMemo, useRef, useState } from 'react'

import { hasErrors, validate, validateAll, type ErrorMap, type RuleMap } from './validate'

export type FormConfig<V extends Record<string, unknown>> = {
  initial: V
  /**
   * Either a map of rules, or a function given the current values.
   *
   * The function form exists for rules that compare fields - a password
   * confirmation, a date that must follow another. Written as a plain map,
   * those rules have to reach for the form object while it is still being
   * built, which is circular in fact and not just to the type checker.
   */
  rules?: RuleMap<V> | ((values: V) => RuleMap<V>)
  onSubmit?: (values: V) => void | Promise<void>
}

export type FieldProps = {
  value: string
  onChangeText: (next: string) => void
  onBlur: () => void
  error: string | null
}

export type Form<V extends Record<string, unknown>> = {
  values: V
  /** Only the errors the user is allowed to see yet */
  errors: ErrorMap<V>
  touched: { [K in keyof V]?: boolean }
  submitting: boolean
  valid: boolean
  setValue: <K extends keyof V>(key: K, value: V[K]) => void
  setValues: (partial: Partial<V>) => void
  blur: (key: keyof V) => void
  submit: () => Promise<void>
  reset: () => void
  /** Everything a text field needs, wired up */
  fieldProps: (key: keyof V) => FieldProps
}

/**
 * Form state, values and errors.
 *
 * The rule that matters is WHEN an error is allowed to appear: not while the
 * field is being typed into for the first time. Validating on every keystroke
 * means telling someone their email is invalid after they have typed one
 * letter of it, which is both true and useless.
 *
 * So a message shows once the field has been left, or once a submit has been
 * attempted. After that it updates live, because at that point the user is
 * correcting something and wants to see when they are done.
 */
export function useForm<V extends Record<string, unknown>>({
  initial,
  rules = {},
  onSubmit,
}: FormConfig<V>): Form<V> {
  const [values, setValuesState] = useState<V>(initial)
  const [touched, setTouched] = useState<{ [K in keyof V]?: boolean }>({})
  const [attempted, setAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const initialRef = useRef(initial)

  const resolvedRules = useMemo(
    () => (typeof rules === 'function' ? rules(values) : rules),
    [rules, values],
  )

  const allErrors = useMemo(() => validateAll(values, resolvedRules), [resolvedRules, values])

  const errors = useMemo(() => {
    const visible: ErrorMap<V> = {}
    for (const key of Object.keys(allErrors) as (keyof V)[]) {
      visible[key] = attempted || touched[key] ? allErrors[key] : null
    }
    return visible
  }, [allErrors, attempted, touched])

  const setValue = useCallback(<K extends keyof V>(key: K, value: V[K]) => {
    setValuesState((previous) => ({ ...previous, [key]: value }))
  }, [])

  const setValues = useCallback((partial: Partial<V>) => {
    setValuesState((previous) => ({ ...previous, ...partial }))
  }, [])

  const blur = useCallback((key: keyof V) => {
    setTouched((previous) => ({ ...previous, [key]: true }))
  }, [])

  const submit = useCallback(async () => {
    setAttempted(true)
    // Re-checked here rather than trusting the memo: submit can be called in
    // the same tick as a change, before anything has re-rendered.
    if (hasErrors(validateAll(values, typeof rules === 'function' ? rules(values) : rules))) return

    setSubmitting(true)
    try {
      await onSubmit?.(values)
    } finally {
      setSubmitting(false)
    }
  }, [onSubmit, rules, values])

  const reset = useCallback(() => {
    setValuesState(initialRef.current)
    setTouched({})
    setAttempted(false)
  }, [])

  const fieldProps = useCallback(
    (key: keyof V): FieldProps => ({
      value: String(values[key] ?? ''),
      onChangeText: (next: string) => setValue(key, next as V[keyof V]),
      onBlur: () => blur(key),
      error: errors[key] ?? null,
    }),
    [blur, errors, setValue, values],
  )

  return {
    values,
    errors,
    touched,
    submitting,
    valid: !hasErrors(allErrors),
    setValue,
    setValues,
    blur,
    submit,
    reset,
    fieldProps,
  }
}

/** Re-exported so a form needs one import */
export { validate, validateAll, hasErrors }
