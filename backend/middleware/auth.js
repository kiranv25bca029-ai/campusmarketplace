const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. Please login.' });
    }

    const token = authorization.slice(7).trim();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });

        if (!decoded?.id || !decoded?.role) {
            return res.status(401).json({ message: 'Invalid token payload.' });
        }

        const user = await User.findById(decoded.id).select('_id role').lean();

        if (!user) {
            return res.status(401).json({
                message: 'User account no longer exists.'
            });
        }

        req.user = {
            id: user._id,
            role: user.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token.'
        });
    }
};

module.exports = authMiddleware;