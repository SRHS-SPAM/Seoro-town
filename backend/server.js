<<<<<<< HEAD
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

=======
// 라우터 임포트
>>>>>>> main
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import mealRoutes from './routes/meal.js';
import comRoutes from './routes/com.js';
<<<<<<< HEAD
import marketRoutes from './routes/market.js';
import chatRoutes from './routes/chat.js'; // chatRoutes import 추가
=======
>>>>>>> main

import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
<<<<<<< HEAD
import { readChatMessages, writeChatMessages } from './utils/fileHandlers.js'; // 메시지 저장을 위해 import
=======

>>>>>>> main

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> main
const app = express();
const PORT = process.env.PORT || 3001;

<<<<<<< HEAD
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
=======
>>>>>>> main
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
<<<<<<< Updated upstream
=======
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
>>>>>>> Stashed changes



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

<<<<<<< HEAD
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
=======
// API 라우트 연결
app.use('/api/meal', mealRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/com', comRoutes);

// 서버 상태 확인 API
>>>>>>> main
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '서버가 정상적으로 작동중입니다.'});
});

io.on('connection', (socket) => {
    console.log('✅ 새 사용자가 접속했습니다:', socket.id);

<<<<<<< HEAD
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
=======
app.get('*', (req, res) => {
>>>>>>> main

    res.status(404).json({ success: false, message: 'API 경로가 아닙니다.' });
});


// 404 처리 미들웨어 (이전 코드와 동일)
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: '요청한 경로를 찾을 수 없습니다.' });
});

// 전역 에러 핸들러 (이전 코드와 동일)
app.use((err, req, res, next) => {
    console.error('치명적인 서버 오류:', err.stack);
    res.status(500).json({ success: false, message: '서버에 문제가 발생했습니다.' });
});

// 서버 실행
app.listen(PORT, () => {
<<<<<<< HEAD
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
=======
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
>>>>>>> main
});