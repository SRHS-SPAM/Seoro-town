// backend/server.js (최종 완성 버전)

import http from 'http';
import { Server } from 'socket.io';
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

import connectDB from './config/db.js';
import ChatMessage from './models/ChatMessage.js';

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

io.on('connection', (socket) => {
    console.log('✅ 새 사용자가 접속했습니다:', socket.id);

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`[JOIN] 사용자 ${socket.id}가 ${roomId} 방에 참여했습니다.`);
    });

    socket.on('sendMessage', async (messageData) => {
        try {
            console.log('[MSG-DEBUG] Received messageData:', messageData); // ADDED LOG
            // Save message to MongoDB
            const newMessage = await ChatMessage.create(messageData);
            console.log('[MSG-DEBUG] ChatMessage created:', newMessage); // ADDED LOG

            // Emit the new message to the room
            io.to(messageData.roomId).emit('receiveMessage', newMessage);
            console.log(`[MSG] ${messageData.roomId} 방으로 메시지 방송 성공:`, newMessage.message);

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