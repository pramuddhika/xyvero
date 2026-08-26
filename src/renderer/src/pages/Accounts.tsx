/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, X, Check } from 'lucide-react'
import { Icon, iconsList } from '../components/Icon'
import { COLOR_PALETTE } from '../components/Color'

type AccountTypeRecord = {
  account_type_id: number
  account_type: string
  account_type_name: string
}

type AccountRecord = {
  account_id: number
  account_name: string
  account_amount: number
  account_type_id: number
  account_color: string
  account_icon: string
}

interface FormValues {
  accountName: string
  accountAmount: string
  accountTypeId: string
  accountIcon: string
  accountColor: string
}

const getCurrencySymbol = (currencyCode: string): string => {
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol'
    }).formatToParts(1)

    const symbol = parts.find((part) => part.type === 'currency')?.value ?? ''
    return symbol === currencyCode ? '' : symbol
  } catch {
    return ''
  }
}

function Accounts(): React.JSX.Element {
  const [accounts, setAccounts] = useState<AccountRecord[]>([])
  const [accountTypes, setAccountTypes] = useState<AccountTypeRecord[]>([])
  const [currencyType, setCurrencyType] = useState<string>('USD')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    defaultValues: {
      accountName: '',
      accountAmount: '',
      accountTypeId: '',
      accountIcon: 'wallet',
      accountColor: '#6366f1'
    }
  })

  // Watch fields for rendering active selections
  const selectedIcon = watch('accountIcon')
  const selectedColor = watch('accountColor')

  const currencySymbol = useMemo(() => getCurrencySymbol(currencyType), [currencyType])

  const fetchData = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      if (window.api) {
        const [accs, types, configVal] = await Promise.all([
          window.api.listAccounts ? window.api.listAccounts() : [],
          window.api.listAccountTypes ? window.api.listAccountTypes() : [],
          window.api.getConfigurationValue ? window.api.getConfigurationValue('CURRENCY_TYPE') : undefined
        ])

        setAccounts(accs || [])
        setAccountTypes(types || [])
        if (configVal?.configuration_value) {
          setCurrencyType(configVal.configuration_value)
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
    reset({
      accountName: '',
      accountAmount: '0',
      accountTypeId: accountTypes[0]?.account_type_id.toString() || '1',
      accountIcon: 'wallet',
      accountColor: COLOR_PALETTE[0] || '#6366f1'
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: FormValues): Promise<void> => {
    setSaveError(null)
    try {
      if (!window.api?.addAccount) {
        throw new Error(
          'Database save function is not available. Please restart the dev server ("npm run dev") so Electron loads the new database handlers.'
        )
      }

      const amount = data.accountAmount === '' ? 0 : parseFloat(data.accountAmount)
      if (isNaN(amount) || amount < 0) {
        throw new Error('Please enter a valid amount.')
      }

      const accountTypeId = parseInt(data.accountTypeId, 10)
      if (isNaN(accountTypeId)) {
        throw new Error('Please select a valid account type.')
      }

      await window.api.addAccount(
        data.accountName.trim(),
        Math.round(amount),
        accountTypeId,
        data.accountIcon,
        data.accountColor
      )

      setIsModalOpen(false)
      await fetchData()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save account')
    }
  }

  return (
    <section className="content-area accounts-page relative">
      <div className="categories-toolbar">
        <div className="categories-copy">
          <h2>Accounts</h2>
          <p>Manage your financial accounts and view balances.</p>
        </div>

        <button
          type="button"
          className="category-add-button flex items-center justify-center gap-2"
          onClick={handleOpenModal}
        >
          <Plus size={18} />
          <span>Add Account</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-[var(--theme-text-muted)] text-sm">
          <span>Loading accounts...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-[var(--theme-text-muted)] text-sm border border-dashed border-[var(--theme-border-soft)] rounded-xl mt-6">
          <p>No accounts created yet. Click &quot;Add Account&quot; to create one.</p>
        </div>
      ) : (
        <div className="category-accordions mt-6">
          {accountTypes.map((type) => {
            const typeAccounts = accounts.filter((a) => a.account_type_id === type.account_type_id)
            if (typeAccounts.length === 0) return null

            return (
              <details key={type.account_type_id} className="category-accordion" open>
                <summary className="hover:bg-[var(--theme-surface-strong)] transition-colors">
                  <span>{type.account_type_name} ({typeAccounts.length})</span>
                </summary>
                <div className="category-accordion-body">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2">
                    {typeAccounts.map((acc) => (
                      <div
                        key={acc.account_id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] shadow-xs"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner"
                          style={{ backgroundColor: acc.account_color }}
                        >
                          <Icon icon={acc.account_icon} size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate text-[var(--theme-text-strong)]">
                            {acc.account_name}
                          </h4>
                          <span className="text-xs text-[var(--theme-text-muted)] font-mono">
                            {currencySymbol || currencyType} {acc.account_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--color-background-soft)] border border-[var(--theme-border-soft)] w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-border-soft)] bg-[var(--color-background-mute)]">
              <h3 className="text-lg font-bold text-[var(--theme-text-strong)]">Create New Account</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-strong)] hover:bg-[var(--theme-control-hover)] p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 flex flex-col gap-8">
              {saveError && (
                <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                  {saveError}
                </div>
              )}

              {/* Type Select and Name Input in One Line */}
              <div className="grid grid-cols-2 gap-6">
                {/* Type Select */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                    Account Type
                  </label>
                  <select
                    {...register('accountTypeId', { required: true })}
                    className="w-full px-3 py-2 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] rounded-lg text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  >
                    {accountTypes.map((t) => (
                      <option
                        key={t.account_type_id}
                        value={t.account_type_id.toString()}
                        className="bg-[var(--color-background-mute)] text-[var(--theme-text-strong)]"
                      >
                        {t.account_type_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                    Account Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter name (e.g. Main Bank, Wallet)"
                    autoComplete="off"
                    {...register('accountName', {
                      required: 'Account name is required',
                      maxLength: { value: 30, message: 'Max 30 characters allowed' }
                    })}
                    className="w-full px-3 py-2 text-sm bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)] rounded-lg text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50"
                  />
                  {errors.accountName && (
                    <span className="text-[11px] text-red-400 font-medium">
                      {errors.accountName.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                  Initial Balance / Amount
                </label>
                <div className="flex items-stretch rounded-lg border border-[var(--theme-border-soft)] bg-[var(--theme-control-bg)] overflow-hidden focus-within:border-emerald-500/50">
                  <span className="px-3 py-2 bg-[var(--theme-surface-strong)] text-sm font-semibold border-r border-[var(--theme-border-soft)] text-[var(--theme-text-muted)] min-w-[54px] flex items-center justify-center font-mono">
                    {currencySymbol || currencyType}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                    }}
                    {...register('accountAmount', {
                      required: 'Amount is required',
                      min: { value: 0, message: 'Amount cannot be negative' }
                    })}
                    className="flex-1 px-3 py-2 text-sm bg-transparent border-0 text-[var(--theme-text-strong)] focus:outline-none font-mono no-spinners"
                  />
                </div>
                {errors.accountAmount && (
                  <span className="text-[11px] text-red-400 font-medium">
                    {errors.accountAmount.message}
                  </span>
                )}
              </div>

              {/* Icon Selector Grid (Fixed Size with Scroll) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                  Account Icon
                </label>
                <div className="grid grid-cols-12 sm:grid-cols-14 md:grid-cols-16 gap-1.5 p-2 border border-[var(--theme-border-soft)] rounded-lg bg-[var(--theme-control-bg)] max-h-28 overflow-y-auto custom-scrollbar">
                  {iconsList.map((iconName) => {
                    const isSelected = selectedIcon === iconName
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setValue('accountIcon', iconName)}
                        className={`aspect-square flex items-center justify-center rounded-md transition-all border cursor-pointer ${
                          isSelected
                            ? 'scale-105 shadow-sm text-white'
                            : 'border-transparent text-[var(--theme-text-muted)] hover:bg-[var(--theme-control-hover)] hover:text-[var(--theme-text-strong)]'
                        }`}
                        style={{
                          backgroundColor: isSelected ? selectedColor : undefined,
                          borderColor: isSelected ? selectedColor : undefined
                        }}
                        title={iconName}
                      >
                        <Icon icon={iconName} size={16} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Color Grid Picker (Fixed Size with Scroll) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                  Account Color
                </label>
                <div className="grid grid-cols-12 sm:grid-cols-14 md:grid-cols-16 gap-1.5 p-2 border border-[var(--theme-border-soft)] rounded-lg bg-[var(--theme-control-bg)] max-h-28 overflow-y-auto custom-scrollbar">
                  {COLOR_PALETTE.map((colorHex) => {
                    const isSelected = selectedColor.toLowerCase() === colorHex.toLowerCase()
                    return (
                      <button
                        key={colorHex}
                        type="button"
                        onClick={() => setValue('accountColor', colorHex)}
                        className="w-full aspect-square rounded-full flex items-center justify-center transition-all scale-95 hover:scale-110 active:scale-95 relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        style={{ backgroundColor: colorHex }}
                        title={colorHex}
                      >
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Save Footer Button inside Modal Form */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--theme-border-soft)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--theme-text-strong)] hover:bg-[var(--theme-control-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default Accounts
