import { expect, it, vi } from 'vitest'
import { displayUnit, presentation, format } from './units'

it('keeps the numeric conversion and displayed unit paired, including dimensionless zero', () => {
  for (const [unit, value, output] of [['m/year', 1000, 'mm/year'], ['cm/year', 10, 'mm/year'], ['cm', 10, 'mm'], ['m', 1000, 'mm'], ['1', 1, '1']] as const) {
    expect(presentation(1, unit)).toBe(value)
    expect(displayUnit(unit)).toBe(output)
    expect(presentation(0, unit)).toBe(0)
    expect(presentation(null, unit)).toBeNull()
  }
})

it('reuses number formatters with exact locale and rounding semantics and a bounded cache', () => {
  for (const locale of ['fa-IR', 'en-US']) {
    for (const digits of [0, 1, 2]) {
      for (const value of [0, -0, -12.345, 123456.789, NaN, Infinity])
        expect(format(value, digits, locale)).toBe(value.toLocaleString(locale, {
          minimumFractionDigits: digits, maximumFractionDigits: digits,
        }))
    }
  }
  const NumberFormat = Intl.NumberFormat
  const constructor = vi.spyOn(Intl, 'NumberFormat').mockImplementation(function (locale, options) {
    return new NumberFormat(locale, options)
  })
  try {
    for (let row = 0; row < 323; row++) format(row, 1, row % 2 ? 'fa-IR' : 'en-US')
    expect(format(null, 1, 'en-US', 'Missing')).toBe('Missing')
    expect(format(undefined)).toBe('ناموجود')
    expect(constructor).not.toHaveBeenCalled()
    for (let digits = 0; digits < 17; digits++) format(1, digits, 'fr-FR')
    expect(constructor).toHaveBeenCalledTimes(17)
    format(1, 0, 'fr-FR')
    expect(constructor).toHaveBeenCalledTimes(18)
    expect(() => format(1, -1)).toThrow(RangeError)
  } finally { constructor.mockRestore() }
})
