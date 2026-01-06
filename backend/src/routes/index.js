const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const skillRoutes = require('./skills');
const teacherRoutes = require('./teachers');
const requestRoutes = require('./requests');
const sessionRoutes = require('./sessions');
const assignmentRoutes = require('./assignments');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/skills', skillRoutes);
router.use('/teachers', teacherRoutes);
router.use('/requests', requestRoutes);
router.use('/sessions', sessionRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/skill-scores', require('./skillScores'));

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'PeerGrade API is running',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
