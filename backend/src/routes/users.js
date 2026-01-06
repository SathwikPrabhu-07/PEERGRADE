const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get my profile
router.get('/me', userController.getProfile);

// Update my profile
router.put('/me', userController.updateProfile);

// Get my credibility score (main dashboard data)
router.get('/me/credibility', userController.getCredibilityScore);

// Get my stats
router.get('/me/stats', userController.getStats);

// Get my skills
router.get('/me/skills', userController.getUserSkills);

// Get public profile (parameterized route last)
router.get('/:id', userController.getPublicUserProfile);

module.exports = router;

