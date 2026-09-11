export function presentation(value: number | null, unit: string): number | null {
  return value === null ? null : value * (unit === 'm' || unit === 'm/year' ? 1000 : unit === 'cm' || unit === 'cm/year' ? 10 : 1)
}
export function displayUnit(unit: string): string {
  return ({ m: 'mm', cm: 'mm', 'm/year': 'mm/year', 'cm/year': 'mm/year' } as Record<string, string>)[unit] ?? unit
}
export function format(value: number | null | undefined, digits = 1, locale = 'en-US', missing = 'ناموجود'): string {
  return value == null ? missing : value.toLocaleString(locale, {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  })
}
