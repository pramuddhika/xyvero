/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  ReceiptText,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import TransactionItem from './TransactionItem'
import TransactionDrawer, { TransactionFormData } from './TransactionDrawer'
import { formatDayHeader } from '../utils/date'
import { getCurrencySymbol } from '../utils/currency'
import type { AccountRecord, CategoryRecord, TransactionRecord } from '../types'

interface DayDetailProps {
  dateStr: string
  accounts: AccountRecord[]
  categories: CategoryRecord[]
  currencyType: string
  currencySymbol?: string
  onBack: () => void
  onTransactionUpdated?: () => void | Promise<void>
}

export default function DayDetail({
  dateStr,
  accounts,
  categories,
  currencyType,
  currencySymbol,
  onBack,
  onTransactionUpdated
}: DayDetailProps): React.JSX.Element {
  const [currentDateStr, setCurrentDateStr] = useState<string>(dateStr)
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Edit/create transaction state
  const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null)
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState<boolean>(false)

  const symbol = useMemo(
    () => currencySymbol || getCurrencySymbol(currencyType) || currencyType,
    [currencySymbol, currencyType]
  )

  const [prevDateStr, setPrevDateStr] = useState<string>(dateStr)
  if (dateStr !== prevDateStr) {
    setPrevDateStr(dateStr)
    setCurrentDateStr(dateStr)
  }

  // Fetch all transactions
  const fetchTransactions = useCallback(async (): Promise<void> => {
    try {
      if (window.api?.listTransactions) {
        const txs = await window.api.listTransactions()
        setTransactions(txs || [])
      }
    } catch (err) {
      console.error('Failed to load transactions for day detail:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTransactions()
  }, [fetchTransactions])

  // Filter transactions for the selected day
  const dayTransactions = useMemo(() => {
    return transactions
      .filter((tx) => tx.transaction_time.slice(0, 10) === currentDateStr)
      .sort((a, b) => b.transaction_time.localeCompare(a.transaction_time))
  }, [transactions, currentDateStr])

  // Calculate day totals: Income, Expenses (including transfer fees), and Net
  const { totalIncome, totalExpense, netTotal, incomeCount, expenseCount } = useMemo(() => {
    let inc = 0
    let exp = 0
    let incC = 0
    let expC = 0

    for (const tx of dayTransactions) {
      if (tx.transaction_type_id === 1) {
        inc += tx.amount
        incC++
      } else if (tx.transaction_type_id === 2) {
        exp += tx.amount
        expC++
      } else if (tx.transaction_type_id === 3 && tx.fees && tx.fees > 0) {
        exp += tx.fees
        expC++
      }
    }

    const net = inc - exp

    return {
      totalIncome: inc,
      totalExpense: exp,
      netTotal: net,
      incomeCount: incC,
      expenseCount: expC
    }
  }, [dayTransactions])

  const formatAmount = (val: number): string => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Format full date title (e.g., "Tuesday, October 20, 2026")
  const formattedFullDate = useMemo(() => {
    const [year, month, day] = currentDateStr.split('-').map((v) => parseInt(v, 10))
    if (isNaN(year) || isNaN(month) || isNaN(day)) return currentDateStr
    const d = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d)
  }, [currentDateStr])

  // Detect today or yesterday
  const { isToday, isYesterday } = useMemo(() => {
    const [year, month, day] = currentDateStr.split('-').map((v) => parseInt(v, 10))
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return { isToday: false, isYesterday: false }
    }
    const d = new Date(year, month - 1, day)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    const sameDay = (a: Date, b: Date): boolean =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()

    return {
      isToday: sameDay(d, today),
      isYesterday: sameDay(d, yesterday)
    }
  }, [currentDateStr])

  const goToPreviousDay = (): void => {
    const [year, month, day] = currentDateStr.split('-').map((v) => parseInt(v, 10))
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() - 1)
    const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`)
    setCurrentDateStr(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  }

  const goToNextDay = (): void => {
    const [year, month, day] = currentDateStr.split('-').map((v) => parseInt(v, 10))
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + 1)
    const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`)
    setCurrentDateStr(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  }

  // Handle saving a new or edited transaction
  const handleSaveTransaction = async (data: TransactionFormData): Promise<void> => {
    try {
      if (data.timeStamp) {
        if (window.api?.updateTransaction) {
          await window.api.updateTransaction(
            data.timeStamp,
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
      } else {
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
      }
      setIsTransactionDrawerOpen(false)
      setEditingTransaction(null)
      await fetchTransactions()
      if (onTransactionUpdated) {
        await onTransactionUpdated()
      }
    } catch (err) {
      console.error('Failed to save transaction:', err)
    }
  }

  // Handle deleting a transaction
  const handleDeleteTransaction = async (timeStamp: string): Promise<void> => {
    try {
      if (window.api?.deleteTransaction) {
        await window.api.deleteTransaction(timeStamp)
        await fetchTransactions()
        if (onTransactionUpdated) {
          await onTransactionUpdated()
        }
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      throw err
    }
  }

  return (
    <section className="content-area day-detail-page relative flex flex-col gap-5">
      {/* Top Navigation & Day Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--theme-border-soft)] bg-[var(--theme-control-bg)] hover:bg-[var(--theme-control-hover)] text-[var(--theme-text-strong)] transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 shrink-0"
            title="Back to Calendar"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-500 bg-emerald-500/15 shrink-0 shadow-md">
            <Calendar size={24} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-[var(--theme-text-strong)] truncate">
                {formattedFullDate}
              </h2>
              {isToday && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  Today
                </span>
              )}
              {isYesterday && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-chip-bg)] text-[var(--theme-text-muted)] border border-[var(--theme-border-soft)] shrink-0">
                  Yesterday
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--theme-text-muted)] mt-0.5">
              Daily summary &amp; transaction records
            </p>
          </div>
        </div>

        {/* Right side actions: Stepper & Add Transaction */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          {/* Day Stepper */}
          <div className="inline-flex overflow-hidden rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] shadow-2xs">
            <button
              type="button"
              onClick={goToPreviousDay}
              className="px-3 py-2 text-xs font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text-strong)] hover:bg-[var(--theme-control-hover)] transition-all cursor-pointer flex items-center gap-1"
              title="Previous Day"
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <div className="w-px bg-[var(--theme-border-soft)]" />
            <button
              type="button"
              onClick={goToNextDay}
              className="px-3 py-2 text-xs font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text-strong)] hover:bg-[var(--theme-control-hover)] transition-all cursor-pointer flex items-center gap-1"
              title="Next Day"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Add Transaction Button */}
          <button
            type="button"
            onClick={() => {
              setEditingTransaction(null)
              setIsTransactionDrawerOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Top 3 Stat Summary Cards: Income, Expense, and Day Net */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Income Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xs transition-all hover:shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Income
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                {incomeCount}
              </span>
            </div>
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              + {symbol} {formatAmount(totalIncome)}
            </span>
          </div>
        </div>

        {/* Expense Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 shadow-xs transition-all hover:shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
            <TrendingDown size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Expenses
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-semibold">
                {expenseCount}
              </span>
            </div>
            <span className="text-lg sm:text-xl font-bold font-mono text-red-600 dark:text-red-400 mt-0.5 truncate">
              - {symbol} {formatAmount(totalExpense)}
            </span>
          </div>
        </div>

        {/* Day Net Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] shadow-xs transition-all hover:shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-[var(--theme-control-bg)] text-[var(--theme-text-strong)] flex items-center justify-center shrink-0">
            <Wallet size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
              Day Net
            </span>
            <span
              className={`text-lg sm:text-xl font-bold font-mono mt-0.5 truncate ${
                netTotal < 0 ? 'text-red-500' : 'text-[var(--theme-text-strong)]'
              }`}
            >
              {netTotal < 0 ? '-' : '+'} {symbol} {formatAmount(Math.abs(netTotal))}
            </span>
          </div>
        </div>
      </div>

      {/* Day-Wise Transactions Section */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[var(--theme-text-strong)] flex items-center gap-2">
            <ReceiptText size={18} className="text-emerald-500" />
            <span>Day-by-Day Transactions</span>
          </h3>
          <span className="text-xs text-[var(--theme-text-muted)] font-medium">
            {dayTransactions.length} {dayTransactions.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-[var(--theme-text-muted)] text-sm">
            <span>Loading transactions...</span>
          </div>
        ) : dayTransactions.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--theme-border-soft)] rounded-2xl bg-[var(--theme-surface-soft)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-control-bg)] flex items-center justify-center text-[var(--theme-text-muted)] mb-3 shadow-inner">
              <ReceiptText size={24} />
            </div>
            <h4 className="text-sm font-bold text-[var(--theme-text-strong)]">
              No transactions for this day
            </h4>
            <p className="text-xs text-[var(--theme-text-muted)] max-w-sm mt-1">
              There are no income, expense, or transfer records for {formattedFullDate}.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingTransaction(null)
                setIsTransactionDrawerOpen(true)
              }}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Transaction</span>
            </button>
          </div>
        ) : (
          /* Transactions List with Day Header Bar */
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-[var(--theme-text-strong)]">
                  {formatDayHeader(currentDateStr)}
                </span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--theme-chip-bg)] text-[var(--theme-text-muted)] font-semibold">
                  {dayTransactions.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-[11px] text-[var(--theme-text-muted)] font-sans hidden sm:inline">
                  Day Net:
                </span>
                <span
                  className={`font-bold ${
                    netTotal >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {netTotal >= 0 ? '+' : '-'} {symbol} {formatAmount(Math.abs(netTotal))}
                </span>
              </div>
            </div>

            {/* Transaction Items */}
            <div className="flex flex-col gap-2 pl-1 sm:pl-2">
              {dayTransactions.map((tx) => (
                <TransactionItem
                  key={tx.time_stamp}
                  transaction={tx}
                  categories={categories}
                  accounts={accounts}
                  currencySymbol={symbol}
                  currencyType={currencyType}
                  onClick={() => {
                    setEditingTransaction(tx)
                    setIsTransactionDrawerOpen(true)
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TransactionDrawer for creating or editing transactions for this day */}
      <TransactionDrawer
        isOpen={isTransactionDrawerOpen}
        mode={editingTransaction ? 'edit' : 'create'}
        initialTransaction={editingTransaction}
        defaultDate={currentDateStr}
        accounts={accounts}
        categories={categories}
        currencySymbol={symbol}
        currencyType={currencyType}
        onClose={() => {
          setIsTransactionDrawerOpen(false)
          setEditingTransaction(null)
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
      />
    </section>
  )
}
