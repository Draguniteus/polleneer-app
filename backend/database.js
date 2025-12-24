const { Pool } = require('pg');
require('dotenv').config();

// DigitalOcean provides DATABASE_URL in this format:
// postgresql://user:password@host:port/database?sslmode=require
const connectionString = process.env.DATABASE_URL;

console.log('🔧 Database module loaded');
console.log('📝 Database connection temporarily disabled for launch');

// Create a mock pool that won't crash the app
const pool = {
  connect: async () => {
    console.log('📦 Mock database connection (real DB disabled)');
    return {
      query: async () => ({ rows: [] }),
      release: () => console.log('🔓 Mock connection released')
    };
  },
  query: async () => ({ rows: [] }),
  on: () => {} // Empty event handlers
};

async function initializeDatabase() {
  console.log('📝 Database initialization SKIPPED for initial deployment');
  console.log('🐝 Polleneer will run with simulated data for now');
  console.log('💾 Real PostgreSQL database will be connected in next update');
  
  // Return mock data for testing
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

module.exports = { pool, initializeDatabase };
