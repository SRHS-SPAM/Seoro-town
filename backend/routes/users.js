import express from 'express';
import multer from 'multer';
import path from 'path'; 
import fs from 'fs/promises';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Follow from '../models/Follow.js';
import Product from '../models/Product.js';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
    },
});
const upload = multer({ storage: storage });

// 프로필 이미지 업로드
router.post('/me/profile-image', authenticateToken, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: '이미지 파일이 필요합니다.' });
        const user = await User.findOne({ id: req.user.id });
        if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });

        // ... 이미지 삭제 및 저장 로직 ...
        const newImageUrl = `/uploads/${req.file.filename}`;
        user.profileImage = newImageUrl;
        await user.save();
        res.json({ success: true, message: '프로필 이미지가 성공적으로 변경되었습니다.', profileImage: newImageUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 💥💥💥 바로 이 코드가 마이페이지 이동 실패의 원인입니다 💥💥💥
router.get('/me', authenticateToken, async (req, res) => {
    try {
        // req.user 객체가 있음에도 불구하고, _id를 사용해서 다시 DB를 조회하려고 시도합니다.
        // 하지만 토큰에는 수동 id가 들어있어서 req.user._id가 원하는 값이 아닐 수 있습니다.
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }
        res.json({ success: true, user: user });
    } catch (error) {
        console.error('GET /api/users/me 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});


// ... (이하 다른 users.js 라우터들은 수동 id를 기준으로 작성되어 있음) ...

export default router;