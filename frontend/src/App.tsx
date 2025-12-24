import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiMessage, setApiMessage] = useState('Loading...')
  const [connectionStatus, setConnectionStatus] = useState('testing')

  useEffect(() => {
    testApiConnection()
  }, [])

  const testApiConnection = async () => {
    try {
      console.log('Testing API connection...')

      // ALWAYS use relative path for both production and development
      const apiUrl = '/api/test'
      console.log('Connecting to:', apiUrl)

      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Success! Response:', data)
      setApiMessage(data.message || 'API Connected!')
      setConnectionStatus('connected')
    } catch (error) {
      console.error('Connection error:', error)
      // FIXED: Handle unknown error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setApiMessage(`API Connection Failed: ${errorMessage}`)
      setConnectionStatus('failed')
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🐝 Polleneer Platform</h1>
        <h2>Welcome to the Hive!</h2>

        <div className="status-box">
          <h3>API Connection Status:</h3>
          <div className={`status ${connectionStatus}`}>
            {connectionStatus === 'testing' && '🔄 Testing connection...'}
            {connectionStatus === 'connected' && '✅ Connected to API!'}
            {connectionStatus === 'failed' && '❌ Connection failed'}
          </div>
          <p>{apiMessage}</p>
          <button onClick={testApiConnection} className="retry-btn">
            Retry Connection
          </button>
        </div>

        <div className="info-box">
          <h3>📊 Current Environment:</h3>
          <p><strong>URL:</strong> {window.location.href}</p>
          <p><strong>Host:</strong> {window.location.hostname}</p>
          <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
          <p><strong>API Endpoint:</strong> /api/test</p>
        </div>

        <div className="next-steps">
          <h3>🚀 Next Steps:</h3>
          <ul>
            <li>✅ Fixed API connection</li>
            <li>🔜 User Authentication</li>
            <li>🔜 91 Bee Roles</li>
            <li>🔜 Honey Points System</li>
          </ul>
        </div>

        <div className="links">
          <h3>🔗 Quick Links:</h3>
          <a href="/api/test" target="_blank" className="link">Test API</a>
          <a href="https://github.com/Draguniteus/polleneer-app" target="_blank" className="link">GitHub</a>
          <a href="https://polleneer-dbkzq.ondigitalocean.app" target="_blank" className="link">Live Demo</a>
        </div>
      </header>
    </div>
  )
}

export default App
