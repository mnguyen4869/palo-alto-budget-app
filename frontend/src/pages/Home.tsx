import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Home: React.FC = () => {
  const { user } = useAuth()

  if (user) {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome back, {user.name}!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Ready to take control of your finances?
        </p>
        <Link
          to="/dashboard"
          className="bg-orange-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-orange-700"
        >
          Go to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Smart Financial Coach
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Transform your transaction data into personalized insights. 
        Take control of your financial life with AI-powered recommendations.
      </p>
      
      <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
        <Link
          to="/register"
          className="block w-full sm:w-auto bg-orange-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-orange-700"
        >
          Get Started
        </Link>
        <Link
          to="/login"
          className="block w-full sm:w-auto bg-white text-orange-600 border border-orange-600 px-6 py-3 rounded-lg text-lg font-medium hover:bg-orange-50"
        >
          Sign In
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="bg-blue-100 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Smart Insights</h3>
          <p className="text-gray-600">
            AI-powered analysis of your spending patterns and financial behavior
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-green-100 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Goal Tracking</h3>
          <p className="text-gray-600">
            Set financial goals and track your progress with personalized forecasting
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-purple-100 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Security First</h3>
          <p className="text-gray-600">
            Bank-level security with encrypted data and privacy-focused design
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home