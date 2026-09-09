import type { Language } from '../i18n'

const locale = (language: Language) => language === 'fa'
  ? 'fa-IR-u-ca-persian-nu-arabext'
  : 'en-GB-u-ca-gregory-nu-latn'

function parseDate(value: string | number | Date) {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  const year = /^(\d{4})$/.exec(value)
  if (year) return new Date(Date.UTC(Number(year[1]), 0, 1))
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (day) return new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3])))
  return new Date(value)
}

function calendarYear(value: Date, language: Language) {
  return new Intl.DateTimeFormat(locale(language), { year: 'numeric', timeZone: 'UTC' }).format(value)
}

export function formatDate(value: string | number | Date, language: Language) {
  const date = parseDate(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(locale(language), {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date)
}

export function formatMonth(value: string | number | Date, language: Language) {
  const date = parseDate(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(locale(language), {
    month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date)
}

export function formatDateRange(start: string, end: string, language: Language, precision: 'day' | 'year' = 'day') {
  if (precision === 'year' && /^\d{4}$/.test(start) && /^\d{4}$/.test(end)) {
    if (language === 'en') return start === end ? start : `${start}–${end}`
    const first = calendarYear(new Date(Date.UTC(Number(start), 0, 1)), language)
    const last = calendarYear(new Date(Date.UTC(Number(end), 11, 31)), language)
    return first === last ? first : `${first}–${last}`
  }
  const first = formatDate(start, language), last = formatDate(end, language)
  return first === last ? first : `${first} – ${last}`
}

export function formatDateRangesInText(value: string, language: Language) {
  if (language === 'en') return value
  return value.replace(/\b(\d{4})[–-](\d{4})\b/g,
    (_match, start: string, end: string) => formatDateRange(start, end, language, 'year'))
}

export function formatObservationPeriod(value: unknown, language: Language) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(item => typeof item === 'string')) return '—'
  return formatDateRange(value[0], value[1], language, value.every(item => /^\d{4}$/.test(item)) ? 'year' : 'day')
}
