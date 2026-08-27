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
  is_active: number
}

export type AccountRecord = {
  account_id: number
  account_name: string
  account_amount: number
  account_type_id: number
  account_color: string
  account_icon: string
  is_active: number
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
      category_amount REAL NOT NULL DEFAULT 0.00,
      category_group_id INTEGER NOT NULL REFERENCES categoryTypes(category_id),
      category_icon VARCHAR(100) NOT NULL DEFAULT 'circle',
      category_colour VARCHAR(7) NOT NULL DEFAULT '#6366f1',
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_category_active_name ON category (category_name) WHERE is_active = 1;

    CREATE TABLE IF NOT EXISTS accounts (
      account_id INTEGER PRIMARY KEY,
      account_name VARCHAR(100) NOT NULL,
      account_amount REAL NOT NULL DEFAULT 0.00,
      account_type_id INTEGER NOT NULL REFERENCES accountTypes(account_type_id),
      account_color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
      account_icon VARCHAR(100) NOT NULL DEFAULT 'circle',
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_active_name ON accounts (account_name) WHERE is_active = 1;

    CREATE TABLE IF NOT EXISTS transactionTypes (
      transaction_type_id INTEGER PRIMARY KEY,
      transaction_type_name VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      time_stamp DATETIME PRIMARY KEY,
      transaction_time DATETIME NOT NULL,
      transaction_type_id INTEGER NOT NULL REFERENCES transactionTypes(transaction_type_id),
      to_account_id INTEGER NOT NULL REFERENCES accounts(account_id),
      from_account_id INTEGER NOT NULL REFERENCES accounts(account_id),
      category_id INTEGER NOT NULL REFERENCES category(category_id),
      amount REAL NOT NULL,
      fees REAL,
      note VARCHAR(200)
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
      (1, 'IN', 'Income'),
      (2, 'OUT', 'Expense');

    INSERT OR IGNORE INTO category (
      category_id,
      category_name,
      category_amount,
      category_group_id,
      category_icon,
      category_colour,
      is_active
    )
    VALUES
      (1, 'Salary', 0.00, 1, 'salary', '#12B886', 1),
      (2, 'Freelance', 0.00, 1, 'freelance', '#339AF0', 1),
      (3, 'Investment', 0.00, 1, 'investment', '#845EF7', 1),
      (4, 'Other Income', 0.00, 1, 'other', '#FCC419', 1),
      (5, 'Food', 0.00, 2, 'food', '#FA5252', 1),
      (6, 'Transport', 0.00, 2, 'transport', '#FD7E14', 1),
      (7, 'Entertainment', 0.00, 2, 'entertainment', '#E64980', 1),
      (8, 'Other Expense', 0.00, 2, 'other', '#868E96', 1);

    INSERT OR IGNORE INTO accounts (
      account_id,
      account_name,
      account_amount,
      account_type_id,
      account_color,
      account_icon,
      is_active
    )
    VALUES
      (1, 'Wallet', 0.00, 1, '#12B886', 'wallet', 1),
      (2, 'Bank Account', 0.00, 2, '#339AF0', 'bank', 1),
      (3, 'Piggy Bank', 0.00, 3, '#F783AC', 'savings', 1);

    INSERT OR IGNORE INTO transactionTypes (transaction_type_id, transaction_type_name)
    VALUES
      (1, 'Income'),
      (2, 'Expense'),
      (3, 'Transfer');
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
          category_colour,
          is_active
        FROM category
        WHERE is_active = 1
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
  categoryColour: string,
  isActive: number = 1
): number {
  const database = getDatabase()
  const trimmedName = categoryName.trim()
  if (!trimmedName) {
    throw new Error('Category name cannot be empty.')
  }
  if (trimmedName.length > 50) {
    throw new Error('Category name cannot exceed 50 characters.')
  }

  const existing = database
    .prepare(
      `
        SELECT category_id
        FROM category
        WHERE LOWER(category_name) = LOWER(?) AND is_active = 1
        LIMIT 1
      `
    )
    .get(trimmedName)

  if (existing) {
    throw new Error(`An active category named "${trimmedName}" already exists.`)
  }

  const cleanAmount = parseFloat(Number(categoryAmount || 0).toFixed(2))
  const result = database
    .prepare(
      `
        INSERT INTO category (
          category_name,
          category_amount,
          category_group_id,
          category_icon,
          category_colour,
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(trimmedName, cleanAmount, categoryGroupId, categoryIcon, categoryColour, isActive ? 1 : 0)
  return result.lastInsertRowid as number
}

export function listAccounts(): AccountRecord[] {
  const database = getDatabase()
  return database
    .prepare(
      `
        SELECT
          account_id,
          account_name,
          account_amount,
          account_type_id,
          account_color,
          account_icon,
          is_active
        FROM accounts
        WHERE is_active = 1
        ORDER BY account_id ASC
      `
    )
    .all() as AccountRecord[]
}

export function addAccount(
  accountName: string,
  accountAmount: number,
  accountTypeId: number,
  accountIcon: string,
  accountColor: string,
  isActive: number = 1
): number {
  const database = getDatabase()
  const trimmedName = accountName.trim()
  if (!trimmedName) {
    throw new Error('Account name cannot be empty.')
  }
  if (trimmedName.length > 50) {
    throw new Error('Account name cannot exceed 50 characters.')
  }

  const existing = database
    .prepare(
      `
        SELECT account_id
        FROM accounts
        WHERE LOWER(account_name) = LOWER(?) AND is_active = 1
        LIMIT 1
      `
    )
    .get(trimmedName)

  if (existing) {
    throw new Error(`An active account named "${trimmedName}" already exists.`)
  }

  const cleanAmount = parseFloat(Number(accountAmount || 0).toFixed(2))
  const result = database
    .prepare(
      `
        INSERT INTO accounts (
          account_name,
          account_amount,
          account_type_id,
          account_icon,
          account_color,
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(trimmedName, cleanAmount, accountTypeId, accountIcon, accountColor, isActive ? 1 : 0)
  return result.lastInsertRowid as number
}
