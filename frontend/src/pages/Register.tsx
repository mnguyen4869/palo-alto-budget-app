import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface PasswordRequirement {
  text: string
  test: (password: string) => boolean
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordRequirements: PasswordRequirement[] = [
    { text: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { text: 'At least one uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { text: 'At least one lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { text: 'At least one number', test: (pwd) => /\d/.test(pwd) },
    { text: 'At least one special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
    { text: 'Passwords must match', test: (pwd) => pwd === formData.confirmPassword }
  ]

  const passwordValidation = useMemo(() => {
    return passwordRequirements.map(req => ({
      ...req,
      isValid: req.test(formData.password)
    }))
  }, [formData.password, formData.confirmPassword, passwordRequirements])
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Check if all password requirements are met
    const allRequirementsMet = passwordValidation.every(req => req.isValid)
    if (!allRequirementsMet) {
      setError('Password does not meet all requirements')
      return
    }

    setLoading(true)

    try {
      const success = await register(formData.email, formData.password, formData.name)
      if (success) {
        navigate('/dashboard')
      } else {
        setError('Registration failed. Email might already be in use.')
      }
    } catch (error) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign Up</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>

          {/* Password Requirements */}
          {formData.password && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Password requirements:</p>
              <ul className="text-sm space-y-1">
                {passwordValidation.map((requirement, index) => (
                  <li
                    key={index}
                    className={`flex items-center space-x-2 ${
                      requirement.isValid ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                      requirement.isValid 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-500'
                    }`}>
                      {requirement.isValid ? '✓' : '×'}
                    </span>
                    <span>{requirement.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-600 hover:text-orange-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
