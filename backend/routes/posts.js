// backend/routes/posts.js (MongoDB 연동 최종 버전)

import express from 'express';
import User from '../models/User.js'; // ✨ User 모델 임포트 (작성자 정보 조회용)
import Post from '../models/Post.js'; // ✨ Post 모델 임포트
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// 모든 게시글 조회 (GET /)
router.get('/', async (req, res) => {
    try {
        // ✨ MongoDB 쿼리: 모든 게시글 조회 (최신순)
        let posts = await Post.find().sort({ createdAt: -1 }); // 최신순 정렬
        
        // 작성자 정보를 User 모델에서 가져와 주입 (Post에 authorName, authorProfileImage가 스냅샷으로 저장되어 있다면 이 과정은 불필요)
        // Post 스키마에 authorName과 authorProfileImage가 이미 있으므로, 별도 populate 불필요.
        // 다만, _id: false 옵션 때문에 findOneById 등이 아니라 findOne({id: ...})를 사용해야 합니다.

        res.json({ success: true, posts: posts });
    } catch (error) {
        console.error('게시글 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 새 게시글 작성 (POST /)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
        }

        const newPostId = Date.now().toString(); // 고유 ID 생성

        // ✨ MongoDB: 새 게시글 생성 및 저장
        const newPost = new Post({
            id: newPostId,
            title: title.trim(),
            content: content.trim(),
            userId: req.user.id,
            author: req.user.username,
        });
        await newPost.save(); // DB에 저장

        res.status(201).json({ success: true, message: '게시글이 작성되었습니다.', post: newPost });
    } catch (error) {
        console.error('게시글 작성 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 게시글 조회 (GET /:id)
router.get('/:id', async (req, res) => {
    try {
        // ✨ MongoDB 쿼리: 특정 게시글 조회
        let post = await Post.findOne({ id: req.params.id });

        if (!post) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }
        
        // Mongoose 문서는 toObject()를 해야 일반 JS 객체로 변환되어 수정 가능
        post = post.toObject(); 

        // ✨ 게시글 작성자 정보 주입 (필요하다면, Post 스키마에 이미 있다면 불필요)
        // (현재 스키마에 authorName, authorProfileImage가 있으므로 추가 주입은 불필요)
        
        // ✨ 댓글 작성자 정보 주입 (Post 문서에 내장된 댓글에는 이미 정보가 있음)
        // Mongoose가 배열 안에 있는 객체들을 스키마에 따라 이미 잘 파싱해줌.
        // 다만, 댓글은 Post 문서에 내장되어 있고, ObjectId를 사용하지 않으므로,
        // 각 댓글에 대한 추가적인 조회는 필요하지 않습니다.

        res.json({ success: true, post: post });
    } catch (error) {
        console.error('특정 게시글 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 게시글 삭제 (DELETE /:id)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // ✨ MongoDB 쿼리: 게시글 조회 (권한 확인용)
        const post = await Post.findOne({ id: req.params.id });

        if (!post) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }
        
        const userIsAdmin = isAdmin(req.user);
        const isAuthor = post.authorId === req.user.id;

        if (!userIsAdmin && !isAuthor) {
            return res.status(403).json({ success: false, message: '게시글을 삭제할 권한이 없습니다.' });
        }

        // ✨ MongoDB 쿼리: 게시글 삭제
        const result = await Post.deleteOne({ id: req.params.id });

        if (result.deletedCount === 0) { // 삭제된 문서가 없으면
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }
        
        res.json({ success: true, message: '게시글이 삭제되었습니다.' });
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 댓글 작성 (POST /:id/comments)
router.post('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
        }

        // ✨ 1. 게시글 존재 여부 확인
        const post = await Post.findOne({ id: req.params.id });
        if (!post) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }
        
        const newCommentId = Date.now().toString(); // 고유 ID 생성

        const newComment = {
            id: newCommentId,
            content,
            authorId: req.user.id,
            authorName: req.user.username,
            authorProfileImage: req.user.profileImage,
            createdAt: new Date()
        };

        // ✨ 2. 게시글 문서에 댓글 추가 (Mongoose push)
        post.comments.push(newComment);
        await post.save(); // 변경된 게시글 문서 저장

        res.status(201).json({ success: true, message: '댓글이 작성되었습니다.', comment: newComment });
    } catch (error) {
        console.error('댓글 작성 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

export default router;