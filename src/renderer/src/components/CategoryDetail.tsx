/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ArrowLeft,
  Calendar,
  Pencil,
  Trash2,
  ReceiptText,
} from 'lucide-react'
import { Icon } from './Icon'
import TransactionItem from './TransactionItem'
import CategoryFormModal, { CategoryFormValues } from './CategoryFormModal'
import ConfirmModal from './ConfirmModal'
import { getAccountingPeriod, formatPeriodDateRange, formatDayHeader } from '../utils/date'
import { getCurrencySymbol } from '../utils/currency'
import type { CategoryRecord, CategoryTypeRecord, AccountRecord, TransactionRecord } from '../types'

interface CategoryDetailProps {
  category: CategoryRecord
  categoryTypes: CategoryTypeRecord[]
  categories: CategoryRecord[]
  accounts: AccountRecord[]
  monthStartDay: number
  currencyType: string
  onBack: () => void
  onCategoryUpdated?: () => void | Promise<void>
}

export default function CategoryDetail({
  category,
  categoryTypes,
  categories,
  accounts,
  monthStartDay,
  currencyType,
  onBack,
  onCategoryUpdated
}: CategoryDetailProps): React.JSX.Element {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const currencySymbol = useMemo(() => getCurrencySymbol(currencyType), [currencyType])
  const symbol = currencySymbol || currencyType

  // Find category type (Income vs Expense)
  const categoryType = useMemo(() => {
    return categoryTypes.find((t) => t.category_id === category.category_group_id)
  }, [categoryTypes, category.category_group_id])

  const isIncome = category.category_group_id === 1

  // Compute active accounting cycle
  const { startDate, endDate, startStr, endStr } = useMemo(() => {
    return getAccountingPeriod(monthStartDay)
  }, [monthStartDay])

  // Fetch transactions
  const fetchTransactions = useCallback(async (): Promise<void> => {
    try {
      if (window.api?.listTransactions) {
        const txs = await window.api.listTransactions()
        setTransactions(txs || [])
      }
    } catch (err) {
      console.error('Failed to load transactions for category detail:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTransactions()
  }, [fetchTransactions])

  // Filter transactions belonging to this category and within the active accounting cycle
  const periodTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.category_id !== category.category_id) return false
      const txTime = tx.transaction_time
      return txTime >= startStr && txTime <= endStr
    })
  }, [transactions, category.category_id, startStr, endStr])

  // Group transactions by day (YYYY-MM-DD), only keeping days that have records
  const groupedDays = useMemo(() => {
    const map = new Map<string, { transactions: TransactionRecord[]; dayTotal: number }>()

    for (const tx of periodTransactions) {
      const dateKey = tx.transaction_time.slice(0, 10)
      if (!map.has(dateKey)) {
        map.set(dateKey, { transactions: [], dayTotal: 0 })
      }
      const entry = map.get(dateKey)!
      entry.transactions.push(tx)
      entry.dayTotal += tx.amount
    }

    // Sort days in descending order (latest day first)
    const sortedDays = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))

    // Sort transactions within each day in descending order
    for (const [, group] of sortedDays) {
      group.transactions.sort((a, b) => b.transaction_time.localeCompare(a.transaction_time))
    }

    return sortedDays
  }, [periodTransactions])

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

  const onEditSubmit = async (data: CategoryFormValues): Promise<void> => {
    setSaveError(null)
    try {
      if (!window.api?.updateCategory) {
        throw new Error(
          'Update category function is not loaded in this session. Please restart the dev server ("npm run dev") so Electron loads the new database handlers.'
        )
      }

      const categoryGroupId = parseInt(data.categoryGroupId, 10)
      if (isNaN(categoryGroupId)) {
        throw new Error('Please select a valid category type.')
      }

      await window.api.updateCategory(
        category.category_id,
        data.categoryName.trim(),
        categoryGroupId,
        data.categoryIcon,
        data.categoryColour
      )

      setIsEditModalOpen(false)
      if (onCategoryUpdated) {
        await onCategoryUpdated()
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update category')
    }
  }

  const handleDeleteCategory = async (): Promise<void> => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      if (!window.api?.deleteCategory) {
        throw new Error(
          'Delete category function is not loaded in this session. Please restart the dev server ("npm run dev") so Electron loads the new database handlers.'
        )
      }
      await window.api.deleteCategory(category.category_id)
      setIsDeleteModalOpen(false)
      if (onCategoryUpdated) {
        await onCategoryUpdated()
      }
      onBack()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="content-area category-detail-page relative flex flex-col gap-5">
      {/* Top Navigation & Category Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--theme-border-soft)] bg-[var(--theme-control-bg)] hover:bg-[var(--theme-control-hover)] text-[var(--theme-text-strong)] transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 shrink-0"
            title="Back to Categories"
          >
            <ArrowLeft size={18} />
          </button>

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
            style={{ backgroundColor: category.category_colour }}
          >
            <Icon icon={category.category_icon} size={24} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--theme-text-strong)] truncate">
                {category.category_name}
              </h2>
              {categoryType && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${isIncome
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    }`}
                >
                  {categoryType.category_name}
                </span>
              )}

              {/* Action Buttons: Edit and Delete */}
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--theme-text-muted)] hover:text-emerald-500 hover:bg-[var(--theme-control-hover)] transition-all cursor-pointer"
                  title="Edit category details"
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
                  title="Delete category"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--theme-text-muted)] mt-0.5">
              Category period summary &amp; day-wise transaction records
            </p>
          </div>
        </div>

        {/* Right side: Accounting Period badge */}
        <div className="flex items-center gap-3 self-start sm:self-center">
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
        </div>
      </div>

      {/* Day-Wise Transactions Section (View-only, no form opening) */}
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
          /* Empty State (Notice: No Add Transaction button) */
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--theme-border-soft)] rounded-2xl bg-[var(--theme-surface-soft)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-control-bg)] flex items-center justify-center text-[var(--theme-text-muted)] mb-3 shadow-inner">
              <ReceiptText size={24} />
            </div>
            <h4 className="text-sm font-bold text-[var(--theme-text-strong)]">
              No transactions for this cycle
            </h4>
            <p className="text-xs text-[var(--theme-text-muted)] max-w-sm mt-1">
              There are no transactions recorded for &ldquo;{category.category_name}&rdquo; in the period from{' '}
              {formatPeriodDateRange(startDate, endDate)}.
            </p>
          </div>
        ) : (
          /* Day Groups */
          <div className="flex flex-col gap-5">
            {groupedDays.map(([dateKey, group]) => {
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
                        Day Total:
                      </span>
                      <span
                        className={`font-bold ${isIncome ? 'text-emerald-500' : 'text-red-500'
                          }`}
                      >
                        {isIncome ? '+' : '-'} {symbol} {formatAmount(group.dayTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Day Transaction Items (View-only: No onClick passed to disable form opening) */}
                  <div className="flex flex-col gap-2 pl-1 sm:pl-2">
                    {group.transactions.map((tx) => (
                      <TransactionItem
                        key={tx.time_stamp}
                        transaction={tx}
                        categories={categories}
                        accounts={accounts}
                        currentCategoryId={category.category_id}
                        currencySymbol={currencySymbol}
                        currencyType={currencyType}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Shared CategoryFormModal in 'edit' mode */}
      <CategoryFormModal
        isOpen={isEditModalOpen}
        mode="edit"
        categoryTypes={categoryTypes}
        initialValues={{
          categoryName: category.category_name,
          categoryGroupId: category.category_group_id.toString(),
          categoryIcon: category.category_icon,
          categoryColour: category.category_colour
        }}
        saveError={saveError}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={onEditSubmit}
      />

      {/* Confirmation Modal for Category Deletion */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Category"
        itemLabel="Target Category"
        itemName={category.category_name}
        itemIcon={<Icon icon={category.category_icon} size={20} />}
        itemColor={category.category_colour}
        message="Are you sure you want to delete this category?"
        subMessage="Past transactions will remain in your transaction history under this category name. However, this category will be deactivated and will no longer appear on your Categories page or be available for new transactions."
        confirmLabel="Delete Category"
        cancelLabel="Cancel"
        isDestructive={true}
        isProcessing={isDeleting}
        error={deleteError}
        onClose={() => {
          if (!isDeleting) setIsDeleteModalOpen(false)
        }}
        onConfirm={handleDeleteCategory}
      />
    </section>
  )
}
