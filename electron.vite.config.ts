import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'
import {
  getDatabasePathForApp,
  listAccountTypes,
  listConfiguration,
  getConfigurationValue,
  setConfigurationValue,
  listCategoryTypes,
  listCategories,
  addCategory,
  listAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  listTransactionTypes,
  listTransactions,
  addTransaction
} from './src/main/database'

function devDatabasePlugin(): Plugin {
  return {
    name: 'dev-database-api',
    configureServer(server): void {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || ''
        const [pathname, queryString] = rawUrl.split('?')
        const searchParams = new URLSearchParams(queryString || '')

        if (pathname === '/api/listAccountTypes') {
          try {
            const data = listAccountTypes()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          }
          return
        }

        if (pathname === '/api/listConfiguration') {
          try {
            const data = listConfiguration()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          }
          return
        }

        if (pathname === '/api/getDatabasePath') {
          try {
            const data = getDatabasePathForApp()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          }
          return
        }

        if (pathname === '/api/getConfigurationValue') {
          try {
            const key = searchParams.get('key') || ''
            const data = getConfigurationValue(key) || null
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          }
          return
        }

        if (pathname === '/api/setConfigurationValue' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              setConfigurationValue(parsed.key, parsed.value)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
          return
        }

        if (pathname === '/api/listCategoryTypes') {
          try {
            const data = listCategoryTypes()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          }
          return
        }

        if (pathname === '/api/listCategories') {
          try {
            const data = listCategories()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          }
          return
        }

        if (pathname === '/api/addCategory' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              const categoryId = addCategory(
                parsed.categoryName,
                parsed.categoryGroupId,
                parsed.categoryIcon,
                parsed.categoryColour
              )
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ categoryId }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
            }
          })
          return
        }

        if (pathname === '/api/listAccounts') {
          try {
            const data = listAccounts()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
          }
          return
        }

        if (pathname === '/api/addAccount' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              const accountId = addAccount(
                parsed.accountName,
                parsed.accountTypeId,
                parsed.accountIcon,
                parsed.accountColor
              )
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ accountId }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
            }
          })
          return
        }

        if (pathname === '/api/updateAccount' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              updateAccount(
                parsed.accountId,
                parsed.accountName,
                parsed.accountTypeId,
                parsed.accountIcon,
                parsed.accountColor
              )
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
            }
          })
          return
        }

        if (pathname === '/api/deleteAccount' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              deleteAccount(parsed.accountId)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
            }
          })
          return
        }

        if (pathname === '/api/listTransactionTypes') {
          try {
            const data = listTransactionTypes()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
          }
          return
        }

        if (pathname === '/api/listTransactions') {
          try {
            const data = listTransactions()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
          }
          return
        }

        if (pathname === '/api/addTransaction' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              const timeStamp = addTransaction(
                parsed.transactionTime,
                parsed.transactionTypeId,
                parsed.toAccountId,
                parsed.fromAccountId,
                parsed.categoryId,
                parsed.amount,
                parsed.fees,
                parsed.note
              )
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ timeStamp }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
            }
          })
          return
        }

        next()
      })
    }
  }
}

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [tailwindcss(), react(), devDatabasePlugin()]
  }
})
