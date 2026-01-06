/**
 * AUTH MIDDLEWARE
 * Reads x-user-id header and sets req.user for downstream handlers.
 * No JWT - uses Firebase Auth as authority via stored user ID.
 */

const authMiddleware = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. No user ID provided.',
        });
    }

    // Set user object for downstream handlers
    req.user = { id: userId };
    next();
};

const optionalAuth = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (userId) {
        req.user = { id: userId };
    }

    next();
};

module.exports = { authMiddleware, optionalAuth };
