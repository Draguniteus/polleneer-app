const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(cors({
    origin: '*', // Allow all origins for now
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== SERVE STATIC FILES =====
// Serve frontend files from the frontend folder
app.use(express.static(path.join(__dirname, 'frontend')));

// Debug logging for file serving
console.log('📁 Static files served from:', path.join(__dirname, 'frontend'));
console.log('📁 index.html location:', path.join(__dirname, 'frontend', 'index.html'));

// ===== DATABASE CONNECTION =====
// Use environment variable for MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polleneer';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
    console.log('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Continuing without database - using in-memory storage');
});

// ===== DATABASE MODELS =====
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileColor: { type: String, default: '#FFC107' },
    honeyPoints: { type: Number, default: 100 },
    joinDate: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
    content: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    comments: [{
        userId: String,
        username: String,
        content: String,
        timestamp: Date
    }],
    pollinates: { type: Number, default: 0 }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

// ===== IN-MEMORY STORAGE (FALLBACK) =====
let inMemoryUsers = [];
let inMemoryPosts = [];

// ===== API ROUTES =====

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API is working! 🐝',
        timestamp: new Date().toISOString(),
        mode: mongoose.connection.readyState === 1 ? 'Database' : 'In-memory'
    });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, profileColor } = req.body;
        
        // Check if user exists
        let existingUser;
        if (mongoose.connection.readyState === 1) {
            existingUser = await User.findOne({ $or: [{ username }, { email }] });
        } else {
            existingUser = inMemoryUsers.find(u => u.username === username || u.email === email);
        }
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username or email already exists' 
            });
        }
        
        // Create new user
        const newUser = {
            username,
            email,
            password, // In real app, hash this!
            profileColor: profileColor || '#FFC107',
            honeyPoints: 100,
            joinDate: new Date()
        };
        
        if (mongoose.connection.readyState === 1) {
            const savedUser = await User.create(newUser);
            res.json({
                success: true,
                message: 'User registered successfully',
                user: {
                    id: savedUser._id,
                    username: savedUser.username,
                    email: savedUser.email,
                    profileColor: savedUser.profileColor,
                    honeyPoints: savedUser.honeyPoints
                },
                token: 'sample-jwt-token' // In real app, generate proper JWT
            });
        } else {
            // In-memory storage
            newUser.id = Date.now().toString();
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
        if (mongoose.connection.readyState === 1) {
            user = await User.findOne({ username, password });
        } else {
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
                id: user._id || user.id,
                username: user.username,
                email: user.email,
                profileColor: user.profileColor,
                honeyPoints: user.honeyPoints
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
        let posts;
        if (mongoose.connection.readyState === 1) {
            posts = await Post.find().sort({ timestamp: -1 }).limit(50);
        } else {
            posts = inMemoryPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
        }
        
        res.json({ success: true, posts });
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
        
        const newPost = {
            content,
            authorId,
            authorName,
            timestamp: new Date(),
            likes: 0,
            comments: [],
            pollinates: 0
        };
        
        if (mongoose.connection.readyState === 1) {
            const savedPost = await Post.create(newPost);
            res.json({
                success: true,
                message: 'Post created successfully',
                post: savedPost
            });
        } else {
            // In-memory storage
            newPost.id = Date.now().toString();
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

// ===== ROOT ROUTE - SERVE INDEX.HTML =====
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Web interface: http://localhost:${PORT}`);
    console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
    console.log(`📁 Serving from: ${path.join(__dirname, 'frontend')}`);
    console.log(`🗄️ Database status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected (using in-memory)'}`);
});
