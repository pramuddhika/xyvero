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
    );
    CREATE TABLE IF NOT EXISTS accountTypes (
      account_type_id INTEGER PRIMARY KEY,
      account_type VARCHAR(100) NOT NULL,
      account_type_name VARCHAR(100) NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS categoryTypes (
      category_id INTEGER PRIMARY KEY,
      category_type VARCHAR(100) NOT NULL,
      category_name VARCHAR(100) NOT NULL UNIQUE
    );
  `)
 
  database.exec(`
    INSERT OR IGNORE INTO configuration (configuration_id, configuration_key, configuration_value)
    VALUES
      (1, 'CURRENCY_TYPE', 'USD'),
      (2, 'MONTH_START_DATE', '1'),
      (3, 'WEEK_START_DATE', 'Monday'),
      (4, 'THEME', 'dark'),
      (5, 'FIRST_VIEW', 'Calendar');

    INSERT OR IGNORE INTO accountTypes (account_type_id, account_type, account_type_name)
    VALUES
      (1, 'CASH', 'Cash'),
      (2, 'ACCOUNT', 'Accounts'),
      (3, 'SAVING', 'Savings'),
      (4, 'INVESTMENT', 'Investments'),
      (5, 'LOAN', 'Loans'),
      (6, 'CARD', 'Cards'),
      (7, 'OTHER', 'Other');

    INSERT OR IGNORE INTO categoryTypes (category_id, category_type, category_name)
    VALUES
      (1, 'IN', 'In'),
      (2, 'OUT', 'Out');
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

export function getConfigurationValue(configurationKey: string): ConfigurationRecord | undefined {
  const database = getDatabase()
  return database
    .prepare(
      `
        SELECT
          configuration_id,
          configuration_key,
          configuration_value
        FROM configuration
        WHERE configuration_key = ?
        LIMIT 1
      `
    )
    .get(configurationKey) as ConfigurationRecord | undefined
}

export function setConfigurationValue(
  configurationKey: string,
  configurationValue: string
): void {
  const database = getDatabase()
  database
    .prepare(
      `
        INSERT INTO configuration (configuration_key, configuration_value)
        VALUES (?, ?)
        ON CONFLICT(configuration_key) DO UPDATE SET
          configuration_value = excluded.configuration_value
      `
    )
    .run(configurationKey, configurationValue)
}
