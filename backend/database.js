const { Pool } = require('pg');
require('dotenv').config();

// DigitalOcean provides DATABASE_URL in this format:
// postgresql://user:password@host:port/database?sslmode=require
const connectionString = process.env.DATABASE_URL;

console.log('🔧 Database module loaded');
console.log('📝 DATABASE_URL value:', connectionString ? 'SET' : 'NOT SET');

// Check if DATABASE_URL is available
let pool;
let useRealDatabase = false;

if (connectionString && connectionString.includes('postgresql://')) {
  console.log('✅ DATABASE_URL found - using real PostgreSQL database!');
  console.log('🔗 Connection string:', connectionString.substring(0, 50) + '...');
  
  // Parse connection string
  const urlObj = new URL(connectionString);
  const sslmode = urlObj.searchParams.get('sslmode') || 'require';
  
  // Create pool with proper SSL configuration for DigitalOcean managed DB
  const poolConfig = {
    connectionString: connectionString, // Keep full URL including sslmode
    ssl: {
      // For DigitalOcean managed PostgreSQL, we need to accept self-signed certs
      rejectUnauthorized: false,
      // Force TLS 1.2 minimum
      minVersion: 'TLSv1.2',
      // Handle various SSL scenarios
      ...(sslmode === 'require' ? { mode: 'require' } : {})
    }
  };
  
  console.log('🔐 SSL mode:', sslmode);
  console.log('🔐 SSL config: rejectUnauthorized = false');
  
  pool = new Pool(poolConfig);
  
  // Test connection with retry logic
  const testConnection = async () => {
    try {
      const result = await pool.query('SELECT 1 as test');
      console.log('✅ Database connection TEST SUCCESSFUL');
      console.log('📊 Test result:', result.rows[0]);
      return true;
    } catch (err) {
      console.error('❌ Database connection TEST FAILED:', err.message);
      // Try with SSL disabled if initial attempt fails
      if (err.message.includes('certificate') || err.message.includes('SSL')) {
        console.log('🔄 Retrying with SSL disabled...');
        poolConfig.ssl = false;
        try {
          const result = await pool.query('SELECT 1 as test');
          console.log('✅ Database connection SUCCESS (SSL disabled)');
          return true;
        } catch (retryErr) {
          console.error('❌ Retry also failed:', retryErr.message);
          return false;
        }
      }
      return false;
    }
  };
  
  testConnection();
  
  useRealDatabase = true;
} else {
  console.log('⚠️ DATABASE_URL not found or invalid - using mock data');
  console.log('📝 Connection string value:', connectionString);
  // Create a mock pool that won't crash the app
  pool = {
    connect: async () => {
      console.log('📦 Mock database connection');
      return {
        query: async () => ({ rows: [] }),
        release: () => console.log('🔓 Mock connection released')
      };
    },
    query: async () => ({ rows: [] }),
    on: () => {} // Empty event handlers
  };
}

async function initializeDatabase() {
  if (useRealDatabase) {
    console.log('🔄 Initializing real PostgreSQL database...');
    try {
      // Create tables if they don't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          honey_points INTEGER DEFAULT 100,
          role VARCHAR(50) DEFAULT 'worker',
          avatar_url TEXT,
          bio TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          content TEXT NOT NULL,
          image_url TEXT,
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Database tables initialized successfully!');
      console.log('🐝 Polleneer is now running with a real database!');
    } catch (error) {
      console.error('❌ Database initialization error:', error.message);
    }
  } else {
    console.log('📝 Running with mock data (no DATABASE_URL)');
    return {
      users: [
        { id: 1, username: 'admin', role: 'admin', honey_points: 9999 },
        { id: 2, username: 'testuser', role: 'worker', honey_points: 100 }
      ],
      posts: [
        { id: 1, content: 'Welcome to Polleneer! 🐝', likes: 42 },
        { id: 2, content: 'Database coming soon!', likes: 25 }
      ]
    };
  }
}

module.exports = { pool, initializeDatabase, useRealDatabase };
