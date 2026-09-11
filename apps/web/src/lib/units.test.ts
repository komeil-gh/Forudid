import { expect, it } from 'vitest'
import { displayUnit, presentation } from './units'

it('keeps the numeric conversion and displayed unit paired, including dimensionless zero', () => {
  for (const [unit, value, output] of [['m/year', 1000, 'mm/year'], ['cm/year', 10, 'mm/year'], ['cm', 10, 'mm'], ['m', 1000, 'mm'], ['1', 1, '1']] as const) {
    expect(presentation(1, unit)).toBe(value)
    expect(displayUnit(unit)).toBe(output)
    expect(presentation(0, unit)).toBe(0)
    expect(presentation(null, unit)).toBeNull()
  }
})
