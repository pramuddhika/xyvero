/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import FormModal from './FormModal'
import IconPicker from './IconPicker'
import ColorPicker from './ColorPicker'
import { COLOR_PALETTE } from './Color'
import type { CategoryTypeRecord } from '../types'

export interface CategoryFormValues {
  categoryName: string
  categoryGroupId: string
  categoryIcon: string
  categoryColour: string
}

interface CategoryFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  categoryTypes: CategoryTypeRecord[]
  initialValues?: Partial<CategoryFormValues>
  saveError: string | null
  onClose: () => void
  onSubmit: (data: CategoryFormValues) => Promise<void>
}

export default function CategoryFormModal({
  isOpen,
  mode,
  categoryTypes,
  initialValues,
  saveError,
  onClose,
  onSubmit
}: CategoryFormModalProps): React.JSX.Element {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormValues>({
    defaultValues: {
      categoryName: initialValues?.categoryName || '',
      categoryGroupId:
        initialValues?.categoryGroupId || categoryTypes[0]?.category_id.toString() || '1',
      categoryIcon: initialValues?.categoryIcon || 'circle',
      categoryColour: initialValues?.categoryColour || COLOR_PALETTE[0] || '#6366f1'
    }
  })

  // Whenever modal opens or initialValues change, reset form with fresh values
  useEffect(() => {
    if (isOpen) {
      reset({
        categoryName: initialValues?.categoryName || '',
        categoryGroupId:
          initialValues?.categoryGroupId || categoryTypes[0]?.category_id.toString() || '1',
        categoryIcon: initialValues?.categoryIcon || 'circle',
        categoryColour: initialValues?.categoryColour || COLOR_PALETTE[0] || '#6366f1'
      })
    }
  }, [isOpen, initialValues, categoryTypes, reset])

  const selectedIcon = watch('categoryIcon')
  const selectedColour = watch('categoryColour')
  const selectedGroupId = watch('categoryGroupId')

  const currentTypeName = useMemo(() => {
    const match = categoryTypes.find((t) => t.category_id.toString() === selectedGroupId)
    if (match) return match.category_name
    return selectedGroupId === '1' ? 'Income' : 'Expense'
  }, [categoryTypes, selectedGroupId])

  const title = mode === 'edit' ? 'Edit Category' : 'Create New Category'
  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Save Category'

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
            Category Type
          </label>
          {mode === 'edit' ? (
            <div className="relative">
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={currentTypeName}
                className="w-full pl-3.5 pr-22 py-2.5 text-sm bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-muted)] font-medium cursor-not-allowed select-none focus:outline-none"
              />
              <input type="hidden" {...register('categoryGroupId')} />
            </div>
          ) : (
            <select
              {...register('categoryGroupId', { required: true })}
              className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 cursor-pointer transition-colors"
            >
              {categoryTypes.map((t) => (
                <option
                  key={t.category_id}
                  value={t.category_id.toString()}
                  className="bg-[var(--color-background-mute)] text-[var(--theme-text-strong)]"
                >
                  {t.category_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
            Category Name
          </label>
          <input
            type="text"
            placeholder="Enter name (e.g. Groceries)"
            autoComplete="off"
            {...register('categoryName', {
              required: 'Category name is required',
              maxLength: { value: 30, message: 'Max 30 characters allowed' }
            })}
            className="w-full px-3.5 py-2.5 text-sm bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)] rounded-xl text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {errors.categoryName && (
            <span className="text-[11px] text-red-400 font-medium">
              {errors.categoryName.message}
            </span>
          )}
        </div>
      </div>

      {/* Icon Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
          Category Icon
        </label>
        <IconPicker
          selectedIcon={selectedIcon}
          selectedColor={selectedColour}
          onSelect={(iconName) => setValue('categoryIcon', iconName)}
        />
      </div>

      {/* Color Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
          Category Color
        </label>
        <ColorPicker
          selectedColor={selectedColour}
          onSelect={(color) => setValue('categoryColour', color)}
        />
      </div>
    </FormModal>
  )
}
