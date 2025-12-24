import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [honeyPoints, setHoneyPoints] = useState<number>(0);

  useEffect(() => {
    // Test API connection
    fetch('http://localhost:3001/api/test')
      .then(response => response.json())
      .then(data => {
        setApiStatus(data.message || 'API Connected!');
      })
      .catch(error => {
        setApiStatus('API Connection Failed');
        console.error('API Error:', error);
      });

    // Simulate honey points (will come from backend later)
    setHoneyPoints(150);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="hive-header">
          <h1>🐝 Polleneer Pro</h1>
          <div className="user-stats">
            <span className="honey-badge">🍯 {honeyPoints} Honey Points</span>
            <span className="api-status">🔗 {apiStatus}</span>
          </div>
        </div>
        
        <nav className="bee-nav">
          <button className="nav-btn">Hive</button>
          <button className="nav-btn">Create</button>
          <button className="nav-btn">Explore</button>
          <button className="nav-btn">Roles</button>
          <button className="nav-btn">Stream</button>
        </nav>
      </header>

      <main className="hive-main">
        <section className="welcome-section">
          <h2>Welcome to The Hive!</h2>
          <p>Choose your Bee Role and start collecting Honey Points</p>
          
          <div className="role-preview">
            <div className="role-card">
              <h3>Worker Bee</h3>
              <p>Build, maintain, earn steady honey</p>
            </div>
            <div className="role-card">
              <h3>Creator Bee</h3>
              <p>Make content, get pollinations</p>
            </div>
            <div className="role-card">
              <h3>Explorer Bee</h3>
              <p>Discover, share, earn bonuses</p>
            </div>
          </div>
        </section>

        <section className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn">Post Creation</button>
            <button className="action-btn">Check Roles</button>
            <button className="action-btn">Live Stream</button>
            <button className="action-btn">Gift Honey</button>
          </div>
        </section>
      </main>

      <footer className="hive-footer">
        <p>🐝 Polleneer Pro - The Social Hive Platform</p>
        <p>91 Bee Roles | Honey Points Economy | Live Streaming</p>
      </footer>
    </div>
  );
}

export default App;