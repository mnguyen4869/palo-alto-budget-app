import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import { formatCategoryName } from '../utils/categoryUtils'
import type { Transaction } from '../types/transaction'

interface CategoryChartProps {
  transactions: Transaction[]
}

const COLORS = [
  '#EA580C', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#6B7280', '#14B8A6', '#F97316', '#84CC16'
]

const CategoryChart: React.FC<CategoryChartProps> = ({ transactions }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-gray-600">
            <span className="text-green-600 font-medium">${data.value.toLocaleString()}</span>
          </p>
        </div>
      )
    }
    return null
  }
  const processCategoryData = () => {
    const categorySpending: { [key: string]: number } = {}
    
    transactions.forEach(transaction => {
      if (Number(transaction.price) > 0) {
        const category = formatCategoryName(transaction.category_primary)
        if (category) {
          categorySpending[category] = (categorySpending[category] || 0) + Number(transaction.price)
        }
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
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="40%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {categoryData.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            layout="vertical"
            wrapperStyle={{
              paddingLeft: '20px',
              fontSize: '14px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CategoryChart