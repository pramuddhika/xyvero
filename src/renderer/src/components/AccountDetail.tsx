/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Pencil,
  Trash2,
  ReceiptText,
  Plus
} from 'lucide-react'
import { Icon } from './Icon'
import TransactionItem from './TransactionItem'
import TransactionDrawer, { TransactionFormData } from './TransactionDrawer'
import AccountFormModal, { AccountFormValues } from './AccountFormModal'
import ConfirmModal from './ConfirmModal'
import { getAccountingPeriod, formatPeriodDateRange, formatDayHeader } from '../utils/date'
import { getCurrencySymbol, unformatAmount } from '../utils/currency'
import type { AccountRecord, AccountTypeRecord, CategoryRecord, TransactionRecord } from '../types'

interface AccountDetailProps {
  account: AccountRecord
  accountTypes: AccountTypeRecord[]
  categories: CategoryRecord[]
  accounts: AccountRecord[]
  monthStartDay: number
  currencyType: string
  onBack: () => void
  onAccountUpdated?: () => void | Promise<void>
}

export default function AccountDetail({
  account,
  accountTypes,
  categories,
  accounts,
  monthStartDay,
  currencyType,
  onBack,
  onAccountUpdated
}: AccountDetailProps): React.JSX.Element {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Edit transaction state
  const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null)
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState<boolean>(false)

  const currencySymbol = useMemo(() => getCurrencySymbol(currencyType), [currencyType])
  const symbol = currencySymbol || currencyType

  // Find account type
  const accountType = useMemo(() => {
    return accountTypes.find((t) => t.account_type_id === account.account_type_id)
  }, [accountTypes, account.account_type_id])

  // Compute active accounting cycle
  const { startDate, endDate, startStr, endStr } = useMemo(() => {
    return getAccountingPeriod(monthStartDay)
  }, [monthStartDay])

  // Fetch transactions for this account
  const fetchTransactions = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      if (window.api?.listTransactions) {
        const txs = await window.api.listTransactions()
        setTransactions(txs || [])
      }
    } catch (err) {
      console.error('Failed to load transactions for account detail:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTransactions()
  }, [fetchTransactions])

  // Filter transactions belonging to this account and within the active accounting cycle
  const periodTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const isAccountMatch =
        tx.to_account_id === account.account_id || tx.from_account_id === account.account_id
      if (!isAccountMatch) return false

      // Check if transaction_time is within [startStr, endStr]
      const txTime = tx.transaction_time
      return txTime >= startStr && txTime <= endStr
    })
  }, [transactions, account.account_id, startStr, endStr])

  // Calculate Income, Expense (including transfer fees), and Total Net (gap)
  const { totalIncome, totalExpense, netTotal, incomeCount, expenseCount } = useMemo(() => {
    let inc = 0
    let exp = 0
    let incC = 0
    let expC = 0

    for (const tx of periodTransactions) {
      if (tx.transaction_type_id === 1 && tx.to_account_id === account.account_id) {
        inc += tx.amount
        incC++
      } else if (tx.transaction_type_id === 2 && tx.to_account_id === account.account_id) {
        exp += tx.amount
        expC++
      } else if (tx.transaction_type_id === 3) {
        // Any transfer fee incurred by this account is counted as an expense
        if (tx.from_account_id === account.account_id && tx.fees && tx.fees > 0) {
          exp += tx.fees
          expC++
        }
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
  }, [periodTransactions, account.account_id])

  // Group transactions by day (YYYY-MM-DD), only keeping days that have records
  const groupedDays = useMemo(() => {
    const map = new Map<string, { transactions: TransactionRecord[]; dayNet: number }>()

    for (const tx of periodTransactions) {
      const dateKey = tx.transaction_time.slice(0, 10)
      if (!map.has(dateKey)) {
        map.set(dateKey, { transactions: [], dayNet: 0 })
      }
      const entry = map.get(dateKey)!
      entry.transactions.push(tx)

      // Calculate day net impact for this account (Income - Expense, transfer fee as expense)
      if (tx.transaction_type_id === 1 && tx.to_account_id === account.account_id) {
        entry.dayNet += tx.amount
      } else if (tx.transaction_type_id === 2 && tx.to_account_id === account.account_id) {
        entry.dayNet -= tx.amount
      } else if (tx.transaction_type_id === 3) {
        if (tx.from_account_id === account.account_id && tx.fees && tx.fees > 0) {
          entry.dayNet -= tx.fees
        }
      }
    }

    // Sort days in descending order (latest day first)
    const sortedDays = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))

    // Sort transactions within each day in descending order
    for (const [, group] of sortedDays) {
      group.transactions.sort((a, b) => b.transaction_time.localeCompare(a.transaction_time))
    }

    return sortedDays
  }, [periodTransactions, account.account_id])

  const formatAmount = (val: number): string => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handleOpenEditModal = (): void => {
    setSaveError(null)
    setIsEditModalOpen(true)
  }

  const onEditSubmit = async (data: AccountFormValues): Promise<void> => {
    setSaveError(null)
    try {
      if (!window.api?.updateAccount) {
        throw new Error('Update account function is not available.')
      }

      const accountTypeId = parseInt(data.accountTypeId, 10)
      if (isNaN(accountTypeId)) {
        throw new Error('Please select a valid account type.')
      }

      const newAmount = unformatAmount(data.accountAmount)
      if (isNaN(newAmount)) {
        throw new Error('Please enter a valid amount.')
      }

      // 1. Update account metadata (name, type, icon, color)
      await window.api.updateAccount(
        account.account_id,
        data.accountName.trim(),
        accountTypeId,
        data.accountIcon,
        data.accountColor
      )

      // 2. Compute amount gap between new target amount and current netTotal
      const diff = parseFloat((newAmount - netTotal).toFixed(2))

      // If there is an amount change, record an Income or Expense transaction
      if (Math.abs(diff) >= 0.01) {
        if (!window.api?.addTransaction) {
          throw new Error('Add transaction function is not available.')
        }

        const now = new Date()
        const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`)
        const txTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`

        if (diff > 0) {
          // Increase -> Record Income transaction
          await window.api.addTransaction(
            txTime,
            1, // Income
            account.account_id,
            null,
            null,
            diff,
            0,
            'Balance Adjustment'
          )
        } else {
          // Decrease -> Record Expense transaction
          await window.api.addTransaction(
            txTime,
            2, // Expense
            account.account_id,
            null,
            null,
            Math.abs(diff),
            0,
            'Balance Adjustment'
          )
        }
      }

      setIsEditModalOpen(false)
      await fetchTransactions()
      if (onAccountUpdated) {
        await onAccountUpdated()
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update account')
    }
  }

  const handleDeleteAccount = async (): Promise<void> => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      if (!window.api?.deleteAccount) {
        throw new Error('Delete account function is not available.')
      }
      await window.api.deleteAccount(account.account_id)
      setIsDeleteModalOpen(false)
      if (onAccountUpdated) {
        await onAccountUpdated()
      }
      onBack()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle saving a new or edited transaction
  const handleSaveTransaction = async (data: TransactionFormData): Promise<void> => {
    try {
      if (data.timeStamp) {
        // Edit existing transaction
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
        // Create new transaction
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
      if (onAccountUpdated) {
        await onAccountUpdated()
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
        if (onAccountUpdated) {
          await onAccountUpdated()
        }
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      throw err
    }
  }

  return (
    <section className="content-area account-detail-page relative flex flex-col gap-5">
      {/* Top Navigation & Account Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--theme-border-soft)] bg-[var(--theme-control-bg)] hover:bg-[var(--theme-control-hover)] text-[var(--theme-text-strong)] transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 shrink-0"
            title="Back to Accounts"
          >
            <ArrowLeft size={18} />
          </button>

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
            style={{ backgroundColor: account.account_color }}
          >
            <Icon icon={account.account_icon} size={24} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--theme-text-strong)] truncate">
                {account.account_name}
              </h2>
              {accountType && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-chip-bg)] text-[var(--theme-text-muted)] border border-[var(--theme-border-soft)] shrink-0">
                  {accountType.account_type_name}
                </span>
              )}
              {/* Action Buttons: Edit and Delete */}
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--theme-text-muted)] hover:text-emerald-500 hover:bg-[var(--theme-control-hover)] transition-all cursor-pointer"
                  title="Edit account details and balance"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null)
                    setIsDeleteModalOpen(true)
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--theme-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Delete account"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--theme-text-muted)] mt-0.5">
              Account cycle summary &amp; day-wise transaction records
            </p>
          </div>
        </div>

        {/* Right side actions: Accounting Period badge & Add Transaction button */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          {/* Month Cycle Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--theme-surface-strong)] border border-[var(--theme-border-soft)] shadow-2xs">
            <Calendar size={16} className="text-emerald-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--theme-text-muted)]">
                Accounting Period
              </span>
              <span className="text-xs font-semibold text-[var(--theme-text-strong)] font-mono">
                {formatPeriodDateRange(startDate, endDate)}
              </span>
            </div>
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

      {/* Top 3 Stat Summary Cards: Income, Expense (incl. transfer fees), and Total Net (gap) */}
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

        {/* Expense Card (includes expenses + transfer fees) */}
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

        {/* Total Net Card (Income - Expense Gap) */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] shadow-xs transition-all hover:shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-[var(--theme-control-bg)] text-[var(--theme-text-strong)] flex items-center justify-center shrink-0">
            <Wallet size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
              Total Net
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
            {periodTransactions.length} {periodTransactions.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-[var(--theme-text-muted)] text-sm">
            <span>Loading transactions...</span>
          </div>
        ) : groupedDays.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--theme-border-soft)] rounded-2xl bg-[var(--theme-surface-soft)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-control-bg)] flex items-center justify-center text-[var(--theme-text-muted)] mb-3 shadow-inner">
              <ReceiptText size={24} />
            </div>
            <h4 className="text-sm font-bold text-[var(--theme-text-strong)]">
              No transactions for this cycle
            </h4>
            <p className="text-xs text-[var(--theme-text-muted)] max-w-sm mt-1">
              There are no transactions recorded for {account.account_name} in the period from{' '}
              {formatPeriodDateRange(startDate, endDate)}.
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
          /* Day Groups */
          <div className="flex flex-col gap-5">
            {groupedDays.map(([dateKey, group]) => {
              const isDayPositive = group.dayNet >= 0

              return (
                <div key={dateKey} className="flex flex-col gap-2.5">
                  {/* Day Header Bar */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-[var(--theme-text-strong)]">
                        {formatDayHeader(dateKey)}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--theme-chip-bg)] text-[var(--theme-text-muted)] font-semibold">
                        {group.transactions.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-[11px] text-[var(--theme-text-muted)] font-sans hidden sm:inline">
                        Day Net:
                      </span>
                      <span
                        className={`font-bold ${
                          isDayPositive ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {isDayPositive ? '+' : '-'} {symbol} {formatAmount(Math.abs(group.dayNet))}
                      </span>
                    </div>
                  </div>

                  {/* Day Transaction Items (All transactions clickable for editing) */}
                  <div className="flex flex-col gap-2 pl-1 sm:pl-2">
                    {group.transactions.map((tx) => (
                      <TransactionItem
                        key={tx.time_stamp}
                        transaction={tx}
                        categories={categories}
                        accounts={accounts}
                        currentAccountId={account.account_id}
                        currencySymbol={currencySymbol}
                        currencyType={currencyType}
                        onClick={() => {
                          setEditingTransaction(tx)
                          setIsTransactionDrawerOpen(true)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Shared AccountFormModal in 'edit' mode */}
      <AccountFormModal
        isOpen={isEditModalOpen}
        mode="edit"
        accountTypes={accountTypes}
        initialValues={{
          accountName: account.account_name,
          accountAmount: netTotal.toFixed(2),
          accountTypeId: account.account_type_id.toString(),
          accountIcon: account.account_icon,
          accountColor: account.account_color
        }}
        currencySymbol={currencySymbol}
        currencyType={currencyType}
        saveError={saveError}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={onEditSubmit}
      />

      {/* Confirmation Modal for Account Deletion */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Account"
        itemName={account.account_name}
        itemIcon={<Icon icon={account.account_icon} size={20} />}
        itemColor={account.account_color}
        message="Are you sure you want to delete this account?"
        subMessage="Past transactions will remain in your transaction history under this account name. However, this account will be deactivated and will no longer appear on your Accounts page or be available for new transactions."
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        isDestructive={true}
        isProcessing={isDeleting}
        error={deleteError}
        onClose={() => {
          if (!isDeleting) setIsDeleteModalOpen(false)
        }}
        onConfirm={handleDeleteAccount}
      />

      {/* TransactionDrawer for creating or editing transactions for this specific account */}
      <TransactionDrawer
        isOpen={isTransactionDrawerOpen}
        mode={editingTransaction ? 'edit' : 'create'}
        initialTransaction={editingTransaction}
        defaultAccountId={account.account_id}
        lockAccount={true}
        accounts={accounts}
        categories={categories}
        currencySymbol={currencySymbol}
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
