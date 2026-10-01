import { expect, it, vi } from 'vitest'
import { formatDate, formatDateRange, formatDateRangesInText, formatMonth, formatObservationPeriod } from './date'

it('uses Persian calendar and digits only for Persian UI dates', () => {
  expect(formatDate('2026-07-31', 'fa')).toBe('۹ مرداد ۱۴۰۵')
  expect(formatDate('2026-07-31', 'en')).toBe('31 July 2026')
  expect(formatDateRange('2014', '2020', 'fa', 'year')).toBe('۱۳۹۲–۱۳۹۹')
  expect(formatDateRange('2014', '2020', 'en', 'year')).toBe('2014–2020')
  expect(formatMonth('2014-10-19', 'fa')).toBe('مهر ۱۳۹۳')
  expect(formatDateRangesInText('COMET · 2014–2026 · ascending', 'fa')).toBe('COMET · ۱۳۹۲–۱۴۰۵ · ascending')
  expect(formatObservationPeriod(['2014', '2020'], 'fa')).toBe('۱۳۹۲–۱۳۹۹')
  expect(formatObservationPeriod(['2014-10-19', '2026-07-31'], 'en')).toBe('19 October 2014 – 31 July 2026')
  expect(formatObservationPeriod(null, 'fa')).toBe('—')
  expect(formatObservationPeriod(['2014', null], 'fa')).toBe('—')
})

it('reuses date formatters without changing UTC, invalid-date or calendar behavior', () => {
  for (const language of ['fa', 'en'] as const) {
    formatDate('2026-07-31', language)
    formatMonth('2026-07-31', language)
    formatDateRange('2014', '2020', language, 'year')
  }
  const constructor = vi.spyOn(Intl, 'DateTimeFormat')
  try {
    for (let row = 0; row < 323; row++) {
      expect(formatDate('2026-07-31T23:59:59Z', 'fa')).toBe('۹ مرداد ۱۴۰۵')
      expect(formatDate(new Date('2026-07-31'), 'en')).toBe('31 July 2026')
      expect(formatMonth(Date.UTC(2014, 9, 19), 'fa')).toBe('مهر ۱۳۹۳')
      expect(formatDateRange('2014', '2020', 'fa', 'year')).toBe('۱۳۹۲–۱۳۹۹')
    }
    expect(formatDate('invalid', 'fa')).toBe('invalid')
    expect(formatMonth('invalid', 'en')).toBe('invalid')
    expect(constructor).not.toHaveBeenCalled()
  } finally { constructor.mockRestore() }
})
