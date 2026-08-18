/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from 'react'
import {
  Wallet,
  Landmark,
  PiggyBank,
  TrendingUp,
  CreditCard,
  CircleDot,
  HandCoins,
  Banknote,
  Plus,
  Layers
} from 'lucide-react'

type AccountTypeRecord = {
  account_type_id: number
  account_type: string
  account_type_name: string
}

function getAccountIcon(accountType: string): React.JSX.Element {
  const iconProps = { size: 22, className: 'account-icon-svg' }
  switch (accountType.toUpperCase()) {
    case 'CASH':
      return <Banknote {...iconProps} />
    case 'ACCOUNT':
    case 'ACCOUNTS':
      return <Landmark {...iconProps} />
    case 'SAVING':
    case 'SAVINGS':
      return <PiggyBank {...iconProps} />
    case 'INVESTMENT':
    case 'INVESTMENTS':
      return <TrendingUp {...iconProps} />
    case 'LOAN':
    case 'LOANS':
      return <HandCoins {...iconProps} />
    case 'CARD':
    case 'CARDS':
      return <CreditCard {...iconProps} />
    case 'OTHER':
      return <Layers {...iconProps} />
    default:
      return <Wallet {...iconProps} />
  }
}

function Accounts(): React.JSX.Element {
  const [accountTypes, setAccountTypes] = useState<AccountTypeRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccountList = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      if (window.api?.listAccountTypes) {
        const list = await window.api.listAccountTypes()
        setAccountTypes(list || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account types')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAccountList()
  }, [fetchAccountList])

  return (
    <section className="content-area accounts-page">
      <div className="categories-toolbar">
        <div className="categories-copy">
          <h2>Accounts</h2>
          <p>Manage your financial accounts and view available account types.</p>
        </div>

        <button type="button" className="category-add-button">
          <Plus size={18} />
          <span>Add Account</span>
        </button>
      </div>

      {isLoading ? (
        <div className="account-loading-state">
          <CircleDot className="animate-spin text-muted" size={24} />
          <p>Loading accounts...</p>
        </div>
      ) : error ? (
        <div className="account-error-state">
          <p className="text-red-400">{error}</p>
          <button type="button" onClick={() => void fetchAccountList()} className="category-add-button mt-2">
            Retry
          </button>
        </div>
      ) : (
        <div className="accounts-grid">
          {accountTypes.map((item) => (
            <div key={item.account_type_id} className="account-type-card">
              <div className="account-type-icon-box">
                {getAccountIcon(item.account_type)}
              </div>
              <div className="account-type-info">
                <div className="account-type-header">
                  <h3 className="account-type-name">{item.account_type_name}</h3>
                  <span className="account-type-id-badge">#{item.account_type_id}</span>
                </div>
                <span className="account-type-code">{item.account_type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Accounts

