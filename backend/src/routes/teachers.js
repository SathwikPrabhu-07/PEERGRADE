const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

// Public routes
router.get('/', teacherController.getTeachers);
router.get('/:id', teacherController.getTeacher);

module.exports = router;
