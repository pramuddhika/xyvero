/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prettier/prettier */
import React, { useMemo, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { getCurrencySymbol } from '../utils/currency'
import TransactionDrawer, { TransactionFormData } from '../components/TransactionDrawer'
import type { AccountRecord, CategoryRecord } from '../types'

type CalendarEvent = {
  title: string
  date: Date
  category: 'Budget' | 'Bills' | 'Planning' | 'General'
}

type CalendarCell = {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type ThemeMode = 'dark' | 'light'

const eventSeed = [
  {
    title: 'Monthly budget review',
    dayOffset: 1,
    category: 'Budget' as const
  },
  {
    title: 'Subscription renewals',
    dayOffset: 3,
    category: 'Bills' as const
  },
  {
    title: 'Cash flow check-in',
    dayOffset: 6,
    category: 'Planning' as const
  },
  {
    title: 'Savings transfer',
    dayOffset: 15,
    category: 'General' as const
  }
]

const categoryStyles: Record<CalendarEvent['category'], string> = {
  Budget: 'bg-emerald-400/15 text-emerald-50 ring-1 ring-inset ring-emerald-300/25',
  Bills: 'bg-sky-400/15 text-sky-50 ring-1 ring-inset ring-sky-300/25',
  Planning: 'bg-amber-400/15 text-amber-50 ring-1 ring-inset ring-amber-300/25',
  General: 'bg-white/10 text-white ring-1 ring-inset ring-white/15'
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const expectedMonth = (result.getMonth() + months + 1200) % 12
  result.setMonth(result.getMonth() + months)
  if (result.getMonth() !== expectedMonth) {
    result.setDate(0)
  }
  return result
}

function getPeriodStart(referenceDate: Date, startDay: number): Date {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const date = referenceDate.getDate()

  const startYear = year
  let startMonth = month

  if (date < startDay) {
    startMonth = month - 1
  }

  const maxDays = new Date(startYear, startMonth + 1, 0).getDate()
  const start = new Date(startYear, startMonth, Math.min(startDay, maxDays), 0, 0, 0, 0)
  return start
}

function getPeriodBoundaries(referenceDate: Date, startDay: number) {
  const start = getPeriodStart(referenceDate, startDay)
  const startMonth = start.getMonth()
  const startYear = start.getFullYear()

  let endYear = startYear
  let endMonth = startMonth + 1
  if (endMonth > 11) {
    endMonth = 0
    endYear += 1
  }

  const maxDaysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate()
  const endDay = startDay - 1
  if (endDay === 0) {
    const maxDaysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate()
    return {
      start,
      end: new Date(startYear, startMonth, maxDaysInStartMonth, 23, 59, 59, 999)
    }
  }

  const end = new Date(endYear, endMonth, Math.min(endDay, maxDaysInEndMonth), 23, 59, 59, 999)
  return { start, end }
}

function startOfCalendarGrid(periodStart: Date, weekStartIndex = 0): Date {
  const firstDow = periodStart.getDay()
  const offset = (firstDow - weekStartIndex + 7) % 7
  const gridStart = new Date(periodStart)
  gridStart.setDate(periodStart.getDate() - offset)
  return gridStart
}

function createCalendarCells(
  periodStart: Date,
  periodEnd: Date,
  events: CalendarEvent[],
  weekStartIndex = 0
): CalendarCell[] {
  const today = new Date()
  const gridStart = startOfCalendarGrid(periodStart, weekStartIndex)
  const cells: CalendarCell[] = []

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(gridStart)
    cellDate.setDate(gridStart.getDate() + index)
    cellDate.setHours(0, 0, 0, 0)

    const cellTime = cellDate.getTime()
    const isInPeriod = cellTime >= periodStart.getTime() && cellTime <= periodEnd.getTime()

    cells.push({
      date: cellDate,
      isCurrentMonth: isInPeriod,
      isToday: isSameDay(cellDate, today),
      events: events.filter((event) => isSameDay(event.date, cellDate))
    })
  }

  return cells
}

type TransactionsProps = {
  theme: ThemeMode
  weekStart?: string
}

function Transactions({ theme, weekStart }: TransactionsProps): React.JSX.Element {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date())
  const [monthStartDate, setMonthStartDate] = useState<number>(1)
  const isLightTheme = theme === 'light'

  // Right-side slide-over drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [accounts, setAccounts] = useState<AccountRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [currencyType, setCurrencyType] = useState<string>('USD')

  const currencySymbol = useMemo(() => getCurrencySymbol(currencyType), [currencyType])

  useEffect(() => {
    if (window.api?.getConfigurationValue) {
      window.api.getConfigurationValue('MONTH_START_DATE').then((val) => {
        if (val?.configuration_value) {
          const parsed = parseInt(val.configuration_value, 10)
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
            setMonthStartDate(parsed)
          }
        }
      })
    }
  }, [])

  // Load active accounts and categories for transaction form
  useEffect(() => {
    if (window.api) {
      Promise.all([
        window.api.listAccounts ? window.api.listAccounts() : [],
        window.api.listCategories ? window.api.listCategories() : [],
        window.api.getConfigurationValue
          ? window.api.getConfigurationValue('CURRENCY_TYPE')
          : undefined
      ])
        .then(([accs, cats, configVal]) => {
          setAccounts(accs || [])
          setCategories(cats || [])
          if (configVal?.configuration_value) {
            setCurrencyType(configVal.configuration_value)
          }
        })
        .catch((err) => {
          console.error('Failed to load accounts and categories:', err)
        })
    }
  }, [])

  const { start: periodStart, end: periodEnd } = useMemo(() => {
    return getPeriodBoundaries(visibleMonth, monthStartDate)
  }, [visibleMonth, monthStartDate])

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return eventSeed.map((event) => {
      const eventDate = new Date(periodStart)
      eventDate.setDate(periodStart.getDate() + event.dayOffset - 1)
      return {
        title: event.title,
        category: event.category,
        date: eventDate
      }
    })
  }, [periodStart])

  const computedWeekStartIndex = weekStart && weekStart.toLowerCase() === 'monday' ? 1 : 0

  const calendarCells = useMemo(
    () => createCalendarCells(periodStart, periodEnd, calendarEvents, computedWeekStartIndex),
    [calendarEvents, periodStart, periodEnd, computedWeekStartIndex]
  )

  const displayedWeekdayLabels = useMemo(() => {
    if (computedWeekStartIndex === 0) return weekdayLabels
    const rotated = weekdayLabels.slice(1).concat(weekdayLabels[0])
    return rotated
  }, [computedWeekStartIndex])

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric'
      }).format(visibleMonth),
    [visibleMonth]
  )

  const navigateMonth = (direction: -1 | 1): void => {
    setVisibleMonth((currentMonth) => addMonths(currentMonth, direction))
  }

  // Keyboard navigation & ESC key handler for drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isDrawerOpen) {
        if (e.key === 'Escape') {
          setIsDrawerOpen(false)
        }
        return
      }
      if (e.key === 'ArrowLeft') {
        setVisibleMonth((currentMonth) => addMonths(currentMonth, -1))
      } else if (e.key === 'ArrowRight') {
        setVisibleMonth((currentMonth) => addMonths(currentMonth, 1))
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isDrawerOpen])

  const handleSaveTransaction = async (data: TransactionFormData): Promise<void> => {
    try {
      if (window.api?.addTransaction) {
        await window.api.addTransaction(
          data.transactionTime,
          data.transactionTypeId,
          data.toAccountId,
          data.fromAccountId,
          data.categoryId,
          data.amount,
          data.fees,
          data.note
        )
      }
      if (window.api?.listAccounts) {
        const updatedAccounts = await window.api.listAccounts()
        setAccounts(updatedAccounts || [])
      }
    } catch (err) {
      console.error('Failed to save transaction to database:', err)
    }
    setIsDrawerOpen(false)
  }

  const shellClassName = isLightTheme
    ? 'flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(54,177,118,0.16),_transparent_30%),linear-gradient(180deg,_#ffffff,_#f1f6f8)] shadow-[0_24px_60px_rgba(15,36,48,0.12)] relative'
    : 'flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[var(--theme-border)] bg-[radial-gradient(circle_at_top_left,_rgba(54,177,118,0.14),_transparent_28%),linear-gradient(180deg,_rgba(12,31,40,0.98),_rgba(8,19,26,0.98))] shadow-[0_28px_70px_rgba(0,0,0,0.28)] relative'

  const topBarClassName = isLightTheme
    ? 'flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-4 sm:px-6'
    : 'flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6'

  const monthActionButtonClassName = isLightTheme
    ? 'inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 cursor-pointer'
    : 'inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-(--theme-text-strong) shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:border-white/20 hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 cursor-pointer'

  const monthStepperClassName = isLightTheme
    ? 'inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm'
    : 'inline-flex overflow-hidden rounded-full border border-white/12 bg-[rgba(255,255,255,0.04)] shadow-[0_10px_24px_rgba(0,0,0,0.18)]'

  const monthStepperButtonClassName = isLightTheme
    ? 'inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 cursor-pointer'
    : 'inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-semibold text-(--theme-text-strong) transition hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 cursor-pointer'

  const panelClassName = isLightTheme
    ? 'mt-px grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-px overflow-hidden rounded-b-3xl border border-t-0 border-slate-200 bg-slate-200/80'
    : 'mt-px grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-px overflow-hidden rounded-b-3xl border border-t-0 border-white/10 bg-white/10'

  return (
    <div className={shellClassName}>
      {/* Top Toolbar */}
      <div className={topBarClassName}>
        <div className="min-w-0">
          <h2
            className={`text-2xl font-semibold tracking-tight sm:text-3xl ${isLightTheme ? 'text-slate-900' : 'text-(--theme-text-strong)'}`}
          >
            {monthLabel}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Today Button */}
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date())}
            className={monthActionButtonClassName}
            title="Go to current month"
            aria-label="Go to current month"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <path d="M16 2v4M8 2v4" />
            </svg>
            <span>Today</span>
          </button>

          {/* Stepper Navigation */}
          <div className={monthStepperClassName} aria-label="Month navigation">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              aria-label="Previous month"
              className={monthStepperButtonClassName}
              title="Previous month"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M12.293 15.707a1 1 0 0 1-1.414 0l-5-5a1 1 0 0 1 0-1.414l5-5a1 1 0 1 1 1.414 1.414L8.414 10l3.879 3.879a1 1 0 0 1 0 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Prev</span>
            </button>

            <div
              className={isLightTheme ? 'w-px bg-slate-200' : 'w-px bg-white/12'}
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={() => navigateMonth(1)}
              aria-label="Next month"
              className={monthStepperButtonClassName}
              title="Next month"
            >
              <span>Next</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Easy-Access Top Bar + Marker Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="category-add-button flex items-center justify-center gap-2 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer min-h-11 px-4.5 rounded-full"
            title="Create New Transaction"
            aria-label="Create New Transaction"
          >
            <Plus size={18} />
            <span className="font-semibold text-sm">Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <div
          className={`grid grid-cols-7 gap-px rounded-t-2xl border text-center text-[11px] font-semibold uppercase tracking-[0.22em] ${
            isLightTheme
              ? 'overflow-hidden border-slate-200 bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/70'
              : 'border-white/10 bg-white/10 text-(--theme-text-muted)'
          }`}
        >
          {displayedWeekdayLabels.map((weekday) => (
            <div
              key={weekday}
              className={
                isLightTheme ? 'bg-white px-2 py-3' : 'bg-[rgba(255,255,255,0.03)] px-2 py-3'
              }
            >
              {weekday}
            </div>
          ))}
        </div>

        <div className={panelClassName}>
          {calendarCells.map((cell) => (
            <div
              key={cell.date.toISOString()}
              className={`relative flex min-h-0 flex-col overflow-hidden p-3 transition ${
                isLightTheme ? 'bg-white' : 'bg-[rgba(255,255,255,0.03)]'
              } ${
                cell.isCurrentMonth
                  ? isLightTheme
                    ? 'text-slate-900'
                    : 'text-(--theme-text-strong)'
                  : isLightTheme
                    ? 'text-slate-300'
                    : 'text-white/35'
              } ${
                cell.isToday
                  ? isLightTheme
                    ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-300/50'
                    : 'bg-emerald-400/12 ring-1 ring-inset ring-emerald-300/30'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-sm font-semibold sm:text-base ${isLightTheme ? 'text-slate-900' : ''}`}
                >
                  {cell.date.getDate().toString().padStart(2, '0')}
                </span>
                {cell.isToday ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      isLightTheme
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-400/20 text-emerald-50'
                    }`}
                  >
                    Today
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                {cell.events.length > 0 ? (
                  cell.events.map((event) => (
                    <div
                      key={`${event.title}-${event.date.toISOString()}`}
                      className={`rounded-xl px-2.5 py-2 text-left text-xs font-semibold leading-snug ${
                        isLightTheme
                          ? {
                              Budget:
                                'bg-emerald-100 text-emerald-900 ring-1 ring-inset ring-emerald-200',
                              Bills: 'bg-sky-100 text-sky-900 ring-1 ring-inset ring-sky-200',
                              Planning:
                                'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-200',
                              General:
                                'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'
                            }[event.category]
                          : categoryStyles[event.category]
                      }`}
                    >
                      <div className="truncate">{event.title}</div>
                      <div
                        className={`mt-1 text-[10px] font-medium uppercase tracking-[0.18em] ${
                          isLightTheme ? 'opacity-75' : 'opacity-70'
                        }`}
                      >
                        {event.category}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className={`mt-auto text-[11px] ${isLightTheme ? 'text-slate-300' : 'text-white/22'}`}
                  >
                    &nbsp;
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button (FAB) + Marker for Easy Access */}
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-[0_10px_25px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Add Transaction"
        aria-label="Add Transaction"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Separated Right-Side Slide-Over Transaction Drawer with Backdrop Blur */}
      <TransactionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        accounts={accounts}
        categories={categories}
        currencySymbol={currencySymbol}
        currencyType={currencyType}
        onSave={handleSaveTransaction}
      />
    </div>
  )
}

export default Transactions
