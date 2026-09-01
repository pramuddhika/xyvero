/* eslint-disable prettier/prettier */
import React from 'react'
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Clock } from 'lucide-react'
import { Icon } from './Icon'
import { formatTransactionTime } from '../utils/date'
import type { TransactionRecord, CategoryRecord, AccountRecord } from '../types'

interface TransactionItemProps {
  transaction: TransactionRecord
  categories: CategoryRecord[]
  accounts: AccountRecord[]
  currentAccountId?: number
  currencySymbol?: string
  currencyType?: string
  onClick?: () => void
}

export default function TransactionItem({
  transaction,
  categories,
  accounts,
  currentAccountId,
  currencySymbol = '$',
  currencyType = 'USD',
  onClick
}: TransactionItemProps): React.JSX.Element {
  const { transaction_type_id, to_account_id, from_account_id, category_id, amount, fees, note, transaction_time } =
    transaction

  const symbol = currencySymbol || currencyType

  // Determine transaction role for this account:
  // 1 = Income (inflow)
  // 2 = Expense (outflow)
  // 3 = Transfer:
  //     if to_account_id === currentAccountId -> Transfer In (+amount)
  //     if from_account_id === currentAccountId -> Transfer Out (-(amount + fees))
  const isIncome = transaction_type_id === 1
  const isExpense = transaction_type_id === 2
  const isTransfer = transaction_type_id === 3

  const isTransferIn = isTransfer && currentAccountId !== undefined && to_account_id === currentAccountId
  const isTransferOut = isTransfer && currentAccountId !== undefined && from_account_id === currentAccountId

  const category = category_id ? categories.find((c) => c.category_id === category_id) : undefined
  const toAccount = accounts.find((a) => a.account_id === to_account_id)
  const fromAccount = from_account_id ? accounts.find((a) => a.account_id === from_account_id) : undefined

  // Amount and sign calculation
  let displayAmount = amount
  let isPositive = false
  let typeLabel = 'Transaction'
  let typeBadgeClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20'

  if (isIncome) {
    displayAmount = amount
    isPositive = true
    typeLabel = 'Income'
    typeBadgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400'
  } else if (isExpense) {
    displayAmount = amount
    isPositive = false
    typeLabel = 'Expense'
    typeBadgeClass = 'bg-red-500/10 text-red-500 border-red-500/20 dark:text-red-400'
  } else if (isTransferIn) {
    displayAmount = amount
    isPositive = true
    typeLabel = 'Transfer In'
    typeBadgeClass = 'bg-blue-500/10 text-blue-500 border-blue-500/20 dark:text-blue-400'
  } else if (isTransferOut) {
    displayAmount = amount + (fees || 0)
    isPositive = false
    typeLabel = 'Transfer Out'
    typeBadgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:text-amber-400'
  } else if (isTransfer) {
    // General transfer display
    displayAmount = amount
    isPositive = false
    typeLabel = 'Transfer'
    typeBadgeClass = 'bg-purple-500/10 text-purple-500 border-purple-500/20 dark:text-purple-400'
  }

  const formatValue = (val: number): string => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Subtitle / Counter-party or Category description
  let detailLabel = category?.category_name || 'Uncategorized'
  if (isTransfer) {
    if (isTransferIn && fromAccount) {
      detailLabel = `From ${fromAccount.account_name}`
    } else if (isTransferOut && toAccount) {
      detailLabel = `To ${toAccount.account_name}${fees && fees > 0 ? ` (incl. ${symbol} ${formatValue(fees)} fee)` : ''}`
    } else if (fromAccount && toAccount) {
      detailLabel = `${fromAccount.account_name} ➔ ${toAccount.account_name}`
    }
  }

  // Icon & Background styling
  const iconBg = category?.category_colour || (isTransfer ? '#8b5cf6' : '#64748b')
  const iconName = category?.category_icon || (isTransfer ? 'layers' : 'circle')

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] hover:border-emerald-500/40 hover:shadow-sm transition-all duration-150 group ${
        onClick ? 'cursor-pointer hover:scale-[1.008] active:scale-[0.992]' : ''
      }`}
      title={onClick ? 'Click to edit transaction' : undefined}
    >
      {/* Icon Badge */}
      <div
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs transition-transform group-hover:scale-105"
        style={{ backgroundColor: iconBg }}
      >
        {isTransfer ? (
          isTransferIn ? (
            <ArrowDownLeft size={20} className="text-white" />
          ) : isTransferOut ? (
            <ArrowUpRight size={20} className="text-white" />
          ) : (
            <ArrowRightLeft size={20} className="text-white" />
          )
        ) : (
          <Icon icon={iconName} size={20} />
        )}
      </div>

      {/* Note & Detail subtitle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-xs sm:text-sm text-[var(--theme-text-strong)] truncate">
            {note || 'Transaction'}
          </h4>
          <span
            className={`hidden xs:inline-flex text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ${typeBadgeClass}`}
          >
            {typeLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-[11px] sm:text-xs text-[var(--theme-text-muted)]">
          <span className="truncate max-w-[150px] sm:max-w-[240px] font-medium">{detailLabel}</span>
          <span>•</span>
          <span className="flex items-center gap-1 shrink-0 font-medium">
            <Clock size={12} className="opacity-70" />
            {formatTransactionTime(transaction_time)}
          </span>
        </div>
      </div>

      {/* Amount with semantic color */}
      <div className="text-right shrink-0">
        <span
          className={`font-mono text-xs sm:text-sm font-bold block ${
            isPositive
              ? 'text-emerald-500 dark:text-emerald-400'
              : 'text-red-500 dark:text-red-400'
          }`}
        >
          {isPositive ? '+' : '-'} {symbol} {formatValue(displayAmount)}
        </span>
        {Boolean(fees && fees > 0 && isTransferOut) && (
          <span className="text-[10px] text-[var(--theme-text-muted)] font-mono block">
            Fee: {symbol} {formatValue(fees || 0)}
          </span>
        )}
      </div>
    </div>
  )
}
