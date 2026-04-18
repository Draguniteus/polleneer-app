const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, useRealDatabase } = require('../database');

// Initialize Passport
function initializePassport(app) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value;
      const displayName = profile.displayName || profile.name?.givenName;
      const avatarUrl = profile.photos?.[0]?.value?.replace('?sz=50', '?sz=200');

      if (!useRealDatabase) {
        return done(null, { googleId, email, displayName, avatarUrl, isNew: true });
      }

      // Check if user exists with this Google ID
      let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

      if (result.rows.length > 0) {
        // Existing user - return them
        const user = result.rows[0];
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          process.env.JWT_SECRET || 'polleneer-secret-key',
          { expiresIn: '7d' }
        );
        return done(null, { user, token, isNew: false });
      }

      // Check if user exists with same email
      if (email) {
        result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
          // Link Google account to existing user
          await pool.query('UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3', [googleId, avatarUrl, result.rows[0].id]);
          const user = result.rows[0];
          const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'polleneer-secret-key',
            { expiresIn: '7d' }
          );
          return done(null, { user, token, isNew: false, linked: true });
        }
      }

      // Create new user
      const username = email ? email.split('@')[0] + '_' + googleId.slice(-6) : 'user_' + googleId.slice(-8);
      const password_hash = await bcrypt.hash(googleId + Date.now(), 10);
      const honeyPoints = 100;

      result = await pool.query(
        `INSERT INTO users (username, email, password_hash, display_name, google_id, avatar_url, honey_points, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [username, email, password_hash, displayName, googleId, avatarUrl, honeyPoints, 'worker']
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'polleneer-secret-key',
        { expiresIn: '7d' }
      );

      return done(null, { user, token, isNew: true });
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error);
    }
  }));

  // GitHub OAuth Strategy
  passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
    scope: ['user:email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const githubId = profile.id;
      const email = profile.emails?.[0]?.value || `${githubId}@github.noemail`;
      const displayName = profile.displayName || profile.username;
      const avatarUrl = profile.photos?.[0]?.value;
      const githubUsername = profile.username;

      if (!useRealDatabase) {
        return done(null, { githubId, githubUsername, email, displayName, avatarUrl, isNew: true });
      }

      // Check if user exists with this GitHub ID
      let result = await pool.query('SELECT * FROM users WHERE github_id = $1', [githubId]);

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          process.env.JWT_SECRET || 'polleneer-secret-key',
          { expiresIn: '7d' }
        );
        return done(null, { user, token, isNew: false });
      }

      // Check if user exists with same email
      result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        await pool.query('UPDATE users SET github_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3', [githubId, avatarUrl, result.rows[0].id]);
        const user = result.rows[0];
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          process.env.JWT_SECRET || 'polleneer-secret-key',
          { expiresIn: '7d' }
        );
        return done(null, { user, token, isNew: false, linked: true });
      }

      // Create new user
      const username = githubUsername || 'user_' + githubId.slice(-8);
      const password_hash = await bcrypt.hash(githubId + Date.now(), 10);
      const honeyPoints = 100;

      result = await pool.query(
        `INSERT INTO users (username, email, password_hash, display_name, github_id, avatar_url, honey_points, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [username, email, password_hash, displayName, githubId, avatarUrl, honeyPoints, 'worker']
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET || 'polleneer-secret-key',
        { expiresIn: '7d' }
      );

      return done(null, { user, token, isNew: true });
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return done(error);
    }
  }));
}

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const { user, token, isNew, linked } = req.user;
    // Redirect to frontend with token
    const baseUrl = process.env.FRONTEND_URL || 'https://polleneer-app-ukvcq.ondigitalocean.app';
    let redirectUrl = `${baseUrl}?oauth=google&token=${token}&isNew=${isNew}`;
    if (linked) redirectUrl += '&linked=true';
    res.redirect(redirectUrl);
  }
);

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', {
  scope: ['user:email']
}));

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  (req, res) => {
    const { user, token, isNew, linked } = req.user;
    const baseUrl = process.env.FRONTEND_URL || 'https://polleneer-app-ukvcq.ondigitalocean.app';
    let redirectUrl = `${baseUrl}?oauth=github&token=${token}&isNew=${isNew}`;
    if (linked) redirectUrl += '&linked=true';
    res.redirect(redirectUrl);
  }
);

module.exports = { router, initializePassport };
