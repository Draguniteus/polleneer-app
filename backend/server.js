const express = require('express');
const cors = require('cors');
// const path = require('path'); // REMOVED - we don't serve static files anymore
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // CHANGED FROM 8080 TO 3001

// ===== MIDDLEWARE =====
app.use(cors({ 
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Allow frontend ports
    credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REMOVED: app.use(express.static(path.join(__dirname, 'frontend')));

// ===== DATABASE CONNECTION (PostgreSQL) =====
let pool;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/polleneer';

try {
    pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    console.log('✅ PostgreSQL connected');
    
    // Create tables if they don't exist
    (async () => {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(100) NOT NULL,
                    profile_color VARCHAR(20) DEFAULT '#FFC107',
                    honey_points INTEGER DEFAULT 100,
                    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS posts (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL,
                    author_id INTEGER REFERENCES users(id),
                    author_name VARCHAR(50) NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    likes INTEGER DEFAULT 0,
                    pollinates INTEGER DEFAULT 0
                );
                
                CREATE TABLE IF NOT EXISTS comments (
                    id SERIAL PRIMARY KEY,
                    post_id INTEGER REFERENCES posts(id),
                    user_id INTEGER REFERENCES users(id),
                    username VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Database tables ready');
        } catch (err) {
            console.log('⚠️ Table creation error:', err.message);
        }
    })();
} catch (error) {
    console.log('❌ PostgreSQL connection failed:', error.message);
    console.log('⚠️ Using in-memory storage instead');
    pool = null;
}

// ===== IN-MEMORY STORAGE (FALLBACK) =====
let inMemoryUsers = [];
let inMemoryPosts = [];
let inMemoryComments = [];

// ===== API ROUTES =====

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API is working! 🐝',
        timestamp: new Date().toISOString(),
        mode: pool ? 'PostgreSQL' : 'In-memory',
        frontendUrl: 'http://localhost:3000'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        server: 'Polleneer Backend',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, profileColor } = req.body;
        
        if (pool) {
            // PostgreSQL
            const result = await pool.query(
                'INSERT INTO users (username, email, password, profile_color) VALUES ($1, $2, $3, $4) RETURNING *',
                [username, email, password, profileColor || '#FFC107']
            );
            
            res.json({
                success: true,
                message: 'User registered successfully',
                user: {
                    id: result.rows[0].id,
                    username: result.rows[0].username,
                    email: result.rows[0].email,
                    profileColor: result.rows[0].profile_color,
                    honeyPoints: result.rows[0].honey_points
                },
                token: 'sample-jwt-token'
            });
        } else {
            // In-memory storage
            const existingUser = inMemoryUsers.find(u => u.username === username || u.email === email);
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Username or email already exists' 
                });
            }
            
            const newUser = {
                id: Date.now(),
                username,
                email,
                password,
                profileColor: profileColor || '#FFC107',
                honeyPoints: 100,
                joinDate: new Date()
            };
            
            inMemoryUsers.push(newUser);
            res.json({
                success: true,
                message: 'User registered (in-memory mode)',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    profileColor: newUser.profileColor,
                    honeyPoints: newUser.honeyPoints
                },
                token: 'sample-jwt-token'
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration' 
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        let user;
        if (pool) {
            // PostgreSQL
            const result = await pool.query(
                'SELECT * FROM users WHERE username = $1 AND password = $2',
                [username, password]
            );
            user = result.rows[0];
        } else {
            // In-memory
            user = inMemoryUsers.find(u => u.username === username && u.password === password);
        }
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profileColor: user.profile_color || user.profileColor,
                honeyPoints: user.honey_points || user.honeyPoints
            },
            token: 'sample-jwt-token'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Posts routes
app.get('/api/posts', async (req, res) => {
    try {
        if (pool) {
            // PostgreSQL
            const result = await pool.query(
                'SELECT * FROM posts ORDER BY timestamp DESC LIMIT 50'
            );
            res.json({ success: true, posts: result.rows });
        } else {
            // In-memory
            const posts = inMemoryPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
            res.json({ success: true, posts });
        }
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch posts',
            posts: []
        });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const { content, authorId, authorName } = req.body;
        
        if (pool) {
            // PostgreSQL
            const result = await pool.query(
                'INSERT INTO posts (content, author_id, author_name) VALUES ($1, $2, $3) RETURNING *',
                [content, authorId, authorName]
            );
            
            res.json({
                success: true,
                message: 'Post created successfully',
                post: result.rows[0]
            });
        } else {
            // In-memory
            const newPost = {
                id: Date.now(),
                content,
                authorId,
                authorName,
                timestamp: new Date(),
                likes: 0,
                pollinates: 0
            };
            
            inMemoryPosts.unshift(newPost);
            res.json({
                success: true,
                message: 'Post created (in-memory mode)',
                post: newPost
            });
        }
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create post' 
        });
    }
});

// REMOVED: app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
// });

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 Backend Server running on port ${PORT}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️ Database: ${pool ? 'PostgreSQL' : 'In-memory (no DB)'}`);
    console.log(`🌐 Frontend should run on: http://localhost:3000`);
});