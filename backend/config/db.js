// backend/config/db.js (새 파일 - SQLite)

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'seorotown.db'); // 데이터베이스 파일 경로

let db; // 데이터베이스 인스턴스를 저장할 변수

const connectDB = async () => {
    try {
        db = await open({
            filename: DB_FILE,
            driver: sqlite3.Database
        });
        console.log('SQLite 데이터베이스 연결 성공!');
        
        // ✨ 데이터베이스 스키마 생성 (테이블 만들기)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password TEXT,
                profileImage TEXT,
                createdAt TEXT,
                schedule TEXT -- JSON 문자열로 저장
            );
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                title TEXT,
                content TEXT,
                category TEXT,
                authorId TEXT,
                authorName TEXT,
                authorProfileImage TEXT,
                createdAt TEXT
            );
            CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY,
                postId TEXT,
                content TEXT,
                authorId TEXT,
                authorName TEXT,
                authorProfileImage TEXT,
                createdAt TEXT,
                FOREIGN KEY (postId) REFERENCES posts(id)
            );
            CREATE TABLE IF NOT EXISTS follows (
                id TEXT PRIMARY KEY,
                followerId TEXT,
                followingId TEXT,
                UNIQUE(followerId, followingId)
            );
            CREATE TABLE IF NOT EXISTS clubs (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE,
                description TEXT,
                creatorId TEXT,
                creatorName TEXT,
                createdAt TEXT
            );
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                title TEXT,
                content TEXT,
                price INTEGER,
                category TEXT,
                authorId TEXT,
                authorName TEXT,
                imageUrl TEXT,
                createdAt TEXT
            );
            CREATE TABLE IF NOT EXISTS chat_rooms (
                id TEXT PRIMARY KEY,
                productId TEXT,
                participants TEXT, -- JSON 문자열로 저장
                createdAt TEXT
            );
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT, -- 자동 증가 ID
                roomId TEXT,
                senderId TEXT,
                senderName TEXT,
                message TEXT,
                timestamp TEXT
            );
        `);
        console.log('SQLite 테이블 생성 또는 확인 완료.');

    } catch (error) {
        console.error('SQLite 데이터베이스 연결 또는 초기화 실패:', error.message);
        process.exit(1);
    }
};

// 데이터베이스 인스턴스를 반환하는 헬퍼 함수
export const getDb = () => db;

export default connectDB;