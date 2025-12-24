const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await pool.query(`
      SELECT p.*, u.username, u.display_name, u.role, u.avatar_url,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    
    res.json(posts.rows);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new post
router.post('/', async (req, res) => {
  try {
    const { userId, content, tags, mediaUrl } = req.body;
    
    const newPost = await pool.query(
      `INSERT INTO posts (user_id, content, tags, media_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, content, tags || [], mediaUrl]
    );
    
    // Add honey points to user
    await pool.query(
      'UPDATE users SET honey_points = honey_points + 25 WHERE id = $1',
      [userId]
    );
    
    res.json({
      message: 'Post created successfully',
      post: newPost.rows[0],
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
    
    // Check if already liked
    const existingLike = await pool.query(
      'SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2',
      [userId, id]
    );
    
    if (existingLike.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2',
        [userId, id]
      );
      await pool.query(
        'UPDATE posts SET likes = likes - 1 WHERE id = $1',
        [id]
      );
      
      res.json({ message: 'Post unliked', liked: false });
    } else {
      // Like
      await pool.query(
        'INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)',
        [userId, id]
      );
      await pool.query(
        'UPDATE posts SET likes = likes + 1 WHERE id = $1',
        [id]
      );
      
      // Add honey points to post owner
      const post = await pool.query('SELECT user_id FROM posts WHERE id = $1', [id]);
      if (post.rows[0].user_id !== userId) {
        await pool.query(
          'UPDATE users SET honey_points = honey_points + 5 WHERE id = $1',
          [post.rows[0].user_id]
        );
      }
      
      res.json({ message: 'Post liked', liked: true, honeyPointsAdded: 5 });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;