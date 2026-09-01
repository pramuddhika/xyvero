/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Plus, Search, TrendingUp, TrendingDown, Wallet, X } from 'lucide-react'
import { Icon } from '../components/Icon'
import { getCurrencySymbol, unformatAmount } from '../utils/currency'
import AccountDetail from '../components/AccountDetail'
import AccountFormModal, { AccountFormValues } from '../components/AccountFormModal'
import type { AccountTypeRecord, AccountRecord, CategoryRecord } from '../types'

function Accounts(): React.JSX.Element {
  const [accounts, setAccounts] = useState<AccountRecord[]>([])
  const [accountTypes, setAccountTypes] = useState<AccountTypeRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [currencyType, setCurrencyType] = useState<string>('USD')
  const [monthStartDay, setMonthStartDay] = useState<number>(1)
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const currencySymbol = useMemo(() => getCurrencySymbol(currencyType), [currencyType])

  // Aggregate totals for Assets (> 0), Liabilities (< 0), and Net Total
  const { assetsTotal, liabilitiesTotal, netTotal, assetsCount, liabilitiesCount } = useMemo(() => {
    let assets = 0
    let liabilities = 0
    let aCount = 0
    let lCount = 0

    for (const acc of accounts) {
      if (acc.account_amount > 0) {
        assets += acc.account_amount
        aCount++
      } else if (acc.account_amount < 0) {
        liabilities += Math.abs(acc.account_amount)
        lCount++
      }
    }

    return {
      assetsTotal: assets,
      liabilitiesTotal: liabilities,
      netTotal: assets - liabilities,
      assetsCount: aCount,
      liabilitiesCount: lCount
    }
  }, [accounts])

  const formatAmount = (val: number): string => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const fetchData = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      if (window.api) {
        const [accs, types, configVal, cats, monthStartVal] = await Promise.all([
          window.api.listAccounts ? window.api.listAccounts() : [],
          window.api.listAccountTypes ? window.api.listAccountTypes() : [],
          window.api.getConfigurationValue ? window.api.getConfigurationValue('CURRENCY_TYPE') : undefined,
          window.api.listCategories ? window.api.listCategories() : [],
          window.api.getConfigurationValue ? window.api.getConfigurationValue('MONTH_START_DATE') : undefined
        ])

        setAccounts(accs || [])
        setAccountTypes(types || [])
        setCategories(cats || [])
        if (configVal?.configuration_value) {
          setCurrencyType(configVal.configuration_value)
        }
        if (monthStartVal?.configuration_value) {
          const parsed = parseInt(monthStartVal.configuration_value, 10)
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
            setMonthStartDay(parsed)
          }
        }
      }
    } catch (err) {
      console.error('Failed to load account data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleOpenModal = (): void => {
    setSaveError(null)
    setIsModalOpen(true)
  }

  const onSubmit = async (data: AccountFormValues): Promise<void> => {
    setSaveError(null)
    try {
      if (!window.api?.addAccount) {
        throw new Error(
          'Database save function is not available. Please restart the dev server ("npm run dev") so Electron loads the new database handlers.'
        )
      }

      const accountTypeId = parseInt(data.accountTypeId, 10)
      if (isNaN(accountTypeId)) {
        throw new Error('Please select a valid account type.')
      }

      const initialAmount = unformatAmount(data.accountAmount)

      const newAccountId = await window.api.addAccount(
        data.accountName.trim(),
        accountTypeId,
        data.accountIcon,
        data.accountColor
      )

      // If an initial opening balance is provided (!== 0), record an Income or Expense transaction
      if (initialAmount !== 0 && !isNaN(initialAmount) && window.api?.addTransaction) {
        const now = new Date()
        const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`)
        const txTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`

        if (initialAmount > 0) {
          await window.api.addTransaction(
            txTime,
            1, // Income
            newAccountId,
            null,
            null,
            initialAmount,
            0,
            'Account Opening'
          )
        } else {
          await window.api.addTransaction(
            txTime,
            2, // Expense (for liabilities / negative balance)
            newAccountId,
            null,
            null,
            Math.abs(initialAmount),
            0,
            'Account Opening'
          )
        }
      }

      setIsModalOpen(false)
      await fetchData()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save account')
    }
  }

  // Filter accounts by search query
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts
    const query = searchQuery.toLowerCase().trim()
    return accounts.filter((acc) => acc.account_name.toLowerCase().includes(query))
  }, [accounts, searchQuery])

  // Active selected account resolved from latest accounts state
  const activeSelectedAccount = useMemo(() => {
    if (!selectedAccount) return null
    return accounts.find((a) => a.account_id === selectedAccount.account_id) || selectedAccount
  }, [accounts, selectedAccount])

  if (activeSelectedAccount) {
    return (
      <AccountDetail
        account={activeSelectedAccount}
        accountTypes={accountTypes}
        categories={categories}
        accounts={accounts}
        monthStartDay={monthStartDay}
        currencyType={currencyType}
        onBack={() => setSelectedAccount(null)}
        onAccountUpdated={fetchData}
      />
    )
  }

  return (
    <section className="content-area accounts-page relative">
      {/* Top Toolbar with Search on the left of Add button */}
      <div className="categories-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="categories-copy">
          <h2>Accounts</h2>
          <p>Manage your financial accounts, track assets, and monitor liabilities.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Search Input on the left side of Add Account button */}
          {accounts.length > 0 && (
            <div className="relative w-48 sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-strong)] p-0.5 rounded-full cursor-pointer"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            className="category-add-button flex items-center justify-center gap-2 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            onClick={handleOpenModal}
          >
            <Plus size={18} />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Top Summary Stats (Assets, Liabilities, Total Net Worth) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mt-2">
        {/* Assets Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 shadow-xs transition-all hover:shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Assets
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold">
                {assetsCount}
              </span>
            </div>
            <span className="text-lg sm:text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 truncate">
              {currencySymbol || currencyType} {formatAmount(assetsTotal)}
            </span>
          </div>
        </div>

        {/* Liabilities Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 shadow-xs transition-all hover:shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
            <TrendingDown size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Liabilities
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-semibold">
                {liabilitiesCount}
              </span>
            </div>
            <span className="text-lg sm:text-xl font-bold font-mono text-red-600 dark:text-red-400 mt-0.5 truncate">
              {currencySymbol || currencyType} {formatAmount(liabilitiesTotal)}
            </span>
          </div>
        </div>

        {/* Total Net Balance Card */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] shadow-xs transition-all hover:shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-[var(--theme-control-bg)] text-[var(--theme-text-strong)] flex items-center justify-center shrink-0">
            <Wallet size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
              Total Balance
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-[var(--theme-text-strong)] mt-0.5 truncate">
              {netTotal < 0 ? '-' : ''}
              {currencySymbol || currencyType} {formatAmount(Math.abs(netTotal))}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-[var(--theme-text-muted)] text-sm">
          <span>Loading accounts...</span>
        </div>
      ) : accounts.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--theme-border-soft)] rounded-2xl mt-6 bg-[var(--theme-surface-soft)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--theme-control-bg)] flex items-center justify-center text-[var(--theme-text-muted)] mb-4 shadow-inner">
            <Wallet size={28} />
          </div>
          <h3 className="text-base font-bold text-[var(--theme-text-strong)]">No accounts created yet</h3>
          <p className="text-xs text-[var(--theme-text-muted)] max-w-sm mt-1 mb-5">
            Add bank accounts, cash wallets, credit cards, or savings accounts to start tracking your net worth.
          </p>
          <button
            type="button"
            className="category-add-button flex items-center justify-center gap-2 shadow-sm"
            onClick={handleOpenModal}
          >
            <Plus size={16} />
            <span>Create First Account</span>
          </button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        /* Search Empty State */
        <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-[var(--theme-border-soft)] rounded-2xl mt-6">
          <Search size={24} className="text-[var(--theme-text-muted)] mb-2" />
          <p className="text-sm text-[var(--theme-text-strong)] font-semibold">
            No accounts matching &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--theme-control-bg)] hover:bg-[var(--theme-control-hover)] text-[var(--theme-text-strong)] transition-colors"
          >
            Clear Search
          </button>
        </div>
      ) : (
        /* Account Groups Accordions */
        <div className="category-accordions mt-4">
          {accountTypes.map((type) => {
            const typeAccounts = filteredAccounts.filter((a) => a.account_type_id === type.account_type_id)
            if (typeAccounts.length === 0) return null

            // Subtotal for this specific account group
            const typeTotal = typeAccounts.reduce((sum, a) => sum + a.account_amount, 0)
            const isGroupNegative = typeTotal < 0

            return (
              <details key={type.account_type_id} className="category-accordion group" open>
                <summary className="hover:bg-[var(--theme-surface-strong)] transition-colors cursor-pointer select-none">
                  <div className="flex items-center gap-2.5">
                    <span>{type.account_type_name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--theme-chip-bg)] text-[var(--theme-text-muted)] font-semibold">
                      {typeAccounts.length}
                    </span>
                  </div>

                  {/* Group Subtotal Header */}
                  <div className="flex items-center gap-2 mr-3 font-mono text-xs">
                    <span className="text-[11px] text-[var(--theme-text-muted)] font-sans hidden sm:inline">
                      Subtotal:
                    </span>
                    <span
                      className={`font-semibold ${isGroupNegative
                          ? 'text-red-500'
                          : 'text-[var(--theme-text-strong)]'
                        }`}
                    >
                      {isGroupNegative ? '-' : ''}
                      {currencySymbol || currencyType} {formatAmount(Math.abs(typeTotal))}
                    </span>
                  </div>
                </summary>

                <div className="category-accordion-body">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 py-1">
                    {typeAccounts.map((acc) => {
                      const isNegative = acc.account_amount < 0
                      return (
                        <div
                          key={acc.account_id}
                          onClick={() => setSelectedAccount(acc)}
                          className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] hover:border-emerald-500/50 hover:shadow-md hover:scale-[1.015] active:scale-[0.985] transition-all group/card cursor-pointer"
                          title={`View ${acc.account_name} transactions & details`}
                        >
                          {/* Account Icon Badge */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover/card:scale-105"
                            style={{ backgroundColor: acc.account_color }}
                          >
                            <Icon icon={acc.account_icon} size={22} />
                          </div>

                          {/* Account Name and Balance */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-semibold text-sm truncate text-[var(--theme-text-strong)] group-hover/card:text-emerald-500 transition-colors">
                                {acc.account_name}
                              </h4>
                              {isNegative && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 uppercase tracking-wider shrink-0">
                                  Liability
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-xs font-mono font-semibold block mt-0.5 truncate ${isNegative
                                  ? 'text-red-500'
                                  : 'text-[var(--theme-text-strong)]'
                                }`}
                            >
                              {currencySymbol || currencyType}{' '}
                              {formatAmount(Math.abs(acc.account_amount))}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}

      {/* Shared AccountFormModal in 'create' mode */}
      <AccountFormModal
        isOpen={isModalOpen}
        mode="create"
        accountTypes={accountTypes}
        currencySymbol={currencySymbol}
        currencyType={currencyType}
        saveError={saveError}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onSubmit}
      />
    </section>
  )
}

export default Accounts
