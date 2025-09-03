import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTransactions, useGoals, useInsights } from '../hooks/useApi'
import DashboardStats from '../components/DashboardStats'
import SpendingChart from '../components/SpendingChart'
import CategoryChart from '../components/CategoryChart'
import PlaidLink from '../components/PlaidLink'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactions()
  const { goals, loading: goalsLoading, error: goalsError } = useGoals()
  const { insights, loading: insightsLoading, error: insightsError } = useInsights()

  if (transactionsLoading || goalsLoading || insightsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Loading your financial data...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your financial activity
        </p>
      </div>

      <DashboardStats transactions={transactions} goals={goals} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SpendingChart transactions={transactions} />
        <CategoryChart transactions={transactions} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Recent Insights
        </h3>
        
        {insights.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">No insights available yet. Connect your bank account to get started!</p>
            <PlaidLink
              onSuccess={() => window.location.reload()}
              className="bg-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 5).map(insight => (
              <div 
                key={insight.id} 
                className={`p-4 rounded-lg border-l-4 ${
                  insight.confidence_score > 0.7 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-yellow-400 bg-yellow-50'
                }`}
              >
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                <p className="text-gray-700 mt-1">{insight.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(insight.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-gray-500">
                    Confidence: {Math.round(insight.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {transactionsError && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error loading transactions: {transactionsError}
        </div>
      )}

      {goalsError && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error loading goals: {goalsError}
        </div>
      )}

      {insightsError && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error loading insights: {insightsError}
        </div>
      )}
    </div>
  )
}

export default Dashboard