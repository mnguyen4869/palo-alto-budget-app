import React, { useState } from 'react'
import { useBankAccounts, usePlaidSync } from '../hooks/useApi'
import PlaidLink from './PlaidLink'

const BankAccounts: React.FC = () => {
  const { accounts, loading, error, refetch, removeAccount } = useBankAccounts()
  const { syncTransactions } = usePlaidSync()
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [removingAccount, setRemovingAccount] = useState<string | null>(null)

  const handlePlaidSuccess = async () => {
    // Refetch accounts first
    await refetch()
    
    // Auto-sync transactions after successful bank connection
    try {
      setSyncing(true)
      setSyncMessage('Syncing your transaction data...')
      const result = await syncTransactions()
      setSyncMessage(`Success! ${result.transaction_count || 0} transactions synced.`)
      setTimeout(() => setSyncMessage(null), 5000)
    } catch (error) {
      setSyncMessage('Note: Transaction sync will be available after account setup is complete.')
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncTransactions = async () => {
    try {
      setSyncing(true)
      setSyncMessage('Syncing transactions...')
      const result = await syncTransactions()
      setSyncMessage(`Success! ${result.transaction_count || 0} transactions synced.`)
      setTimeout(() => setSyncMessage(null), 5000)
    } catch (error: any) {
      setSyncMessage(`Sync failed: ${error.message}`)
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  const handleRemoveAccount = async (accountId: string, accountName: string) => {
    if (!window.confirm(`Are you sure you want to disconnect "${accountName}"? This will remove access to transaction data from this account.`)) {
      return
    }

    try {
      setRemovingAccount(accountId)
      await removeAccount(accountId)
      setSyncMessage(`Successfully disconnected "${accountName}"`)
      setTimeout(() => setSyncMessage(null), 5000)
    } catch (error: any) {
      setSyncMessage(`Failed to disconnect account: ${error.message}`)
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setRemovingAccount(null)
    }
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
        <div className="flex gap-2">
          <PlaidLink
            onSuccess={handlePlaidSuccess}
            className="bg-orange-600 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          />
          {accounts.length > 0 && (
            <button
              onClick={handleSyncTransactions}
              disabled={syncing}
              className={`px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                syncing 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {syncing ? 'Syncing...' : 'Sync Transactions'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {syncMessage && (
        <div className={`mb-4 p-3 rounded ${
          syncMessage.includes('Success') || syncMessage.includes('synced')
            ? 'bg-green-100 border border-green-400 text-green-700'
            : syncMessage.includes('failed') || syncMessage.includes('Sync failed')
            ? 'bg-red-100 border border-red-400 text-red-700'
            : 'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          {syncMessage}
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
                    <h4 className="font-medium text-gray-900">{account.account_name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountTypeColor(account.account_type)}`}>
                      {account.account_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{account.institution_name}</p>
                  <p className="text-xs text-gray-500">Connected on {formatDate(account.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
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
                
                <button
                  onClick={() => handleRemoveAccount(account.id, account.account_name)}
                  disabled={removingAccount === account.id}
                  className={`p-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                    removingAccount === account.id
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  }`}
                  title="Disconnect account"
                >
                  {removingAccount === account.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
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
        </ul>
      </div>
    </div>
  )
}

export default BankAccounts
