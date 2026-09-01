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
  Check,
  Trash2,
  Lock
} from 'lucide-react'
import { Icon } from './Icon'
import ConfirmModal from './ConfirmModal'
import {
  formatAmountWithCommas,
  unformatAmount,
  handleFormattedAmountInput
} from '../utils/currency'
import type { AccountRecord, CategoryRecord, TransactionRecord } from '../types'

export type TransactionType = 'Expense' | 'Income' | 'Transfer'

const TRANSACTION_TYPE_MAP: Record<TransactionType, number> = {
  Income: 1,
  Expense: 2,
  Transfer: 3
}

export interface TransactionFormData {
  timeStamp?: string
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
  initialTransaction?: TransactionRecord | null
  mode?: 'create' | 'edit'
  defaultAccountId?: number | string
  lockAccount?: boolean
  onSave?: (data: TransactionFormData) => void | Promise<void>
  onDelete?: (timeStamp: string) => void | Promise<void>
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
  disabled?: boolean
}

function AccountSelect({
  accounts,
  selectedId,
  onChange,
  currencySymbol,
  currencyType,
  placeholder = 'Select account',
  disabled = false
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
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] flex items-center justify-between gap-2.5 transition-all shadow-2xs ${
          disabled
            ? 'cursor-not-allowed opacity-90'
            : 'hover:border-emerald-500/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
        }`}
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
        {disabled ? (
          <Lock size={14} className="text-[var(--theme-text-muted)] shrink-0" />
        ) : (
          <ChevronDown
            size={16}
            className={`text-[var(--theme-text-muted)] shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-500' : ''
            }`}
          />
        )}
      </button>

      {isOpen && !disabled && (
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
  initialTransaction,
  mode = 'create',
  defaultAccountId,
  lockAccount = false,
  onSave,
  onDelete
}: TransactionDrawerProps): React.JSX.Element {
  const [txType, setTxType] = useState<TransactionType>('Expense')
  const [amount, setAmount] = useState<string>('')
  const [toAccountId, setToAccountId] = useState<string>(() =>
    defaultAccountId !== undefined && defaultAccountId !== null
      ? defaultAccountId.toString()
      : accounts.length > 0
        ? accounts[0].account_id.toString()
        : ''
  )
  const [fromAccountId, setFromAccountId] = useState<string>(() =>
    defaultAccountId !== undefined && defaultAccountId !== null
      ? defaultAccountId.toString()
      : accounts.length > 1
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

  // Date picker input ref to open calendar popup when clicking anywhere on the field
  const dateInputRef = useRef<HTMLInputElement>(null)

  const handleOpenDatePicker = (): void => {
    try {
      if (dateInputRef.current && 'showPicker' in dateInputRef.current) {
        dateInputRef.current.showPicker()
      }
    } catch {
      // Ignore if showPicker is unsupported or already open
    }
  }

  // Deletion state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Reset or pre-fill form values when drawer opens
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setFormError(null)
      setAmountTouched(false)
      setNoteTouched(false)
      setIsSubmitted(false)

      if (initialTransaction && mode === 'edit') {
        const initialType: TransactionType =
          initialTransaction.transaction_type_id === 1
            ? 'Income'
            : initialTransaction.transaction_type_id === 2
              ? 'Expense'
              : 'Transfer'
        setTxType(initialType)
        setAmount(formatAmountWithCommas(initialTransaction.amount.toFixed(2), false))
        setToAccountId(initialTransaction.to_account_id.toString())
        setFromAccountId(
          initialTransaction.from_account_id ? initialTransaction.from_account_id.toString() : ''
        )
        setCategoryId(
          initialTransaction.category_id ? initialTransaction.category_id.toString() : ''
        )
        setTxDate(initialTransaction.transaction_time)
        setFees(
          initialTransaction.fees !== undefined && initialTransaction.fees !== null
            ? formatAmountWithCommas(initialTransaction.fees.toFixed(2), false)
            : '0.00'
        )
        setNote(initialTransaction.note || '')
      } else {
        setAmount('')
        setFees('0.00')
        setNote('')
        setTxDate(getLocalDateTimeString())

        const targetAccId =
          defaultAccountId !== undefined && defaultAccountId !== null
            ? defaultAccountId.toString()
            : accounts.length > 0
              ? accounts[0].account_id.toString()
              : ''

        if (txType === 'Transfer') {
          setFromAccountId(targetAccId)
          const otherAcc = accounts.find((a) => a.account_id.toString() !== targetAccId)
          setToAccountId(otherAcc ? otherAcc.account_id.toString() : targetAccId)
        } else {
          setToAccountId(targetAccId)
          const otherAcc = accounts.find((a) => a.account_id.toString() !== targetAccId)
          setFromAccountId(otherAcc ? otherAcc.account_id.toString() : targetAccId)
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

  // Identify whether the current transaction being edited is a Balance Adjustment
  const isBalanceAdjustment = useMemo(() => {
    return (
      mode === 'edit' &&
      Boolean(
        initialTransaction?.note &&
          initialTransaction.note.trim().toLowerCase() === 'balance adjustment'
      )
    )
  }, [mode, initialTransaction])

  // Validation state for amount
  const isAmountInvalid = useMemo(() => {
    if (!amountTouched && !isSubmitted) return false
    const numeric = unformatAmount(amount)
    return !amount.trim() || numeric <= 0
  }, [amount, amountTouched, isSubmitted])

  // Validation state for note (required for standard transactions, omitted for Balance Adjustments)
  const isNoteInvalid = useMemo(() => {
    if (isBalanceAdjustment) return false
    if (!noteTouched && !isSubmitted) return false
    return note.trim() === ''
  }, [note, noteTouched, isSubmitted, isBalanceAdjustment])

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

    if (lockAccount && defaultAccountId !== undefined && defaultAccountId !== null) {
      const lockedId = defaultAccountId.toString()
      if (newType === 'Transfer') {
        setFromAccountId(lockedId)
        if (toAccountId === lockedId) {
          const otherAcc = accounts.find((a) => a.account_id.toString() !== lockedId)
          if (otherAcc) setToAccountId(otherAcc.account_id.toString())
        }
      } else {
        setToAccountId(lockedId)
      }
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    handleFormattedAmountInput(
      e,
      (val) => {
        setAmount(val)
        if (formError) setFormError(null)
      },
      false
    )
  }

  const handleFeesChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    handleFormattedAmountInput(e, (val) => setFees(val), false)
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    setIsSubmitted(true)
    setFormError(null)

    // Amount is mandatory and strictly positive for all 3 transaction types
    const numericAmount = unformatAmount(amount)
    if (!amount.trim() || numericAmount <= 0) {
      setFormError('Amount is required and must be a positive number greater than 0.00.')
      return
    }

    // Note is mandatory for standard transactions (omitted for Balance Adjustment)
    const trimmedNote = note.trim()
    if (!isBalanceAdjustment && !trimmedNote) {
      setFormError('Note / Description is required.')
      return
    }

    if (txType === 'Transfer' && toAccountId && fromAccountId && toAccountId === fromAccountId) {
      setFormError('Transfer requires different source and destination accounts.')
      return
    }

    const numericFees = unformatAmount(fees)
    const toAcc = parseInt(toAccountId, 10)
    const fromAcc = txType === 'Transfer' ? parseInt(fromAccountId, 10) : undefined
    const catId = txType !== 'Transfer' && !isBalanceAdjustment && categoryId ? parseInt(categoryId, 10) : undefined
    const transactionTypeId = TRANSACTION_TYPE_MAP[txType]

    if (onSave) {
      onSave({
        timeStamp: initialTransaction?.time_stamp,
        transactionTypeId,
        transactionType: txType,
        amount: parseFloat(numericAmount.toFixed(2)),
        toAccountId: toAcc,
        fromAccountId: fromAcc ?? null,
        categoryId: catId ?? null,
        transactionTime: txDate,
        fees: parseFloat(numericFees.toFixed(2)),
        note: isBalanceAdjustment ? (initialTransaction?.note || 'Balance Adjustment') : trimmedNote
      })
    }

    onClose()
  }

  const isEditMode = mode === 'edit' && Boolean(initialTransaction)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-[var(--color-background-soft)] border-l border-[var(--theme-border-soft)] shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--theme-border-soft)] bg-[var(--color-background-mute)]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl text-white shadow-xs ${
                txType === 'Expense'
                  ? 'bg-red-500'
                  : txType === 'Income'
                    ? 'bg-emerald-600'
                    : 'bg-blue-600'
              }`}
            >
              {txType === 'Expense' && <TrendingDown size={20} />}
              {txType === 'Income' && <TrendingUp size={20} />}
              {txType === 'Transfer' && <ArrowRightLeft size={20} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--theme-text-strong)]">
                {isBalanceAdjustment
                  ? 'Edit Balance Adjustment'
                  : isEditMode
                    ? 'Edit Transaction'
                    : 'New Transaction'}
              </h3>
              <p className="text-xs text-[var(--theme-text-muted)]">
                {isBalanceAdjustment
                  ? 'Update balance adjustment amount and date/time'
                  : isEditMode
                    ? 'Update transaction details and date/time'
                    : 'Record an expense, income, or account transfer'}
              </p>
            </div>
          </div>

          {/* Top Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--theme-text-muted)] hover:bg-[var(--theme-control-hover)] hover:text-[var(--theme-text-strong)] transition-colors cursor-pointer"
            title="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5.5 custom-scrollbar">

            {/* Transaction Type Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                Transaction Type
              </label>
              {isEditMode ? (
                <div className="p-1 rounded-xl bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)]">
                  <div
                    className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg ${
                      txType === 'Expense'
                        ? 'bg-red-500 text-white shadow-xs'
                        : txType === 'Income'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-blue-600 text-white shadow-xs'
                    }`}
                  >
                    {txType === 'Expense' && <TrendingDown size={14} />}
                    {txType === 'Income' && <TrendingUp size={14} />}
                    {txType === 'Transfer' && <ArrowRightLeft size={14} />}
                    <span>{txType}</span>
                  </div>
                </div>
              ) : (
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
              )}
            </div>

            {/* Amount Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center gap-1">
                <span>Amount</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <div
                className={`flex items-stretch rounded-xl border overflow-hidden transition-all ${isAmountInvalid
                    ? 'border-red-500 ring-1 ring-red-500/50 bg-red-500/5'
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
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  autoComplete="off"
                  value={amount}
                  onChange={handleAmountChange}
                  onBlur={() => {
                    setAmountTouched(true)
                    if (amount) {
                      const num = unformatAmount(amount)
                      if (num > 0) {
                        setAmount(formatAmountWithCommas(num.toFixed(2), false))
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault()
                    }
                  }}
                  required
                  className="flex-1 px-3.5 py-2.5 text-sm bg-transparent border-0 text-[var(--theme-text-strong)] focus:outline-none font-mono"
                />
              </div>
              {isAmountInvalid && (
                <span className="text-[11px] text-red-400 font-medium pl-1">
                  Amount is required and must be greater than 0.
                </span>
              )}
            </div>

            {/* Transfer Fees Input */}
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
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    value={fees}
                    onChange={handleFeesChange}
                    onBlur={() => {
                      if (!fees || fees === '.') {
                        setFees('0.00')
                      } else {
                        const num = unformatAmount(fees)
                        setFees(formatAmountWithCommas(num.toFixed(2), false))
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 text-sm bg-transparent border-0 text-[var(--theme-text-strong)] focus:outline-none font-mono"
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
                    disabled={lockAccount}
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
                  disabled={lockAccount}
                />
              </div>
            )}

            {/* Category Selector (for Expense and Income, hidden for Transfers and Balance Adjustments) */}
            {txType !== 'Transfer' && !isBalanceAdjustment && (
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
              <div
                onClick={handleOpenDatePicker}
                className="relative flex items-center w-full bg-[var(--theme-control-bg)] hover:bg-[var(--theme-control-hover)] border border-[var(--theme-border-soft)] hover:border-emerald-500/40 focus-within:border-emerald-500/50 rounded-xl transition-all cursor-pointer shadow-2xs group"
              >
                <input
                  ref={dateInputRef}
                  type="datetime-local"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  onClick={handleOpenDatePicker}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-transparent border-0 text-[var(--theme-text-strong)] focus:outline-none cursor-pointer font-mono"
                />
              </div>
            </div>

            {/* Note / Description (hidden for Balance Adjustments) */}
            {!isBalanceAdjustment && (
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
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl text-[var(--theme-text-strong)] focus:outline-none transition-all resize-none ${
                    isNoteInvalid
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
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[var(--theme-border-soft)] bg-[var(--color-background-mute)] shrink-0">
            {isEditMode && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null)
                  setIsDeleteConfirmOpen(true)
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer shadow-2xs"
                title="Delete transaction"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
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
                {isEditMode ? <Check size={16} /> : <Plus size={16} />}
                <span>{isEditMode ? 'Update Transaction' : 'Save Transaction'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Transaction Deletion */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Transaction"
        itemName={`${txType} • ${currencySymbol} ${amount || '0.00'}`}
        message="Are you sure you want to delete this transaction?"
        subMessage="This transaction will be permanently removed and your account totals and balances will be recalculated."
        confirmLabel="Delete Transaction"
        cancelLabel="Cancel"
        isDestructive={true}
        isProcessing={isDeleting}
        error={deleteError}
        onClose={() => {
          if (!isDeleting) setIsDeleteConfirmOpen(false)
        }}
        onConfirm={async () => {
          if (!initialTransaction?.time_stamp || !onDelete) return
          setIsDeleting(true)
          setDeleteError(null)
          try {
            await onDelete(initialTransaction.time_stamp)
            setIsDeleteConfirmOpen(false)
            onClose()
          } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete transaction')
          } finally {
            setIsDeleting(false)
          }
        }}
      />
    </>
  )
}

