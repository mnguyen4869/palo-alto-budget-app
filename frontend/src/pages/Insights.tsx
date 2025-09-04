import React from 'react'
import { useInsights, useBankAccounts } from '../hooks/useApi'
import PlaidLink from '../components/PlaidLink'
import InsightCard from '../components/InsightCard'

const Insights: React.FC = () => {
  const { insights, loading, error } = useInsights()
  const { accounts } = useBankAccounts()

  const handlePlaidSuccess = async () => {
    // Refresh insights data
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Loading insights...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading insights: {error}
      </div>
    )
  }

  const highConfidenceInsights = insights.filter(insight => insight.confidence_score > 0.7)
  const mediumConfidenceInsights = insights.filter(insight => insight.confidence_score <= 0.7 && insight.confidence_score > 0.5)
  const lowConfidenceInsights = insights.filter(insight => insight.confidence_score <= 0.5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Insights</h1>
        <p className="text-gray-600">AI-powered analysis of your spending patterns and financial behavior</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Confidence</p>
              <p className="text-2xl font-semibold text-green-600">{highConfidenceInsights.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Medium Confidence</p>
              <p className="text-2xl font-semibold text-yellow-600">{mediumConfidenceInsights.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Insights</p>
              <p className="text-2xl font-semibold text-blue-600">{insights.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {insights.length === 0 ? (
        <div className="text-center py-12">
          {accounts.length === 0 ? (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">No insights available yet</h3>
              <p className="text-gray-500 mb-6">Connect your bank account to start getting personalized financial insights!</p>
              <PlaidLink
                onSuccess={handlePlaidSuccess}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              />
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available yet</h3>
              <p className="text-gray-500">Insights will appear here as your transaction data is analyzed over time.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* High Confidence Insights */}
          {highConfidenceInsights.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-800">High Confidence Insights</h3>
                </div>
                <p className="text-sm text-green-700 mt-1">These insights have a confidence score above 70%</p>
              </div>
              <div className="p-6 space-y-4">
                {highConfidenceInsights.map(insight => (
                  <InsightCard 
                    key={insight.id} 
                    insight={insight} 
                    variant="green" 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medium Confidence Insights */}
          {mediumConfidenceInsights.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-lg font-semibold text-yellow-800">Medium Confidence Insights</h3>
                </div>
                <p className="text-sm text-yellow-700 mt-1">These insights have a confidence score between 50-70%</p>
              </div>
              <div className="p-6 space-y-4">
                {mediumConfidenceInsights.map(insight => (
                  <InsightCard 
                    key={insight.id} 
                    insight={insight} 
                    variant="yellow" 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Low Confidence Insights */}
          {lowConfidenceInsights.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-lg font-semibold text-blue-800">Preliminary Insights</h3>
                </div>
                <p className="text-sm text-blue-700 mt-1">These insights have a confidence score below 50% and should be considered preliminary</p>
              </div>
              <div className="p-6 space-y-4">
                {lowConfidenceInsights.map(insight => (
                  <InsightCard 
                    key={insight.id} 
                    insight={insight} 
                    variant="blue" 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              About Financial Insights
            </h3>
            <div className="mt-2 text-sm text-gray-600">
              <ul className="list-disc list-inside space-y-1">
                <li>Insights are generated using AI analysis of your transaction patterns</li>
                <li>Higher confidence scores indicate more reliable recommendations</li>
                <li>New insights are generated as more transaction data becomes available</li>
                <li>Use these insights to make informed decisions about your financial habits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights