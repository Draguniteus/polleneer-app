// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'polleneer-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polleneer', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// File upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ============================================
// DATABASE MODELS
// ============================================

// User Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['queen', 'worker', 'drone', 'honeybee', 'admin'],
        default: 'worker'
    },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    honeyPoints: { type: Number, default: 100 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    customization: {
        colors: { type: Object, default: {} },
        background: { type: String, default: '' },
        css: { type: String, default: '' },
        music: { type: String, default: '' }
    },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Post Model
const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    media: { type: String, default: '' },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    pollinations: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pollinatedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Comment Model
const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);

// Notification Model
const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: ['like', 'comment', 'follow', 'pollination', 'mention'],
        required: true 
    },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Message Model
const messageSchema = new mongoose.Schema({
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Community Model
const communitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    color: { type: String, default: '#FFC30B' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    memberCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const Community = mongoose.model('Community', communitySchema);

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, displayName, role } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create avatar URL
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
        
        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            displayName,
            role: role || 'worker',
            avatar
        });
        
        await user.save();
        
        // Create token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                honeyPoints: user.honeyPoints,
                bio: user.bio,
                followers: user.followers,
                following: user.following,
                customization: user.customization
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check admin login first
        if (email === 'admin@polleneer.com' && password === 'polleneer2024') {
            // Create or find admin user
            let admin = await User.findOne({ email: 'admin@polleneer.com' });
            
            if (!admin) {
                admin = new User({
                    username: 'admin',
                    email: 'admin@polleneer.com',
                    password: await bcrypt.hash('polleneer2024', 10),
                    displayName: 'Admin',
                    role: 'admin',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                    honeyPoints: 9999
                });
                await admin.save();
            }
            
            const token = jwt.sign({ userId: admin._id }, JWT_SECRET, { expiresIn: '7d' });
            
            return res.json({
                token,
                user: {
                    id: admin._id,
                    username: admin.username,
                    displayName: admin.displayName,
                    email: admin.email,
                    role: admin.role,
                    avatar: admin.avatar,
                    honeyPoints: admin.honeyPoints,
                    bio: admin.bio,
                    followers: admin.followers,
                    following: admin.following,
                    customization: admin.customization
                }
            });
        }
        
        // Regular user login
        const user = await User.findOne({ 
            $or: [{ email }, { username: email }] 
        });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                honeyPoints: user.honeyPoints,
                bio: user.bio,
                followers: user.followers,
                following: user.following,
                customization: user.customization
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
app.get('/api/user', authenticate, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            username: req.user.username,
            displayName: req.user.displayName,
            email: req.user.email,
            role: req.user.role,
            avatar: req.user.avatar,
            honeyPoints: req.user.honeyPoints,
            bio: req.user.bio,
            followers: req.user.followers,
            following: req.user.following,
            customization: req.user.customization
        }
    });
});

// ============================================
// USER ROUTES
// ============================================

