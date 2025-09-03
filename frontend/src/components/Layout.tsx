import React, { ReactNode } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-stone-50 bg-rhombus-pattern">
      <nav className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-orange-600">
                Smart Financial Coach
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/dashboard')
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:text-orange-600'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/transactions"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/transactions')
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:text-orange-600'
                    }`}
                  >
                    Transactions
                  </Link>
                  <Link
                    to="/goals"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/goals')
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:text-orange-600'
                    }`}
                  >
                    Goals
                  </Link>
                  <Link
                    to="/settings"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/settings')
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:text-orange-600'
                    }`}
                  >
                    Settings
                  </Link>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-700">Hello, {user.name}</span>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout