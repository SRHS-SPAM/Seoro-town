<<<<<<< Updated upstream
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
=======
// backend/server.js (전체 코드)

import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import mealRoutes from './routes/meal.js';
import comRoutes from './routes/com.js';
import marketRoutes from './routes/market.js';
import chatRoutes from './routes/chat.js'; // chatRoutes import 추가

import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readChatMessages, writeChatMessages } from './utils/fileHandlers.js'; // 메시지 저장을 위해 import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

>>>>>>> Stashed changes
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your-secret-key-change-this-in-production';
const USERS_FILE = path.join(__dirname, 'users.json');
const POSTS_FILE = path.join(__dirname, 'boardlist.json');

<<<<<<< Updated upstream
// CORS 설정
=======
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

>>>>>>> Stashed changes
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
<<<<<<< Updated upstream
=======
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
>>>>>>> Stashed changes

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', req.body);
    }
    next();
});

<<<<<<< Updated upstream
// 파일 읽기/쓰기 함수들
const readUsers = async () => {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('users.json 파일이 없어서 새로 생성합니다.');
        return [];
    }
};

const writeUsers = async (users) => {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('사용자 데이터 저장 오류:', error);
        throw error;
    }
};

const readPosts = async () => {
    try {
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('boardlist.json 파일이 없어서 새로 생성합니다.');
        const emptyPosts = [];
        await writePosts(emptyPosts);
        return emptyPosts;
    }
};

const writePosts = async (posts) => {
    try {
        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
        console.log('게시글 데이터 저장 완료');
    } catch (error) {
        console.error('게시글 데이터 저장 오류:', error);
        throw error;
    }
};

// 관리자 권한 확인 헬퍼 함수
const isAdmin = (user) => {
    return user?.username === '관리자' || user?.email === 'DBADMIN@dba.com';
};

// 인증 미들웨어 - 먼저 정의
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('Auth header:', authHeader);
    console.log('Extracted token:', token);
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: '액세스 토큰이 필요합니다.' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('토큰 검증 오류:', err);
            return res.status(403).json({ 
                success: false, 
                message: '유효하지 않은 토큰입니다.' 
            });
        }
        console.log('토큰 검증 성공:', user);
        req.user = user;
        next();
    });
};

// 이제 라우트들을 정의 - authenticateToken을 사용할 수 있음

// 사용자 검색
app.get('/api/users/search', authenticateToken, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: '검색어는 2자 이상 입력해주세요.'
            });
        }

        const users = await readUsers();
        const searchResults = users
            .filter(user => 
                user.username.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
            )
            .map(user => ({
                id: user.id,
                username: user.username,
                email: user.email
            }))
            .slice(0, 10); // 최대 10개 결과

        res.json({
            success: true,
            users: searchResults
        });

    } catch (error) {
        console.error('사용자 검색 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 서버 상태 확인
=======
// API 라우트 연결
app.use('/api/meal', mealRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/com', comRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/chat', chatRoutes); // chatRoutes 연결 추가

>>>>>>> Stashed changes
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: '서버가 정상적으로 작동중입니다.',
        timestamp: new Date().toISOString()
    });
});

// 회원가입
app.post('/api/signup', async (req, res) => {
    try {
        console.log('회원가입 요청:', req.body);
        
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: '모든 필드를 입력해주세요.' 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: '비밀번호는 6자 이상이어야 합니다.' 
            });
        }

        const users = await readUsers();
        
        if (users.find(user => user.username === username || user.email === email)) {
            return res.status(400).json({ 
                success: false, 
                message: '이미 존재하는 사용자명 또는 이메일입니다.' 
            });
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

        console.log('회원가입 성공:', username);

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
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 로그인
app.post('/api/login', async (req, res) => {
    try {
        console.log('로그인 요청:', req.body);
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: '아이디와 비밀번호를 입력해주세요.' 
            });
        }

        const users = await readUsers();
        console.log(`총 ${users.length}명의 사용자가 등록되어 있습니다.`);
        
        const user = users.find(u => u.username === username || u.email === username);
        
        if (!user) {
            console.log('사용자를 찾을 수 없음:', username);
            return res.status(401).json({ 
                success: false, 
                message: '아이디 또는 비밀번호가 올바르지 않습니다.' 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            console.log('비밀번호 불일치:', username);
            return res.status(401).json({ 
                success: false, 
                message: '아이디 또는 비밀번호가 올바르지 않습니다.' 
            });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('로그인 성공:', username, isAdmin(user) ? '(관리자)' : '(일반 사용자)');

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
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 사용자 정보 조회
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const users = await readUsers();
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: '사용자를 찾을 수 없습니다.' 
            });
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
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 게시글 목록 조회
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await readPosts();
        console.log('불러온 게시글:', posts.length, '개');
        res.json({
            success: true,
            posts: posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error('게시글 목록 조회 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 게시글 작성
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        console.log('게시글 작성 요청:', req.body);
        console.log('요청 사용자:', req.user, isAdmin(req.user) ? '(관리자)' : '(일반 사용자)');
        
        const { title, content, category } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ 
                success: false, 
                message: '제목과 내용을 입력해주세요.' 
            });
        }

        // 카테고리 기본값 설정
        const postCategory = category || '재학생';

        const posts = await readPosts();
        const newPost = {
            id: Date.now().toString(),
            title: title.trim(),
            content: content.trim(),
            category: postCategory,
            authorId: req.user.id,
            authorName: req.user.username,
            createdAt: new Date().toISOString(),
            comments: []
        };

        posts.push(newPost);
        await writePosts(posts);

        console.log('새 게시글 작성 완료:', {
            title: newPost.title,
            category: newPost.category,
            author: req.user.username,
            id: newPost.id,
            isAdmin: isAdmin(req.user)
        });

        res.status(201).json({
            success: true,
            message: '게시글이 작성되었습니다.',
            post: newPost
        });

    } catch (error) {
        console.error('게시글 작성 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 특정 게시글 조회
app.get('/api/posts/:id', async (req, res) => {
    try {
        const posts = await readPosts();
        const post = posts.find(p => p.id === req.params.id);
        
        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: '게시글을 찾을 수 없습니다.' 
            });
        }

        res.json({ 
            success: true, 
            post: post 
        });
    } catch (error) {
        console.error('게시글 조회 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 게시글 삭제 - 관리자 권한 추가
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        console.log('=== 게시글 삭제 요청 시작 ===');
        console.log('요청된 게시글 ID:', req.params.id, '(타입:', typeof req.params.id, ')');
        console.log('요청 사용자:', req.user);
        console.log('관리자 여부:', isAdmin(req.user));
    
        const posts = await readPosts();
        console.log('boardlist.json에서 불러온 게시글 수:', posts.length);
    
        const requestedId = req.params.id;
        let postIndex = -1;

        postIndex = posts.findIndex(p => {
            if (p.id.toString() === requestedId.toString()) return true;
            if (Number(p.id) === Number(requestedId)) return true;
            if (p.id === requestedId) return true;
            return false;
        });
        
        console.log('찾는 ID:', requestedId, '(타입:', typeof requestedId, ')');
        console.log('찾은 게시글 인덱스:', postIndex);

        console.log('저장된 게시글 ID들:');
        posts.forEach((p, index) => {
            console.log(`  ${index}: ID=${p.id} (${typeof p.id}), 제목=${p.title}, 작성자=${p.authorName || p.author}`);
        });

        if (postIndex === -1) {
            console.log('❌ 게시글을 찾을 수 없음');
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }
        
        const post = posts[postIndex];
        console.log('✅ 찾은 게시글:', {
            id: post.id,
            title: post.title,
            authorId: post.authorId,
            authorName: post.authorName,
            author: post.author
        });

        // 관리자는 모든 게시글 삭제 가능, 일반 사용자는 본인 게시글만 삭제 가능
        const userIsAdmin = isAdmin(req.user);
        const isAuthor = 
            (post.authorId && req.user.id && post.authorId === req.user.id) ||
            (post.authorName && req.user.username && post.authorName === req.user.username) ||
            (post.author && req.user.username && post.author === req.user.username) ||
            (post.authorName && req.user.name && post.authorName === req.user.name) ||
            (post.author && req.user.name && post.author === req.user.name);
    
        console.log('권한 확인:', {
            postAuthorId: post.authorId,
            postAuthorName: post.authorName,
            postAuthor: post.author,
            requestUserId: req.user.id,
            requestUserName: req.user.username,
            requestUserDisplayName: req.user.name,
            isAuthor: isAuthor,
            userIsAdmin: userIsAdmin,
            canDelete: userIsAdmin || isAuthor
        });
        
        // 관리자이거나 작성자인 경우에만 삭제 허용
        if (!userIsAdmin && !isAuthor) {
            console.log('❌ 권한 없음 - 삭제 거부');
            return res.status(403).json({
                success: false,
                message: '본인이 작성한 게시글만 삭제할 수 있습니다.'
            });
        }
        
        // 게시글 삭제
        const deletedPost = posts.splice(postIndex, 1)[0];
        await writePosts(posts);
        
        console.log('✅ 게시글 삭제 완료:', {
            id: deletedPost.id,
            title: deletedPost.title,
            author: deletedPost.authorName || deletedPost.author,
            deletedBy: req.user.username,
            deletedByAdmin: userIsAdmin
        });
        console.log('남은 게시글 수:', posts.length);
        console.log('=== 게시글 삭제 요청 완료 ===');
        
        res.json({
            success: true,
            message: userIsAdmin && !isAuthor ? 
                '관리자 권한으로 게시글이 삭제되었습니다.' : 
                '게시글이 삭제되었습니다.'
        });
        
    } catch (error) {
        console.error('❌ 게시글 삭제 오류:', error);
        console.error('오류 스택:', error.stack);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 댓글 작성
app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
    try {
        console.log('댓글 작성 요청:', {
            postId: req.params.id,
            user: req.user.username,
            isAdmin: isAdmin(req.user),
            content: req.body.content?.substring(0, 50) + '...'
        });

        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ 
                success: false, 
                message: '댓글 내용을 입력해주세요.' 
            });
        }

        const posts = await readPosts();
        const postIndex = posts.findIndex(p => p.id === req.params.id);
        
        if (postIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: '게시글을 찾을 수 없습니다.' 
            });
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

        console.log('새 댓글 작성 완료:', {
            content: content.substring(0, 30) + '...',
            author: req.user.username,
            isAdmin: isAdmin(req.user),
            postTitle: posts[postIndex].title
        });

        res.status(201).json({
            success: true,
            message: '댓글이 작성되었습니다.',
            comment: newComment
        });

    } catch (error) {
        console.error('댓글 작성 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const posts = await readPosts();
        const post = posts.find(p => p.id === req.params.id);
        
        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: '게시글을 찾을 수 없습니다.' 
            });
        }

        res.json({ 
            success: true, 
            comments: post.comments || [] 
        });
    } catch (error) {
        console.error('댓글 조회 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

io.on('connection', (socket) => {
    console.log('✅ 새 사용자가 접속했습니다:', socket.id);

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`사용자 ${socket.id}가 ${roomId} 방에 참여했습니다.`);
    });

    socket.on('sendMessage', async (data) => {
        try {
            const allMessages = await readChatMessages();
            if (!allMessages[data.roomId]) {
                allMessages[data.roomId] = [];
            }
            
            const newMessage = {
                senderId: data.senderId,
                senderName: data.senderName,
                message: data.message,
                timestamp: new Date().toISOString()
            };

            allMessages[data.roomId].push(newMessage);
            await writeChatMessages(allMessages);
            
            io.to(data.roomId).emit('receiveMessage', newMessage);
            console.log(`${data.roomId} 방으로 메시지 전송:`, data.message);

        } catch (error) {
            console.error('메시지 저장 중 오류:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔻 사용자가 접속을 끊었습니다:', socket.id);
    });
});

