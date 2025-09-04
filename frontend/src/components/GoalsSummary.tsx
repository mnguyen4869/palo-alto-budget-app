import React from 'react'
import { Link } from 'react-router-dom'
import { useInsights } from '../hooks/useApi'

interface Goal {
  id: string
  title: string
  description: string
  target_amount: number
  current_amount: number
  target_date: string
  status: 'active' | 'completed' | 'paused'
}

interface GoalsSummaryProps {
  goals: Goal[]
}

const GoalsSummary: React.FC<GoalsSummaryProps> = ({ goals }) => {
  const activeGoals = goals.filter(goal => goal.status === 'active')
  const { insights } = useInsights()
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  }

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate)
    const today = new Date()
    const timeDiff = target.getTime() - today.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  const getSavingInsight = () => {
    const savingInsightTypes = [
      'category_analysis',
      'coffee_spending',
      'delivery_spending'
    ]
    
    return insights.find(insight => 
      savingInsightTypes.includes(insight.insight_type) && 
      insight.confidence_score > 0.7
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-semibold text-gray-900">Active Goals</h3>
        </div>
        <Link 
          to="/goals" 
          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {activeGoals.length === 0 ? (
        <div className="text-center py-6">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-3">No active goals yet</p>
          <Link 
            to="/goals" 
            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            Create your first goal
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activeGoals.slice(0, 3).map((goal) => (
            <div key={goal.id} className="border-l-4 border-orange-500 pl-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {goal.title}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {goal.description}
                  </p>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <div className="text-xs text-gray-600">
                    {Math.round(calculateProgress(goal))}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {getDaysRemaining(goal.target_date)}d left
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{formatCurrency(goal.current_amount)}</span>
                  <span>{formatCurrency(goal.target_amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress(goal)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          
          {activeGoals.length > 3 && (
            <div className="text-center pt-2">
              <Link 
                to="/goals" 
                className="text-orange-600 hover:text-orange-700 text-sm"
              >
                +{activeGoals.length - 3} more goals
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-600">Total Progress</span>
          <span className="font-medium text-gray-900">
            {activeGoals.length > 0 
              ? Math.round(activeGoals.reduce((sum, goal) => sum + calculateProgress(goal), 0) / activeGoals.length)
              : 0}% avg
          </span>
        </div>
        
        {/* Money-saving tip preview */}
        {getSavingInsight() && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800 mb-1">💡 Quick Saving Tip</p>
                  <p className="text-sm text-green-700 leading-relaxed">
                    {getSavingInsight()?.insight_type === 'category_analysis'
                      ? getSavingInsight()?.message.split('\n')[0] || "Review your top spending categories for saving opportunities"
                      : getSavingInsight()?.title.includes('Coffee')
                      ? "Consider brewing coffee at home to save money towards your goals"
                      : getSavingInsight()?.title.includes('Delivery')
                      ? "Save on delivery fees by picking up orders to reach your goals faster"
                      : getSavingInsight()?.message.length > 100
                      ? getSavingInsight()?.message.substring(0, 100) + '...'
                      : getSavingInsight()?.message || "Check your insights for personalized money-saving tips"}
                  </p>
                  <div className="mt-2 text-xs text-green-600">
                    {Math.round(getSavingInsight()?.confidence_score * 100)}% confidence
                  </div>
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <Link 
                  to="/goals" 
                  className="text-green-700 hover:text-green-800 text-xs font-medium bg-green-100 hover:bg-green-200 px-2 py-1 rounded-md transition-colors"
                >
                  More Tips →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GoalsSummary