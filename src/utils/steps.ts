export type StepStatus = 'done' | 'current' | 'upcoming'

export function stepStatus(index: number, current: number): StepStatus {
  if (index < current) return 'done'
  if (index === current) return 'current'
  return 'upcoming'
}

/** Keeps a step index inside the flow, allowing `count` to mean finished */
export function clampStep(value: number, count: number): number {
  if (count <= 0) return 0
  return Math.min(count, Math.max(0, Math.trunc(value)))
}

/**
 * How much of the flow is behind you, 0 to 1.
 *
 * The step you are ON is not counted: you have not finished it. So the bar is
 * only full once `current` reaches `count`, which is what a flow reports when
 * it ends - not while its last screen is still up asking for something.
 */
export function stepProgress(current: number, count: number): number {
  if (count <= 0) return 0
  return clampStep(current, count) / count
}

/**
 * Whether to give up on drawing every step and say the number instead.
 *
 * Seven markers with labels under them on a phone leaves each label two
 * truncated words, which teaches nothing about where you are. A count and a
 * bar are smaller and say more.
 */
export function shouldCompact(count: number, compactFrom = 5): boolean {
  if (compactFrom <= 0) return true
  return count > compactFrom
}
