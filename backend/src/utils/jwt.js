/**
 * DUMMY JWT UTILITY
 * Replaced to eliminate RS256/JWT errors.
 * This file now does NOTHING.
 */

const generateToken = (payload) => {
    return 'dummy_token';
};

const verifyToken = (token) => {
    return {};
};

module.exports = { generateToken, verifyToken };
