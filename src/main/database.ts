/* eslint-disable prettier/prettier */
import electron from 'electron'
import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { join } from 'path'

export type ConfigurationRecord = {
  configuration_id: number
  configuration_key: string
  configuration_value: string
}

export type AccountTypeRecord = {
  account_type_id: number
  account_type: string
  account_type_name: string
}

export type CategoryTypeRecord = {
  category_id: number
  category_type: string
  category_name: string
}

export type CategoryRecord = {
  category_id: number
  category_name: string
  category_amount: number
  category_group_id: number
  category_icon: string
  category_colour: string
}

let db: Database.Database | null = null

type AppLike = {
  getPath: (name: 'userData' | string) => string
}

function getElectronApp(): AppLike | undefined {
  if (typeof electron === 'object' && electron !== null) {
    const pkg = electron as unknown as { app?: AppLike; default?: { app?: AppLike } }
    return pkg.app || pkg.default?.app
  }
  return undefined
}

function getDatabasePath(): string {
  const app = getElectronApp()
  const dataDir = app?.getPath
    ? app.getPath('userData')
    : join(process.env.APPDATA || process.env.HOME || process.cwd(), 'xyvero')
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
    CREATE TABLE IF NOT EXISTS category (
      category_id INTEGER PRIMARY KEY,
      category_name VARCHAR(100) NOT NULL,
      category_amount INTEGER NOT NULL DEFAULT 0,
      category_group_id INTEGER NOT NULL REFERENCES categoryTypes(category_id),
      category_icon VARCHAR(100) NOT NULL DEFAULT 'circle',
      category_colour VARCHAR(7) NOT NULL DEFAULT '#6366f1'
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
  db.pragma('foreign_keys = ON')
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

export function setConfigurationValue(configurationKey: string, configurationValue: string): void {
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

export function listAccountTypes(): AccountTypeRecord[] {
  const database = getDatabase()
  return database
    .prepare(
      `
        SELECT
          account_type_id,
          account_type,
          account_type_name
        FROM accountTypes
        ORDER BY account_type_id ASC
      `
    )
    .all() as AccountTypeRecord[]
}

export function listCategoryTypes(): CategoryTypeRecord[] {
  const database = getDatabase()
  return database
    .prepare(
      `
        SELECT
          category_id,
          category_type,
          category_name
        FROM categoryTypes
        ORDER BY category_id ASC
      `
    )
    .all() as CategoryTypeRecord[]
}

export function listCategories(): CategoryRecord[] {
  const database = getDatabase()
  return database
    .prepare(
      `
        SELECT
          category_id,
          category_name,
          category_amount,
          category_group_id,
          category_icon,
          category_colour
        FROM category
        ORDER BY category_id ASC
      `
    )
    .all() as CategoryRecord[]
}

export function addCategory(
  categoryName: string,
  categoryAmount: number,
  categoryGroupId: number,
  categoryIcon: string,
  categoryColour: string
): number {
  const database = getDatabase()
  const result = database
    .prepare(
      `
        INSERT INTO category (
          category_name,
          category_amount,
          category_group_id,
          category_icon,
          category_colour
        ) VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(categoryName, categoryAmount, categoryGroupId, categoryIcon, categoryColour)
  return result.lastInsertRowid as number
}
