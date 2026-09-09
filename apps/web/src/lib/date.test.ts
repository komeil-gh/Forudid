import { expect, it } from 'vitest'
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
