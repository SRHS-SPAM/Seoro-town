import express from 'express';
import multer from 'multer';
import path from 'path'; 
import fs from 'fs/promises';
import { readUsers, writeUsers, readPosts, readFollows, writeFollows } from '../utils/fileHandlers.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer 저장소 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
    },
});
const upload = multer({ storage: storage });



//  인증(로그인)이 반드시 필요한 API 모음 


// 내 프로필 이미지 업로드
router.post('/me/profile-image', authenticateToken, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '이미지 파일이 필요합니다.' });
        }
        const users = await readUsers();
        const userIndex = users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }
        const oldImage = users[userIndex].profileImage;
        if (oldImage) {
            const oldImagePath = path.join(__dirname, '..', oldImage);
            try {
                await fs.unlink(oldImagePath);
            } catch (err) {
                if (err.code !== 'ENOENT') console.error('기존 이미지 삭제 오류:', err);
            }
        }
        const newImageUrl = `/uploads/${req.file.filename}`;
        users[userIndex].profileImage = newImageUrl;
        await writeUsers(users);
        res.json({ success: true, message: '프로필 이미지가 성공적으로 변경되었습니다.', profileImage: newImageUrl });
    } catch (error) {
        console.error("프로필 이미지 업로드 오류:", error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 내 정보 조회
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const users = await readUsers();
        const user = users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }
        const { password, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 다른 사용자에 대한 나의 팔로우 상태 확인
router.get('/:id/follow-status', authenticateToken, async (req, res) => {
    try {
        const follows = await readFollows();
        const isFollowing = follows.some(f => f.followerId === req.user.id && f.followingId === req.params.id);
        res.json({ success: true, isFollowing });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 팔로우/언팔로우
router.post('/:id/follow', authenticateToken, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        if (targetUserId === req.user.id) return res.status(400).json({ success: false, message: '자신을 팔로우할 수 없습니다.' });
        const follows = await readFollows();
        if (follows.some(f => f.followerId === req.user.id && f.followingId === targetUserId)) {
            return res.status(400).json({ success: false, message: '이미 팔로우하고 있습니다.' });
        }
        follows.push({ id: Date.now().toString(), followerId: req.user.id, followingId: targetUserId });
        await writeFollows(follows);
        res.json({ success: true, message: '팔로우했습니다.' });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});
router.post('/:id/unfollow', authenticateToken, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        let follows = await readFollows();
        const initialLength = follows.length;
        follows = follows.filter(f => !(f.followerId === req.user.id && f.followingId === targetUserId));
        if (follows.length === initialLength) {
            return res.status(400).json({ success: false, message: '팔로우하고 있지 않습니다.' });
        }
        await writeFollows(follows);
        res.json({ success: true, message: '언팔로우했습니다.' });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 사용자 검색
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim().length < 2) {
            return res.json({ success: true, users: [] });
        }
        const users = await readUsers();
        const results = users
            .filter(u => u.id !== req.user.id && (u.username.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())))
            .map(({ id, username, email, profileImage }) => ({ id, username, email, profileImage }));
        res.json({ success: true, users: results });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 관리자 기능
router.get('/admin/all', authenticateToken, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
    try {
        const users = await readUsers();
        const safeUsers = users.map(({ password, ...user }) => user);
        res.json({ success: true, users: safeUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});
router.delete('/admin/:id', authenticateToken, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
    if (req.user.id === req.params.id) return res.status(400).json({ success: false, message: '자기 자신을 삭제할 수 없습니다.' });
    try {
        let users = await readUsers();
        const initialLength = users.length;
        users = users.filter(u => u.id !== req.params.id);
        if (users.length === initialLength) {
            return res.status(404).json({ success: false, message: '삭제할 사용자를 찾을 수 없습니다.' });
        }
        await writeUsers(users);
        res.json({ success: true, message: '사용자가 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 인증(로그인)이 필요 없는 공개 API 모음 

// 특정 사용자 정보 조회
router.get('/:id', async (req, res) => {
    try {
        const users = await readUsers();
        const user = users.find(u => u.id === req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }
        const { password, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 사용자의 게시글 목록
router.get('/:id/posts', async (req, res) => {
    try {
        const posts = await readPosts();
        const userPosts = posts.filter(p => p.authorId === req.params.id);
        res.json({ success: true, posts: userPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 사용자의 댓글 목록
router.get('/:id/comments', async (req, res) => {
    try {
        const allPosts = await readPosts();
        const userComments = [];
        for (const post of allPosts) {
            if (post.comments && post.comments.length > 0) {
                for (const comment of post.comments) {
                    if (comment.authorId === req.params.id) {
                        userComments.push({ ...comment, postId: post.id, postTitle: post.title });
                    }
                }
            }
        }
        res.json({ success: true, comments: userComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 사용자의 팔로워 목록
router.get('/:id/followers', async (req, res) => {
    try {
        const follows = await readFollows();
        const users = await readUsers();
        const followerIds = follows.filter(f => f.followingId === req.params.id).map(f => f.followerId);
        const followers = users
            .filter(u => followerIds.includes(u.id))
            .map(({ id, username, email, profileImage }) => ({ id, username, email, profileImage }));
        res.json({ success: true, followers });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 사용자의 팔로잉 목록
router.get('/:id/following', async (req, res) => {
    try {
        const follows = await readFollows();
        const users = await readUsers();
        const followingIds = follows.filter(f => f.followerId === req.params.id).map(f => f.followingId);
        const following = users
            .filter(u => followingIds.includes(u.id))
            .map(({ id, username, email, profileImage }) => ({ id, username, email, profileImage }));
        res.json({ success: true, following });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});


export default router;