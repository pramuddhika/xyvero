/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  X,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Wallet,
  Layers,
  FileText
} from 'lucide-react'
import type { AccountRecord, CategoryRecord } from '../types'

export type TransactionType = 'Expense' | 'Income' | 'Transfer'

export interface TransactionFormData {
  transactionType: TransactionType
  amount: number
  toAccountId: number
  fromAccountId?: number
  categoryId?: number
  transactionTime: string
  fees?: number
  note?: string
}

interface TransactionDrawerProps {
  isOpen: boolean
  onClose: () => void
  accounts: AccountRecord[]
  categories: CategoryRecord[]
  currencySymbol: string
  currencyType: string
  onSave?: (data: TransactionFormData) => void | Promise<void>
}

export default function TransactionDrawer({
  isOpen,
  onClose,
  accounts,
  categories,
  currencySymbol,
  currencyType,
  onSave
}: TransactionDrawerProps): React.JSX.Element {
  const [txType, setTxType] = useState<TransactionType>('Expense')
  const [amount, setAmount] = useState<string>('')
  const [toAccountId, setToAccountId] = useState<string>('')
  const [fromAccountId, setFromAccountId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().slice(0, 16))
  const [fees, setFees] = useState<string>('0.00')
  const [note, setNote] = useState<string>('')

  // Reset or initialize default values when drawer opens
  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setFees('0.00')
      setNote('')
      setTxDate(new Date().toISOString().slice(0, 16))

      if (accounts.length > 0) {
        setToAccountId(accounts[0].account_id.toString())
        setFromAccountId(
          accounts.length > 1 ? accounts[1].account_id.toString() : accounts[0].account_id.toString()
        )
      }

      const defaultCat = categories.find((c) =>
        txType === 'Income' ? c.category_group_id === 1 : c.category_group_id === 2
      )
      if (defaultCat) {
        setCategoryId(defaultCat.category_id.toString())
      } else if (categories.length > 0) {
        setCategoryId(categories[0].category_id.toString())
      }
    }
  }, [isOpen, accounts, categories, txType])

  // Filter categories according to active transaction type
  const availableCategories = useMemo(() => {
    if (txType === 'Income') {
      return categories.filter((c) => c.category_group_id === 1)
    }
    if (txType === 'Expense') {
      return categories.filter((c) => c.category_group_id === 2)
    }
    return categories
  }, [categories, txType])

  // Automatically select the first valid category when transaction type changes
  const handleTypeChange = (newType: TransactionType): void => {
    setTxType(newType)
    const firstCat = categories.find((c) =>
      newType === 'Income' ? c.category_group_id === 1 : c.category_group_id === 2
    )
    if (firstCat) {
      setCategoryId(firstCat.category_id.toString())
    }
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) return

    const numericFees = parseFloat(fees) || 0
    const toAcc = parseInt(toAccountId, 10)
    const fromAcc = txType === 'Transfer' ? parseInt(fromAccountId, 10) : undefined
    const catId = txType !== 'Transfer' ? parseInt(categoryId, 10) : undefined

    if (onSave) {
      onSave({
        transactionType: txType,
        amount: parseFloat(numericAmount.toFixed(2)),
        toAccountId: toAcc,
        fromAccountId: fromAcc,
        categoryId: catId,
        transactionTime: txDate,
        fees: parseFloat(numericFees.toFixed(2)),
        note: note.trim() || undefined
      })
    }

    onClose()
  }

  return (
    <>
      {/* Background Blur Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Right Side Slide-Over Drawer (Top to Bottom Column) */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md sm:max-w-lg flex-col bg-[var(--color-background-soft)] border-l border-[var(--theme-border-soft)] shadow-[-10px_0_30px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-drawer-title"
      >
        {/* Drawer Header with Top Close Button */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--theme-border-soft)] bg-[var(--color-background-mute)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 shadow-inner">
              <Plus size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3
                id="transaction-drawer-title"
                className="text-base font-bold text-[var(--theme-text-strong)]"
              >
                New Transaction
              </h3>
              <p className="text-xs text-[var(--theme-text-muted)]">
                Record an expense, income, or account transfer
              </p>
            </div>
          </div>

          {/* Top Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--theme-text-muted)] hover:bg-[var(--theme-control-hover)] hover:text-[var(--theme-text-strong)] transition-colors cursor-pointer"
            title="Close drawer"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body (Top to Bottom Scrollable Form Content) */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5.5 custom-scrollbar">
            {/* Transaction Type Selector (Expense / Income / Transfer) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                Transaction Type
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)]">
                <button
                  type="button"
                  onClick={() => handleTypeChange('Expense')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    txType === 'Expense'
                      ? 'bg-red-500 text-white shadow-xs'
                      : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-strong)]'
                  }`}
                >
                  <TrendingDown size={14} />
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('Income')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    txType === 'Income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-strong)]'
                  }`}
                >
                  <TrendingUp size={14} />
                  <span>Income</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('Transfer')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    txType === 'Transfer'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-strong)]'
                  }`}
                >
                  <ArrowRightLeft size={14} />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                Amount
              </label>
              <div className="flex items-stretch rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-control-bg)] overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                <span className="px-3.5 py-2.5 bg-[var(--theme-surface-strong)] text-sm font-semibold border-r border-[var(--theme-border-soft)] text-[var(--theme-text-muted)] min-w-[54px] flex items-center justify-center font-mono">
                  {currencySymbol || currencyType}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="flex-1 px-3.5 py-2.5 text-sm bg-transparent border-0 text-[var(--theme-text-strong)] focus:outline-none font-mono no-spinners"
                />
              </div>
            </div>

            {/* Account Selectors */}
            {txType === 'Transfer' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1.5">
                    <Wallet size={13} className="text-blue-500" />
                    <span>From Account</span>
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 cursor-pointer transition-colors"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.account_id} value={acc.account_id.toString()}>
                        {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1.5">
                    <Wallet size={13} className="text-emerald-500" />
                    <span>To Account</span>
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 cursor-pointer transition-colors"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.account_id} value={acc.account_id.toString()}>
                        {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1.5">
                  <Wallet size={13} className="text-emerald-500" />
                  <span>Account</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 cursor-pointer transition-colors"
                >
                  {accounts.map((acc) => (
                    <option key={acc.account_id} value={acc.account_id.toString()}>
                      {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Selector (for Expense and Income) */}
            {txType !== 'Transfer' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1.5">
                  <Layers size={13} className="text-purple-500" />
                  <span>Category</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 cursor-pointer transition-colors"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id.toString()}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date & Time Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1.5">
                <CalendarIcon size={13} className="text-blue-500" />
                <span>Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            {/* Transfer Fees (Optional) */}
            {txType === 'Transfer' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                  Transfer Fees (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                />
              </div>
            )}

            {/* Note / Description */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1.5">
                <FileText size={13} className="text-amber-500" />
                <span>Note / Description</span>
              </label>
              <textarea
                rows={3}
                placeholder="Optional details, reference number, or note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--theme-border-soft)] bg-[var(--color-background-mute)] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl text-[var(--theme-text-strong)] hover:bg-[var(--theme-control-hover)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} />
              <span>Save Transaction</span>
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}
