/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Search, X } from 'lucide-react'
import { Icon } from '../components/Icon'
import { COLOR_PALETTE } from '../components/Color'
import IconPicker from '../components/IconPicker'
import ColorPicker from '../components/ColorPicker'
import FormModal from '../components/FormModal'
import { getCurrencySymbol } from '../utils/currency'
import type { CategoryTypeRecord, CategoryRecord } from '../types'

interface CategoryFormValues {
  categoryName: string
  categoryAmount: string
  categoryGroupId: string
  categoryIcon: string
  categoryColour: string
}

function Categories(): React.JSX.Element {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [categoryTypes, setCategoryTypes] = useState<CategoryTypeRecord[]>([])
  const [currencyType, setCurrencyType] = useState<string>('USD')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormValues>({
    defaultValues: {
      categoryName: '',
      categoryAmount: '0.00',
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

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories
    const query = searchQuery.toLowerCase().trim()
    return categories.filter((cat) => cat.category_name.toLowerCase().includes(query))
  }, [categories, searchQuery])

  // Group filtered categories into Income and Expense
  const incomeCategories = useMemo(() => {
    return filteredCategories.filter((c) => c.category_group_id === 1)
  }, [filteredCategories])

  const expenseCategories = useMemo(() => {
    return filteredCategories.filter((c) => c.category_group_id === 2)
  }, [filteredCategories])

  const incomeTotal = useMemo(() => {
    return incomeCategories.reduce((sum, c) => sum + c.category_amount, 0)
  }, [incomeCategories])

  const expenseTotal = useMemo(() => {
    return expenseCategories.reduce((sum, c) => sum + c.category_amount, 0)
  }, [expenseCategories])

  const handleOpenModal = (): void => {
    setSaveError(null)
    reset({
      categoryName: '',
      categoryAmount: '0.00',
      categoryGroupId: categoryTypes[0]?.category_id.toString() || '1',
      categoryIcon: 'circle',
      categoryColour: COLOR_PALETTE[0] || '#6366f1'
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: CategoryFormValues): Promise<void> => {
    setSaveError(null)
    try {
      if (!window.api?.addCategory) {
        throw new Error('Database save function not available.')
      }

      const amount = data.categoryAmount === '' ? 0 : parseFloat(data.categoryAmount)
      if (isNaN(amount) || amount < 0) {
        throw new Error('Please enter a valid amount.')
      }

      const finalAmount = parseFloat(amount.toFixed(2))

      await window.api.addCategory(
        data.categoryName.trim(),
        finalAmount,
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

  /** Renders a single category card */
  const renderCategoryCard = (cat: CategoryRecord): React.JSX.Element => (
    <div
      key={cat.category_id}
      className="flex items-center gap-3 p-3.5 rounded-2xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] hover:border-emerald-500/40 hover:shadow-md transition-all group/card cursor-default"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover/card:scale-105"
        style={{ backgroundColor: cat.category_colour }}
      >
        <Icon icon={cat.category_icon} size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm truncate text-[var(--theme-text-strong)]">
          {cat.category_name}
        </h4>
        <span className="text-xs text-[var(--theme-text-muted)] font-mono font-semibold block mt-0.5">
          {currencySymbol || currencyType}{' '}
          {cat.category_amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      </div>
    </div>
  )

  return (
    <section className="content-area categories-page relative">
      {/* Top Toolbar with Search on left of Add button */}
      <div className="categories-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="categories-copy">
          <h2>Categories</h2>
          <p>Manage income and expense categories.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {categories.length > 0 && (
            <div className="relative w-48 sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search categories..."
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
            <span>Add new</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-[var(--theme-text-muted)] text-sm">
          <span>Loading categories...</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-[var(--theme-text-muted)] text-sm border border-dashed border-[var(--theme-border-soft)] rounded-xl mt-6">
          <p>No categories created yet. Click &quot;Add new&quot; to create one.</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        /* Search Empty State */
        <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-[var(--theme-border-soft)] rounded-2xl mt-6">
          <Search size={24} className="text-[var(--theme-text-muted)] mb-2" />
          <p className="text-sm text-[var(--theme-text-strong)] font-semibold">
            No categories matching &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--theme-control-bg)] hover:bg-[var(--theme-control-hover)] text-[var(--theme-text-strong)] transition-colors cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="category-accordions mt-4">
          {incomeCategories.length > 0 && (
            <details className="category-accordion group" open>
              <summary className="hover:bg-[var(--theme-surface-strong)] transition-colors cursor-pointer select-none">
                <div className="flex items-center gap-2.5">
                  <span>Income Categories</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--theme-chip-bg)] text-[var(--theme-text-muted)] font-semibold">
                    {incomeCategories.length}
                  </span>
                </div>

                {/* Subtotal Header in right corner */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[11px] text-[var(--theme-text-muted)] font-sans hidden sm:inline">
                    Subtotal:
                  </span>
                  <span className="font-semibold text-blue-500">
                    {currencySymbol || currencyType}{' '}
                    {incomeTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </summary>
              <div className="category-accordion-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 py-1">
                  {incomeCategories.map(renderCategoryCard)}
                </div>
              </div>
            </details>
          )}

          {expenseCategories.length > 0 && (
            <details className="category-accordion group" open>
              <summary className="hover:bg-[var(--theme-surface-strong)] transition-colors cursor-pointer select-none">
                <div className="flex items-center gap-2.5">
                  <span>Expense Categories</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--theme-chip-bg)] text-[var(--theme-text-muted)] font-semibold">
                    {expenseCategories.length}
                  </span>
                </div>

                {/* Subtotal Header in right corner */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[11px] text-[var(--theme-text-muted)] font-sans hidden sm:inline">
                    Subtotal:
                  </span>
                  <span className="font-semibold text-[var(--theme-text-strong)]">
                    {currencySymbol || currencyType}{' '}
                    {expenseTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </summary>
              <div className="category-accordion-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 py-1">
                  {expenseCategories.map(renderCategoryCard)}
                </div>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      <FormModal
        isOpen={isModalOpen}
        title="Create New Category"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitLabel="Save Category"
        saveError={saveError}
      >
        {/* Type Select and Name Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
              Category Type
            </label>
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

        {/* Amount Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-strong)]">
            Category Amount
          </label>
          <div className="flex items-stretch rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-control-bg)] overflow-hidden focus-within:border-emerald-500/50 transition-colors">
            <span className="px-3.5 py-2.5 bg-[var(--theme-surface-strong)] text-sm font-semibold border-r border-[var(--theme-border-soft)] text-[var(--theme-text-muted)] min-w-[54px] flex items-center justify-center font-mono">
              {currencySymbol || currencyType}
            </span>
            <input
              type="number"
              step="0.01"
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
              className="flex-1 px-3.5 py-2.5 text-sm bg-transparent border-0 text-[var(--theme-text-strong)] focus:outline-none font-mono no-spinners"
            />
          </div>
          {errors.categoryAmount && (
            <span className="text-[11px] text-red-400 font-medium">
              {errors.categoryAmount.message}
            </span>
          )}
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
    </section>
  )
}

export default Categories
