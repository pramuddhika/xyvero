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
      category_group_id INTEGER NOT NULL REFERENCES categoryTypes(category_id),
      category_icon VARCHAR(100) NOT NULL DEFAULT 'circle',
      category_colour VARCHAR(7) NOT NULL DEFAULT '#6366f1',
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_category_active_name ON category (category_name) WHERE is_active = 1;

    CREATE TABLE IF NOT EXISTS accounts (
      account_id INTEGER PRIMARY KEY,
      account_name VARCHAR(100) NOT NULL,
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
      from_account_id INTEGER REFERENCES accounts(account_id),
      category_id INTEGER REFERENCES category(category_id),
      amount REAL NOT NULL,
      fees REAL,
      note VARCHAR(200) NOT NULL
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
      category_group_id,
      category_icon,
      category_colour,
      is_active
    )
    VALUES
      (1, 'Salary', 1, 'salary', '#12B886', 1),
      (2, 'Freelance', 1, 'freelance', '#339AF0', 1),
      (3, 'Investment', 1, 'investment', '#845EF7', 1),
      (4, 'Other Income', 1, 'other', '#FCC419', 1),
      (5, 'Food', 2, 'food', '#FA5252', 1),
      (6, 'Transport', 2, 'transport', '#FD7E14', 1),
      (7, 'Entertainment', 2, 'entertainment', '#E64980', 1),
      (8, 'Other Expense', 2, 'other', '#868E96', 1);

    INSERT OR IGNORE INTO accounts (
      account_id,
      account_name,
      account_type_id,
      account_color,
      account_icon,
      is_active
    )
    VALUES
      (1, 'Wallet', 1, '#12B886', 'wallet', 1),
      (2, 'Bank Account', 2, '#339AF0', 'bank', 1),
      (3, 'Piggy Bank', 3, '#F783AC', 'savings', 1);

    INSERT OR IGNORE INTO transactionTypes (transaction_type_id, transaction_type_name)
    VALUES
      (1, 'Income'),
      (2, 'Expense'),
      (3, 'Transfer');
  `)
}

function migrateTransactionsTable(database: Database.Database): void {
  try {
    const tableInfo = database.prepare("PRAGMA table_info('transactions')").all() as Array<{
      cid: number
      name: string
      type: string
      notnull: number
      dflt_value: unknown
      pk: number
    }>

    if (!tableInfo || tableInfo.length === 0) {
      return
    }

    const fromAccCol = tableInfo.find((col) => col.name === 'from_account_id')
    const categoryCol = tableInfo.find((col) => col.name === 'category_id')

    // If from_account_id or category_id has notnull === 1 in existing SQLite table on disk, migrate it
    if ((fromAccCol && fromAccCol.notnull === 1) || (categoryCol && categoryCol.notnull === 1)) {
      database.pragma('foreign_keys = OFF')
      database.exec(`
        CREATE TABLE IF NOT EXISTS transactions_migration (
          time_stamp DATETIME PRIMARY KEY,
          transaction_time DATETIME NOT NULL,
          transaction_type_id INTEGER NOT NULL REFERENCES transactionTypes(transaction_type_id),
          to_account_id INTEGER NOT NULL REFERENCES accounts(account_id),
          from_account_id INTEGER REFERENCES accounts(account_id),
          category_id INTEGER REFERENCES category(category_id),
          amount REAL NOT NULL,
          fees REAL,
          note VARCHAR(200) NOT NULL
        );

        INSERT INTO transactions_migration (
          time_stamp,
          transaction_time,
          transaction_type_id,
          to_account_id,
          from_account_id,
          category_id,
          amount,
          fees,
          note
        )
        SELECT
          time_stamp,
          transaction_time,
          transaction_type_id,
          to_account_id,
          from_account_id,
          category_id,
          amount,
          fees,
          COALESCE(note, '')
        FROM transactions;

        DROP TABLE transactions;
        ALTER TABLE transactions_migration RENAME TO transactions;
      `)
      database.pragma('foreign_keys = ON')
    }
  } catch (err) {
    console.error('Migration error for transactions table:', err)
    try {
      database.pragma('foreign_keys = ON')
    } catch {
      // ignore
    }
  }
}

export function getDatabase(): Database.Database {
  if (db) {
    return db
  }

  db = new Database(getDatabasePath())
  db.pragma('foreign_keys = ON')
  createTables(db)
  migrateTransactionsTable(db)
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

export function getAccountingPeriodRange(
  monthStartDay: number = 1,
  refDate: Date = new Date()
): { startStr: string; endStr: string; startDate: Date; endDate: Date } {
  const currentYear = refDate.getFullYear()
  const currentMonth = refDate.getMonth()
  const currentDate = refDate.getDate()

  let startYear = currentYear
  let startMonth = currentMonth

  if (currentDate < monthStartDay) {
    startMonth = currentMonth - 1
    if (startMonth < 0) {
      startMonth = 11
      startYear -= 1
    }
  }

  // Days in start month
  const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate()
  const actualStartDay = Math.min(monthStartDay, daysInStartMonth)

  const startDate = new Date(startYear, startMonth, actualStartDay, 0, 0, 0, 0)

  let endYear = startYear
  let endMonth = startMonth + 1
  if (endMonth > 11) {
    endMonth = 0
    endYear += 1
  }

  const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate()
  const targetEndDay = monthStartDay - 1

  let actualEndDay: number
  let actualEndMonth: number
  let actualEndYear: number

  if (targetEndDay <= 0) {
    actualEndDay = daysInStartMonth
    actualEndMonth = startMonth
    actualEndYear = startYear
  } else {
    actualEndDay = Math.min(targetEndDay, daysInEndMonth)
    actualEndMonth = endMonth
    actualEndYear = endYear
  }

  const endDate = new Date(actualEndYear, actualEndMonth, actualEndDay, 23, 59, 59, 999)

  const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`)
  const startStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`
  const endStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T23:59:59.999`

  return { startStr, endStr, startDate, endDate }
}

