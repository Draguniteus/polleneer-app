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

// Helper function to create mock pool
function createMockPool() {
  console.log('📦 Creating mock database pool');
  return {
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

if (connectionString && connectionString.includes('postgresql://')) {
  console.log('✅ DATABASE_URL found - using real PostgreSQL database!');
  console.log('🔗 Connection string:', connectionString.substring(0, 50) + '...');
  
  // Parse connection string
  const urlObj = new URL(connectionString);
  const sslmode = urlObj.searchParams.get('sslmode') || 'require';
  
  console.log('🔐 SSL mode from URL:', sslmode);
  
  // Try with SSL first, then without if it fails
  const tryConnect = async (sslOption) => {
    const poolConfig = {
      connectionString: connectionString,
      ssl: sslOption
    };
    
    const testPool = new Pool(poolConfig);
    try {
      const result = await testPool.query('SELECT 1 as test');
      console.log('✅ Database connection SUCCESS!');
      await testPool.end();
      return testPool;
    } catch (err) {
      console.log('❌ Connection attempt failed:', err.message);
      await testPool.end();
      throw err;
    }
  };
  
  // Main connection setup with fallback
  (async () => {
    try {
      // First try with SSL (rejectUnauthorized: false for self-signed certs)
      pool = await tryConnect({ rejectUnauthorized: false, minVersion: 'TLSv1.2' });
      console.log('🔐 Connected with SSL (self-signed cert allowed)');
    } catch (sslErr) {
      console.log('🔄 SSL connection failed, trying without SSL...');
      try {
        pool = await tryConnect(false);
        console.log('🔐 Connected without SSL');
      } catch (noSslErr) {
        console.error('❌ All connection attempts failed:', noSslErr.message);
        // Fall back to mock pool
        pool = createMockPool();
      }
    }
  })();
  
  useRealDatabase = true;
} else {
  console.log('⚠️ DATABASE_URL not found or invalid - using mock data');
  console.log('📝 Connection string value:', connectionString);
  pool = createMockPool();
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
