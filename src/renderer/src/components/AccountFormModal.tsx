/* eslint-disable prettier/prettier */
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import FormModal from './FormModal'
import IconPicker from './IconPicker'
import ColorPicker from './ColorPicker'
import { COLOR_PALETTE } from './Color'
import type { AccountTypeRecord } from '../types'

export interface AccountFormValues {
  accountName: string
  accountAmount?: string
  accountTypeId: string
  accountIcon: string
  accountColor: string
}

interface AccountFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  accountTypes: AccountTypeRecord[]
  initialValues?: Partial<AccountFormValues>
  currencySymbol?: string
  currencyType?: string
  saveError: string | null
  onClose: () => void
  onSubmit: (data: AccountFormValues) => Promise<void>
}

export default function AccountFormModal({
  isOpen,
  mode,
  accountTypes,
  initialValues,
  currencySymbol = '$',
  currencyType = 'USD',
  saveError,
  onClose,
  onSubmit
}: AccountFormModalProps): React.JSX.Element {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AccountFormValues>({
    defaultValues: {
      accountName: initialValues?.accountName || '',
      accountAmount: initialValues?.accountAmount || '0.00',
      accountTypeId: initialValues?.accountTypeId || accountTypes[0]?.account_type_id.toString() || '1',
      accountIcon: initialValues?.accountIcon || 'wallet',
      accountColor: initialValues?.accountColor || COLOR_PALETTE[0] || '#6366f1'
    }
  })

  // Whenever modal opens or initialValues change, reset form with fresh values
  useEffect(() => {
    if (isOpen) {
      reset({
        accountName: initialValues?.accountName || '',
        accountAmount: initialValues?.accountAmount || '0.00',
        accountTypeId:
          initialValues?.accountTypeId || accountTypes[0]?.account_type_id.toString() || '1',
        accountIcon: initialValues?.accountIcon || 'wallet',
        accountColor: initialValues?.accountColor || COLOR_PALETTE[0] || '#6366f1'
      })
    }
  }, [isOpen, initialValues, accountTypes, reset])

  const selectedIcon = watch('accountIcon')
  const selectedColor = watch('accountColor')

  const title = mode === 'edit' ? 'Edit Account' : 'Create New Account'
  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Save Account'

  return (
    <FormModal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitLabel={submitLabel}
      saveError={saveError}
    >
      {/* Type Select and Name Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
            Account Type
          </label>
          <select
            {...register('accountTypeId', { required: true })}
            className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 cursor-pointer transition-colors"
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
            className="w-full px-3.5 py-2.5 text-sm bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {errors.accountName && (
            <span className="text-[11px] text-red-400 font-medium">
              {errors.accountName.message}
            </span>
          )}
        </div>
      </div>

      {/* Amount Input (Visible in Edit mode for balance adjustment) */}
      {mode === 'edit' && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)] flex items-center justify-between">
            <span>Total Net Balance</span>
            <span className="text-[11px] font-normal italic lowercase tracking-normal text-[var(--theme-text-muted)]">
              (adjusting creates an Income/Expense record)
            </span>
          </label>
          <div className="flex items-stretch rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-control-bg)] overflow-hidden focus-within:border-emerald-500/50 transition-colors">
            <span className="px-3.5 py-2.5 bg-[var(--theme-surface-strong)] text-sm font-semibold border-r border-[var(--theme-border-soft)] text-[var(--theme-text-muted)] min-w-[54px] flex items-center justify-center font-mono">
              {currencySymbol || currencyType}
            </span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              onKeyDown={(e) => {
                if (e.key === '+' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault()
                }
              }}
              {...register('accountAmount', {
                required: 'Amount is required'
              })}
              className="flex-1 px-3.5 py-2.5 text-sm bg-transparent border-0 text-[var(--theme-text-strong)] focus:outline-none font-mono no-spinners"
            />
          </div>
          {errors.accountAmount && (
            <span className="text-[11px] text-red-400 font-medium">
              {errors.accountAmount.message}
            </span>
          )}
        </div>
      )}

      {/* Icon Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
          Account Icon
        </label>
        <IconPicker
          selectedIcon={selectedIcon}
          selectedColor={selectedColor}
          onSelect={(iconName) => setValue('accountIcon', iconName)}
        />
      </div>

      {/* Color Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
          Account Color
        </label>
        <ColorPicker
          selectedColor={selectedColor}
          onSelect={(color) => setValue('accountColor', color)}
        />
      </div>
    </FormModal>
  )
}
