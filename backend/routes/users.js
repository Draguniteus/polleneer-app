const express = require('express');
const router = express.Router();

// Mock users data
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    display_name: 'Admin Bee',
    role: 'admin',
    bio: 'The hive administrator. Building Polleneer for everyone!',
    honey_points: 9999,
    followers: 100,
    following: 50,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    username: 'testuser',
    display_name: 'Test User',
    role: 'worker',
    bio: 'Just testing Polleneer! Love the bee theme.',
    honey_points: 250,
    followers: 10,
    following: 20,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Test',
    created_at: '2024-01-02T00:00:00.000Z'
  },
  {
    id: 3,
    username: 'beelover',
    display_name: 'Bee Lover',
    role: 'honeybee',
    bio: 'Beekeeper and nature enthusiast. 🐝🌸',
    honey_points: 500,
    followers: 45,
    following: 32,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BeeLover',
    created_at: '2024-01-03T00:00:00.000Z'
  }
];

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = mockUsers.find(u => u.id === parseInt(id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { bio, avatar_url } = req.body;
    
    const user = mockUsers.find(u => u.id === parseInt(id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update fields
    if (bio !== undefined) user.bio = bio;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    
    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's posts
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In real app, query posts by user_id
    // For demo, return some mock posts
    const mockUserPosts = [
      {
        id: 1,
        user_id: parseInt(id),
        content: `User ${id}'s first post! Testing Polleneer.`,
        likes_count: 10,
        comments_count: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: parseInt(id),
        content: `Another post from user ${id}. The hive is buzzing! 🐝`,
        likes_count: 5,
        comments_count: 1,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    
    res.json(mockUserPosts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
