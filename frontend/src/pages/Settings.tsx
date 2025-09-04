import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import BankAccounts from '../components/BankAccounts'

const Settings: React.FC = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'accounts'>('profile')


  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  )


  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Privacy</h3>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-green-800">Secure Data Handling</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your financial data is encrypted and stored securely. We never share your personal information with third parties.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Data Usage</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transaction Analysis</span>
                <span className="text-sm text-green-600 font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Spending Insights</span>
                <span className="text-sm text-green-600 font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Goal Forecasting</span>
                <span className="text-sm text-green-600 font-medium">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Password Protection</h4>
              <p className="text-sm text-gray-600">Your account is protected with encrypted password storage</p>
            </div>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Session Management</h4>
              <p className="text-sm text-gray-600">Automatic logout after inactivity</p>
            </div>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and privacy preferences</p>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-2 border-b-2 font-medium text-sm ${
              activeTab === 'accounts'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Bank Accounts
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2 border-b-2 font-medium text-sm ${
              activeTab === 'privacy'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Privacy & Security
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'profile' && renderProfileSettings()}
        {activeTab === 'accounts' && <BankAccounts />}
        {activeTab === 'privacy' && renderPrivacySettings()}
      </div>
    </div>
  )
}

export default Settings