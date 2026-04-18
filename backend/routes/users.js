const express = require('express');
const router = express.Router();
const { pool, useRealDatabase } = require('../database');

// Get all users
router.get('/', async (req, res) => {
  try {
    if (!useRealDatabase) {
      // Return mock data if no database
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
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
        }
      ];
      return res.json(mockUsers);
    }

    // Use real database
    const result = await pool.query('SELECT id, username, display_name, role, bio, honey_points, avatar_url, created_at FROM users ORDER BY honey_points DESC LIMIT 50');
    
    const users = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      role: row.role,
      bio: row.bio,
      honey_points: row.honey_points,
      followers: Math.floor(row.honey_points / 10),
      following: Math.floor(row.honey_points / 20),
      avatar_url: row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.username}`,
      created_at: row.created_at
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!useRealDatabase) {
      return res.json({
        id: 1,
        username: 'admin',
        display_name: 'Admin Bee',
        role: 'admin',
        bio: 'The hive administrator',
        honey_points: 9999,
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
      });
    }

    const result = await pool.query('SELECT id, username, display_name, role, bio, honey_points, avatar_url, created_at FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const row = result.rows[0];
    res.json({
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      role: row.role,
      bio: row.bio,
      honey_points: row.honey_points,
      followers: Math.floor(row.honey_points / 10),
      following: Math.floor(row.honey_points / 20),
      avatar_url: row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.username}`,
      created_at: row.created_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, display_name, bio, avatar_url, role } = req.body;

    if (!useRealDatabase) {
      return res.json({ message: 'User updated (mock)', id, username, display_name, bio, role });
    }

    // Check if username is already taken (if changing)
    if (username) {
      const existing = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const result = await pool.query(
      'UPDATE users SET username = COALESCE($1, username), display_name = COALESCE($2, display_name), bio = COALESCE($3, bio), avatar_url = COALESCE($4, avatar_url), role = COALESCE($5, role) WHERE id = $6 RETURNING *',
      [username, display_name, bio, avatar_url, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      message: 'User updated',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        bio: user.bio,
        honey_points: user.honey_points,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
