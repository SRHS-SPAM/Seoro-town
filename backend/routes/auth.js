// backend/routes/auth.js (MongoDB 연동)

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // ✨ User 모델 임포트

const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: '비밀번호는 6자 이상이어야 합니다.' });
        }

        // ✨ MongoDB 쿼리: 사용자명 또는 이메일 중복 확인
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ success: false, message: '이미 존재하는 사용자명 또는 이메일입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserId = Date.now().toString(); // 기존 ID 생성 방식 유지

        // ✨ MongoDB: 새 사용자 생성 및 저장
        const newUser = new User({
            id: newUserId, // 스키마의 id 필드 사용
            _id: newUserId, // MongoDB의 _id도 id와 동일하게 설정 (마이그레이션 시 일관성)
            username,
            email,
            password: hashedPassword,
            profileImage: null,
            createdAt: new Date(), // Date 객체로 저장
            schedule: [ // 기본 시간표 (스키마 default와 일치)
                ["", "월", "화", "수", "목", "금"],
                ["1", "", "", "", "", ""], ["2", "", "", "", "", ""],
                ["3", "", "", "", "", ""], ["4", "", "", "", "", ""],
                ["5", "", "", "", "", ""], ["6", "", "", "", "", ""],
                ["7", "", "", "", "", ""],
            ]
        });
        await newUser.save(); // DB에 저장

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

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });
        }

        // ✨ MongoDB 쿼리: 사용자 조회
        const user = await User.findOne({ $or: [{ username }, { email: username }] });

        if (!user) {
            return res.status(404).json({ success: false, message: '존재하지 않는 사용자입니다.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: '비밀번호가 올바르지 않습니다.' });
        }
        
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