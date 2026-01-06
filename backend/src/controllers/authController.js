const authService = require('../services/authService');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and role are required',
            });
        }

        const result = await authService.register({ name, email, password, role });

        res.status(200).json({
            success: true,
            user: result.user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        const result = await authService.login({ email, password });

        res.json({
            success: true,
            user: result.user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.uid || req.body.uid;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'No user ID provided',
            });
        }

        const result = await authService.getCurrentUser(userId);

        res.json({
            success: true,
            user: result.user
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
};
