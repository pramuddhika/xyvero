// ─── Configuration ────────────────────────────────────────────────────────────

export type ConfigurationRecord = {
  configuration_id: number
  configuration_key: string
  configuration_value: string
}

export type ConfigurationKey =
  | 'CURRENCY_TYPE'
  | 'MONTH_START_DATE'
  | 'WEEK_START_DATE'
  | 'FIRST_VIEW'
  | 'THEME'

// ─── Account Types ────────────────────────────────────────────────────────────

export type AccountTypeRecord = {
  account_type_id: number
  account_type: string
  account_type_name: string
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

// ─── Category Types ───────────────────────────────────────────────────────────

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

// ─── Transaction Types ────────────────────────────────────────────────────────

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

