import React, { useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTransactions } from '../hooks/useApi'
import BankAccounts from '../components/BankAccounts'

interface SubscriptionPattern {
  merchantName: string
  amount: number
  frequency: 'weekly' | 'monthly' | 'yearly'
  transactionCount: number
  avgAmount: number
  lastSeen: string
  category: string
}

const Settings: React.FC = () => {
  const { user, logout } = useAuth()
  const { transactions } = useTransactions()
  const [activeTab, setActiveTab] = useState<'profile' | 'subscriptions' | 'privacy' | 'accounts'>('profile')

  const detectedSubscriptions = useMemo(() => {
    const merchantData: { [key: string]: { transactions: any[], amounts: number[], dates: string[] } } = {}

    transactions.forEach(transaction => {
      if (transaction.price < 0) {
        const merchant = transaction.merchant_name
        if (!merchantData[merchant]) {
          merchantData[merchant] = { transactions: [], amounts: [], dates: [] }
        }
        merchantData[merchant].transactions.push(transaction)
        merchantData[merchant].amounts.push(Math.abs(transaction.price))
        merchantData[merchant].dates.push(transaction.transaction_date)
      }
    })

    const subscriptions: SubscriptionPattern[] = []

    Object.entries(merchantData).forEach(([merchantName, data]) => {
      if (data.transactions.length >= 2) {
        const amounts = data.amounts
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
        const amountVariance = amounts.reduce((acc, amt) => acc + Math.abs(amt - avgAmount), 0) / amounts.length

        if (amountVariance < avgAmount * 0.1) {
          const sortedDates = data.dates.sort()
          const intervals = []
          for (let i = 1; i < sortedDates.length; i++) {
            const days = Math.abs(new Date(sortedDates[i]).getTime() - new Date(sortedDates[i-1]).getTime()) / (1000 * 60 * 60 * 24)
            intervals.push(days)
          }

          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
          let frequency: 'weekly' | 'monthly' | 'yearly'

          if (avgInterval <= 10) frequency = 'weekly'
          else if (avgInterval <= 40) frequency = 'monthly'
          else frequency = 'yearly'

          const category = data.transactions[0].categories[0]?.replace('_', ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Other'

          subscriptions.push({
            merchantName,
            amount: Math.round(avgAmount * 100) / 100,
            frequency,
            transactionCount: data.transactions.length,
            avgAmount: Math.round(avgAmount * 100) / 100,
            lastSeen: sortedDates[sortedDates.length - 1],
            category
          })
        }
      }
    })

    return subscriptions.sort((a, b) => b.avgAmount - a.avgAmount)
  }, [transactions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'bg-red-100 text-red-800'
      case 'monthly': return 'bg-yellow-100 text-yellow-800'
      case 'yearly': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateMonthlyTotal = () => {
    return detectedSubscriptions.reduce((total, sub) => {
      switch (sub.frequency) {
        case 'weekly': return total + (sub.amount * 4.33)
        case 'monthly': return total + sub.amount
        case 'yearly': return total + (sub.amount / 12)
        default: return total
      }
    }, 0)
  }

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  )

  const renderSubscriptionSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Detection</h3>
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-orange-800">
              We analyze your transactions to detect recurring payments and subscriptions automatically.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{detectedSubscriptions.length}</p>
            <p className="text-sm text-gray-600">Detected Subscriptions</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateMonthlyTotal())}</p>
            <p className="text-sm text-gray-600">Estimated Monthly Total</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(calculateMonthlyTotal() * 12)}</p>
            <p className="text-sm text-gray-600">Estimated Yearly Total</p>
          </div>
        </div>
      </div>

      {detectedSubscriptions.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h8z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions detected</h3>
          <p className="text-gray-600">Add more transaction data to detect recurring payments and subscriptions.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detected Subscriptions</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Charge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detectedSubscriptions.map((subscription, index) => {
                  const monthlyCost = subscription.frequency === 'weekly' ? subscription.amount * 4.33 :
                                   subscription.frequency === 'monthly' ? subscription.amount :
                                   subscription.amount / 12

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.merchantName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.transactionCount} transactions detected
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(subscription.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(subscription.frequency)}`}>
                          {subscription.frequency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(subscription.lastSeen)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(monthlyCost)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detectedSubscriptions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Subscription Management Tips
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Review your subscriptions regularly to avoid unwanted charges</li>
                  <li>Consider canceling services you don't use frequently</li>
                  <li>Look for annual plans that offer better value than monthly billing</li>
                  <li>Set calendar reminders for free trial endings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Privacy</h3>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-green-800">Secure Data Handling</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your financial data is encrypted and stored securely. We never share your personal information with third parties.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Data Usage</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transaction Analysis</span>
                <span className="text-sm text-green-600 font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Spending Insights</span>
                <span className="text-sm text-green-600 font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Goal Forecasting</span>
                <span className="text-sm text-green-600 font-medium">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Password Protection</h4>
              <p className="text-sm text-gray-600">Your account is protected with encrypted password storage</p>
            </div>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Session Management</h4>
              <p className="text-sm text-gray-600">Automatic logout after inactivity</p>
            </div>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account, subscriptions, and privacy preferences</p>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-2 border-b-2 font-medium text-sm ${
              activeTab === 'accounts'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Bank Accounts
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-2 border-b-2 font-medium text-sm ${
              activeTab === 'subscriptions'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2 border-b-2 font-medium text-sm ${
              activeTab === 'privacy'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Privacy & Security
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'profile' && renderProfileSettings()}
        {activeTab === 'accounts' && <BankAccounts />}
        {activeTab === 'subscriptions' && renderSubscriptionSettings()}
        {activeTab === 'privacy' && renderPrivacySettings()}
      </div>
    </div>
  )
}

export default Settings