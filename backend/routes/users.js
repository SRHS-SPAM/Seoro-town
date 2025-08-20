// backend/routes/users.js (MongoDB 연동)

import express from 'express';
import multer from 'multer';
import path from 'path'; 
import fs from 'fs/promises';
import User from '../models/User.js';         // ✨ User 모델 임포트
import Post from '../models/Post.js';         // ✨ Post 모델 임포트
import Follow from '../models/Follow.js';     // ✨ Follow 모델 임포트
import Product from '../models/Product.js';   // ✨ Product 모델 임포트
import ChatRoom from '../models/ChatRoom.js'; // ✨ ChatRoom 모델 임포트
import ChatMessage from '../models/ChatMessage.js'; // ✨ ChatMessage 모델 임포트
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


// ===================================================
// ✨ 인증(로그인)이 반드시 필요한 API 모음 ✨
// ===================================================

router.post('/me/profile-image', authenticateToken, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: '이미지 파일이 필요합니다.' });
        // ✨ MongoDB 쿼리: 사용자 조회
        const user = await User.findOne({ id: req.user.id });
        if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });

        const oldImage = user.profileImage;
        if (oldImage) {
            const oldImagePath = path.join(__dirname, '..', oldImage);
            try { await fs.unlink(oldImagePath); } catch (err) { if (err.code !== 'ENOENT') console.error('기존 이미지 삭제 오류:', err); }
        }
        const newImageUrl = `/uploads/${req.file.filename}`;
        // ✨ MongoDB 쿼리: profileImage 업데이트
        user.profileImage = newImageUrl;
        await user.save(); // 변경사항 저장
        res.json({ success: true, message: '프로필 이미지가 성공적으로 변경되었습니다.', profileImage: newImageUrl });
    } catch (error) {
        console.error("프로필 이미지 업로드 오류:", error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        // ✨ MongoDB 쿼리: 사용자 조회
        const user = await User.findOne({ id: req.user.id }).select('-password'); // 비밀번호 제외
        if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        res.json({ success: true, user: user });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/me/schedule', authenticateToken, async (req, res) => {
    try {
        // ✨ MongoDB 쿼리: schedule 필드만 조회
        const user = await User.findOne({ id: req.user.id }).select('schedule');
        if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        const userSchedule = user.schedule; // Mongoose가 이미 객체로 변환해줌
        const defaultScheduleStructure = [
            ["", "월", "화", "수", "목", "금"],
            ["1", "", "", "", "", ""], ["2", "", "", "", "", ""],
            ["3", "", "", "", "", ""], ["4", "", "", "", "", ""],
            ["5", "", "", "", "", ""], ["6", "", "", "", "", ""],
            ["7", "", "", "", "", ""]
        ];
        // 저장된 시간표 구조가 기본값과 다르면 기본값으로 시작
        if (!Array.isArray(userSchedule) || userSchedule.length !== defaultScheduleStructure.length || 
            (userSchedule.length > 0 && userSchedule[0].length !== defaultScheduleStructure[0].length)) {
            console.warn("저장된 시간표 구조가 기본값과 다릅니다. 새 시간표로 시작합니다.");
            return res.json({ success: true, schedule: defaultScheduleStructure });
        }
        res.json({ success: true, schedule: userSchedule });
    } catch (error) {
        console.error('시간표 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.post('/me/schedule', authenticateToken, async (req, res) => {
    try {
        const { schedule } = req.body;
        const defaultScheduleStructure = [ /* default */ ]; // 이미 위에서 정의됨
        if (!schedule || !Array.isArray(schedule) || schedule.length !== 8 || schedule[0].length !== 6) {
            return res.status(400).json({ success: false, message: '유효한 시간표 데이터가 필요합니다. (6x8 배열 형식)' });
        }
        // ✨ MongoDB 쿼리: schedule 필드 업데이트
        await User.updateOne({ id: req.user.id }, { $set: { schedule: schedule } });
        res.json({ success: true, message: '시간표가 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('시간표 저장 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/:id/follow-status', authenticateToken, async (req, res) => {
    try {
        // ✨ MongoDB 쿼리: 팔로우 관계 확인
        const isFollowing = await Follow.exists({ followerId: req.user.id, followingId: req.params.id });
        res.json({ success: true, isFollowing: !!isFollowing });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.post('/:id/follow', authenticateToken, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        if (targetUserId === req.user.id) return res.status(400).json({ success: false, message: '자신을 팔로우할 수 없습니다.' });
        // ✨ MongoDB 쿼리: 기존 팔로우 관계 확인
        const existingFollow = await Follow.exists({ followerId: req.user.id, followingId: targetUserId });
        if (existingFollow) return res.status(400).json({ success: false, message: '이미 팔로우하고 있습니다.' });
        
        const newFollowId = Date.now().toString(); // 고유 ID 생성 (Mongoose _id와는 별개)
        // ✨ MongoDB 쿼리: 팔로우 관계 생성
        const newFollow = new Follow({ id: newFollowId, _id: newFollowId, followerId: req.user.id, followingId: targetUserId });
        await newFollow.save();
        res.json({ success: true, message: '팔로우했습니다.' });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});
router.post('/:id/unfollow', authenticateToken, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        // ✨ MongoDB 쿼리: 팔로우 관계 삭제
        const result = await Follow.deleteOne({ followerId: req.user.id, followingId: targetUserId });
        if (result.deletedCount === 0) return res.status(400).json({ success: false, message: '팔로우하고 있지 않습니다.' });
        res.json({ success: true, message: '언팔로우했습니다.' });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim().length < 2) return res.json({ success: true, users: [] });
        // ✨ MongoDB 쿼리: 사용자 검색 (regex를 사용해 부분 일치, $ne로 자기 자신 제외)
        const users = await User.find({
            id: { $ne: req.user.id }, // 자기 자신 제외
            $or: [
                { username: { $regex: query, $options: 'i' } }, // 대소문자 구분 없이 검색
                { email: { $regex: query, $options: 'i' } }
            ]
        }).select('id username email profileImage'); // 필요한 필드만 선택

        res.json({ success: true, users: users });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/admin/all', authenticateToken, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
    try {
        // ✨ MongoDB 쿼리: 모든 사용자 조회 (비밀번호 제외)
        const users = await User.find().select('-password');
        res.json({ success: true, users: users });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.delete('/admin/:id', authenticateToken, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
    if (req.user.id === req.params.id) return res.status(400).json({ success: false, message: '자기 자신을 삭제할 수 없습니다.' });
    try {
        // 사용자 삭제 (관련 데이터 모두 삭제)
        const userIdToDelete = req.params.id;
        const userToDelete = await User.findOne({ id: userIdToDelete });
        if (!userToDelete) return res.status(404).json({ success: false, message: '삭제할 사용자를 찾을 수 없습니다.' });

        // 프로필 이미지 파일 삭제 (있다면)
        if (userToDelete.profileImage) {
            const oldImagePath = path.join(__dirname, '..', userToDelete.profileImage);
            try { await fs.unlink(oldImagePath); } catch (err) { if (err.code !== 'ENOENT') console.error('사용자 이미지 삭제 오류 (admin):', err); }
        }
        
        // ✨ MongoDB 쿼리: 관련 데이터 삭제 (Mongoose 사용)
        await Follow.deleteMany({ $or: [{ followerId: userIdToDelete }, { followingId: userIdToDelete }] });
        await ChatMessage.deleteMany({ senderId: userIdToDelete });
        await ChatRoom.deleteMany({ participants: userIdToDelete }); // 참여자 목록에 ID가 포함된 채팅방

        // 사용자가 작성한 게시글 및 그에 달린 댓글 삭제
        const userPosts = await Post.find({ authorId: userIdToDelete });
        for(const post of userPosts) {
            await ChatMessage.deleteMany({ roomId: post.id }); // 게시글 관련 채팅메시지 (만약 있다면)
            await Post.deleteOne({ id: post.id });
        }
        
        // 사용자가 등록한 상품 삭제 (및 관련 이미지 파일 삭제)
        const userProducts = await Product.find({ authorId: userIdToDelete });
        for(const product of userProducts) {
            if (product.imageUrl) {
                const imagePath = path.join(__dirname, '..', product.imageUrl);
                try { await fs.unlink(imagePath); } catch (err) { if (err.code !== 'ENOENT') console.error('상품 이미지 삭제 오류 (admin):', err); }
            }
            await Product.deleteOne({ id: product.id });
        }

        // 최종 사용자 삭제
        const result = await User.deleteOne({ id: userIdToDelete });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: '삭제할 사용자를 찾을 수 없습니다.' });
        res.json({ success: true, message: '사용자가 삭제되었습니다.' });
    } catch (error) {
        console.error('관리자 사용자 삭제 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});


router.get('/:id', async (req, res) => {
    try {
        // ✨ MongoDB 쿼리: 사용자 조회
        const user = await User.findOne({ id: req.params.id }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        res.json({ success: true, user: user });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/:id/posts', async (req, res) => {
    try {
        // ✨ MongoDB 쿼리: 게시글 조회 (댓글은 Post 문서에 내장)
        const posts = await Post.find({ authorId: req.params.id }).sort({ createdAt: -1 }); // 최신순
        res.json({ success: true, posts: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/:id/comments', async (req, res) => {
    try {
        // MongoDB는 댓글을 별도의 컬렉션으로 저장하지 않았으므로,
        // 모든 게시글을 찾아서 그 안에 있는 댓글을 필터링해야 합니다.
        // 또는, Comments 모델을 별도로 만들어 ChatMessage처럼 관리할 수도 있습니다.
        // 현재는 Post 모델 내부에 Comments가 내장되어 있으므로, 모든 게시글을 조회 후 필터링합니다.

        // ✨ MongoDB 쿼리: 모든 게시글 조회
        const allPosts = await Post.find({});
        const userComments = [];

        allPosts.forEach(post => {
            if (post.comments && post.comments.length > 0) {
                post.comments.forEach(comment => {
                    if (comment.authorId === req.params.id) {
                        userComments.push({ ...comment.toObject(), postId: post.id, postTitle: post.title });
                    }
                });
            }
        });
        // 시간순으로 정렬
        userComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ success: true, comments: userComments });
    } catch (error) {
        console.error('사용자 댓글 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/:id/followers', async (req, res) => {
    try {
        // ✨ MongoDB 쿼리: 팔로워 ID 조회
        const followerRelations = await Follow.find({ followingId: req.params.id }).select('followerId');
        const followerIds = followerRelations.map(f => f.followerId);
        
        let followers = [];
        if (followerIds.length > 0) {
            // ✨ MongoDB 쿼리: 팔로워 사용자 정보 조회
            followers = await User.find({ id: { $in: followerIds } }).select('id username email profileImage');
        }
        res.json({ success: true, followers: followers });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/:id/following', async (req, res) => {
    try {
        // ✨ MongoDB 쿼리: 팔로잉 ID 조회
        const followingRelations = await Follow.find({ followerId: req.params.id }).select('followingId');
        const followingIds = followingRelations.map(f => f.followingId);

        let following = [];
        if (followingIds.length > 0) {
            // ✨ MongoDB 쿼리: 팔로잉 사용자 정보 조회
            following = await User.find({ id: { $in: followingIds } }).select('id username email profileImage');
        }
        res.json({ success: true, following: following });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});


export default router;