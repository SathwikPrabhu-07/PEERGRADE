const requestService = require('../services/requestService');
const sessionService = require('../services/sessionService');
const messageService = require('../services/messageService');

/**
 * Get user's requests
 * GET /api/requests
 */
const getRequests = async (req, res, next) => {
    try {
        const requests = await requestService.getUserRequests(req.user.id);

        res.json({
            success: true,
            data: requests,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single request with details
 * GET /api/requests/:id
 */
const getRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const request = await requestService.getRequestById(id, req.user.id);

        res.json({
            success: true,
            data: request,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Send a session request
 * POST /api/requests
 */
const sendRequest = async (req, res, next) => {
    try {
        const { teacherId, skillId, message } = req.body;

        if (!teacherId || !skillId) {
            return res.status(400).json({
                success: false,
                message: 'Teacher ID and Skill ID are required',
            });
        }

        const request = await requestService.sendRequest(req.user.id, {
            teacherId,
            skillId,
            message,
        });

        res.status(201).json({
            success: true,
            message: 'Session request sent successfully',
            data: request,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Accept a request and create session atomically
 * PUT /api/requests/:id/accept
 * Returns both the updated request and the created session
 */
const acceptRequest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await requestService.acceptRequest(id, req.user.id);

        res.json({
            success: true,
            message: result.alreadyExists
                ? 'Request already accepted. Session exists.'
                : 'Request accepted and session created!',
            data: {
                request: result.request,
                session: result.session,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Confirm a request with mode selection (creates session)
 * POST /api/requests/:id/confirm
 * Body: { mode: 'single' | 'mutual', teacherSkill: string, learnerSkill?: string }
 */
const confirmRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { mode, teacherSkill, learnerSkill } = req.body;

        if (!mode) {
            return res.status(400).json({
                success: false,
                message: 'Mode is required (single or mutual)',
            });
        }

        if (!teacherSkill) {
            return res.status(400).json({
                success: false,
                message: 'Teacher skill is required',
            });
        }

        // Confirm the request with mode selection
        const request = await requestService.confirmRequest(id, req.user.id, {
            mode,
            teacherSkill,
            learnerSkill,
        });

        // Create session from confirmed request
        const session = await sessionService.createSession(request);

        res.json({
            success: true,
            message: `${mode === 'mutual' ? 'Mutual' : 'Single'} learning session created!`,
            data: {
                request,
                session,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reject a request
 * PUT /api/requests/:id/reject
 */
const rejectRequest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await requestService.rejectRequest(id, req.user.id);

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel a request
 * DELETE /api/requests/:id
 */
const cancelRequest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await requestService.cancelRequest(id, req.user.id);

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get messages for a request
 * GET /api/requests/:id/messages
 */
const getMessages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const messages = await messageService.getMessages(id, req.user.id);

        res.json({
            success: true,
            data: messages,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Send a message in a request
 * POST /api/requests/:id/messages
 */
const sendMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message text is required',
            });
        }

        const message = await messageService.sendMessage(id, req.user.id, text.trim());

        res.status(201).json({
            success: true,
            message: 'Message sent',
            data: message,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRequests,
    getRequest,
    sendRequest,
    acceptRequest,
    confirmRequest,
    rejectRequest,
    cancelRequest,
    getMessages,
    sendMessage,
};
