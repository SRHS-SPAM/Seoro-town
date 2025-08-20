// backend/migrate.js (MongoDB 마이그레이션 스크립트 - Club 모델 제외)

import mongoose from 'mongoose'; // Mongoose 임포트
import 'dotenv/config';          // .env 파일 로드

// ✨✨✨ 필요한 모델들을 임포트합니다. ✨✨✨
// Club 모델은 사용하지 않으므로 임포트에서 제외됩니다.
import User from './models/User.js';
import Post from './models/Post.js';
import Follow from './models/Follow.js';
import Product from './models/Product.js'; // Product 모델
import ChatRoom from './models/ChatRoom.js';
import ChatMessage from './models/ChatMessage.js';

import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt'; // 비밀번호 해싱용
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_DIR = path.join(__dirname, 'json_backup'); // 0-1단계에서 백업한 JSON 파일 경로

// JSON 파일 읽기 헬퍼 함수
const readJsonFile = async (filename) => {
    try {
        const data = await fs.readFile(path.join(JSON_DIR, filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`[Migrate] Warning: ${filename} 파일을 찾을 수 없습니다. 건너뜝니다.`);
            return [];
        }
        console.error(`[Migrate] Error reading ${filename}:`, error.message);
        throw error;
    }
};

const migrateData = async () => {
    try {
        // MongoDB 연결
        const mongoURI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/seorotown'; 
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB 연결 성공 (마이그레이션용)!');

        console.log('--- 데이터 마이그레이션 시작 ---');

        // 모든 컬렉션 비우기
        await User.deleteMany({});
        await Post.deleteMany({});
        await Follow.deleteMany({});
        // await Club.deleteMany({}); // Club 모델은 사용하지 않으므로 마이그레이션에서 제외
        await Product.deleteMany({});
        await ChatRoom.deleteMany({});
        await ChatMessage.deleteMany({});
        console.log('기존 MongoDB 컬렉션 초기화 완료.');

        // 1. Users 마이그레이션
        const usersJson = await readJsonFile('users.json');
        const usersToInsert = [];
        for (const user of usersJson) {
            const isPasswordHashed = user.password.startsWith('$2b$'); 
            if (!isPasswordHashed) {
                user.password = await bcrypt.hash(user.password, 10);
            }
            usersToInsert.push({ ...user, _id: user.id }); 
        }
        if (usersToInsert.length > 0) {
            await User.insertMany(usersToInsert);
            console.log(`${usersToInsert.length}명의 사용자 마이그레이션 완료.`);
        } else {
            console.log('마이그레이션할 사용자 없음.');
        }

        // 2. Posts 마이그레이션
        const postsJson = await readJsonFile('boardlist.json'); 
        if (postsJson.length > 0) {
            await Post.insertMany(postsJson.map(post => ({ ...post, _id: post.id }))); 
            console.log(`${postsJson.length}개의 게시글 마이그레이션 완료.`);
        } else {
            console.log('마이그레이션할 게시글 없음.');
        }
        
        // 3. Follows 마이그레이션
        const followsJson = await readJsonFile('follows.json');
        if (followsJson.length > 0) {
            await Follow.insertMany(followsJson.map(follow => ({ ...follow, _id: follow.id })));
            console.log(`${followsJson.length}개의 팔로우 관계 마이그레이션 완료.`);
        } else {
            console.log('마이그레이션할 팔로우 관계 없음.');
        }
        // 4. Products 마이그레이션 (Market 데이터)
        const productsJson = await readJsonFile('market.json'); // market.json 파일 읽기
        if (productsJson.length > 0) {
            await Product.insertMany(productsJson.map(product => ({ ...product, _id: product.id })));
            console.log(`${productsJson.length}개의 상품 (마켓) 마이그레이션 완료.`);
        } else {
            console.log('마이그레이션할 상품 (마켓) 없음.');
        }

        // 5. ChatRooms 마이그레이션
        const chatRoomsJson = await readJsonFile('chat_rooms.json');
        if (chatRoomsJson.length > 0) {
            await ChatRoom.insertMany(chatRoomsJson.map(room => ({ ...room, _id: room.id })));
            console.log(`${chatRoomsJson.length}개의 채팅방 마이그레이션 완료.`);
        } else {
            console.log('마이그레이션할 채팅방 없음.');
        }

        // 6. ChatMessages 마이그레이션
        const chatMessagesObj = await readJsonFile('chat_messages.json');
        const chatMessagesToInsert = [];
        for (const roomId in chatMessagesObj) {
            chatMessagesToInsert.push(...chatMessagesObj[roomId]);
        }
        if (chatMessagesToInsert.length > 0) {
            await ChatMessage.insertMany(chatMessagesToInsert);
            console.log(`${chatMessagesToInsert.length}개의 채팅 메시지 마이그레이션 완료.`);
        } else {
            console.log('마이그레이션할 채팅 메시지 없음.');
        }

        //7. 존재하지 않는 기억
        
        console.log('--- 데이터 마이그레이션 완료! ---');

    } catch (error) {
        console.error('데이터 마이그레이션 중 오류 발생:', error);
    } finally {
        mongoose.connection.close(); // DB 연결 종료
        console.log('MongoDB 연결 종료.');
        process.exit(0); // 스크립트 종료
    }
};

migrateData();