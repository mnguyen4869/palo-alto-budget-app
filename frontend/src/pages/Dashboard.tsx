import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTransactions, useGoals, useInsights, useBankAccounts } from '../hooks/useApi'
import NetIncomeChart from '../components/NetIncomeChart'
import CategoryChart from '../components/CategoryChart'
import IncomeStreams from '../components/IncomeStreams'
import SubscriptionSummary from '../components/SubscriptionSummary'
import GoalsSummary from '../components/GoalsSummary'
import InsightsSummary from '../components/InsightsSummary'
import PlaidLink from '../components/PlaidLink'

const Dashboard: React.FC = () => {
  const { user, token } = useAuth()
  const { transactions, loading: transactionsLoading, error: transactionsError, setTransactions } = useTransactions()
  const { goals, loading: goalsLoading, error: goalsError } = useGoals()
  const { loading: insightsLoading, error: insightsError, setInsights } = useInsights()
  const { accounts, loading: accountsLoading, refetch: refetchAccounts } = useBankAccounts()

  const handlePlaidSuccess = async () => {
    // Refresh accounts list
    await refetchAccounts()
    
    // Refresh transactions data
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
      }
    } catch (error) {
      console.error('Failed to refresh transactions:', error)
    }

    // Refresh insights data  
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
      }
    } catch (error) {
      console.error('Failed to refresh insights:', error)
    }
  }

  if (transactionsLoading || goalsLoading || insightsLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Loading your financial data...</span>
      </div>
    )
  }

  return (
    <div>
      {accounts.length === 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-3">
            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-800 mb-2">Get Started</h3>
          <p className="text-sm text-blue-700 mb-4">
            Connect your bank account to see personalized insights and track your spending automatically.
          </p>
          <PlaidLink
            onSuccess={handlePlaidSuccess}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          />
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your financial activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Last 30 Days Spending */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Last 30 Days Spending</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${Math.round(transactions.filter(t => {
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  return new Date(t.date_of_transaction) >= thirtyDaysAgo && Number(t.price) > 0
                }).reduce((sum, t) => sum + Number(t.price), 0) * 100) / 100}
              </p>
            </div>
          </div>
        </div>

        {/* Last 30 Days Income */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Last 30 Days Income</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${Math.round(transactions.filter(t => {
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  return new Date(t.date_of_transaction) >= thirtyDaysAgo && Number(t.price) < 0
                }).reduce((sum, t) => sum + Math.abs(Number(t.price)), 0) * 100) / 100}
              </p>
            </div>
          </div>
        </div>

        {/* Net Income */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${(() => {
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
              const recentTransactions = transactions.filter(t => new Date(t.date_of_transaction) >= thirtyDaysAgo)
              const income = recentTransactions.filter(t => Number(t.price) < 0).reduce((sum, t) => sum + Math.abs(Number(t.price)), 0)
              const spending = recentTransactions.filter(t => Number(t.price) > 0).reduce((sum, t) => sum + Number(t.price), 0)
              const netIncome = income - spending
              return netIncome >= 0 ? "bg-green-100" : "bg-red-100"
            })()}`}>
              <svg className={`w-6 h-6 ${(() => {
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                const recentTransactions = transactions.filter(t => new Date(t.date_of_transaction) >= thirtyDaysAgo)
                const income = recentTransactions.filter(t => Number(t.price) < 0).reduce((sum, t) => sum + Math.abs(Number(t.price)), 0)
                const spending = recentTransactions.filter(t => Number(t.price) > 0).reduce((sum, t) => sum + Number(t.price), 0)
                const netIncome = income - spending
                return netIncome >= 0 ? "text-green-600" : "text-red-600"
              })()}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Income</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${(() => {
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  const recentTransactions = transactions.filter(t => new Date(t.date_of_transaction) >= thirtyDaysAgo)
                  const income = recentTransactions.filter(t => Number(t.price) < 0).reduce((sum, t) => sum + Math.abs(Number(t.price)), 0)
                  const spending = recentTransactions.filter(t => Number(t.price) > 0).reduce((sum, t) => sum + Number(t.price), 0)
                  return Math.round((income - spending) * 100) / 100
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="lg:col-span-2">
          <NetIncomeChart transactions={transactions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CategoryChart transactions={transactions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <IncomeStreams accounts={accounts} />
        <GoalsSummary goals={goals} />
        <SubscriptionSummary transactions={transactions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <InsightsSummary />
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