/**
 * Format number as currency using user's locale
 * Detects locale from browser, infers currency from region
 */
export function formatCurrency(amount: number): string {
  // Safely get locale - fallback to 'en-US' if navigator is undefined or doesn't have language
  const locale =
    typeof navigator !== 'undefined' && navigator.language
      ? navigator.language
      : 'en-US'

  // Map common regions to currencies
  const currencyMap: Record<string, string> = {
    KE: 'KES', // Kenya
    US: 'USD', // United States
    GB: 'GBP', // United Kingdom
    NG: 'NGN', // Nigeria
    ZA: 'ZAR', // South Africa
    UG: 'UGX', // Uganda
    TZ: 'TZS', // Tanzania
    GH: 'GHS', // Ghana
    IN: 'INR', // India
    EU: 'EUR', // Eurozone
    DE: 'EUR',
    FR: 'EUR',
    CA: 'CAD', // Canada
    AU: 'AUD', // Australia
  }

  // Extract region from locale (e.g., "en-KE" → "KE")
  const region = locale.split('-')[1]?.toUpperCase() ?? 'US'
  const currency = currencyMap[region] ?? 'USD'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number with locale-aware thousand separators
 */
export function formatNumber(num: number): string {
  const locale =
    typeof navigator !== 'undefined' && navigator.language
      ? navigator.language
      : 'en-US'
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Format date as human readable (e.g., "Nov. 12 2025")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
