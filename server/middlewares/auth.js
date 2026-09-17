const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.username = decoded.username;
        req.role = decoded.role;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        return res.status(403).json({ message: 'Access Denied: Admins only' });
    }
    next();
};

module.exports = { verifyToken, isAdmin };
