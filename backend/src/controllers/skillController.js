const skillService = require('../services/skillService');

/**
 * Get user's skills
 * GET /api/skills
 */
const getSkills = async (req, res, next) => {
    try {
        const skills = await skillService.getUserSkills(req.user.id);

        res.json({
            success: true,
            data: skills,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get ALL teaching skills from ALL users
 * GET /api/skills/all-teaching
 * Used by frontend to join with teachers at render time
 */
const getAllTeachingSkills = async (req, res, next) => {
    try {
        const skills = await skillService.getAllTeachingSkills();

        res.json({
            success: true,
            data: skills,
            count: skills.length,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add a skill
 * POST /api/skills
 */
const addSkill = async (req, res, next) => {
    try {
        const { name, category, level, type, description } = req.body;

        // Validate required fields
        if (!name || !category || !level || !type) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, level, and type are required',
            });
        }

        // Validate type
        if (!['teach', 'learn'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be teach or learn',
            });
        }

        // Validate level
        if (!['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
            return res.status(400).json({
                success: false,
                message: 'Level must be Beginner, Intermediate, or Advanced',
            });
        }

        const skill = await skillService.addSkill(req.user.id, {
            name,
            category,
            level,
            type,
            description,
        });

        res.status(201).json({
            success: true,
            message: 'Skill added successfully',
            data: skill,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove a skill
 * DELETE /api/skills/:id
 */
const removeSkill = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await skillService.removeSkill(id, req.user.id);

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single skill by ID
 * GET /api/skills/:id
 */
const getSkill = async (req, res, next) => {
    try {
        const { id } = req.params;
        const skill = await skillService.getSkillById(id);

        res.json({
            success: true,
            data: skill,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSkills,
    getAllTeachingSkills,
    addSkill,
    removeSkill,
    getSkill,
};

