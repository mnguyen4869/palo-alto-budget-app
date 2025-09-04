import React, { useState, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { useAuth } from '../contexts/AuthContext'

interface PlaidLinkProps {
  onSuccess: () => void
  className?: string
}

const PlaidLink: React.FC<PlaidLinkProps> = ({ onSuccess, className = '' }) => {
  const { token } = useAuth()
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSuccessCallback = useCallback(
    async (public_token: string) => {
      try {
        const response = await fetch(`http://localhost:8000/plaid/exchange_token?public_token=${encodeURIComponent(public_token)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          // Automatically sync transactions after connecting bank account
          try {
            const syncResponse = await fetch('http://localhost:8000/plaid/transactions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (syncResponse.ok) {
              console.log('Automatic transaction sync completed successfully')
              
              // Also sync income data
              try {
                const incomeResponse = await fetch('http://localhost:8000/plaid/income', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                })
                
                if (incomeResponse.ok) {
                  console.log('Automatic income sync completed successfully')
                } else {
                  console.warn('Automatic income sync failed, but transactions were synced')
                }
              } catch (incomeError) {
                console.warn('Automatic income sync error:', incomeError)
              }
            } else {
              console.warn('Automatic transaction sync failed, but account was connected')
            }
          } catch (syncError) {
            console.warn('Automatic sync error, but account was connected:', syncError)
          }
          
          onSuccess()
        } else {
          const errorData = await response.json()
          setError(errorData.detail || 'Failed to connect bank account')
        }
      } catch (error) {
        setError('Failed to connect bank account')
      }
    },
    [token, onSuccess]
  )

  const onEventCallback = useCallback((eventName: string) => {
    console.log('Plaid Link event:', eventName)
  }, [])

  const onExitCallback = useCallback((err: any) => {
    if (err) {
      console.error('Plaid Link error:', err)
      setError('Bank connection was cancelled or failed')
    }
  }, [])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onSuccessCallback,
    onEvent: onEventCallback,
    onExit: onExitCallback,
  })

  const createLinkToken = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/plaid/create_link_token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLinkToken(data.link_token)
      } else {
        setError('Failed to create link token')
      }
    } catch (error) {
      setError('Failed to connect to bank service')
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (!linkToken) {
      createLinkToken()
    } else if (ready) {
      open()
    }
  }

  React.useEffect(() => {
    if (linkToken && ready) {
      open()
    }
  }, [linkToken, ready, open])

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || (!ready && linkToken !== null)}
        className={`${className} ${
          loading || (!ready && linkToken !== null)
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-orange-700'
        }`}
      >
        {loading
          ? 'Connecting...'
          : !linkToken
          ? 'Connect Bank Account'
          : !ready
          ? 'Loading...'
          : 'Connect Bank Account'}
      </button>
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

export default PlaidLink
