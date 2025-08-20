// backend/migrate.js (최종 수정 버전)

import connectDB, { getDb } from './config/db.js';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_DIR = path.join(__dirname, 'json_backup');

const readJsonFile = async (filename) => {
    try {
        const data = await fs.readFile(path.join(JSON_DIR, filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        console.warn(`[Migrate] ${filename} 파일을 찾을 수 없거나 읽기 오류:`, error.message);
        return [];
    }
};

const migrateData = async () => {
    await connectDB();
    const db = getDb();

    console.log('--- 데이터 마이그레이션 시작 ---');

    try {
        await db.exec('DELETE FROM chat_messages');
        await db.exec('DELETE FROM chat_rooms');
        await db.exec('DELETE FROM follows');
        await db.exec('DELETE FROM clubs');
        await db.exec('DELETE FROM products');
        await db.exec('DELETE FROM comments');
        await db.exec('DELETE FROM posts');
        await db.exec('DELETE FROM users');
        console.log('기존 SQLite 테이블 초기화 완료.');

        // 1. Users 마이그레이션
        const usersJson = await readJsonFile('users.json');
        const userStmt = await db.prepare('INSERT INTO users (id, username, email, password, profileImage, createdAt, schedule) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const user of usersJson) {
            const isPasswordHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
            if (!isPasswordHashed) {
                user.password = await bcrypt.hash(user.password, 10);
            }
            await userStmt.run(
                user.id, user.username, user.email, user.password, 
                user.profileImage || null, user.createdAt, 
                JSON.stringify(user.schedule || [
                    ["", "월", "화", "수", "목", "금"],
                    ["1", "", "", "", "", ""], ["2", "", "", "", "", ""],
                    ["3", "", "", "", "", ""], ["4", "", "", "", "", ""],
                    ["5", "", "", "", "", ""], ["6", "", "", "", "", ""],
                    ["7", "", "", "", "", ""]
                ])
            );
        }
        await userStmt.finalize();
        console.log(`${usersJson.length}명의 사용자 마이그레이션 완료.`);

        // 2. Posts 마이그레이션
        const postsJson = await readJsonFile('boardlist.json');
        const postStmt = await db.prepare('INSERT INTO posts (id, title, content, category, authorId, authorName, authorProfileImage, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        const commentStmt = await db.prepare('INSERT INTO comments (id, postId, content, authorId, authorName, authorProfileImage, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const post of postsJson) {
            await postStmt.run(
                post.id, post.title, post.content, post.category, post.authorId,
                post.authorName || '알 수 없음', post.authorProfileImage || null, post.createdAt
            );
            if (post.comments && post.comments.length > 0) {
                for (const comment of post.comments) {
                    await commentStmt.run(
                        comment.id, post.id, comment.content, comment.authorId,
                        comment.authorName || '알 수 없음', comment.authorProfileImage || null, comment.createdAt
                    );
                }
            }
        }
        await postStmt.finalize();
        await commentStmt.finalize();
        console.log(`${postsJson.length}개의 게시글 마이그레이션 완료.`);
        
        // 3. Follows 마이그레이션
        const followsJson = await readJsonFile('follows.json');
        const followStmt = await db.prepare('INSERT INTO follows (id, followerId, followingId) VALUES (?, ?, ?)');
        for (const follow of followsJson) {
            await followStmt.run(follow.id, follow.followerId, follow.followingId);
        }
        await followStmt.finalize();
        console.log(`${followsJson.length}개의 팔로우 관계 마이그레이션 완료.`);

        // 4. Clubs 마이그레이션
        const clubsJson = await readJsonFile('clubs.json');
        const clubStmt = await db.prepare('INSERT INTO clubs (id, name, description, creatorId, creatorName, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
        for (const club of clubsJson) {
            await clubStmt.run(club.id, club.name, club.description || null, club.creatorId, club.creatorName, club.createdAt);
        }
        await clubStmt.finalize();
        console.log(`${clubsJson.length}개의 커뮤니티 마이그레이션 완료.`);

        // 5. Products 마이그레이션
        const productsJson = await readJsonFile('products.json');
        const productStmt = await db.prepare('INSERT INTO products (id, title, content, price, category, authorId, authorName, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const product of productsJson) {
            await productStmt.run(
                product.id, product.title, product.content, product.price, product.category,
                product.authorId, product.authorName, product.imageUrl || null, product.createdAt
            );
        }
        await productStmt.finalize();
        console.log(`${productsJson.length}개의 상품 마이그레이션 완료.`);

        // ✨✨✨ 6. ChatRooms 마이그레이션 - 변수 선언 추가 ✨✨✨
        const chatRoomsJson = await readJsonFile('chat_rooms.json'); // 이 라인이 빠져있었습니다!
        const chatRoomStmt = await db.prepare('INSERT INTO chat_rooms (id, productId, participants, createdAt) VALUES (?, ?, ?, ?)');
        for (const room of chatRoomsJson) {
            await chatRoomStmt.run(room.id, room.productId || null, JSON.stringify(room.participants), room.createdAt);
        }
        await chatRoomStmt.finalize();
        console.log(`${chatRoomsJson.length}개의 채팅방 마이그레이션 완료.`);

        // ✨✨✨ 7. ChatMessages 마이그레이션 - readJsonFile 사용으로 통일 ✨✨✨
        const chatMessagesObj = await readJsonFile('chat_messages.json');
        const chatMessageStmt = await db.prepare('INSERT INTO chat_messages (roomId, senderId, senderName, message, timestamp) VALUES (?, ?, ?, ?, ?)');
        for (const roomId in chatMessagesObj) {
            for (const message of chatMessagesObj[roomId]) {
                await chatMessageStmt.run(message.roomId, message.senderId, message.senderName, message.message, message.timestamp);
            }
        }
        await chatMessageStmt.finalize();
        console.log(`모든 채팅 메시지 마이그레이션 완료.`);

        console.log('--- 데이터 마이그레이션 완료! ---');

    } catch (error) {
        console.error('데이터 마이그레이션 중 오류 발생:', error);
    } finally {
        if (db) db.close();
        console.log('SQLite DB 연결 종료.');
        process.exit(0);
    }
};

migrateData();