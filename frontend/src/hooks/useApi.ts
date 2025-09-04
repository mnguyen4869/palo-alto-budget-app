import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { Transaction } from '../types/transaction'
import type { Insight } from '../types/insight'

interface Goal {
  id: string
  title: string
  description: string
  target_amount: number
  current_amount: number
  target_date: string
  status: 'active' | 'completed' | 'paused'
}


interface BankAccount {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  institution_name: string
  mask: string
  is_active: boolean
  created_at: string
}

interface IncomeStream {
  account_id: string
  account_name: string
  name: string
  monthly_income: number
  confidence: number
  days_available: number
  frequency: string
}

interface IncomeData {
  message: string
  income_streams: IncomeStream[]
  total_monthly_income: number
  stream_count: number
}

interface SyncResult {
  message: string
  transaction_count?: number
  status: string
}

export const useTransactions = () => {
  const { token } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) return

      try {
        const response = await fetch('http://localhost:8000/transactions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setTransactions(data)
        } else {
          setError('Failed to fetch transactions')
        }
      } catch (error) {
        setError('Failed to fetch transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [token])

  return { transactions, loading, error, setTransactions }
}

export const useGoals = () => {
  const { token } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGoals = async () => {
      if (!token) return

      try {
        const response = await fetch('http://localhost:8000/goals', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setGoals(data)
        } else {
          setError('Failed to fetch goals')
        }
      } catch (error) {
        setError('Failed to fetch goals')
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [token])

  return { goals, loading, error, setGoals }
}

export const useInsights = () => {
  const { token } = useAuth()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      if (!token) return

      try {
        const response = await fetch('http://localhost:8000/insights', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setInsights(data)
        } else {
          setError('Failed to fetch insights')
        }
      } catch (error) {
        setError('Failed to fetch insights')
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [token])

  return { insights, loading, error, setInsights }
}

export const useBankAccounts = () => {
  const { token } = useAuth()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
        setError(null)
      } else {
        setError('Failed to fetch bank accounts')
      }
    } catch (error) {
      setError('Failed to fetch bank accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [token])

  const removeAccount = async (accountId: string): Promise<void> => {
    if (!token) throw new Error('No authentication token')

    const response = await fetch(`http://localhost:8000/accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to remove bank account')
    }

    // Refresh accounts list after successful removal
    await fetchAccounts()
  }

  return { accounts, loading, error, refetch: fetchAccounts, removeAccount }
}

export const usePlaidSync = () => {
  const { token } = useAuth()

  const syncTransactions = async (): Promise<SyncResult> => {
    if (!token) throw new Error('No authentication token')

    const response = await fetch('http://localhost:8000/plaid/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to sync transactions')
    }

    return response.json()
  }

  const syncIncome = async (): Promise<IncomeData> => {
    if (!token) throw new Error('No authentication token')

    const response = await fetch('http://localhost:8000/plaid/income', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to sync income data')
    }

    return response.json()
  }

  return { syncTransactions, syncIncome }
}

export const useIncomeData = () => {
  const { token } = useAuth()
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIncomeData = async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://localhost:8000/income/analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setIncomeData(data)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to fetch income data')
      }
    } catch (error) {
      setError('Failed to fetch income data')
    } finally {
      setLoading(false)
    }
  }

  return { incomeData, loading, error, fetchIncomeData }
}