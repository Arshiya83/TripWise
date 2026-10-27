
import jwt from 'jsonwebtoken';

export function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.',
            });
        }

        const token = authHeader.split(' ')[1];

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured.');
            return res.status(500).json({
                success: false,
                message: 'Authentication service is not configured.',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token.',
            });
        }

        req.user = { userId: decoded.userId };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError' ||
            error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Your session is invalid or expired. Please log in again.',
            });
        }

        next(error);
    }
}
