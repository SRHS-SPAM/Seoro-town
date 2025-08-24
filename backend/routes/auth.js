import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            const message = existingUser.email === email ? '이미 사용 중인 이메일입니다.' : '이미 사용 중인 사용자 이름입니다.';
            return res.status(400).json({ success: false, message });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            email,
            password: hashedPassword,
            username
        });
        await newUser.save();
        res.status(201).json({ success: true, message: '회원가입이 완료되었습니다.' });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });

        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        
        const payload = { id: user._id, username: user.username, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ success: true, token, user });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

export default router;