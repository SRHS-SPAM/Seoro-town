// backend/routes/auth.js (로그인 로직 개선 최종 버전)

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { readUsers, writeUsers } from '../utils/fileHandlers.js';

const router = express.Router();

// --- 회원가입 API (수정 없음) ---
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: '비밀번호는 6자 이상이어야 합니다.' });
        }

        const users = await readUsers();
        if (users.find(user => user.username === username || user.email === email)) {
            return res.status(409).json({ success: false, message: '이미 존재하는 사용자명 또는 이메일입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            profileImage: null,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeUsers(users);

        const tokenPayload = { 
            id: newUser.id, 
            username: newUser.username, 
            email: newUser.email,
            profileImage: newUser.profileImage 
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다!',
            token,
            user: tokenPayload
        });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

// --- ✨ 로그인 API (로직 개선) ✨ ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });
        }

        const users = await readUsers();
        const user = users.find(u => u.username === username || u.email === username);

        // 1. 사용자가 없는 경우: 명확한 에러 메시지
        if (!user) {
            return res.status(404).json({ success: false, message: '존재하지 않는 사용자입니다.' });
        }

        // 2. 사용자는 찾았지만, 비밀번호가 틀린 경우
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: '비밀번호가 올바르지 않습니다.' });
        }
        
        // 3. 로그인 성공
        const tokenPayload = { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            profileImage: user.profileImage
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            success: true,
            message: '로그인 성공',
            token,
            user: tokenPayload
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

export default router;