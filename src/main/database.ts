/* eslint-disable prettier/prettier */
import { app } from 'electron'
import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { join } from 'path'

export type ConfigurationRecord = {
  configuration_id: number
  configuration_key: string
  configuration_value: string
}

let db: Database.Database | null = null

function getDatabasePath(): string {
  const dataDir = app.getPath('userData')
  mkdirSync(dataDir, { recursive: true })
  return join(dataDir, 'xyvero.sqlite')
}

function createTables(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS configuration (
      configuration_id INTEGER PRIMARY KEY,
      configuration_key VARCHAR(200) NOT NULL UNIQUE,
      configuration_value VARCHAR(100) NOT NULL
    )
  `)

  database.exec(`
    INSERT OR IGNORE INTO configuration (configuration_id, configuration_key, configuration_value)
    VALUES
      (1, 'CURRENCY_TYPE', 'USD'),
      (2, 'MONTH_START_DATE', '1'),
      (3, 'WEEK_START_DATE', 'Monday'),
      (4, 'THEME', 'dark'),
      (5, 'FIRST_VIEW', 'Calendar')
  `)
}

export function getDatabase(): Database.Database {
  if (db) {
    return db
  }

  db = new Database(getDatabasePath())
  createTables(db)
  return db
}

export function getDatabasePathForApp(): string {
  return getDatabasePath()
}

export function listConfiguration(): ConfigurationRecord[] {
  const database = getDatabase()
  return database
    .prepare(
      `
        SELECT
          configuration_id,
          configuration_key,
          configuration_value
        FROM configuration
        ORDER BY configuration_id ASC
      `
    )
    .all() as ConfigurationRecord[]
}
