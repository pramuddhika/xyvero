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
      categoryAmount: number,
      categoryGroupId: number,
      categoryIcon: string,
      categoryColour: string
    ): Promise<number> => {
      const res = await fetch('/api/addCategory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName,
          categoryAmount,
          categoryGroupId,
          categoryIcon,
          categoryColour
        })
      })
      const result = await parseJson<{ categoryId: number }>(res)
      return result.categoryId
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
