/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, X, Check } from 'lucide-react'
import { Icon, iconsList } from '../components/Icon'
import { COLOR_PALETTE } from '../components/Color'

type CategoryTypeRecord = {
  category_id: number
  category_type: string
  category_name: string
}

type CategoryRecord = {
  category_id: number
  category_name: string
  category_amount: number
  category_group_id: number
  category_icon: string
  category_colour: string
}

interface FormValues {
  categoryName: string
  categoryAmount: string
  categoryGroupId: string
  categoryIcon: string
  categoryColour: string
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

function Categories(): React.JSX.Element {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [categoryTypes, setCategoryTypes] = useState<CategoryTypeRecord[]>([])
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
      categoryName: '',
      categoryAmount: '',
      categoryGroupId: '',
      categoryIcon: 'circle',
      categoryColour: '#6366f1'
    }
  })

  // Watch fields for rendering active selections
  const selectedIcon = watch('categoryIcon')
  const selectedColour = watch('categoryColour')

  const currencySymbol = useMemo(() => getCurrencySymbol(currencyType), [currencyType])

  const fetchData = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      if (window.api) {
        const [cats, types, configVal] = await Promise.all([
          window.api.listCategories ? window.api.listCategories() : [],
          window.api.listCategoryTypes ? window.api.listCategoryTypes() : [],
          window.api.getConfigurationValue ? window.api.getConfigurationValue('CURRENCY_TYPE') : undefined
        ])

        setCategories(cats || [])
        setCategoryTypes(types || [])
        if (configVal?.configuration_value) {
          setCurrencyType(configVal.configuration_value)
        }
      }
    } catch (err) {
      console.error('Failed to load category data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // Group categories into Income and Expense
  const incomeCategories = useMemo(() => {
    return categories.filter((c) => c.category_group_id === 1)
  }, [categories])

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.category_group_id === 2)
  }, [categories])

  const handleOpenModal = (): void => {
    setSaveError(null)
    reset({
      categoryName: '',
      categoryAmount: '',
      categoryGroupId: categoryTypes[0]?.category_id.toString() || '1',
      categoryIcon: 'circle',
      categoryColour: COLOR_PALETTE[0] || '#6366f1'
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: FormValues): Promise<void> => {
    setSaveError(null)
    try {
      if (!window.api?.addCategory) {
        throw new Error('Database save function not available.')
      }

      const amount = parseFloat(data.categoryAmount)
      if (isNaN(amount) || amount < 0) {
        throw new Error('Please enter a valid amount.')
      }

      await window.api.addCategory(
        data.categoryName.trim(),
        Math.round(amount),
        parseInt(data.categoryGroupId, 10),
        data.categoryIcon,
        data.categoryColour
      )

      setIsModalOpen(false)
      await fetchData()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save category')
    }
  }

  return (
    <section className="content-area categories-page relative">
      <div className="categories-toolbar">
        <div className="categories-copy">
          <h2>Categories</h2>
          <p>Manage income and expense categories.</p>
        </div>

        <button
          type="button"
          className="category-add-button flex items-center justify-center gap-2"
          onClick={handleOpenModal}
        >
          <Plus size={18} />
          <span>Add new</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-[var(--theme-text-muted)] text-sm">
          <span>Loading categories...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-[var(--theme-text-muted)] text-sm border border-dashed border-[var(--theme-border-soft)] rounded-xl mt-6">
          <p>No categories created yet. Click &quot;Add new&quot; to create one.</p>
        </div>
      ) : (
        <div className="category-accordions mt-6">
          {incomeCategories.length > 0 && (
            <details className="category-accordion" open>
              <summary className="hover:bg-[var(--theme-surface-strong)] transition-colors">
                <span>Income Categories ({incomeCategories.length})</span>
              </summary>
              <div className="category-accordion-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2">
                  {incomeCategories.map((cat) => (
                    <div
                      key={cat.category_id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] shadow-xs"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner"
                        style={{ backgroundColor: cat.category_colour }}
                      >
                        <Icon icon={cat.category_icon} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate text-[var(--theme-text-strong)]">
                          {cat.category_name}
                        </h4>
                        <span className="text-xs text-[var(--theme-text-muted)] font-mono">
                          {currencySymbol || currencyType} {cat.category_amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}

          {expenseCategories.length > 0 && (
            <details className="category-accordion" open>
              <summary className="hover:bg-[var(--theme-surface-strong)] transition-colors">
                <span>Expense Categories ({expenseCategories.length})</span>
              </summary>
              <div className="category-accordion-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2">
                  {expenseCategories.map((cat) => (
                    <div
                      key={cat.category_id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] shadow-xs"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-inner"
                        style={{ backgroundColor: cat.category_colour }}
                      >
                        <Icon icon={cat.category_icon} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate text-[var(--theme-text-strong)]">
                          {cat.category_name}
                        </h4>
                        <span className="text-xs text-[var(--theme-text-muted)] font-mono">
                          {currencySymbol || currencyType} {cat.category_amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--color-background-soft)] border border-[var(--theme-border-soft)] w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-border-soft)] bg-[var(--color-background-mute)]">
              <h3 className="text-lg font-bold text-[var(--theme-text-strong)]">Create New Category</h3>
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
                    Category Type
                  </label>
                  <select
                    {...register('categoryGroupId', { required: true })}
                    className="w-full px-3 py-2 text-sm bg-[var(--color-background-mute)] border border-[var(--theme-border-soft)] rounded-lg text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50 cursor-pointer"
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
                </div>

                {/* Name Input */}
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
                    className="w-full px-3 py-2 text-sm bg-[var(--theme-control-bg)] border border-[var(--theme-border-soft)] rounded-lg text-[var(--theme-text-strong)] focus:outline-none focus:border-emerald-500/50"
                  />
                  {errors.categoryName && (
                    <span className="text-[11px] text-red-400 font-medium">
                      {errors.categoryName.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                  Category Amount
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
                    {...register('categoryAmount', {
                      required: 'Amount is required',
                      min: { value: 0, message: 'Amount cannot be negative' }
                    })}
                    className="flex-1 px-3 py-2 text-sm bg-transparent border-0 text-[var(--theme-text-strong)] focus:outline-none font-mono no-spinners"
                  />
                </div>
                {errors.categoryAmount && (
                  <span className="text-[11px] text-red-400 font-medium">
                    {errors.categoryAmount.message}
                  </span>
                )}
              </div>

              {/* Icon Selector Grid (Fixed Size with Scroll) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
                  Category Icon
                </label>
                <div className="grid grid-cols-12 sm:grid-cols-14 md:grid-cols-16 gap-1.5 p-2 border border-[var(--theme-border-soft)] rounded-lg bg-[var(--theme-control-bg)] max-h-28 overflow-y-auto custom-scrollbar">
                  {iconsList.map((iconName) => {
                    const isSelected = selectedIcon === iconName
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setValue('categoryIcon', iconName)}
                        className={`aspect-square flex items-center justify-center rounded-md transition-all border cursor-pointer ${
                          isSelected
                            ? 'scale-105 shadow-sm text-white'
                            : 'border-transparent text-[var(--theme-text-muted)] hover:bg-[var(--theme-control-hover)] hover:text-[var(--theme-text-strong)]'
                        }`}
                        style={{
                          backgroundColor: isSelected ? selectedColour : undefined,
                          borderColor: isSelected ? selectedColour : undefined
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
                  Category Color
                </label>
                <div className="grid grid-cols-12 sm:grid-cols-14 md:grid-cols-16 gap-1.5 p-2 border border-[var(--theme-border-soft)] rounded-lg bg-[var(--theme-control-bg)] max-h-28 overflow-y-auto custom-scrollbar">
                  {COLOR_PALETTE.map((colorHex) => {
                    const isSelected = selectedColour.toLowerCase() === colorHex.toLowerCase()
                    return (
                      <button
                        key={colorHex}
                        type="button"
                        onClick={() => setValue('categoryColour', colorHex)}
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
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default Categories
