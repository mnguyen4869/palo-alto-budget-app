export interface Transaction {
  id: number
  user_id: number
  name: string
  price: number
  category_primary: string | null
  category_detailed: string | null
  category_confidence_level: string | null
  category_icon_url: string | null
  merchant_name: string
  logo_url: string | null
  date_of_transaction: string
  plaid_transaction_id: string | null
  account_id: string | null
  created_at: string
}