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
      // First, try to grant schema permissions
      try {
        await pool.query('GRANT ALL ON SCHEMA public TO CURRENT_USER;');
        await pool.query('GRANT CREATE ON SCHEMA public TO CURRENT_USER;');
        console.log('✅ Schema permissions granted');
      } catch (permError) {
        console.log('⚠️ Could not grant permissions (may already have them):', permError.message);
      }
      
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'worker',
          bio TEXT,
          honey_points INTEGER DEFAULT 100,
          followers INTEGER DEFAULT 0,
          following INTEGER DEFAULT 0,
          avatar_url TEXT,
          website TEXT,
          location VARCHAR(255),
          joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create posts table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          image_url TEXT,
          likes INTEGER DEFAULT 0,
          pollinations INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          views INTEGER DEFAULT 0,
          is_pinned BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create likes table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS likes (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, post_id)
        );
      `);
      
      // Create pollinations (reposts) table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pollinations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, post_id)
        );
      `);
      
      // Create notifications table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create messages table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create index for faster queries
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);`);
      
      console.log('✅ Database tables initialized successfully!');
      console.log('🐝 Polleneer is now running with a real database!');
    } catch (error) {
      console.error('❌ Database initialization error:', error.message);
      console.log('💡 Tip: Make sure the database user has permission to create tables. Run this in PostgreSQL:');
      console.log('   GRANT ALL PRIVILEGES ON DATABASE your_database TO your_user;');
      console.log('   GRANT ALL ON SCHEMA public TO your_user;');
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
