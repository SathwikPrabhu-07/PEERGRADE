const teacherService = require('../services/teacherService');

/**
 * Get teachers with optional filters
 * GET /api/teachers
 */
const getTeachers = async (req, res, next) => {
    try {
        const { category, level, search } = req.query;

        const teachers = await teacherService.getTeachers({
            category,
            level,
            search,
        });

        res.json({
            success: true,
            data: teachers,
            count: teachers.length,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single teacher by ID
 * GET /api/teachers/:id
 */
const getTeacher = async (req, res, next) => {
    try {
        const { id } = req.params;
        const teacher = await teacherService.getTeacherById(id);

        res.json({
            success: true,
            data: teacher,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTeachers,
    getTeacher,
};
