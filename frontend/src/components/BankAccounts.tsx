import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import PlaidLink from './PlaidLink'

interface BankAccount {
  id: string
  name: string
  account_type: string
  institution_name: string
  is_active: boolean
  created_at: string
}

const BankAccounts: React.FC = () => {
  const { token } = useAuth()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:8000/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      } else {
        setError('Failed to fetch accounts')
      }
    } catch (error) {
      setError('Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchAccounts()
    }
  }, [token])

  const handlePlaidSuccess = () => {
    fetchAccounts()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAccountTypeColor = (accountType: string) => {
    switch (accountType.toLowerCase()) {
      case 'checking': return 'bg-orange-100 text-orange-800'
      case 'savings': return 'bg-green-100 text-green-800'
      case 'credit': return 'bg-purple-100 text-purple-800'
      case 'investment': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Connected Bank Accounts</h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect your bank accounts to automatically sync transactions
          </p>
        </div>
        <PlaidLink
          onSuccess={handlePlaidSuccess}
          className="bg-orange-600 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No bank accounts connected</h4>
          <p className="text-gray-600 mb-4">
            Connect your first bank account to start tracking your financial data automatically.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
            <div className="flex">
              <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h5 className="text-sm font-medium text-orange-800 mb-1">Secure Bank-Level Encryption</h5>
                <p className="text-sm text-orange-700">
                  Your banking credentials are encrypted and never stored on our servers. 
                  We use Plaid's secure infrastructure, trusted by thousands of financial institutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{account.name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountTypeColor(account.account_type)}`}>
                      {account.account_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{account.institution_name}</p>
                  <p className="text-xs text-gray-500">Connected on {formatDate(account.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                {account.is_active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-1.5 h-1.5 mr-1" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <svg className="w-1.5 h-1.5 mr-1" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                    Inactive
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-900 mb-2">About Bank Connections</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Transactions are automatically synced and categorized</li>
          <li>• Your banking credentials are never stored on our servers</li>
          <li>• You can disconnect accounts at any time</li>
          <li>• All data is encrypted with bank-level security</li>
        </ul>
      </div>
    </div>
  )
}

export default BankAccounts