<<<<<<< Updated upstream
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: '관리자만 접근할 수 있습니다.'
            });
        }

        const users = await readUsers();
        const safeUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
        }));

        console.log('관리자가 사용자 목록 조회:', req.user.username);

        res.json({
            success: true,
            users: safeUsers
        });
    } catch (error) {
        console.error('사용자 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});


app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: '관리자만 접근할 수 있습니다.'
            });
        }

        const users = await readUsers();
        const userIndex = users.findIndex(u => u.id === req.params.id);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        if (users[userIndex].id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: '자신의 계정은 삭제할 수 없습니다.'
            });
        }

        const deletedUser = users.splice(userIndex, 1)[0];
        await writeUsers(users);

        console.log('관리자가 사용자 삭제:', {
            admin: req.user.username,
            deletedUser: deletedUser.username
        });

        res.json({
            success: true,
            message: '사용자가 삭제되었습니다.'
        });
    } catch (error) {
        console.error('사용자 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '요청한 API를 찾을 수 없습니다.'
    });
});

app.use((error, req, res, next) => {
    console.error('서버 에러:', error);
    res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.'
    });
});

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
    console.log(`API 엔드포인트:`);
    console.log(`   - POST /api/signup - 회원가입`);
    console.log(`   - POST /api/login - 로그인`);
    console.log(`   - GET  /api/user - 사용자 정보`);
    console.log(`   - GET  /api/posts - 게시글 목록`);
    console.log(`   - POST /api/posts - 게시글 작성`);
    console.log(`   - GET  /api/posts/:id - 게시글 조회`);
    console.log(`   - DELETE /api/posts/:id - 게시글 삭제`);
    console.log(`   - POST /api/posts/:id/comments - 댓글 작성`);
    console.log(`   - GET  /api/posts/:id/comments - 댓글 조회`);
    console.log(`   - GET  /api/admin/users - 관리자: 사용자 목록`);
    console.log(`   - DELETE /api/admin/users/:id - 관리자: 사용자 삭제`);
    console.log(`   - GET  /api/users/search - 사용자 검색`);
    console.log(`   - GET  /api/health - 서버 상태 확인`);
});

process.on('SIGINT', () => {
    console.log('\n👋 서버를 종료합니다...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 서버를 종료합니다...');
    process.exit(0);
=======
app.get('*', (req, res) => {
    res.status(404).json({ success: false, message: 'API 경로가 아닙니다.' });
});

app.use((req, res, next) => {
    res.status(404).json({ success: false, message: '요청한 경로를 찾을 수 없습니다.' });
});

app.use((err, req, res, next) => {
    console.error('치명적인 서버 오류:', err.stack);
    res.status(500).json({ success: false, message: '서버에 문제가 발생했습니다.' });
});

server.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
>>>>>>> Stashed changes
});