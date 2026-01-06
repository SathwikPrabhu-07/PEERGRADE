const express = require('express');
const router = express.Router();
const skillScoreController = require('../controllers/skillScoreController');
const { authMiddleware } = require('../middleware/auth');

// Debug: confirm routes are loaded
console.log('[SkillScore Routes] Registering skill score routes...');

// All routes require authentication
router.use(authMiddleware);

// Get scores for current user
router.get('/', skillScoreController.getSkillScores);

module.exports = router;
