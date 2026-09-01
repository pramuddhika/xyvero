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

/**
 * Formats a numeric or typed amount string with thousands comma separators.
 * Preserves decimals and negative sign during typing.
 *
 * Examples:
 *   "1000" -> "1,000"
 *   "1000000.5" -> "1,000,000.5"
 *   "-50000.75" -> "-50,000.75"
 *   "-" -> "-"
 *   "." -> "0."
 */
export function formatAmountWithCommas(
  value: string | number | undefined | null,
  allowNegative: boolean = true
): string {
  if (value === undefined || value === null) return ''
  const str = String(value).trim()
  if (str === '') return ''
  if (str === '-' && allowNegative) return '-'
  if (str === '.' || str === '0.') return '0.'
  if (str === '-.' && allowNegative) return '-0.'

  const isNegative = allowNegative && str.startsWith('-')
  const cleanStr = isNegative ? str.slice(1) : str

  // Strip all characters except digits and decimal point
  const sanitized = cleanStr.replace(/[^\d.]/g, '')
  if (!sanitized) {
    return isNegative ? '-' : ''
  }

  const parts = sanitized.split('.')
  let integerPart = parts[0]
  const hasDecimal = parts.length > 1
  const decimalPart = hasDecimal ? parts.slice(1).join('') : null

  // Remove redundant leading zeros (e.g. "05" -> "5", but keep "0")
  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    integerPart = integerPart.replace(/^0+/, '') || '0'
  }

  // Add commas every 3 digits
  const formattedInteger = (integerPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  let result = (isNegative ? '-' : '') + (integerPart === '' && hasDecimal ? '0' : formattedInteger)

  if (hasDecimal) {
    result += '.' + (decimalPart !== null ? decimalPart.slice(0, 2) : '')
  }

  return result
}

/**
 * Strips formatting commas and returns a clean numeric value.
 */
export function unformatAmount(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0
  const str = String(value).trim().replace(/,/g, '')
  const parsed = parseFloat(str)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Handles live input formatting for currency/amount text fields,
 * preserving the caret position seamlessly across comma insertions/deletions.
 */
export function handleFormattedAmountInput(
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (val: string) => void,
  allowNegative: boolean = true
): void {
  const input = e.target
  const rawValue = input.value
  const selectionStart = input.selectionStart ?? rawValue.length

  // Count valid numeric characters before the current cursor position
  const rawBeforeCursor = rawValue.slice(0, selectionStart)
  const validCharsBeforeCursor = (rawBeforeCursor.match(/[-\d.]/g) || []).length

  // Format the new value
  const formatted = formatAmountWithCommas(rawValue, allowNegative)
  onChange(formatted)

  // Restore caret position in the next animation frame
  requestAnimationFrame(() => {
    let charCount = 0
    let newCursorPos = 0

    if (validCharsBeforeCursor === 0) {
      newCursorPos = 0
    } else {
      for (let i = 0; i < formatted.length; i++) {
        if (/[-\d.]/.test(formatted[i])) {
          charCount++
        }
        if (charCount === validCharsBeforeCursor) {
          newCursorPos = i + 1
          break
        }
      }
      if (charCount < validCharsBeforeCursor) {
        newCursorPos = formatted.length
      }
    }

    try {
      input.setSelectionRange(newCursorPos, newCursorPos)
    } catch {
      // Ignore if input is not focused or unmounted
    }
  })
}
