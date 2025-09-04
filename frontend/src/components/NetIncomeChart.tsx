import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts'
import type { Transaction } from '../types/transaction'

interface NetIncomeChartProps {
  transactions: Transaction[]
}

const NetIncomeChart: React.FC<NetIncomeChartProps> = ({ transactions }) => {
  const processDataForChart = () => {
    const dailyNetIncome: { [key: string]: { income: number, expenses: number } } = {}
    
    // Get last 30 days of data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Filter transactions to last 30 days
    const recentTransactions = transactions.filter(transaction => 
      new Date(transaction.date_of_transaction) >= thirtyDaysAgo
    )
    
    // Process each transaction
    recentTransactions.forEach(transaction => {
      const date = new Date(transaction.date_of_transaction).toISOString().split('T')[0] // YYYY-MM-DD format
      const price = Number(transaction.price)
      
      if (!dailyNetIncome[date]) {
        dailyNetIncome[date] = { income: 0, expenses: 0 }
      }
      
      if (price < 0) {
        // Income (negative values in Plaid)
        dailyNetIncome[date].income += Math.abs(price)
      } else {
        // Expenses (positive values)
        dailyNetIncome[date].expenses += price
      }
    })

    // Generate all days for the last 30 days and calculate running totals
    const chartData = []
    let runningIncome = 0
    let runningExpenses = 0
    let runningNetIncome = 0
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      const dayData = dailyNetIncome[dateStr] || { income: 0, expenses: 0 }
      
      // Add to running totals
      runningIncome += dayData.income
      runningExpenses += dayData.expenses
      runningNetIncome = runningIncome - runningExpenses
      
      chartData.push({
        date: displayDate,
        fullDate: dateStr,
        runningNetIncome: Math.round(runningNetIncome * 100) / 100,
        runningIncome: Math.round(runningIncome * 100) / 100,
        runningExpenses: Math.round(runningExpenses * 100) / 100,
        dailyIncome: Math.round(dayData.income * 100) / 100,
        dailyExpenses: Math.round(dayData.expenses * 100) / 100
      })
    }

    return chartData
  }

  const chartData = processDataForChart()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">Daily:</p>
            <p className="text-green-600 text-sm ml-2">+${data.dailyIncome.toLocaleString()}</p>
            <p className="text-red-600 text-sm ml-2">-${data.dailyExpenses.toLocaleString()}</p>
            <div className="border-t pt-1 mt-2">
              <p className="text-sm text-gray-600">Running Total:</p>
              <p className="text-green-600 text-sm ml-2">Income: ${data.runningIncome.toLocaleString()}</p>
              <p className="text-red-600 text-sm ml-2">Expenses: ${data.runningExpenses.toLocaleString()}</p>
              <p className={`font-semibold ${data.runningNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Net: ${data.runningNetIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Running Net Income (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
          <Line 
            type="monotone" 
            dataKey="runningNetIncome" 
            stroke="#10B981" 
            strokeWidth={2}
            name="Running Net Income"
            dot={{ fill: '#10B981', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default NetIncomeChart