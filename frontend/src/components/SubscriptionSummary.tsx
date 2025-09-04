import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Transaction } from '../types/transaction'

interface SubscriptionPattern {
  merchantName: string
  amount: number
  frequency: 'weekly' | 'monthly' | 'yearly'
  transactionCount: number
  avgAmount: number
  lastSeen: string
  category: string
}

interface SubscriptionSummaryProps {
  transactions: Transaction[]
}

const SubscriptionSummary: React.FC<SubscriptionSummaryProps> = ({ transactions }) => {
  const detectedSubscriptions = useMemo(() => {
    const merchantData: { [key: string]: { transactions: any[], amounts: number[], dates: string[] } } = {}

    transactions.forEach(transaction => {
      if (Number(transaction.price) > 0) {  // Expenses are now positive amounts
        const merchant = transaction.merchant_name
        if (!merchantData[merchant]) {
          merchantData[merchant] = { transactions: [], amounts: [], dates: [] }
        }
        merchantData[merchant].transactions.push(transaction)
        merchantData[merchant].amounts.push(Number(transaction.price))
        merchantData[merchant].dates.push(transaction.date_of_transaction)
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

          const category = (data.transactions[0].category_primary || data.transactions[0].category_detailed)?.replace('_', ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Other'

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'bg-red-100 text-red-800'
      case 'monthly': return 'bg-yellow-100 text-yellow-800'
      case 'yearly': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const topSubscriptions = detectedSubscriptions.slice(0, 3)

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h8z" clipRule="evenodd" />
          </svg>
          Subscription Summary
        </h3>
        <Link
          to="/subscriptions"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          View All →
        </Link>
      </div>

      {detectedSubscriptions.length === 0 ? (
        <div className="text-center py-6">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h8z" clipRule="evenodd" />
          </svg>
          <p className="text-gray-500 text-sm">No subscriptions detected yet</p>
          <p className="text-gray-400 text-xs mt-1">Connect your accounts to detect recurring payments</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{detectedSubscriptions.length}</p>
              <p className="text-xs text-gray-600">Active Subscriptions</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateMonthlyTotal())}</p>
              <p className="text-xs text-gray-600">Monthly Total</p>
            </div>
          </div>

          {/* Top Subscriptions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Top Subscriptions</h4>
            {topSubscriptions.map((subscription, index) => {
              const monthlyCost = subscription.frequency === 'weekly' ? subscription.amount * 4.33 :
                               subscription.frequency === 'monthly' ? subscription.amount :
                               subscription.amount / 12

              return (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{subscription.merchantName}</p>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(subscription.frequency)}`}>
                        {subscription.frequency}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{subscription.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(subscription.amount)}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(monthlyCost)}/mo</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default SubscriptionSummary