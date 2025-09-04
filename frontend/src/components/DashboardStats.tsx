import React from 'react'
import type { Transaction } from '../types/transaction'

interface Goal {
  id: string
  title: string
  description: string
  target_amount: number
  current_amount: number
  target_date: string
  status: 'active' | 'completed' | 'paused'
}

interface DashboardStatsProps {
  transactions: Transaction[]
  goals: Goal[]
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ transactions, goals }) => {
  const calculateStats = () => {
    // Get last 30 days instead of just this calendar month
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const recentTransactions = transactions.filter(t => 
      new Date(t.date_of_transaction) >= thirtyDaysAgo
    )

    // Expenses are positive amounts, income are negative amounts (Plaid API convention)
    const totalSpent = recentTransactions
      .filter(t => Number(t.price) > 0)
      .reduce((sum, t) => sum + Number(t.price), 0)

    const totalIncome = recentTransactions
      .filter(t => Number(t.price) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.price)), 0)

    const activeGoals = goals.filter(g => g.status === 'active').length
    const completedGoals = goals.filter(g => g.status === 'completed').length

    const totalGoalProgress = goals
      .filter(g => g.status === 'active')
      .reduce((sum, g) => sum + (g.current_amount / g.target_amount), 0)
    
    const avgGoalProgress = activeGoals > 0 ? (totalGoalProgress / activeGoals) * 100 : 0

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      netIncome: Math.round((totalIncome - totalSpent) * 100) / 100,
      activeGoals,
      completedGoals,
      avgGoalProgress: Math.round(avgGoalProgress * 10) / 10,
      transactionCount: recentTransactions.length
    }
  }

  const stats = calculateStats()

  const StatCard: React.FC<{ 
    title: string, 
    value: string | number, 
    icon: React.ReactNode,
    color: string 
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className={`${color} p-3 rounded-full`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 gap-6">
      <StatCard
        title="Last 30 Days Spending"
        value={`$${stats.totalSpent}`}
        color="bg-red-100"
        icon={
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        }
      />
      
      <StatCard
        title="Last 30 Days Income"
        value={`$${stats.totalIncome}`}
        color="bg-green-100"
        icon={
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        }
      />
      
      <StatCard
        title="Net Income"
        value={`$${stats.netIncome}`}
        color={stats.netIncome >= 0 ? "bg-green-100" : "bg-red-100"}
        icon={
          <svg className={`w-6 h-6 ${stats.netIncome >= 0 ? "text-green-600" : "text-red-600"}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        }
      />
    </div>
  )
}

export default DashboardStats
