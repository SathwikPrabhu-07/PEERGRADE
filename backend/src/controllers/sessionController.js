const sessionService = require('../services/sessionService');
const feedbackService = require('../services/feedbackService');

/**
 * Get user's sessions
 * GET /api/sessions
 */
const getSessions = async (req, res, next) => {
    try {
        const { status } = req.query; // 'scheduled', 'completed', or undefined for all

        const sessions = await sessionService.getUserSessions(req.user.id, status);

        // Separate by status for frontend compatibility
        const scheduled = sessions.filter((s) => s.status === 'scheduled');
        const completed = sessions.filter((s) => s.status === 'completed');

        res.json({
            success: true,
            data: {
                all: sessions,
                scheduled,
                completed,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single session
 * GET /api/sessions/:id
 */
const getSession = async (req, res, next) => {
    try {
        const { id } = req.params;
        const session = await sessionService.getSessionById(id);

        res.json({
            success: true,
            data: session,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Schedule a session (set time)
 * PUT /api/sessions/:id/schedule
 * Only teacher can set the time
 */
const scheduleSession = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { scheduledAt } = req.body;

        if (!scheduledAt) {
            return res.status(400).json({
                success: false,
                message: 'scheduledAt is required',
            });
        }

        // Validate date format
        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format for scheduledAt',
            });
        }

        const session = await sessionService.scheduleSession(id, req.user.id, scheduledAt);

        res.json({
            success: true,
            message: 'Session scheduled successfully',
            data: session,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a session as completed
 * POST /api/sessions/:id/complete
 */
const completeSession = async (req, res, next) => {
    try {
        const { id } = req.params;

        const session = await sessionService.completeSession(id, req.user.id);

        res.json({
            success: true,
            message: 'Session marked as completed',
            data: session,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get join info for a session
 * GET /api/sessions/:id/join
 * Returns the Jitsi meeting URL for the session
 * Also updates session status to 'ongoing' when first joined
 * 
 * IMPORTANT: meetingUrl must be set during scheduling.
 * No fallback generation - ensures stable room names.
 */
const joinSession = async (req, res, next) => {
    try {
        const { id } = req.params;
        const session = await sessionService.getSessionById(id);

        // Verify user is part of the session
        if (session.teacherId !== req.user.id && session.learnerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to join this session',
            });
        }

        // STRICT: meetingUrl must exist (generated at scheduling time)
        if (!session.meetingUrl || !session.meetingRoom) {
            return res.status(400).json({
                success: false,
                message: 'Meeting room not configured. Please ensure the session is scheduled.',
            });
        }

        const { db } = require('../config/firebase');
        const updates = {};

        // Update status to 'ongoing' if still scheduled (first join starts the session)
        if (session.status === 'scheduled') {
            updates.status = 'ongoing';
            updates.startedAt = new Date().toISOString();
        }

        // Persist updates to Firestore if any
        if (Object.keys(updates).length > 0) {
            await db.collection('sessions').doc(id).update(updates);
        }

        // Return the meeting URL (from Firestore, never regenerated)
        res.json({
            success: true,
            data: {
                meetingUrl: session.meetingUrl,
                session: {
                    ...session,
                    ...updates,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};



/**
 * Submit feedback for a session
 * POST /api/sessions/:id/feedback
 */
const submitFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const feedback = await feedbackService.submitFeedback(id, req.user.id, {
            rating,
            comment,
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get feedback for a session
 * GET /api/sessions/:id/feedback
 */
const getFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;

        const feedback = await feedbackService.getFeedbackForSession(id, req.user.id);
        const hasSubmitted = await feedbackService.hasUserSubmittedFeedback(id, req.user.id);

        res.json({
            success: true,
            data: {
                feedback,
                hasSubmitted,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Migrate legacy session room names
 * POST /api/sessions/migrate-room-names
 * One-time migration for sessions with UUID-based room names
 */
const migrateRoomNames = async (req, res, next) => {
    try {
        const result = await sessionService.migrateSessionRoomNames();

        res.json({
            success: true,
            message: `Migrated ${result.migratedCount} of ${result.totalChecked} sessions`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSessions,
    getSession,
    scheduleSession,
    completeSession,
    joinSession,
    submitFeedback,
    getFeedback,
    migrateRoomNames,
};

