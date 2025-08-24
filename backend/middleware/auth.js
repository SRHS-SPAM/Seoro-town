import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const isAdmin = (user) => {
    return user?.username === '관리자' || user?.email === 'DBADMIN@dba.com';
};

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: '액세스 토큰이 필요합니다.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }
        try {
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
            }
            req.user = user;
            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: '서버 오류' });
        }
    });
};