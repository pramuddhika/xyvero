/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Icon } from '../components/Icon'
import CategoryDetail from '../components/CategoryDetail'
import CategoryFormModal, { CategoryFormValues } from '../components/CategoryFormModal'
import { getCurrencySymbol } from '../utils/currency'
import type { CategoryTypeRecord, CategoryRecord, AccountRecord } from '../types'

function Categories(): React.JSX.Element {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [categoryTypes, setCategoryTypes] = useState<CategoryTypeRecord[]>([])
  const [accounts, setAccounts] = useState<AccountRecord[]>([])
  const [currencyType, setCurrencyType] = useState<string>('USD')
  const [monthStartDay, setMonthStartDay] = useState<number>(1)
  const [selectedCategory, setSelectedCategory] = useState<CategoryRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const currencySymbol = useMemo(() => getCurrencySymbol(currencyType), [currencyType])

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      if (window.api) {
        const [cats, types, configVal, accs, monthStartVal] = await Promise.all([
          window.api.listCategories ? window.api.listCategories() : [],
          window.api.listCategoryTypes ? window.api.listCategoryTypes() : [],
          window.api.getConfigurationValue ? window.api.getConfigurationValue('CURRENCY_TYPE') : undefined,
          window.api.listAccounts ? window.api.listAccounts() : [],
          window.api.getConfigurationValue ? window.api.getConfigurationValue('MONTH_START_DATE') : undefined
        ])

        setCategories(cats || [])
        setCategoryTypes(types || [])
        setAccounts(accs || [])
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
      console.error('Failed to load category data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleOpenModal = (): void => {
    setSaveError(null)
    setIsModalOpen(true)
  }

  const onSubmit = async (data: CategoryFormValues): Promise<void> => {
    setSaveError(null)
    try {
      if (!window.api?.addCategory) {
        throw new Error('Database save function not available.')
      }

      await window.api.addCategory(
        data.categoryName.trim(),
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

  // Active selected category resolved from latest categories state
  const activeSelectedCategory = useMemo(() => {
    if (!selectedCategory) return null
    return categories.find((c) => c.category_id === selectedCategory.category_id) || selectedCategory
  }, [categories, selectedCategory])

  if (activeSelectedCategory) {
    return (
      <CategoryDetail
        category={activeSelectedCategory}
        categoryTypes={categoryTypes}
        categories={categories}
        accounts={accounts}
        monthStartDay={monthStartDay}
        currencyType={currencyType}
        onBack={() => setSelectedCategory(null)}
        onCategoryUpdated={fetchData}
      />
    )
  }

  /** Renders a single category card */
  const renderCategoryCard = (cat: CategoryRecord): React.JSX.Element => (
    <div
      key={cat.category_id}
      onClick={() => setSelectedCategory(cat)}
      className="flex items-center gap-3 p-3.5 rounded-2xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-strong)] hover:border-emerald-500/50 hover:shadow-md hover:scale-[1.015] active:scale-[0.985] transition-all group/card cursor-pointer"
      title={`View ${cat.category_name} transactions & details`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover/card:scale-105"
        style={{ backgroundColor: cat.category_colour }}
      >
        <Icon icon={cat.category_icon} size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm truncate text-[var(--theme-text-strong)] group-hover/card:text-emerald-500 transition-colors">
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

      {/* Shared CategoryFormModal in 'create' mode */}
      <CategoryFormModal
        isOpen={isModalOpen}
        mode="create"
        categoryTypes={categoryTypes}
        saveError={saveError}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onSubmit}
      />
    </section>
  )
}

export default Categories
