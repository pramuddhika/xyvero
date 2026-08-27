/* eslint-disable prettier/prettier */
import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus,
  X,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Wallet,
  Layers,
  FileText,
  ChevronDown,
  Check
} from 'lucide-react'
import { Icon } from './Icon'
import type { AccountRecord, CategoryRecord } from '../types'

export type TransactionType = 'Expense' | 'Income' | 'Transfer'

const TRANSACTION_TYPE_MAP: Record<TransactionType, number> = {
  Income: 1,
  Expense: 2,
  Transfer: 3
}

export interface TransactionFormData {
  transactionTypeId: number
  transactionType: TransactionType
  amount: number
  toAccountId: number
  fromAccountId?: number | null
  categoryId?: number | null
  transactionTime: string
  fees?: number
  note: string
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

/**
 * Custom styled Account Dropdown with Account Icon and Color Badge
 */
interface AccountSelectProps {
  accounts: AccountRecord[]
  selectedId: string
  onChange: (id: string) => void
  currencySymbol: string
  currencyType: string
  placeholder?: string
}

function AccountSelect({
  accounts,
  selectedId,
  onChange,
  currencySymbol,
  currencyType,
  placeholder = 'Select account'
}: AccountSelectProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.account_id.toString() === selectedId)
  }, [accounts, selectedId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] hover:border-emerald-500/40 rounded-xl text-[var(--theme-text-strong)] flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedAccount ? (
            <>
              <div
                className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                style={{ backgroundColor: selectedAccount.account_color }}
              >
                <Icon icon={selectedAccount.account_icon} size={15} />
              </div>
              <span className="font-semibold truncate text-[var(--theme-text-strong)] text-sm">
                {selectedAccount.account_name}
              </span>
              <span className="text-xs text-[var(--theme-text-muted)] font-mono font-medium ml-auto pr-1 truncate shrink-0">
                {currencySymbol || currencyType}{' '}
                {selectedAccount.account_amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </>
          ) : (
            <span className="text-[var(--theme-text-muted)]">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-[var(--theme-text-muted)] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-500' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 p-1.5 bg-[var(--color-background-soft)] border border-[var(--theme-border-soft)] rounded-xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-1">
          {accounts.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--theme-text-muted)] text-center">
              No accounts available
            </div>
          ) : (
            accounts.map((acc) => {
              const isSelected = acc.account_id.toString() === selectedId
              return (
                <button
                  key={acc.account_id}
                  type="button"
                  onClick={() => {
                    onChange(acc.account_id.toString())
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 text-[var(--theme-text-strong)] font-semibold'
                      : 'hover:bg-[var(--theme-control-hover)] text-[var(--theme-text-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: acc.account_color }}
                    >
                      <Icon icon={acc.account_icon} size={15} />
                    </div>
                    <span className="text-sm font-medium truncate flex-1">{acc.account_name}</span>
                    <span className="text-xs text-[var(--theme-text-muted)] font-mono font-medium truncate shrink-0">
                      {currencySymbol || currencyType}{' '}
                      {acc.account_amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  {isSelected && <Check size={16} className="text-emerald-500 shrink-0 ml-1.5" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Custom styled Category Dropdown with Category Icon and Color Badge
 */
interface CategorySelectProps {
  categories: CategoryRecord[]
  selectedId: string
  onChange: (id: string) => void
  placeholder?: string
}

function CategorySelect({
  categories,
  selectedId,
  onChange,
  placeholder = 'Select category'
}: CategorySelectProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.category_id.toString() === selectedId)
  }, [categories, selectedId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] hover:border-emerald-500/40 rounded-xl text-[var(--theme-text-strong)] flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedCategory ? (
            <>
              <div
                className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                style={{ backgroundColor: selectedCategory.category_colour }}
              >
                <Icon icon={selectedCategory.category_icon} size={15} />
              </div>
              <span className="font-semibold truncate text-[var(--theme-text-strong)] text-sm">
                {selectedCategory.category_name}
              </span>
            </>
          ) : (
            <span className="text-[var(--theme-text-muted)]">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-[var(--theme-text-muted)] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-500' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 p-1.5 bg-[var(--color-background-soft)] border border-[var(--theme-border-soft)] rounded-xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-1">
          {categories.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--theme-text-muted)] text-center">
              No categories available
            </div>
          ) : (
            categories.map((cat) => {
              const isSelected = cat.category_id.toString() === selectedId
              return (
                <button
                  key={cat.category_id}
                  type="button"
                  onClick={() => {
                    onChange(cat.category_id.toString())
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 text-[var(--theme-text-strong)] font-semibold'
                      : 'hover:bg-[var(--theme-control-hover)] text-[var(--theme-text-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat.category_colour }}
                    >
                      <Icon icon={cat.category_icon} size={15} />
                    </div>
                    <span className="text-sm font-medium truncate flex-1">{cat.category_name}</span>
                  </div>
                  {isSelected && <Check size={16} className="text-emerald-500 shrink-0 ml-1.5" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Returns formatted YYYY-MM-DDTHH:mm string based on current local time.
 */
function getLocalDateTimeString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
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
  const [toAccountId, setToAccountId] = useState<string>(() =>
    accounts.length > 0 ? accounts[0].account_id.toString() : ''
  )
  const [fromAccountId, setFromAccountId] = useState<string>(() =>
    accounts.length > 1
      ? accounts[1].account_id.toString()
      : accounts.length > 0
        ? accounts[0].account_id.toString()
        : ''
  )
  const [categoryId, setCategoryId] = useState<string>(() => {
    const defaultCat = categories.find((c) => c.category_group_id === 2)
    return defaultCat ? defaultCat.category_id.toString() : categories[0]?.category_id.toString() || ''
  })
  const [txDate, setTxDate] = useState<string>(() => getLocalDateTimeString())
  const [fees, setFees] = useState<string>('0.00')
  const [note, setNote] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)
  const [amountTouched, setAmountTouched] = useState<boolean>(false)
  const [noteTouched, setNoteTouched] = useState<boolean>(false)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen)

  // Reset form values when drawer opens
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setAmount('')
      setFees('0.00')
      setNote('')
      setFormError(null)
      setAmountTouched(false)
      setNoteTouched(false)
      setIsSubmitted(false)
      setTxDate(getLocalDateTimeString())

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
  }

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

  // Validation state for amount
  const isAmountInvalid = useMemo(() => {
    if (!amountTouched && !isSubmitted) return false
    const trimmed = amount.trim()
    const numeric = parseFloat(trimmed)
    return trimmed === '' || isNaN(numeric) || numeric <= 0
  }, [amount, amountTouched, isSubmitted])

  // Validation state for note (required for all transaction types)
  const isNoteInvalid = useMemo(() => {
    if (!noteTouched && !isSubmitted) return false
    return note.trim() === ''
  }, [note, noteTouched, isSubmitted])

  // Automatically select the first valid category when transaction type changes
  const handleTypeChange = (newType: TransactionType): void => {
    setTxType(newType)
    setFormError(null)
    const firstCat = categories.find((c) =>
      newType === 'Income' ? c.category_group_id === 1 : c.category_group_id === 2
    )
    if (firstCat) {
      setCategoryId(firstCat.category_id.toString())
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // Only permit non-negative numbers and decimal dots
    const sanitized = e.target.value.replace(/[-+eE]/g, '')
    setAmount(sanitized)
    if (formError) setFormError(null)
  }

  const handleFeesChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // Only permit non-negative numbers and decimal dots
    const sanitized = e.target.value.replace(/[-+eE]/g, '')
    setFees(sanitized)
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    setIsSubmitted(true)
    setFormError(null)

    // Amount is mandatory and strictly positive for all 3 transaction types
    const trimmedAmount = amount.trim()
    const numericAmount = parseFloat(trimmedAmount)
    if (!trimmedAmount || isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Amount is required and must be a positive number greater than 0.00.')
      return
    }

    // Note is mandatory for all transaction types
    const trimmedNote = note.trim()
    if (!trimmedNote) {
      setFormError('Note / Description is required.')
      return
    }

    if (txType === 'Transfer' && toAccountId && fromAccountId && toAccountId === fromAccountId) {
      setFormError('Transfer requires different source and destination accounts.')
      return
    }

    const numericFees = parseFloat(fees) || 0
    const toAcc = parseInt(toAccountId, 10)
    const fromAcc = txType === 'Transfer' ? parseInt(fromAccountId, 10) : undefined
    const catId = txType !== 'Transfer' ? parseInt(categoryId, 10) : undefined
    const transactionTypeId = TRANSACTION_TYPE_MAP[txType]

    if (onSave) {
      onSave({
        transactionTypeId,
        transactionType: txType,
        amount: parseFloat(numericAmount.toFixed(2)),
        toAccountId: toAcc,
        fromAccountId: fromAcc ?? null,
        categoryId: catId ?? null,
        transactionTime: txDate,
        fees: parseFloat(numericFees.toFixed(2)),
        note: trimmedNote
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
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md sm:max-w-lg flex-col bg-[var(--color-background-soft)] border-l border-[var(--theme-border-soft)] shadow-[-10px_0_30px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
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
        <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
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
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${txType === 'Expense'
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
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${txType === 'Income'
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
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${txType === 'Transfer'
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1">
                <span>Amount</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <div
                className={`flex items-stretch rounded-xl border overflow-hidden transition-all ${isAmountInvalid
                    ? 'border-red-500 ring-1 ring-red-500/50 bg-red-500/5 focus-within:border-red-500'
                    : 'border-[var(--theme-border-soft)] bg-[var(--theme-control-bg)] focus-within:border-emerald-500/50'
                  }`}
              >
                <span
                  className={`px-3.5 py-2.5 text-sm font-semibold border-r text-[var(--theme-text-muted)] min-w-[54px] flex items-center justify-center font-mono select-none ${isAmountInvalid
                      ? 'bg-red-500/10 border-red-500/40 text-red-400'
                      : 'bg-[var(--theme-surface-strong)] border-[var(--theme-border-soft)]'
                    }`}
                >
                  {currencySymbol || currencyType}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  onBlur={() => setAmountTouched(true)}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault()
                    }
                  }}
                  required
                  className="flex-1 px-3.5 py-2.5 text-sm bg-transparent border-0 text-[var(--theme-text-strong)] focus:outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {isAmountInvalid && (
                <span className="text-[11px] text-red-400 font-medium pl-1">
                  Amount is required and must be greater than 0.
                </span>
              )}
            </div>

            {/* Transfer Fees Input (Row 2 for Transfer) */}
            {txType === 'Transfer' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                  Fees (Optional)
                </label>
                <div className="flex items-stretch rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-control-bg)] overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                  <span className="px-3.5 py-2.5 bg-[var(--theme-surface-strong)] text-sm font-semibold border-r border-[var(--theme-border-soft)] text-[var(--theme-text-muted)] min-w-[54px] flex items-center justify-center font-mono select-none">
                    {currencySymbol || currencyType}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={fees}
                    onChange={handleFeesChange}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 text-sm bg-transparent border-0 text-[var(--theme-text-strong)] focus:outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            )}

            {/* Account Selectors */}
            {txType === 'Transfer' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1.5">
                    <Wallet size={13} className="text-blue-500" />
                    <span>From Account</span>
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    selectedId={fromAccountId}
                    onChange={setFromAccountId}
                    currencySymbol={currencySymbol}
                    currencyType={currencyType}
                    placeholder="Select source account"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1.5">
                    <Wallet size={13} className="text-emerald-500" />
                    <span>To Account</span>
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    selectedId={toAccountId}
                    onChange={setToAccountId}
                    currencySymbol={currencySymbol}
                    currencyType={currencyType}
                    placeholder="Select target account"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1.5">
                  <Wallet size={13} className="text-emerald-500" />
                  <span>Account</span>
                </label>
                <AccountSelect
                  accounts={accounts}
                  selectedId={toAccountId}
                  onChange={setToAccountId}
                  currencySymbol={currencySymbol}
                  currencyType={currencyType}
                  placeholder="Select account"
                />
              </div>
            )}

            {/* Category Selector (for Expense and Income) */}
            {txType !== 'Transfer' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1.5">
                  <Layers size={13} className="text-purple-500" />
                  <span>Category</span>
                </label>
                <CategorySelect
                  categories={availableCategories}
                  selectedId={categoryId}
                  onChange={setCategoryId}
                  placeholder="Select category"
                />
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

            {/* Note / Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1">
                <FileText size={13} className="text-amber-500" />
                <span>Note / Description</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter transaction note or description..."
                value={note}
                onChange={(e) => {
                  setNote(e.target.value)
                  if (formError) setFormError(null)
                }}
                onBlur={() => setNoteTouched(true)}
                maxLength={200}
                required
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl text-[var(--theme-text-strong)] focus:outline-none transition-all resize-none ${isNoteInvalid
                    ? 'border border-red-500 ring-1 ring-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)] focus:border-emerald-500/50'
                  }`}
              />
              {isNoteInvalid && (
                <span className="text-[11px] text-red-400 font-medium pl-1">
                  Note is required.
                </span>
              )}
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

