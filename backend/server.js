// backend/server.js (MongoDB 연결 추가)

import http from 'http';
import { Server } from 'socket.io';

// ✨✨✨ MongoDB 연결 관련 임포트 ✨✨✨
import connectDB from './config/db.js'; // DB 연결 함수 임포트
// 필요한 모델 임포트 (기존 readChatMessages, writeChatMessages 대신 사용)
import ChatMessage from './models/ChatMessage.js'; // ChatMessage 모델 임포트 (소켓용)
import ChatRoom from './models/ChatRoom.js';       // ChatRoom 모델 (소켓용)
import User from './models/User.js';               // User 모델 (소켓 메시지 저장 시 senderName, senderId 확인용)


import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import mealRoutes from './routes/meal.js';
import comRoutes from './routes/com.js';
import marketRoutes from './routes/market.js';
import chatRoutes from './routes/chat.js'; 

import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// import { readChatMessages, writeChatMessages } from './utils/fileHandlers.js'; // ✨ 이 라인 삭제

// ✨✨✨ MongoDB 연결 실행 ✨✨✨
connectDB(); 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// API 라우트 연결
app.use('/api/meal', mealRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/com', comRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '서버가 정상적으로 작동중입니다.'});
});

// ✨✨✨ Socket.IO 메시지 저장 로직을 MongoDB로 변경 ✨✨✨
io.on('connection', (socket) => {
    console.log('✅ 새 사용자가 접속했습니다:', socket.id);

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`[JOIN] 사용자 ${socket.id}가 ${roomId} 방에 참여했습니다.`);
    });

    socket.on('sendMessage', async (messageData) => {
        try {
            // 메시지를 보낸 사용자와 방이 유효한지 간단히 확인
            const senderExists = await User.exists({ id: messageData.senderId });
            const roomExists = await ChatRoom.exists({ id: messageData.roomId });
            
            if (!senderExists || !roomExists) {
                console.warn(`[MSG] 유효하지 않은 발신자 또는 방으로 메시지 수신: senderId=${messageData.senderId}, roomId=${messageData.roomId}`);
                return;
            }

            // MongoDB ChatMessage 모델을 사용하여 메시지 저장
            const newMessage = new ChatMessage({
                roomId: messageData.roomId,
                senderId: messageData.senderId,
                senderName: messageData.senderName,
                message: messageData.message,
                timestamp: new Date() // 현재 시간으로 저장
            });
            await newMessage.save(); // DB에 저장

            // '나를 포함한' 방의 모든 사람에게 메시지 방송
            io.to(messageData.roomId).emit('receiveMessage', newMessage);
            console.log(`[MSG] ${messageData.roomId} 방으로 메시지 방송 성공:`, messageData.message);

        } catch (error) {
            console.error('!!!!!!!!!!! 메시지 저장/방송 중 심각한 오류 발생 !!!!!!!!!!!:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔻 사용자가 접속을 끊었습니다:', socket.id);
    });
});

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
});