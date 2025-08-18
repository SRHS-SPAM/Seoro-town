// backend/routes/posts.js (최종 버전)

import express from 'express';
import { readPosts, writePosts, readUsers } from '../utils/fileHandlers.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// --- Helper Function ---
const injectAuthorInfo = (items, userMap) => {
    const enrich = (item) => {
        const author = userMap.get(item.authorId);
        return {
            ...item,
            authorName: author ? author.username : item.authorName || '알 수 없음',
            authorProfileImage: author ? author.profileImage : null,
        };
    };

    if (Array.isArray(items)) {
        return items.map(enrich);
    }
    return enrich(items);
};

// 모든 게시글 조회 (GET /)
router.get('/', async (req, res) => {
    try {
        const posts = await readPosts();
        const users = await readUsers();
        const userMap = new Map(users.map(u => [u.id, u]));

        const postsWithAuthorInfo = injectAuthorInfo(posts, userMap);

        res.json({ success: true, posts: postsWithAuthorInfo.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
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

        const posts = await readPosts();
        const newPost = {
            id: Date.now().toString(),
            title: title.trim(),
            content: content.trim(),
            category: category || '재학생',
            authorId: req.user.id,
            authorName: req.user.username,
            authorProfileImage: req.user.profileImage,
            createdAt: new Date().toISOString(),
            comments: []
        };

        posts.push(newPost);
        await writePosts(posts);
        res.status(201).json({ success: true, message: '게시글이 작성되었습니다.', post: newPost });
    } catch (error) {
        console.error('게시글 작성 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 게시글 조회 (GET /:id)
router.get('/:id', async (req, res) => {
    try {
        const posts = await readPosts();
        let post = posts.find(p => p.id === req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        const users = await readUsers();
        const userMap = new Map(users.map(u => [u.id, u]));
        
        post = injectAuthorInfo(post, userMap);

        if (post.comments && post.comments.length > 0) {
            post.comments = injectAuthorInfo(post.comments, userMap);
        }

        res.json({ success: true, post });
    } catch (error) {
        console.error('특정 게시글 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 게시글 삭제 (DELETE /:id)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        let posts = await readPosts();
        const postIndex = posts.findIndex(p => p.id === req.params.id);

        if (postIndex === -1) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }
        
        const post = posts[postIndex];
        const userIsAdmin = isAdmin(req.user);
        const isAuthor = post.authorId === req.user.id;

        if (!userIsAdmin && !isAuthor) {
            return res.status(403).json({ success: false, message: '게시글을 삭제할 권한이 없습니다.' });
        }

        posts.splice(postIndex, 1);
        await writePosts(posts);
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

        const posts = await readPosts();
        const postIndex = posts.findIndex(p => p.id === req.params.id);

        if (postIndex === -1) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }
        
        const newComment = {
            id: Date.now().toString(),
            content,
            authorId: req.user.id,
            authorName: req.user.username,
            authorProfileImage: req.user.profileImage,
            createdAt: new Date().toISOString()
        };

        posts[postIndex].comments = posts[postIndex].comments || [];
        posts[postIndex].comments.push(newComment);
        await writePosts(posts);
        
        res.status(201).json({ success: true, message: '댓글이 작성되었습니다.', comment: newComment });
    } catch (error) {
        console.error('댓글 작성 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

export default router;