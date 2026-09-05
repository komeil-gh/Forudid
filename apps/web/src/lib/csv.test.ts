import { expect, it } from 'vitest'
import { csvCell } from './csv'

it('escapes external names and formula prefixes while preserving numeric values and NoData', () => {
  expect(csvCell('راه, "شرق"')).toBe('"راه, ""شرق"""')
  for (const value of ['=1+1', '+SUM(A1)', '-1+2', '@SUM(A1)', ' \t=1']) {
    expect(csvCell(value)).toBe(`"'${value}"`)
  }
  expect(csvCell(-12)).toBe('"-12"')
  expect(csvCell(0)).toBe('"0"')
  expect(csvCell(null)).toBe('""')
})
