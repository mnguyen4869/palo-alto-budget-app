import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useGoals, useTransactions, useInsights } from '../hooks/useApi'
import InsightCard from '../components/InsightCard'

interface Goal {
  id: string
  title: string
  description: string
  target_amount: number
  current_amount: number
  target_date: string
  status: 'active' | 'completed' | 'paused'
}

const Goals: React.FC = () => {
  const { token } = useAuth()
  const { goals, loading, error, setGoals } = useGoals()
  const { transactions } = useTransactions()
  const { insights } = useInsights()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [expandedInsights, setExpandedInsights] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '',
    target_date: ''
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      target_amount: '',
      current_amount: '',
      target_date: ''
    })
    setEditingGoal(null)
    setShowCreateForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const goalData = {
      title: formData.title,
      description: formData.description,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount) || 0,
      target_date: formData.target_date,
      status: 'active' as const
    }

    try {
      const url = editingGoal 
        ? `http://localhost:8000/goals/${editingGoal.id}`
        : 'http://localhost:8000/goals'
      
      const method = editingGoal ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      })

      if (response.ok) {
        const savedGoal = await response.json()
        
        if (editingGoal) {
          setGoals(goals.map(g => g.id === editingGoal.id ? savedGoal : g))
        } else {
          setGoals([...goals, savedGoal])
        }
        
        resetForm()
      } else {
        alert('Failed to save goal')
      }
    } catch (error) {
      alert('Failed to save goal')
    }
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      target_date: goal.target_date.split('T')[0]
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const response = await fetch(`http://localhost:8000/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setGoals(goals.filter(g => g.id !== goalId))
      } else {
        alert('Failed to delete goal')
      }
    } catch (error) {
      alert('Failed to delete goal')
    }
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

  const predictGoalCompletion = (goal: Goal) => {
    if (goal.current_amount >= goal.target_amount) return 'Goal completed!'
    
    const monthlyIncome = transactions
      .filter(t => Number(t.price) < 0)  // Income is negative in Plaid API
      .reduce((sum, t) => sum + Math.abs(Number(t.price)), 0) / Math.max(transactions.length / 30, 1)

    const monthlyExpenses = transactions
      .filter(t => Number(t.price) > 0)  // Expenses are positive in Plaid API
      .reduce((sum, t) => sum + Number(t.price), 0) / Math.max(transactions.length / 30, 1)

    const monthlySavings = monthlyIncome - monthlyExpenses
    const remainingAmount = goal.target_amount - goal.current_amount

    if (monthlySavings <= 0) {
      return 'Current spending exceeds income. Consider reducing expenses.'
    }

    const monthsToComplete = remainingAmount / monthlySavings
    const daysRemaining = getDaysRemaining(goal.target_date)
    const monthsRemaining = daysRemaining / 30

    if (monthsToComplete <= monthsRemaining) {
      return `On track! Estimated completion in ${Math.ceil(monthsToComplete)} months.`
    } else {
      const additionalSavingsNeeded = remainingAmount / monthsRemaining - monthlySavings
      return `Need to save $${Math.round(additionalSavingsNeeded)} more per month to reach goal on time.`
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSavingInsights = () => {
    // Filter insights that can help with saving money
    const savingInsightTypes = [
      'category_analysis',
      'subscription_summary',
      'gray_charges',
      'delivery_spending',
      'coffee_spending',
      'spending_increase',
      'weekend_spending'
    ]
    
    return insights.filter(insight => 
      savingInsightTypes.includes(insight.insight_type) && 
      insight.confidence_score > 0.6
    ).slice(0, 3) // Show top 3 most relevant
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Loading goals...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading goals: {error}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Goals</h1>
          <p className="text-gray-600">Track your progress and plan for the future</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          Create New Goal
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Emergency Fund"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Describe your goal..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({...formData, current_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No goals yet</h3>
          <p className="text-gray-500 mb-6">Create your first financial goal to start tracking your progress</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="text-gray-400 hover:text-orange-600"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{formatCurrency(goal.current_amount)}</span>
                  <span>{formatCurrency(goal.target_amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress(goal)}%` }}
                  ></div>
                </div>
                <div className="text-center mt-2">
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(calculateProgress(goal))}% Complete
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Date:</span>
                  <span className="text-gray-900">{formatDate(goal.target_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Left:</span>
                  <span className={`font-medium ${getDaysRemaining(goal.target_date) < 30 ? 'text-red-600' : 'text-gray-900'}`}>
                    {getDaysRemaining(goal.target_date)} days
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600 italic">
                    {predictGoalCompletion(goal)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expandable Money-Saving Insights */}
      {getSavingInsights().length > 0 && goals.length > 0 && (
        <div className="mt-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            {/* Header */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-100 p-1.5 rounded-lg">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <h3 className="text-sm font-semibold text-gray-900">💡 Quick Saving Tips</h3>
                    <p className="text-xs text-gray-600">
                      {expandedInsights ? 'All personalized insights' : `${getSavingInsights().length} insights to accelerate your goals`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setExpandedInsights(!expandedInsights)}
                    className="text-green-600 hover:text-green-700 text-xs font-medium border border-green-300 hover:border-green-400 px-2 py-1 rounded transition-colors"
                  >
                    {expandedInsights ? 'Collapse' : 'Expand All'}
                  </button>
                  <button
                    onClick={() => window.open('/insights', '_blank')}
                    className="text-green-600 hover:text-green-700 text-xs font-medium px-2 py-1 rounded transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-4 pb-4">
              {!expandedInsights ? (
                /* Collapsed View - Show 2 compact insights */
                <div className="space-y-2">
                  {getSavingInsights().slice(0, 2).map(insight => (
                    <div key={insight.id} className="bg-white rounded-md border border-gray-200 p-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center justify-center mr-3 mt-0.5">
                          {insight.insight_type === 'category_analysis' ? '📊' : 
                           insight.title.includes('Coffee') ? '☕' : 
                           insight.title.includes('Delivery') ? '🚚' : '💰'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-gray-900 mb-1">{insight.title}</h4>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {insight.insight_type === 'category_analysis' 
                              ? insight.message.split('\n')[0] 
                              : insight.message.length > 120 
                                ? insight.message.substring(0, 120) + '...'
                                : insight.message}
                          </p>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">
                              {Math.round(insight.confidence_score * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getSavingInsights().length > 2 && (
                    <div className="text-center pt-2">
                      <span className="text-xs text-gray-500">
                        +{getSavingInsights().length - 2} more insights available
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Expanded View - Show all insights with full text using InsightCard */
                <div className="space-y-3">
                  {getSavingInsights().map(insight => (
                    <div key={insight.id} className="bg-white rounded-md border border-gray-200 overflow-hidden">
                      <InsightCard 
                        insight={insight} 
                        variant="green" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Goals