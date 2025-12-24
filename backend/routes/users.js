const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await pool.query(
      `SELECT id, username, display_name, role, bio, honey_points, 
              followers, following, avatar_url, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: user.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    // In a real app, this would verify the user owns this profile
    const { id } = req.params;
    const { bio, avatar_url } = req.body;
    
    const updatedUser = await pool.query(
      `UPDATE users 
       SET bio = COALESCE($1, bio), 
           avatar_url = COALESCE($2, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, username, display_name, role, bio, avatar_url`,
      [bio, avatar_url, id]
    );
    
    res.json({ 
      message: 'Profile updated',
      user: updatedUser.rows[0]
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
    
    const posts = await pool.query(
      `SELECT p.*, u.username, u.display_name, u.avatar_url
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [id]
    );
    
    res.json(posts.rows);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
