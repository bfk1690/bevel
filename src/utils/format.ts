/**
 * Display formatting.
 *
 * Small functions that every app writes again, and gets subtly wrong in the
 * same places: a size that reads 0.98 MB instead of 1 MB, a count that says
 * 1.0k, a file name shortened from the end so the extension disappears.
 */

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

/**
 * A byte count as a person would say it.
 *
 * Binary steps with the short labels, which is what a file manager shows and
 * therefore what the number will be compared against.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'

  const exponent = Math.min(SIZE_UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** exponent
  const unit = SIZE_UNITS[exponent]!

  // Whole numbers stay whole: "1 MB" rather than "1.0 MB", and bytes are never
  // fractional to begin with.
  if (exponent === 0 || Number.isInteger(value)) return `${Math.round(value)} ${unit}`
  return `${value.toFixed(decimals)} ${unit}`
}

/**
 * A large count, shortened.
 *
 * Below the threshold the exact number is kept: "999" is more useful than "1k"
 * and takes the same room.
 */
export function formatCount(count: number, threshold = 1000): string {
  if (!Number.isFinite(count)) return '0'
  const sign = count < 0 ? '-' : ''
  const value = Math.abs(count)
  if (value < threshold) return `${sign}${Math.round(value)}`

  const units = [
    { limit: 1_000_000_000, suffix: 'B' },
    { limit: 1_000_000, suffix: 'M' },
    { limit: 1_000, suffix: 'k' },
  ]

  for (const { limit, suffix } of units) {
    if (value >= limit) {
      const scaled = value / limit
      // One decimal only while it says something: 1.5k, but 15k not 15.0k
      const text = scaled >= 10 || Number.isInteger(scaled) ? String(Math.round(scaled)) : scaled.toFixed(1)
      return `${sign}${text}${suffix}`
    }
  }

  return `${sign}${Math.round(value)}`
}

/**
 * Shortens from the MIDDLE.
 *
 * File names carry their meaning at both ends - a project name at the front
 * and an extension at the back - so cutting the tail off throws away the half
 * that says what the thing is.
 */
export function truncateMiddle(text: string, max = 24, ellipsis = '…'): string {
  if (max <= 0) return ''
  if (text.length <= max) return text
  if (max <= ellipsis.length) return ellipsis

  const keep = max - ellipsis.length
  const head = Math.ceil(keep / 2)
  const tail = Math.floor(keep / 2)
  return `${text.slice(0, head)}${ellipsis}${tail > 0 ? text.slice(text.length - tail) : ''}`
}

/** The extension, lowercased and without the dot */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

export type FileKind = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'

const KINDS: Record<string, FileKind> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', heic: 'image', svg: 'image',
  mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
  mp3: 'audio', wav: 'audio', m4a: 'audio', aac: 'audio', flac: 'audio',
  pdf: 'document', doc: 'document', docx: 'document', xls: 'document', xlsx: 'document',
  ppt: 'document', pptx: 'document', txt: 'document', csv: 'document', md: 'document',
  zip: 'archive', rar: 'archive', tar: 'archive', gz: 'archive', '7z': 'archive',
}

/** Grouped by what the user would do with it, not by MIME family */
export function fileKind(name: string): FileKind {
  return KINDS[fileExtension(name)] ?? 'other'
}
