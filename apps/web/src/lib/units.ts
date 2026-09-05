export function presentation(value: number | null, unit: string): number | null {
  return value === null ? null : value * (unit === 'm' || unit === 'm/year' ? 1000 : 1)
}
export function format(value: number | null | undefined, digits = 1): string {
  return value == null ? '—' : value.toLocaleString('en-US', {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  })
}
