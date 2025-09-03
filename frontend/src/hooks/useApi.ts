import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Transaction {
  id: string
  name: string
  price: number
  categories: string[]
  merchant_name: string
  transaction_date: string
}

interface Goal {
  id: string
  title: string
  description: string
  target_amount: number
  current_amount: number
  target_date: string
  status: 'active' | 'completed' | 'paused'
}

interface Insight {
  id: string
  title: string
  message: string
  insight_type: string
  confidence_score: number
  is_read: boolean
  created_at: string
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