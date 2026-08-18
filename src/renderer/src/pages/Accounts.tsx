/* eslint-disable prettier/prettier */

import { useCallback, useEffect } from "react"

function Accounts(): React.JSX.Element {
  const fetchAccountList = useCallback(async (): Promise<void> => {
    if (!window.api?.listAccountTypes) {
      console.warn('window.api is not available in this environment.')
      return
    }
    try {
      const accountList = await window.api.listAccountTypes()
      console.log('Account List:', accountList)
    } catch (error) {
      console.error('Failed to fetch account list:', error)
    }
  }, [])

  useEffect(() => {
    void fetchAccountList()
  }, [fetchAccountList])

  return (
    <section className="content-area">
      <h2>Accounts</h2>
      <p>Manage your accounts here.</p>
    </section>
  )
}

export default Accounts
