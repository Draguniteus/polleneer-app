const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Security headers middleware
app.use((req, res, next) => {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Cache control for API routes
    if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    
    next();
});

// Serve static files from public directory with proper caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h', // Cache static assets for 1 hour
    setHeaders: (res, filePath) => {
        // Security headers for static files
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;");
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
        } else if (filePath.match(/\.(png|jpg|jpeg|gif|ico|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
        }
    }
}));

// API Routes
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Mock API endpoints for frontend development
app.get('/api/bee-roles', (req, res) => {
    res.json([
        { id: 1, name: 'Worker Bee', tier: 1, description: 'The foundation of the hive' },
        { id: 2, name: 'Drone Bee', tier: 1, description: 'Support and networking specialist' },
        { id: 3, name: 'Forager Bee', tier: 2, description: 'Resource collector and explorer' }
    ]);
});

app.get('/api/honey/balance', (req, res) => {
    // Mock response - will be replaced with real authentication
    res.json({ balance: 150, currency: '🍯' });
});

// Protected routes placeholder
app.get('/api/users/me', (req, res) => {
    // Mock authenticated user - will be replaced with JWT validation
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json({
        id: 1,
        username: 'TestBee',
        email: 'bee@polleneer.com',
        joinDate: '2025-12-24',
        roles: ['worker_bee']
    });
});

// Catch-all route for SPA - MUST be after API routes
app.get('*', (req, res) => {
    // Don't serve HTML for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Node version: ${process.version}`);
    console.log(`✅ Static files served from: ${path.join(__dirname, 'public')}`);
    console.log(`✅ API available at: http://localhost:${PORT}/api/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
