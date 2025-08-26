import mongoose from 'mongoose';
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

// 시간표 정보 가져오기
router.get('/me/schedule', authenticateToken, async (req, res) => {
    try {
        // The 'user' object is already available from the authenticateToken middleware.
        // No need to query the database again.
        res.json({ success: true, schedule: req.user.schedule });
    } catch (error) {
        console.error('GET /api/users/me/schedule 오류:', error);
        res.status(500).json({ success: false, message: '시간표를 불러오는데 실패했습니다.' });
    }
});

// 시간표 정보 저장
router.post('/me/schedule', authenticateToken, async (req, res) => {
    try {
        const { schedule } = req.body;

        // Basic validation
        if (!schedule || !Array.isArray(schedule)) {
            return res.status(400).json({ success: false, message: '유효하지 않은 시간표 데이터입니다.' });
        }

        // The user object is already on req from the middleware
        req.user.schedule = schedule;
        await req.user.save();

        res.json({ success: true, message: '시간표가 성공적으로 저장되었습니다.' });

    } catch (error) {
        console.error('POST /api/users/me/schedule 오류:', error);
        res.status(500).json({ success: false, message: '시간표 저장 중 서버 오류가 발생했습니다.' });
    }
});

// 특정 사용자 프로필 조회 (Mypage에서 사용)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('-password'); // 비밀번호 제외
        if (!user) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error('GET /api/users/:userId 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 사용자의 게시글 조회
router.get('/:userId/posts', async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await Post.find({ authorId: userId }).sort({ createdAt: -1 });
        res.json({ success: true, posts });
    } catch (error) {
        console.error('GET /api/users/:userId/posts 오류:', error);
        res.status(500).json({ success: false, message: '게시글을 불러오는 데 실패했습니다.' });
    }
});

// 특정 사용자의 댓글 조회
router.get('/:userId/comments', async (req, res) => {
    try {
        const { userId } = req.params;
        const comments = await Post.aggregate([
            { $match: { 'comments.authorId': new mongoose.Types.ObjectId(userId) } },
            { $unwind: '$comments' },
            { $match: { 'comments.authorId': new mongoose.Types.ObjectId(userId) } },
            { $project: {
                _id: '$comments._id',
                content: '$comments.content',
                createdAt: '$comments.createdAt',
                postId: '$_id',
                postTitle: '$title',
                authorId: '$comments.authorId',
                authorName: '$comments.authorName'
            }},
            { $sort: { createdAt: -1 } }
        ]);
        res.json({ success: true, comments });
    } catch (error) {
        console.error('GET /api/users/:userId/comments 오류:', error);
        res.status(500).json({ success: false, message: '댓글을 불러오는 데 실패했습니다.' });
    }
});

// 특정 사용자의 팔로워 목록 조회
router.get('/:userId/followers', async (req, res) => {
    try {
        const { userId } = req.params;
        const followers = await Follow.find({ followingId: userId }).populate('followerId', 'username profileImage');
        res.json({ success: true, followers: followers.map(f => f.followerId) });
    } catch (error) {
        console.error('GET /api/users/:userId/followers 오류:', error);
        res.status(500).json({ success: false, message: '팔로워 목록을 불러오는 데 실패했습니다.' });
    }
});

// 특정 사용자가 팔로우하는 목록 조회
router.get('/:userId/following', async (req, res) => {
    try {
        const { userId } = req.params;
        const following = await Follow.find({ followerId: userId }).populate('followingId', 'username profileImage');
        res.json({ success: true, following: following.map(f => f.followingId) });
    } catch (error) {
        console.error('GET /api/users/:userId/following 오류:', error);
        res.status(500).json({ success: false, message: '팔로잉 목록을 불러오는 데 실패했습니다.' });
    }
});

// 팔로우 상태 확인
router.get('/:userId/follow-status', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id; // 현재 로그인한 사용자 ID

        if (currentUserId.equals(userId)) {
            return res.json({ success: true, isFollowing: false }); // 자기 자신은 팔로우 상태가 아님
        }

        const follow = await Follow.findOne({ followerId: currentUserId, followingId: userId });
        res.json({ success: true, isFollowing: !!follow });
    } catch (error) {
        console.error('GET /api/users/:userId/follow-status 오류:', error);
        res.status(500).json({ success: false, message: '팔로우 상태를 불러오는 데 실패했습니다.' });
    }
});

// 팔로우
router.post('/:userId/follow', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (currentUserId.equals(userId)) {
            return res.status(400).json({ success: false, message: '자기 자신을 팔로우할 수 없습니다.' });
        }

        const existingFollow = await Follow.findOne({ followerId: currentUserId, followingId: userId });
        if (existingFollow) {
            return res.status(400).json({ success: false, message: '이미 팔로우하고 있습니다.' });
        }

        const newFollow = new Follow({ followerId: currentUserId, followingId: userId });
        await newFollow.save();

        res.status(201).json({ success: true, message: '팔로우 성공' });
    } catch (error) {
        console.error('팔로우 오류:', error);
        res.status(500).json({ success: false, message: '팔로우 처리 중 오류 발생' });
    }
});

// 언팔로우
router.post('/:userId/unfollow', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const result = await Follow.deleteOne({ followerId: currentUserId, followingId: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: '팔로우 관계를 찾을 수 없습니다.' });
        }

        res.status(200).json({ success: true, message: '언팔로우 성공' });
    } catch (error) {
        console.error('언팔로우 오류:', error);
        res.status(500).json({ success: false, message: '언팔로우 처리 중 오류 발생' });
    }
});

export default router;