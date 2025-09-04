import React, { useState, useEffect } from 'react'
import { useIncomeData } from '../hooks/useApi'

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

interface IncomeStreamsProps {
  accounts: BankAccount[]
}

const IncomeStreams: React.FC<IncomeStreamsProps> = ({ accounts }) => {
  const { incomeData, loading, error, fetchIncomeData } = useIncomeData()
  const [fetching, setFetching] = useState(false)

  // Automatically fetch income data when accounts are available
  useEffect(() => {
    if (accounts.length > 0 && !incomeData && !loading && !fetching) {
      setFetching(true)
      fetchIncomeData().finally(() => setFetching(false))
    }
  }, [accounts.length, incomeData, loading, fetching, fetchIncomeData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Income Analysis
          {fetching && (
            <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          )}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Monthly income streams from your connected accounts
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!incomeData ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          {accounts.length === 0 ? (
            <>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No income data available</h4>
              <p className="text-gray-600">
                Connect your bank accounts to automatically analyze your income streams and get personalized insights.
              </p>
            </>
          ) : fetching ? (
            <>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Analyzing your income...</h4>
              <p className="text-gray-600">
                Please wait while we analyze your connected accounts for income patterns.
              </p>
            </>
          ) : (
            <>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Income analysis will appear here</h4>
              <p className="text-gray-600">
                Income data will be automatically analyzed from your connected accounts.
              </p>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Total Monthly Income</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(incomeData.total_monthly_income)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Income Streams</p>
                <p className="text-xl font-semibold text-gray-900">{incomeData.stream_count}</p>
              </div>
            </div>
          </div>

          {incomeData.income_streams.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600">No income streams detected in your connected accounts.</p>
              <p className="text-sm text-gray-500 mt-2">
                Try connecting an account with regular income deposits or use test credentials with income data.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h5 className="text-md font-medium text-gray-900">Income Stream Details</h5>
              {incomeData.income_streams.map((stream, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h6 className="font-medium text-gray-900">{stream.name}</h6>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(stream.monthly_income)}
                      </p>
                      <p className="text-sm text-gray-500">per month</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(stream.confidence)}`}>
                        {getConfidenceText(stream.confidence)} Confidence
                      </span>
                      <span className="text-gray-500">
                        Frequency: {stream.frequency}
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {stream.days_available} days of data
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-2">About Income Analysis</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Income is analyzed from deposit patterns in your connected accounts</li>
              <li>• Confidence scores indicate how reliable the income detection is</li>
              <li>• Regular salary, freelance payments, and other income sources are detected</li>
              <li>• Analysis updates automatically as new transaction data is available</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default IncomeStreams