
import { generateTravelItinerary } from '../services/geminiService.js';

function sanitizeErrorForLogging(error) {
    const rawMessage = error.message || 'Unknown error';
    return rawMessage
        .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
        .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
}

export async function generateTripItinerary(req, res) {
    try {
        const itinerary = await generateTravelItinerary(req.body);

        return res.status(200).json({
            success: true,
            message: 'AI itinerary generated successfully.',
            itinerary,
        });
    } catch (error) {
        const safeMessage = sanitizeErrorForLogging(error);
        const status = error.status || error.statusCode || 500;

        console.error('[AI Controller] Itinerary generation failed:', {
            name: error.name || 'Error',
            status,
            code: error.code || undefined,
            message: safeMessage,
        });

        // Validation errors (400)
        if (error.isValidationError || status === 400) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        // Rate limit / Quota exceeded (429)
        if (status === 429 || safeMessage.includes('RESOURCE_EXHAUSTED')) {
            return res.status(429).json({
                success: false,
                message: 'AI generation rate limit or quota reached. Please try again in a few moments.',
            });
        }

        // Configuration or authentication failure (503)
        if (status === 401 || status === 403 || error.code === 'CONFIG_ERROR') {
            return res.status(503).json({
                success: false,
                message: 'AI itinerary service configuration issue. Please check the backend settings.',
            });
        }

        // Model not found or deprecated upstream (502)
        if (status === 404 || error.status === 404) {
            return res.status(502).json({
                success: false,
                message: 'The requested AI model is currently unavailable.',
            });
        }

        // Upstream or schema failure (502)
        if (status === 502) {
            return res.status(502).json({
                success: false,
                message: error.message || 'The AI service returned an unusable response. Please try again.',
            });
        }

        // General server error (500)
        return res.status(500).json({
            success: false,
            message: 'Unable to generate the AI itinerary. Please try again.',
        });
    }
}