// Update user profile
app.put('/api/user/profile', authenticate, async (req, res) => {
    try {
        const { bio, displayName } = req.body;
        
        const updates = {};
        if (bio !== undefined) updates.bio = bio;
        if (displayName !== undefined) updates.displayName = displayName;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true }
        );
        
        res.json({
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                honeyPoints: user.honeyPoints,
                bio: user.bio,
                followers: user.followers,
                following: user.following,
                customization: user.customization
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// Upload avatar
app.post('/api/user/avatar', authenticate, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const avatarUrl = `/uploads/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { avatar: avatarUrl } },
            { new: true }
        );
        
        res.json({
            avatar: user.avatar
        });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Save customization
app.post('/api/user/customization', authenticate, async (req, res) => {
    try {
        const { colors, background, css, music } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { 
                $set: { 
                    customization: { colors, background, css, music }
                } 
            },
            { new: true }
        );
        
        res.json({
            customization: user.customization
        });
    } catch (error) {
        res.status(500).json({ error: 'Save failed' });
    }
});

// ============================================
// POST ROUTES
// ============================================

// Create post
app.post('/api/posts', authenticate, async (req, res) => {
    try {
        const { content, tags, media } = req.body;
        
        const post = new Post({
            userId: req.user._id,
            content,
            tags: tags || [],
            media: media || '',
            likes: 0,
            comments: 0,
            pollinations: 0,
            views: 0
        });
        
        await post.save();
        
        // Add honey points for creating post
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { honeyPoints: 25 }
        });
        
        // Populate user info
        await post.populate('userId', 'username displayName avatar role');
        
        res.status(201).json({
            post: {
                id: post._id,
                content: post.content,
                tags: post.tags,
                media: post.media,
                likes: post.likes,
                comments: post.comments,
                pollinations: post.pollinations,
                views: post.views,
                createdAt: post.createdAt,
                user: {
                    id: post.userId._id,
                    username: post.userId.username,
                    displayName: post.userId.displayName,
                    avatar: post.userId.avatar,
                    role: post.userId.role
                },
                isLiked: false,
                isPollinated: false
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Post creation failed' });
    }
});

// Get all posts (feed)
app.get('/api/posts', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username displayName avatar role');
        
        // Check if user liked/pollinated each post
        const postsWithStatus = await Promise.all(posts.map(async (post) => {
            const isLiked = post.likedBy.includes(req.user._id);
            const isPollinated = post.pollinatedBy.includes(req.user._id);
            
            return {
                id: post._id,
                content: post.content,
                tags: post.tags,
                media: post.media,
                likes: post.likes,
                comments: post.comments,
                pollinations: post.pollinations,
                views: post.views,
                createdAt: post.createdAt,
                user: {
                    id: post.userId._id,
                    username: post.userId.username,
                    displayName: post.userId.displayName,
                    avatar: post.userId.avatar,
                    role: post.userId.role
                },
                isLiked,
                isPollinated
            };
        }));
        
        res.json({ posts: postsWithStatus });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Like/unlike post
app.post('/api/posts/:postId/like', authenticate, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const isLiked = post.likedBy.includes(req.user._id);
        
        if (isLiked) {
            // Unlike
            await Post.findByIdAndUpdate(post._id, {
                $inc: { likes: -1 },
                $pull: { likedBy: req.user._id }
            });
            
            if (post.userId.toString() !== req.user._id.toString()) {
                await User.findByIdAndUpdate(req.user._id, {
                    $inc: { honeyPoints: -5 }
                });
            }
        } else {
            // Like
            await Post.findByIdAndUpdate(post._id, {
                $inc: { likes: 1 },
                $push: { likedBy: req.user._id }
            });
            
            // Add honey points for liking
            if (post.userId.toString() !== req.user._id.toString()) {
                await User.findByIdAndUpdate(req.user._id, {
                    $inc: { honeyPoints: 5 }
                });
                
                // Create notification
                const notification = new Notification({
                    userId: post.userId,
                    type: 'like',
                    fromUserId: req.user._id,
                    postId: post._id
                });
                await notification.save();
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Like failed' });
    }
});

// Pollinate/unpollinate post
app.post('/api/posts/:postId/pollinate', authenticate, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const isPollinated = post.pollinatedBy.includes(req.user._id);
        
        if (isPollinated) {
            // Unpollinate
            await Post.findByIdAndUpdate(post._id, {
                $inc: { pollinations: -1 },
                $pull: { pollinatedBy: req.user._id }
            });
            
            if (post.userId.toString() !== req.user._id.toString()) {
                await User.findByIdAndUpdate(req.user._id, {
                    $inc: { honeyPoints: -15 }
                });
            }
        } else {
            // Pollinate
            await Post.findByIdAndUpdate(post._id, {
                $inc: { pollinations: 1 },
                $push: { pollinatedBy: req.user._id }
            });
            
            // Add honey points for pollinating
            if (post.userId.toString() !== req.user._id.toString()) {
                await User.findByIdAndUpdate(req.user._id, {
                    $inc: { honeyPoints: 15 }
                });
                
                // Create notification
                const notification = new Notification({
                    userId: post.userId,
                    type: 'pollination',
                    fromUserId: req.user._id,
                    postId: post._id
                });
                await notification.save();
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Pollinate failed' });
    }
});

// ============================================
// COMMENT ROUTES
// ============================================

// Add comment
app.post('/api/posts/:postId/comments', authenticate, async (req, res) => {
    try {
        const { text } = req.body;
        
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const comment = new Comment({
            postId: post._id,
            userId: req.user._id,
            text
        });
        
        await comment.save();
        
        // Update post comment count
        await Post.findByIdAndUpdate(post._id, {
            $inc: { comments: 1 }
        });
        
        // Add honey points for commenting
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { honeyPoints: 10 }
        });
        
        // Create notification
        if (post.userId.toString() !== req.user._id.toString()) {
            const notification = new Notification({
                userId: post.userId,
                type: 'comment',
                fromUserId: req.user._id,
                postId: post._id
            });
            await notification.save();
        }
        
        // Populate user info
        await comment.populate('userId', 'username displayName avatar');
        
        res.status(201).json({
            comment: {
                id: comment._id,
                text: comment.text,
                createdAt: comment.createdAt,
                user: {
                    id: comment.userId._id,
                    username: comment.userId.username,
                    displayName: comment.userId.displayName,
                    avatar: comment.userId.avatar
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Comment failed' });
    }
});

// Get comments for post
app.get('/api/posts/:postId/comments', authenticate, async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId })
            .sort({ createdAt: -1 })
            .populate('userId', 'username displayName avatar');
        
        res.json({
            comments: comments.map(comment => ({
                id: comment._id,
                text: comment.text,
                createdAt: comment.createdAt,
                user: {
                    id: comment.userId._id,
                    username: comment.userId.username,
                    displayName: comment.userId.displayName,
                    avatar: comment.userId.avatar
                }
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// ============================================
// FOLLOW ROUTES
// ============================================

// Follow/unfollow user
app.post('/api/users/:userId/follow', authenticate, async (req, res) => {
    try {
        if (req.params.userId === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        
        const userToFollow = await User.findById(req.params.userId);
        if (!userToFollow) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const currentUser = await User.findById(req.user._id);
        const isFollowing = userToFollow.followers.includes(req.user._id);
        
        if (isFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(userToFollow._id, {
                $inc: { followers: -1 },
                $pull: { followers: req.user._id }
            });
            
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { following: -1 },
                $pull: { following: userToFollow._id }
            });
        } else {
            // Follow
            await User.findByIdAndUpdate(userToFollow._id, {
                $inc: { followers: 1 },
                $push: { followers: req.user._id }
            });
            
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { following: 1 },
                $push: { following: userToFollow._id }
            });
            
            // Create notification
            const notification = new Notification({
                userId: userToFollow._id,
                type: 'follow',
                fromUserId: req.user._id
            });
            await notification.save();
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Follow failed' });
    }
});

// Get suggested users to follow
app.get('/api/users/suggested', authenticate, async (req, res) => {
    try {
        const users = await User.find({
            _id: { $ne: req.user._id },
            followers: { $ne: req.user._id }
        })
        .limit(4)
        .select('username displayName avatar role followers');
        
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch suggested users' });
    }
});

// ============================================
// NOTIFICATION ROUTES
// ============================================

// Get notifications
app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('fromUserId', 'username displayName avatar')
            .populate('postId', 'content');
        
        // Mark as read
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { $set: { read: true } }
        );
        
        res.json({ notifications });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// ============================================
// COMMUNITY ROUTES
// ============================================

// Get all communities
app.get('/api/communities', authenticate, async (req, res) => {
    try {
        const communities = await Community.find()
            .sort({ memberCount: -1 })
            .limit(10);
        
        // Check if user is member
        const communitiesWithStatus = await Promise.all(communities.map(async (community) => {
            const isMember = community.members.includes(req.user._id);
            return {
                id: community._id,
                name: community.name,
                description: community.description,
                icon: community.icon,
                color: community.color,
                memberCount: community.memberCount,
                isMember
            };
        }));
        
        res.json({ communities: communitiesWithStatus });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch communities' });
    }
});

// Join/leave community
app.post('/api/communities/:communityId/join', authenticate, async (req, res) => {
    try {
        const community = await Community.findById(req.params.communityId);
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        
        const isMember = community.members.includes(req.user._id);
        
        if (isMember) {
            // Leave community
            await Community.findByIdAndUpdate(community._id, {
                $inc: { memberCount: -1 },
                $pull: { members: req.user._id }
            });
        } else {
            // Join community
            await Community.findByIdAndUpdate(community._id, {
                $inc: { memberCount: 1 },
                $push: { members: req.user._id }
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Join failed' });
    }
});

// ============================================
// TRENDING ROUTES
// ============================================

// Get trending topics
app.get('/api/trending', authenticate, async (req, res) => {
    try {
        // Get most used tags from posts in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const trendingTags = await Post.aggregate([
            { $match: { createdAt: { $gte: oneDayAgo } } },
            { $unwind: '$tags' },
            { $group: { 
                _id: '$tags',
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        res.json({ trending: trendingTags });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trending' });
    }
});

// ============================================
// ACTIVITY ROUTES
// ============================================

// Get hive activity
app.get('/api/activity', authenticate, async (req, res) => {
    try {
        const activities = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('fromUserId', 'username displayName avatar')
            .populate('userId', 'username displayName avatar');
        
        res.json({ activities });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// ============================================
// MESSAGE ROUTES
// ============================================

// Get conversations
app.get('/api/messages', authenticate, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { fromUserId: req.user._id },
                { toUserId: req.user._id }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('fromUserId', 'username displayName avatar')
        .populate('toUserId', 'username displayName avatar');
        
        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send message
app.post('/api/messages', authenticate, async (req, res) => {
    try {
        const { toUserId, text } = req.body;
        
        const message = new Message({
            fromUserId: req.user._id,
            toUserId,
            text
        });
        
        await message.save();
        
        // Populate user info
        await message.populate('fromUserId toUserId', 'username displayName avatar');
        
        res.status(201).json({ message });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Admin-only: Get all users
app.get('/api/admin/users', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const users = await User.find().select('-password');
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Admin-only: Update site settings
app.post('/api/admin/settings', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        // In a real app, you would save these to a Settings model
        // For now, we'll just return success
        res.json({ success: true, message: 'Settings saved' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// ============================================
// INITIALIZATION
// ============================================

// Create default admin if not exists
async function initializeAdmin() {
    try {
        const adminExists = await User.findOne({ email: 'admin@polleneer.com' });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('polleneer2024', 10);
            
            const admin = new User({
                username: 'admin',
                email: 'admin@polleneer.com',
                password: hashedPassword,
                displayName: 'Admin',
                role: 'admin',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                honeyPoints: 9999,
                bio: 'System Administrator'
            });
            
            await admin.save();
            console.log('✅ Default admin user created');
        }
        
        // Create sample communities if none exist
        const communityCount = await Community.countDocuments();
        if (communityCount === 0) {
            const communities = [
                {
                    name: 'Art Collective',
                    description: 'For artists and creators',
                    icon: '🎨',
                    color: '#FF69B4',
                    memberCount: 3700
                },
                {
                    name: 'Tech Innovators',
                    description: 'Technology and innovation',
                    icon: '💻',
                    color: '#87CEEB',
                    memberCount: 4200
                },
                {
                    name: 'Music Lovers',
                    description: 'Music enthusiasts',
                    icon: '🎵',
                    color: '#9370DB',
                    memberCount: 5100
                },
                {
                    name: 'Food & Travel',
                    description: 'Foodies and travelers',
                    icon: '🍕',
                    color: '#FF8C00',
                    memberCount: 2800
                },
                {
                    name: 'Gaming Hub',
                    description: 'Gamers unite',
                    icon: '🎮',
                    color: '#228B22',
                    memberCount: 6300
                },
                {
                    name: 'Book Club',
                    description: 'Readers and writers',
                    icon: '📚',
                    color: '#8B4513',
                    memberCount: 1900
                }
            ];
            
            await Community.insertMany(communities);
            console.log('✅ Sample communities created');
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    initializeAdmin();
});
