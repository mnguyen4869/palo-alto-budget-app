import React, { useState, useMemo } from 'react'
import { useTransactions, usePlaidSync } from '../hooks/useApi'
import { parseDetailedCategory } from '../utils/categoryUtils'

const Transactions: React.FC = () => {
  const { transactions, loading, error } = useTransactions()
  const { syncTransactions } = usePlaidSync()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [transactionType, setTransactionType] = useState<'all' | 'income' | 'expense'>('all')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (transaction.merchant_name && transaction.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const transactionCategory = parseDetailedCategory(transaction.category_primary, transaction.category_detailed)
      const matchesCategory = selectedCategory === '' || 
                            (selectedCategory === 'no_categories' && !transaction.category_primary && !transaction.category_detailed) ||
                            (transactionCategory && transactionCategory === selectedCategory)
      
      const matchesType = transactionType === 'all' ||
                         (transactionType === 'income' && Number(transaction.price) < 0) ||
                         (transactionType === 'expense' && Number(transaction.price) > 0)

      return matchesSearch && matchesCategory && matchesType
    })

    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date_of_transaction).getTime() - new Date(b.date_of_transaction).getTime()
          break
        case 'amount':
          comparison = Math.abs(Number(a.price)) - Math.abs(Number(b.price))
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [transactions, searchTerm, selectedCategory, sortBy, sortOrder, transactionType])

  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    transactions.forEach(transaction => {
      const parsedCategory = parseDetailedCategory(transaction.category_primary, transaction.category_detailed)
      if (parsedCategory) {
        categories.add(parsedCategory)
      }
    })
    return Array.from(categories).sort()
  }, [transactions])

  const handleSyncTransactions = async () => {
    try {
      setSyncing(true)
      setSyncMessage('Syncing transactions from your connected accounts...')
      const result = await syncTransactions()
      setSyncMessage(`Success! ${result.transaction_count || 0} new transactions synced.`)
      
      // Refresh transactions by calling the hook's refetch function
      setTimeout(() => {
        window.location.reload() // Simple refresh for now
      }, 2000)
      
      setTimeout(() => setSyncMessage(null), 5000)
    } catch (error: any) {
      setSyncMessage(`Sync failed: ${error.message}`)
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)  // Don't use Math.abs here, let the caller handle sign
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ]
    const index = category.length % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Loading transactions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading transactions: {error}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
            <p className="text-gray-600">View and categorize your financial transactions</p>
          </div>
          <button
            onClick={handleSyncTransactions}
            disabled={syncing}
            className={`px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              syncing 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {syncing ? 'Syncing...' : 'Sync from Plaid'}
          </button>
        </div>
        
        {syncMessage && (
          <div className={`mt-4 p-3 rounded ${
            syncMessage.includes('Success') || syncMessage.includes('synced')
              ? 'bg-green-100 border border-green-400 text-green-700'
              : syncMessage.includes('failed') || syncMessage.includes('Sync failed')
              ? 'bg-red-100 border border-red-400 text-red-700'
              : 'bg-blue-100 border border-blue-400 text-blue-700'
          }`}>
            {syncMessage}
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Categories</option>
              <option value="no_categories">No Categories</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as 'all' | 'income' | 'expense')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-2xl font-semibold text-gray-900">{filteredAndSortedTransactions.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Income</p>
            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(filteredAndSortedTransactions.filter(t => Number(t.price) < 0).reduce((sum, t) => sum + Math.abs(Number(t.price)), 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-semibold text-red-600">
              {formatCurrency(filteredAndSortedTransactions.filter(t => Number(t.price) > 0).reduce((sum, t) => sum + Number(t.price), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredAndSortedTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {transaction.logo_url && (
                          <img
                            src={transaction.logo_url}
                            alt={`${transaction.merchant_name} logo`}
                            className="w-8 h-8 rounded-full mr-3 object-contain bg-gray-100"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <div>
                          <div 
                            className="text-sm font-medium text-gray-900" 
                            title={transaction.name.length > 30 ? transaction.name : undefined}
                          >
                            {transaction.name.length > 30 ? `${transaction.name.substring(0, 30)}...` : transaction.name}
                          </div>
                          <div 
                            className="text-sm text-gray-500" 
                            title={(transaction.merchant_name?.length || 0) > 30 ? transaction.merchant_name : undefined}
                          >
                            {transaction.merchant_name 
                              ? (transaction.merchant_name.length > 30 
                                  ? `${transaction.merchant_name.substring(0, 30)}...` 
                                  : transaction.merchant_name)
                              : 'Unknown Merchant'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {(transaction.category_primary || transaction.category_detailed) ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(transaction.category_primary || transaction.category_detailed || '')}`}
                          >
                            {parseDetailedCategory(transaction.category_primary, transaction.category_detailed)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">No categories</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.date_of_transaction)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-medium ${Number(transaction.price) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(transaction.price) < 0 ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.price)))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Transactions