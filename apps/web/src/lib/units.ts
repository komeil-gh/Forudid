export function presentation(value: number | null, unit: string): number | null {
  return value === null ? null : value * (unit === 'm' || unit === 'm/year' ? 1000 : unit === 'cm' || unit === 'cm/year' ? 10 : 1)
}
export function displayUnit(unit: string): string {
  return ({ m: 'mm', cm: 'mm', 'm/year': 'mm/year', 'cm/year': 'mm/year' } as Record<string, string>)[unit] ?? unit
}
const numberFormats = new Map<string, Intl.NumberFormat>()
export function format(value: number | null | undefined, digits = 1, locale = 'en-US', missing = 'ناموجود'): string {
  if (value == null) return missing
  const key = `${locale}:${digits}`
  let formatter = numberFormats.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
    if (numberFormats.size >= 16) numberFormats.delete(numberFormats.keys().next().value!)
    numberFormats.set(key, formatter)
  }
  return formatter.format(value)
}
