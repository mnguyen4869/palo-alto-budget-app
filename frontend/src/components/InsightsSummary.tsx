import React from 'react'
import { Link } from 'react-router-dom'
import { useInsights, useBankAccounts } from '../hooks/useApi'
import PlaidLink from './PlaidLink'
import InsightCard from './InsightCard'

const InsightsSummary: React.FC = () => {
  const { insights, loading } = useInsights()
  const { accounts } = useBankAccounts()

  const handlePlaidSuccess = async () => {
    // Simple page reload for this summary component since it needs to refresh multiple data sources
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Recent Insights
        </h3>
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
          <span className="ml-2 text-gray-600 text-sm">Loading insights...</span>
        </div>
      </div>
    )
  }

  const highConfidenceInsights = insights.filter(insight => insight.confidence_score > 0.7)
  const recentInsights = insights.slice(0, 3)

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Recent Insights
        </h3>
        <Link
          to="/insights"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          View All →
        </Link>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-6">
          {accounts.length === 0 ? (
            <>
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-gray-500 text-sm mb-4">No insights available yet</p>
              <p className="text-gray-400 text-xs mb-4">Connect your accounts to get AI-powered financial insights</p>
              <PlaidLink
                onSuccess={handlePlaidSuccess}
                className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
              />
            </>
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-gray-500 text-sm">No insights available yet</p>
              <p className="text-gray-400 text-xs mt-1">Insights will appear as your data is analyzed</p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{insights.length}</p>
              <p className="text-xs text-gray-600">Total Insights</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{highConfidenceInsights.length}</p>
              <p className="text-xs text-gray-600">High Confidence</p>
            </div>
          </div>

          {/* Recent Insights */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Latest Insights</h4>
            {recentInsights.map(insight => (
              <div key={insight.id} className="text-xs">
                <InsightCard 
                  insight={insight} 
                  variant={insight.confidence_score > 0.7 ? 'green' : 'yellow'} 
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default InsightsSummary