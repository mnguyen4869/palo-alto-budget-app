import React from 'react'
import type { Insight } from '../types/insight'

interface InsightCardProps {
  insight: Insight
  variant?: 'green' | 'yellow' | 'blue'
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, variant = 'green' }) => {
  const variantStyles = {
    green: {
      container: 'border-green-400 bg-green-50',
      confidence: 'text-green-600'
    },
    yellow: {
      container: 'border-yellow-400 bg-yellow-50',
      confidence: 'text-yellow-600'
    },
    blue: {
      container: 'border-blue-400 bg-blue-50',
      confidence: 'text-blue-600'
    }
  }

  const renderInsightContent = () => {
    // Special handling for category analysis insights
    if (insight.insight_type === 'category_analysis' && insight.title === 'Top Spending Categories') {
      const lines = insight.message.split('\n')
      const introLine = lines[0]
      const categoryLines = lines.filter(line => line.match(/^\d+\./))
      const conclusionLine = lines[lines.length - 1]

      return (
        <div>
          <h4 className="font-medium text-gray-900">{insight.title}</h4>
          <p className="text-gray-700 mt-1">{introLine}</p>
          
          {categoryLines.length > 0 && (
            <div className="mt-3 bg-white rounded-lg border p-3">
              <ul className="space-y-2">
                {categoryLines.map((line, index) => {
                  const match = line.match(/^(\d+)\.\s+([^:]+):\s+(.*)$/)
                  if (match) {
                    const [, number, category, details] = match
                    return (
                      <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-800 text-xs font-medium rounded-full flex items-center justify-center mr-3">
                            {number}
                          </span>
                          <span className="font-medium text-gray-900">{category}</span>
                        </div>
                        <span className="text-sm text-gray-600 ml-2">{details}</span>
                      </li>
                    )
                  }
                  return (
                    <li key={index} className="text-gray-700 text-sm">{line}</li>
                  )
                })}
              </ul>
            </div>
          )}
          
          <p className="text-gray-700 mt-3 text-sm italic">{conclusionLine}</p>
        </div>
      )
    }

    // Default rendering for other insights
    return (
      <div>
        <h4 className="font-medium text-gray-900">{insight.title}</h4>
        <div className="text-gray-700 mt-1 whitespace-pre-line">{insight.message}</div>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-lg border-l-4 ${variantStyles[variant].container}`}>
      {renderInsightContent()}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500">
          {new Date(insight.created_at).toLocaleDateString()}
        </span>
        <span className={`text-xs font-medium ${variantStyles[variant].confidence}`}>
          Confidence: {Math.round(insight.confidence_score * 100)}%
        </span>
      </div>
    </div>
  )
}

export default InsightCard