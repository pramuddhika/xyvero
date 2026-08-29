/* eslint-disable prettier/prettier */
// Initialize fallback window.api for web browser development mode
if (typeof window !== 'undefined' && !window.api) {
  const parseJson = async <T = unknown>(res: Response): Promise<T> => {
    const text = await res.text()
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(
        `API returned non-JSON response (status: ${res.status}). If you just updated configuration, please restart "npm run dev".`
      )
    }
  }

  window.api = {
    getDatabasePath: async (): Promise<string> => {
      const res = await fetch('/api/getDatabasePath')
      return parseJson(res)
    },
    listConfiguration: async () => {
      const res = await fetch('/api/listConfiguration')
      return parseJson(res)
    },
    getConfigurationValue: async (configurationKey: string) => {
      const res = await fetch(
        `/api/getConfigurationValue?key=${encodeURIComponent(configurationKey)}`
      )
      return parseJson(res)
    },
    setConfigurationValue: async (
      configurationKey: string,
      configurationValue: string
    ): Promise<void> => {
      const res = await fetch('/api/setConfigurationValue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: configurationKey, value: configurationValue })
      })
      await parseJson(res)
    },
    listAccountTypes: async () => {
      const res = await fetch('/api/listAccountTypes')
      return parseJson(res)
    },
    listAccounts: async () => {
      const res = await fetch('/api/listAccounts')
      return parseJson(res)
    },
    addAccount: async (
      accountName: string,
      accountTypeId: number,
      accountIcon: string,
      accountColor: string
    ): Promise<number> => {
      const res = await fetch('/api/addAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          accountTypeId,
          accountIcon,
          accountColor
        })
      })
      const result = await parseJson<{ accountId?: number; error?: string }>(res)
      if (result.error) {
        throw new Error(result.error)
      }
      if (typeof result.accountId !== 'number') {
        throw new Error('Failed to save account: invalid server response')
      }
      return result.accountId
    },
    updateAccount: async (
      accountId: number,
      accountName: string,
      accountTypeId: number,
      accountIcon: string,
      accountColor: string
    ): Promise<void> => {
      const res = await fetch('/api/updateAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          accountName,
          accountTypeId,
          accountIcon,
          accountColor
        })
      })
      const result = await parseJson<{ success?: boolean; error?: string }>(res)
      if (result.error) {
        throw new Error(result.error)
      }
    },
    deleteAccount: async (accountId: number): Promise<void> => {
      const res = await fetch('/api/deleteAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      })
      const result = await parseJson<{ success?: boolean; error?: string }>(res)
      if (result.error) {
        throw new Error(result.error)
      }
    },
    listCategoryTypes: async () => {
      const res = await fetch('/api/listCategoryTypes')
      return parseJson(res)
    },
    listCategories: async () => {
      const res = await fetch('/api/listCategories')
      return parseJson(res)
    },
    addCategory: async (
      categoryName: string,
      categoryGroupId: number,
      categoryIcon: string,
      categoryColour: string
    ): Promise<number> => {
      const res = await fetch('/api/addCategory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName,
          categoryGroupId,
          categoryIcon,
          categoryColour
        })
      })
      const result = await parseJson<{ categoryId?: number; error?: string }>(res)
      if (result.error) {
        throw new Error(result.error)
      }
      if (typeof result.categoryId !== 'number') {
        throw new Error('Failed to save category: invalid server response')
      }
      return result.categoryId
    },
    listTransactionTypes: async () => {
      const res = await fetch('/api/listTransactionTypes')
      return parseJson(res)
    },
    listTransactions: async () => {
      const res = await fetch('/api/listTransactions')
      return parseJson(res)
    },
    addTransaction: async (
      transactionTime: string,
      transactionTypeId: number,
      toAccountId: number,
      fromAccountId: number | null | undefined,
      categoryId: number | null | undefined,
      amount: number,
      fees: number = 0,
      note: string
    ): Promise<string> => {
      const res = await fetch('/api/addTransaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionTime,
          transactionTypeId,
          toAccountId,
          fromAccountId,
          categoryId,
          amount,
          fees,
          note
        })
      })
      const result = await parseJson<{ timeStamp?: string; error?: string }>(res)
      if (result.error) {
        throw new Error(result.error)
      }
      if (!result.timeStamp) {
        throw new Error('Failed to save transaction: invalid server response')
      }
      return result.timeStamp
    },
    getVersion: async () => '0.0.1',
    updater: {
      onUpdateAvailable: () => () => {},
      onUpdateProgress: () => () => {},
      onUpdateDownloaded: () => () => {},
      onUpdateError: () => () => {},
      startDownload: () => {},
      quitAndInstall: () => {}
    }
  }
}
