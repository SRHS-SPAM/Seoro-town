/*const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'your-secret-key'; 
const USERS_FILE = path.join(__dirname, 'users.json');
const POSTS_FILE = path.join(__dirname, 'boardlist.json');

app.use(cors());
app.use(express.json());

const readUsers = async () => {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

const writeUsers = async (users) => {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

const readPosts = async () => {
    try {
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        const emptyPosts = [];
        await writePosts(emptyPosts);
        return emptyPosts;
    }
};

const writePosts = async (posts) => {
    await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
};

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: '액세스 토큰이 필요합니다.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        req.user = user;
        next();
    });
};

app.post('/api/signup', async (req, res) => {
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
            return res.status(400).json({ success: false, message: '이미 존재하는 사용자명 또는 이메일입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeUsers(users);

        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다!',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });
        }

        const users = await readUsers();
        const user = users.find(u => u.username === username || u.email === username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: '로그인 성공',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const users = await readUsers();
        const user = users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.get('/api/posts', async (req, res) => {
    try {
        const posts = await readPosts();
        res.json({
            success: true,
            posts: posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error('게시글 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
        }

        const posts = await readPosts();
        const newPost = {
            id: Date.now().toString(),
            title,
            content,
            authorId: req.user.id,
            authorName: req.user.username,
            createdAt: new Date().toISOString(),
            views: 0,
            likes: 0,
            likedUsers: [],
            comments: []
        };

        posts.push(newPost);
        await writePosts(posts);

        res.status(201).json({
            success: true,
            message: '게시글이 작성되었습니다.',
            post: newPost
        });

    } catch (error) {
        console.error('게시글 작성 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const posts = await readPosts();
        const postIndex = posts.findIndex(p => p.id === req.params.id);
        if (postIndex === -1) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        posts[postIndex].views += 1;
        await writePosts(posts);

        res.json({ success: true, post: posts[postIndex] });
    } catch (error) {
        console.error('게시글 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
    try {
        const posts = await readPosts();
        const postIndex = posts.findIndex(p => p.id === req.params.id);
        if (postIndex === -1) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        const post = posts[postIndex];
        const userId = req.user.id;
        const isLiked = post.likedUsers.includes(userId);

        if (isLiked) {
            post.likedUsers = post.likedUsers.filter(id => id !== userId);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            post.likedUsers.push(userId);
            post.likes += 1;
        }

        posts[postIndex] = post;
        await writePosts(posts);

        res.json({
            success: true,
            message: isLiked ? '좋아요를 취소했습니다.' : '좋아요를 누르셨습니다.',
            likes: post.likes,
            isLiked: !isLiked
        });

    } catch (error) {
        console.error('좋아요 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
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
            createdAt: new Date().toISOString()
        };

        posts[postIndex].comments.push(newComment);
        await writePosts(posts);

        res.status(201).json({
            success: true,
            message: '댓글이 작성되었습니다.',
            comment: newComment
        });

    } catch (error) {
        console.error('댓글 작성 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const posts = await readPosts();
        const post = posts.find(p => p.id === req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        res.json({ success: true, comments: post.comments || [] });
    } catch (error) {
        console.error('댓글 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
*/