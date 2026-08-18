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
  setConfigurationValue
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
