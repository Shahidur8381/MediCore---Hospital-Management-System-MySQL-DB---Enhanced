const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
        }
        return 'medicore_development_jwt_secret_key_2026';
    }
    return secret;
};

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const tokenString = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        const decoded = jwt.verify(tokenString, getJwtSecret());
        req.user = decoded.user;
        
        // Enforce Read-Only mode for Guest Admins
        if (req.user.isGuestAdmin && req.method !== 'GET') {
            return res.status(403).json({ message: 'Guest Admin view-only mode. You cannot modify data.' });
        }
        
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid or has expired' });
    }
};

module.exports = authMiddleware;
