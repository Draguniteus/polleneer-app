const express = require('express');
const router = express.Router();
const { pool, useRealDatabase } = require('../database');

// Get all posts
router.get('/', async (req, res) => {
  try {
    if (!useRealDatabase) {
      // Return mock data if no database
      const mockPosts = [
        {
          id: 1,
          user_id: 1,
          username: 'admin',
          display_name: 'Admin Bee',
          role: 'admin',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
          content: "Welcome to Polleneer! 🐝\n\nThis is our bee-themed social ecosystem where ideas cross-pollinate. Real database is now connected!",
          tags: ['#Welcome', '#Polleneer', '#BeeTheChange'],
          media_url: null,
          likes_count: 42,
          comments_count: 8,
          pollinations: 15,
          views: 120,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          isLiked: false
        }
      ];
      return res.json(mockPosts);
    }

    // Use real database
    const result = await pool.query(`
      SELECT p.id, p.user_id, p.content, p.image_url, p.likes, p.created_at,
             u.username, u.display_name, u.role, u.avatar_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    
    const posts = result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      display_name: row.display_name,
      role: row.role,
      avatar_url: row.avatar_url,
      content: row.content,
      tags: [],
      media_url: row.image_url,
      likes_count: row.likes,
      comments_count: 0,
      pollinations: Math.floor(row.likes / 2),
      views: row.likes * 3,
      created_at: row.created_at,
      isLiked: false
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new post
router.post('/', async (req, res) => {
  try {
    const { userId, content, tags, mediaUrl } = req.body;
    const user_id = userId || 1;
    
    if (!useRealDatabase) {
      // Mock response
      const newPost = {
        id: Date.now(),
        user_id,
        username: 'currentuser',
        display_name: 'Current User',
        role: 'worker',
        content,
        created_at: new Date().toISOString()
      };
      return res.json({ message: 'Post created (mock)', post: newPost, honeyPointsAdded: 25 });
    }

    // Insert into real database
    const result = await pool.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING *',
      [user_id, content, mediaUrl || null]
    );
    
    res.json({
      message: 'Post created successfully!',
      post: result.rows[0],
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
    
    if (!useRealDatabase) {
      return res.json({ message: 'Post liked (mock)!', liked: true, honeyPointsAdded: 5 });
    }

    // Update like count in database
    await pool.query(
      'UPDATE posts SET likes = likes + 1 WHERE id = $1',
      [id]
    );
    
    res.json({ 
      message: 'Post liked!', 
      liked: true, 
      honeyPointsAdded: 5 
    });
    
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
