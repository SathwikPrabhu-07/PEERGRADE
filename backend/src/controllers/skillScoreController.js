const skillScoreService = require('../services/skillScoreService');

/**
 * Get all skill scores for the current user
 * GET /api/skill-scores
 */
const getSkillScores = async (req, res, next) => {
    try {
        const scores = await skillScoreService.getSkillScoresForUser(req.user.id);

        res.json({
            success: true,
            data: scores,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSkillScores,
};
