const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { authMiddleware } = require('../middleware/auth');

// All skill routes require authentication
router.use(authMiddleware);

// Get all teaching skills (for Discover page join)
router.get('/all-teaching', skillController.getAllTeachingSkills);

router.get('/', skillController.getSkills);
router.post('/', skillController.addSkill);
router.get('/:id', skillController.getSkill);
router.delete('/:id', skillController.removeSkill);

module.exports = router;

