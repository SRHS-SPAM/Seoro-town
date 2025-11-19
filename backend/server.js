// backend/server.js

import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import connectDB from './config/db.js';
import ChatMessage from './models/ChatMessage.js';

const startServer = async () => {
    try {
        await connectDB();

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const app = express();

        // 공통 허용 origin 목록 (기본값 + 환경변수)
        const defaultOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://seoro-town.onrender.com',
        ];

        const extraOrigins = (process.env.CORS_ORIGINS || '')
            .split(',')
            .map((o) => o.trim())
            .filter((o) => o.length > 0);

        const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];
        const server = http.createServer(app);
        const isOriginAllowed = (origin = '') => {
            if (!origin) return true; // 모바일 네이티브(fetch) 등 Origin 헤더가 없는 요청 허용
            if (allowedOrigins.includes(origin)) return true;
            if (origin.startsWith('exp://')) return true; // Expo Go
            return false;
        };

        const io = new Server(server, {
            cors: {
                origin: (origin, callback) => {
                    if (isOriginAllowed(origin)) {
                        callback(null, origin);
                    } else {
                        callback(new Error('Socket.io CORS blocked'));
                    }
                },
                methods: ['GET', 'POST'],
            },
        });

        app.use(
            cors({
                origin: (origin, callback) => {
                    if (isOriginAllowed(origin)) {
                        callback(null, origin);
                    } else {
                        callback(new Error('HTTP CORS blocked'));
                    }
                },
                credentials: true,
            })
        );
        app.use(express.json());

        // 상세 로깅 미들웨어
        app.use((req, res, next) => {
          console.log('--- Incoming Request ---');
          console.log(`[${new Date().toISOString()}]`);
          console.log('Method:', req.method);
          console.log('URL:', req.originalUrl);
          console.log('Host Header:', req.headers['host']);
          console.log('X-Forwarded-For:', req.headers['x-forwarded-for']);
          console.log('X-Forwarded-Proto:', req.headers['x-forwarded-proto']);
          console.log('----------------------');
          next();
        });
        app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

        // Dynamically import routes
        const authRoutes = (await import('./routes/auth.js')).default;
        const userRoutes = (await import('./routes/users.js')).default;
        const postRoutes = (await import('./routes/posts.js')).default;
        const mealRoutes = (await import('./routes/meal.js')).default;
        const comRoutes = (await import('./routes/com.js')).default;
        const marketRoutes = (await import('./routes/market.js')).default;
        const chatRoutes = (await import('./routes/chat.js')).default;

        app.use('/api/auth', authRoutes);
        app.use('/api/users', userRoutes);
        app.use('/api/posts', postRoutes);
        app.use('/api/meal', mealRoutes);
        app.use('/api/com', comRoutes);
        app.use('/api/market', marketRoutes);
        app.use('/api/chat', chatRoutes);

        io.on('connection', (socket) => {
            console.log('✅ A user connected:', socket.id);

            socket.on('joinRoom', (roomId) => {
                socket.join(roomId);
                console.log(`[JOIN] User ${socket.id} joined room ${roomId}`);
            });

            socket.on('sendMessage', async (messageData) => {
                try {
                    const newMessage = await ChatMessage.create(messageData);
                    io.to(messageData.roomId).emit('receiveMessage', newMessage);
                } catch (error) {
                    console.error('Error saving or broadcasting message:', error);
                }
            });

            socket.on('disconnect', () => {
                console.log('🔻 User disconnected:', socket.id);
            });
        });

        const PORT = process.env.PORT || 3001;
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
