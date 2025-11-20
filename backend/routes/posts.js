import express from 'express';
import Post from '../models/Post.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// 모든 게시글 조회
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().populate('userId', 'username profileImage').sort({ createdAt: -1 });
        res.json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 새 게시글 작성
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        if (!title || !content) return res.status(400).json({ message: '제목과 내용을 입력해주세요.' });

        const newPost = new Post({
            title: title.trim(),
            content: content.trim(),
            userId: req.user._id,
            author: req.user.username,
            category,
        });
        await newPost.save();
        res.status(201).json({ success: true, message: '게시글이 작성되었습니다.', post: newPost });
    } catch (error) {
        console.error('게시글 작성 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 게시글 조회
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('userId', 'username profileImage');
        if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        res.json({ success: true, post });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: '잘못된 형식의 게시글 ID입니다.' });
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 게시글 수정
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });

        const isAuthor = post.userId.toString() === req.user._id.toString();
        if (!isAuthor && !isAdmin(req.user)) {
            return res.status(403).json({ message: '수정 권한이 없습니다.' });
        }

        if (title) post.title = title.trim();
        if (content) post.content = content.trim();
        if (category) post.category = category;

        await post.save();
        res.json({ success: true, message: '게시글이 수정되었습니다.', post });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: '잘못된 형식의 게시글 ID입니다.' });
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 게시글 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });

        const isAuthor = post.userId.toString() === req.user._id.toString();
        if (!isAuthor && !isAdmin(req.user)) {
            return res.status(403).json({ message: '삭제 권한이 없습니다.' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: '게시글이 삭제되었습니다.' });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: '잘못된 형식의 게시글 ID입니다.' });
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 댓글 작성
router.post('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });

        post.comments.push({
            content,
            authorId: req.user._id,
            authorName: req.user.username,
            authorProfileImage: req.user.profileImage
        });
        await post.save();

        const savedComment = post.comments[post.comments.length - 1];
        res.status(201).json({ success: true, message: '댓글이 작성되었습니다.', comment: savedComment });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: '잘못된 형식의 게시글 ID입니다.' });
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 댓글 수정
router.put('/:id/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });

        const isAuthor = comment.authorId.toString() === req.user._id.toString();
        if (!isAuthor && !isAdmin(req.user)) {
            return res.status(403).json({ message: '수정 권한이 없습니다.' });
        }

        comment.content = content.trim();
        await post.save();

        res.json({ success: true, message: '댓글이 수정되었습니다.', comment });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: '잘못된 형식의 ID입니다.' });
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 댓글 삭제
router.delete('/:id/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });

        const isAuthor = comment.authorId.toString() === req.user._id.toString();
        if (!isAuthor && !isAdmin(req.user)) {
            return res.status(403).json({ message: '삭제 권한이 없습니다.' });
        }

        post.comments.pull(req.params.commentId);
        await post.save();

        res.json({ success: true, message: '댓글이 삭제되었습니다.' });
    } catch (error) {
        if (error.name === 'CastError') return res.status(400).json({ message: '잘못된 형식의 ID입니다.' });
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

export default router;