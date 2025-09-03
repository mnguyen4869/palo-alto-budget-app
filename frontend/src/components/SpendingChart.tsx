import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface Transaction {
  id: string
  name: string
  price: number
  categories: string[]
  merchant_name: string
  transaction_date: string
}

interface SpendingChartProps {
  transactions: Transaction[]
}

const SpendingChart: React.FC<SpendingChartProps> = ({ transactions }) => {
  const processDataForChart = () => {
    const dailySpending: { [key: string]: number } = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date).toLocaleDateString()
      dailySpending[date] = (dailySpending[date] || 0) + Math.abs(transaction.price)
    })

    return Object.entries(dailySpending)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-30)
      .map(([date, amount]) => ({
        date,
        amount: Math.round(amount * 100) / 100
      }))
  }

  const chartData = processDataForChart()

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Daily Spending</h3>
        <p className="text-gray-500 text-center py-8">No spending data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Daily Spending (Last 30 Days)</h3>
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
          <Tooltip 
            formatter={(value) => [`$${value}`, 'Amount Spent']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#EA580C" 
            strokeWidth={2}
            name="Daily Spending"
            dot={{ fill: '#EA580C' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SpendingChart