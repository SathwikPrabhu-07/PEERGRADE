const config = require('../config/env');

/**
 * Firestore error code mappings
 * https://firebase.google.com/docs/reference/node/firebase.firestore#firestoreerrorcode
 */
const FIRESTORE_ERROR_CODES = {
    0: 'OK',
    1: 'CANCELLED',
    2: 'UNKNOWN',
    3: 'INVALID_ARGUMENT',
    4: 'DEADLINE_EXCEEDED',
    5: 'NOT_FOUND',
    6: 'ALREADY_EXISTS',
    7: 'PERMISSION_DENIED',
    8: 'RESOURCE_EXHAUSTED',
    9: 'FAILED_PRECONDITION', // Index required
    10: 'ABORTED',
    11: 'OUT_OF_RANGE',
    12: 'UNIMPLEMENTED',
    13: 'INTERNAL',
    14: 'UNAVAILABLE',
    15: 'DATA_LOSS',
    16: 'UNAUTHENTICATED',
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Safely get error code as string
    const errorCode = err.code != null ? String(err.code) : null;

    // Firebase Auth errors (string codes starting with 'auth/')
    if (errorCode && errorCode.startsWith('auth/')) {
        const firebaseErrors = {
            'auth/email-already-exists': { status: 400, message: 'Email already registered' },
            'auth/invalid-email': { status: 400, message: 'Invalid email format' },
            'auth/user-not-found': { status: 404, message: 'User not found' },
            'auth/wrong-password': { status: 401, message: 'Invalid credentials' },
            'auth/weak-password': { status: 400, message: 'Password is too weak' },
        };

        const errorInfo = firebaseErrors[errorCode] || { status: 400, message: err.message };
        return res.status(errorInfo.status).json({
            success: false,
            message: errorInfo.message,
        });
    }

    // Firestore numeric error codes
    if (errorCode && !isNaN(Number(errorCode))) {
        const numericCode = Number(errorCode);
        const codeName = FIRESTORE_ERROR_CODES[numericCode] || 'UNKNOWN';

        // NOT_FOUND (5)
        if (numericCode === 5) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found',
            });
        }

        // FAILED_PRECONDITION (9) - typically missing Firestore index
        if (numericCode === 9) {
            console.error('Firestore index required. Check Firebase console for index creation link.');
            return res.status(500).json({
                success: false,
                message: 'Database query requires an index. Please check server logs.',
            });
        }

        // PERMISSION_DENIED (7)
        if (numericCode === 7) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied',
            });
        }

        // Other Firestore errors
        return res.status(500).json({
            success: false,
            message: `Database error: ${codeName}`,
        });
    }

    // Firestore string error codes (fallback)
    if (errorCode === 'NOT_FOUND' || errorCode === 'not-found') {
        return res.status(404).json({
            success: false,
            message: 'Resource not found',
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = config.server.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message || 'Unknown error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(config.server.nodeEnv !== 'production' && { stack: err.stack }),
    });
};

/**
 * 404 handler for unknown routes
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
};

module.exports = { errorHandler, notFoundHandler };
