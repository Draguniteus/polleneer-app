const express = require('express');
const router = express.Router();

// Mock posts database (temporary for launch)
let mockPosts = [
  {
    id: 1,
    user_id: 1,
    username: 'admin',
    display_name: 'Admin Bee',
    role: 'admin',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    content: "Welcome to Polleneer! 🐝\n\nThis is our bee-themed social ecosystem where ideas cross-pollinate. Right now we're running with simulated data - real database coming soon!",
    tags: ['#Welcome', '#Polleneer', '#BeeTheChange'],
    media_url: null,
    likes_count: 42,
    comments_count: 8,
    pollinations: 15,
    views: 120,
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    isLiked: false
  },
  {
    id: 2,
    user_id: 2,
    username: 'testuser',
    display_name: 'Test User',
    role: 'worker',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Test',
    content: "Just testing out Polleneer! The bee animations are amazing and I love the honey points system. Can't wait for the real database to save my progress!",
    tags: ['#Test', '#FirstPost', '#BeeHappy'],
    media_url: 'https://images.unsplash.com/photo-1587923623987-c7e4083beb23?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    likes_count: 25,
    comments_count: 3,
    pollinations: 7,
    views: 85,
    created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    isLiked: true
  },
  {
    id: 3,
    user_id: 1,
    username: 'admin',
    display_name: 'Admin Bee',
    role: 'admin',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    content: "🚀 Polleneer Development Update:\n\n✅ Frontend/Backend deployed\n✅ User authentication working\n✅ Post system functional\n⏳ Database connection coming next!\n\nThank you for being part of our hive!",
    tags: ['#Update', '#Development', '#Progress'],
    media_url: null,
    likes_count: 67,
    comments_count: 12,
    pollinations: 23,
    views: 210,
    created_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    isLiked: false
  }
];

// Get all posts
router.get('/', async (req, res) => {
  try {
    res.json(mockPosts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new post
router.post('/', async (req, res) => {
  try {
    const { userId, content, tags, mediaUrl } = req.body;
    
    const newPost = {
      id: mockPosts.length + 1,
      user_id: userId || 1,
      username: 'currentuser',
      display_name: 'Current User',
      role: 'worker',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
      content: content,
      tags: tags || [],
      media_url: mediaUrl || null,
      likes_count: 0,
      comments_count: 0,
      pollinations: 0,
      views: 0,
      created_at: new Date().toISOString(),
      isLiked: false
    };
    
    mockPosts.unshift(newPost); // Add to beginning
    
    res.json({
      message: 'Post created successfully!',
      post: newPost,
      honeyPointsAdded: 25
    });
    
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like a post
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const post = mockPosts.find(p => p.id === parseInt(id));
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Toggle like
    if (post.isLiked) {
      post.likes_count -= 1;
      post.isLiked = false;
      res.json({ message: 'Post unliked', liked: false });
    } else {
      post.likes_count += 1;
      post.isLiked = true;
      res.json({ 
        message: 'Post liked!', 
        liked: true, 
        honeyPointsAdded: 5 
      });
    }
    
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