export function getMonthStartDay(): number {
  const config = getConfigurationValue('MONTH_START_DATE')
  if (config && config.configuration_value) {
    const parsed = parseInt(config.configuration_value, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
      return parsed
    }
  }
  return 1
}

export function listCategories(): CategoryRecord[] {
  const database = getDatabase()
  const monthStartDay = getMonthStartDay()
  const { startStr, endStr } = getAccountingPeriodRange(monthStartDay)

  return database
    .prepare(
      `
        SELECT
          c.category_id,
          c.category_name,
          c.category_group_id,
          c.category_icon,
          c.category_colour,
          c.is_active,
          ROUND(
            COALESCE((
              SELECT SUM(t.amount)
              FROM transactions t
              WHERE t.category_id = c.category_id
                AND t.transaction_time >= ?
                AND t.transaction_time <= ?
            ), 0.00),
            2
          ) AS category_amount
        FROM category c
        WHERE c.is_active = 1
        ORDER BY c.category_id ASC
      `
    )
    .all(startStr, endStr) as CategoryRecord[]
}

export function addCategory(
  categoryName: string,
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

  const result = database
    .prepare(
      `
        INSERT INTO category (
          category_name,
          category_group_id,
          category_icon,
          category_colour,
          is_active
        ) VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(trimmedName, categoryGroupId, categoryIcon, categoryColour, isActive ? 1 : 0)
  return result.lastInsertRowid as number
}

export function listAccounts(): AccountRecord[] {
  const database = getDatabase()
  const monthStartDay = getMonthStartDay()
  const { startStr, endStr } = getAccountingPeriodRange(monthStartDay)

  return database
    .prepare(
      `
        SELECT
          a.account_id,
          a.account_name,
          a.account_type_id,
          a.account_color,
          a.account_icon,
          a.is_active,
          ROUND(
            COALESCE((
              SELECT SUM(t.amount)
              FROM transactions t
              WHERE t.to_account_id = a.account_id
                AND t.transaction_type_id IN (1, 3)
                AND t.transaction_time >= ?
                AND t.transaction_time <= ?
            ), 0.00)
            -
            COALESCE((
              SELECT SUM(t.amount)
              FROM transactions t
              WHERE t.to_account_id = a.account_id
                AND t.transaction_type_id = 2
                AND t.transaction_time >= ?
                AND t.transaction_time <= ?
            ), 0.00)
            -
            COALESCE((
              SELECT SUM(t.amount + COALESCE(t.fees, 0))
              FROM transactions t
              WHERE t.from_account_id = a.account_id
                AND t.transaction_type_id = 3
                AND t.transaction_time >= ?
                AND t.transaction_time <= ?
            ), 0.00),
            2
          ) AS account_amount
        FROM accounts a
        WHERE a.is_active = 1
        ORDER BY a.account_id ASC
      `
    )
    .all(startStr, endStr, startStr, endStr, startStr, endStr) as AccountRecord[]
}

export function addAccount(
  accountName: string,
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

  const result = database
    .prepare(
      `
        INSERT INTO accounts (
          account_name,
          account_type_id,
          account_icon,
          account_color,
          is_active
        ) VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(trimmedName, accountTypeId, accountIcon, accountColor, isActive ? 1 : 0)
  return result.lastInsertRowid as number
}

export function updateAccount(
  accountId: number,
  accountName: string,
  accountTypeId: number,
  accountIcon: string,
  accountColor: string
): void {
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
        WHERE LOWER(account_name) = LOWER(?) AND is_active = 1 AND account_id != ?
        LIMIT 1
      `
    )
    .get(trimmedName, accountId)

  if (existing) {
    throw new Error(`An active account named "${trimmedName}" already exists.`)
  }

  database
    .prepare(
      `
        UPDATE accounts
        SET
          account_name = ?,
          account_type_id = ?,
          account_icon = ?,
          account_color = ?
        WHERE account_id = ?
      `
    )
    .run(trimmedName, accountTypeId, accountIcon, accountColor, accountId)
}

export type TransactionTypeRecord = {
  transaction_type_id: number
  transaction_type_name: string
}

export type TransactionRecord = {
  time_stamp: string
  transaction_time: string
  transaction_type_id: number
  to_account_id: number
  from_account_id?: number | null
  category_id?: number | null
  amount: number
  fees?: number | null
  note: string
}

export function listTransactionTypes(): TransactionTypeRecord[] {
  const database = getDatabase()
  return database
    .prepare(
      `
        SELECT transaction_type_id, transaction_type_name
        FROM transactionTypes
        ORDER BY transaction_type_id ASC
      `
    )
    .all() as TransactionTypeRecord[]
}

export function listTransactions(): TransactionRecord[] {
  const database = getDatabase()
  return database
    .prepare(
      `
        SELECT
          time_stamp,
          transaction_time,
          transaction_type_id,
          to_account_id,
          from_account_id,
          category_id,
          amount,
          fees,
          note
        FROM transactions
        ORDER BY transaction_time DESC, time_stamp DESC
      `
    )
    .all() as TransactionRecord[]
}

export function addTransaction(
  transactionTime: string,
  transactionTypeId: number,
  toAccountId: number,
  fromAccountId: number | null | undefined,
  categoryId: number | null | undefined,
  amount: number,
  fees: number = 0,
  note: string
): string {
  const database = getDatabase()
  const trimmedNote = note.trim()
  if (!trimmedNote) {
    throw new Error('Transaction note is required.')
  }
  if (!toAccountId) {
    throw new Error('To Account is required.')
  }
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0.')
  }

  // For Income (1) and Expense (2), fromAccountId is null
  // For Transfer (3), categoryId is null and fromAccountId is required
  const finalFromAccountId =
    transactionTypeId === 3 && fromAccountId ? Number(fromAccountId) : null
  const finalCategoryId =
    transactionTypeId !== 3 && categoryId ? Number(categoryId) : null

  if (transactionTypeId === 3 && !finalFromAccountId) {
    throw new Error('From Account is required for Transfer transactions.')
  }

  // System-generated ISO timestamp recording time
  const timeStamp = new Date().toISOString()
  const cleanAmount = parseFloat(Number(amount).toFixed(2))
  const cleanFees = parseFloat(Number(fees || 0).toFixed(2))

  database
    .prepare(
      `
        INSERT INTO transactions (
          time_stamp,
          transaction_time,
          transaction_type_id,
          to_account_id,
          from_account_id,
          category_id,
          amount,
          fees,
          note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      timeStamp,
      transactionTime,
      transactionTypeId,
      toAccountId,
      finalFromAccountId,
      finalCategoryId,
      cleanAmount,
      cleanFees,
      trimmedNote
    )

  return timeStamp
}
