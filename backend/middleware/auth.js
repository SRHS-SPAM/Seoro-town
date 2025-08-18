// middleware/auth.js
import jwt from 'jsonwebtoken';

export const isAdmin = (user) => {
    return user?.username === '관리자' || user?.email === 'DBADMIN@dba.com';
};

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: '액세스 토큰이 필요합니다.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }
        req.user = user;
        next();
    });
};