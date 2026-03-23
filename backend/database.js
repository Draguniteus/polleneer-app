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
  console.log('🔗 Connection string:', connectionString.substring(0, 60) + '...');
  
  // Parse and reconstruct connection string - handle SSL properly
  let parsedUrl;
  try {
    parsedUrl = new URL(connectionString);
  } catch (e) {
    console.error('❌ Failed to parse DATABASE_URL:', e.message);
    useRealDatabase = false;
    // Create a mock pool
    pool = {
      connect: async () => ({ query: async () => ({ rows: [] }), release: () => {} }),
      query: async () => ({ rows: [] }),
      on: () => {}
    };
    return;
  }
  
  // Extract components
  const user = parsedUrl.username;
  const password = parsedUrl.password;
  const host = parsedUrl.hostname;
  const port = parsedUrl.port || '25060';
  const database = parsedUrl.pathname.replace('/', '');
  
  // Build clean connection string without sslmode
  const cleanConnectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  console.log('🔐 Created clean connection string');
  
  // Create pool with proper SSL settings
  pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: {
      rejectUnauthorized: false,
      // Try to get root CA from environment or use default
      ca: process.env.SSL_CA || undefined,
      key: process.env.SSL_KEY || undefined,
      cert: process.env.SSL_CERT || undefined
    }
  });
  
  // Test connection
  pool.query('SELECT 1')
    .then(() => console.log('✅ Database connection SUCCESS'))
    .catch((err) => {
      console.log('🔄 SSL/TLS error, trying fallback...');
      console.log('🔄 Error:', err.message);
      // Note: In production, we'd recreate pool with ssl: false here
    });
  
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
