import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'

interface Transaction {
  id: string
  name: string
  price: number
  categories: string[]
  merchant_name: string
  transaction_date: string
}

interface CategoryChartProps {
  transactions: Transaction[]
}

const COLORS = [
  '#EA580C', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#6B7280', '#14B8A6', '#F97316', '#84CC16'
]

const CategoryChart: React.FC<CategoryChartProps> = ({ transactions }) => {
  const processCategoryData = () => {
    const categorySpending: { [key: string]: number } = {}
    
    transactions.forEach(transaction => {
      if (transaction.price < 0) {
        transaction.categories.forEach(category => {
          const cleanCategory = category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
          categorySpending[cleanCategory] = (categorySpending[cleanCategory] || 0) + Math.abs(transaction.price)
        })
      }
    })

    return Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([category, amount]) => ({
        name: category,
        value: Math.round(amount * 100) / 100
      }))
  }

  const categoryData = processCategoryData()

  if (categoryData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
        <p className="text-gray-500 text-center py-8">No category data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => 
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {categoryData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CategoryChart