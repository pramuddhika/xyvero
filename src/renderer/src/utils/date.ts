/* eslint-disable prettier/prettier */

/**
 * Calculates the current accounting cycle boundaries based on the configured month start day.
 * If today's day of month is less than startDay, the cycle started in the previous month.
 */
export function getAccountingPeriod(
  startDay: number = 1,
  refDate: Date = new Date()
): { startDate: Date; endDate: Date; startStr: string; endStr: string } {
  const currentYear = refDate.getFullYear()
  const currentMonth = refDate.getMonth()
  const currentDate = refDate.getDate()

  let startYear = currentYear
  let startMonth = currentMonth

  if (currentDate < startDay) {
    startMonth = currentMonth - 1
    if (startMonth < 0) {
      startMonth = 11
      startYear -= 1
    }
  }

  // Clamping start day to maximum days in start month
  const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate()
  const actualStartDay = Math.min(startDay, daysInStartMonth)

  const startDate = new Date(startYear, startMonth, actualStartDay, 0, 0, 0, 0)

  let endYear = startYear
  let endMonth = startMonth + 1
  if (endMonth > 11) {
    endMonth = 0
    endYear += 1
  }

  const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate()
  const targetEndDay = startDay - 1

  let actualEndDay: number
  let actualEndMonth: number
  let actualEndYear: number

  if (targetEndDay <= 0) {
    actualEndDay = daysInStartMonth
    actualEndMonth = startMonth
    actualEndYear = startYear
  } else {
    actualEndDay = Math.min(targetEndDay, daysInEndMonth)
    actualEndMonth = endMonth
    actualEndYear = endYear
  }

  const endDate = new Date(actualEndYear, actualEndMonth, actualEndDay, 23, 59, 59, 999)

  const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`)
  const startStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`
  const endStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T23:59:59.999`

  return { startDate, endDate, startStr, endStr }
}

/**
 * Formats a period date range, e.g.:
 * "August 15, 2026 – September 14, 2026"
 */
export function formatPeriodDateRange(startDate: Date, endDate: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
  const startFormatted = startDate.toLocaleDateString('en-US', options)
  const endFormatted = endDate.toLocaleDateString('en-US', options)
  return `${startFormatted} – ${endFormatted}`
}

/**
 * Formats a date string (YYYY-MM-DD) for day-wise transaction headers.
 * e.g., "Today • Aug 29, 2026", "Yesterday • Aug 28, 2026", or "Saturday, Aug 22, 2026"
 */
export function formatDayHeader(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map((val) => parseInt(val, 10))
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateKey

  const date = new Date(year, month - 1, day)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isToday =
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()

  const isYesterday =
    yesterday.getFullYear() === date.getFullYear() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getDate() === date.getDate()

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  if (isToday) {
    return `Today • ${formattedDate}`
  }
  if (isYesterday) {
    return `Yesterday • ${formattedDate}`
  }
  return `${weekday}, ${formattedDate}`
}

/**
 * Formats a transaction timestamp / time string into a human-readable 12-hour or 24-hour time.
 * e.g., "09:30 AM" or "02:15 PM"
 */
export function formatTransactionTime(dateTimeStr: string): string {
  try {
    const d = new Date(dateTimeStr)
    if (isNaN(d.getTime())) {
      // If direct string like "2026-08-29T14:30", parse manually
      const timePart = dateTimeStr.split('T')[1] || dateTimeStr.split(' ')[1]
      if (timePart) {
        const [hh, mm] = timePart.split(':')
        const hours = parseInt(hh, 10)
        const minutes = mm || '00'
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const h12 = hours % 12 || 12
        return `${h12}:${minutes} ${ampm}`
      }
      return dateTimeStr
    }
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return dateTimeStr
  }
}
