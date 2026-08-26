/**
 * Converts an ISO 4217 currency code (e.g. "USD", "EUR") into its
 * narrow symbol representation (e.g. "$", "€").
 *
 * Returns an empty string if the code is invalid or the symbol
 * matches the code itself (no distinct symbol exists).
 */
export function getCurrencySymbol(currencyCode: string): string {
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol'
    }).formatToParts(1)

    const symbol = parts.find((part) => part.type === 'currency')?.value ?? ''
    return symbol === currencyCode ? '' : symbol
  } catch {
    return ''
  }
}
