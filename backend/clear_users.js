// backend/clear_users.js (임시 수정)

import mongoose from 'mongoose';
import User from './models/User.js';

const DB_USER = 'rootuser';
const DB_PASS = 'rootpass';
const DB_HOST = 'mongo';
const DB_NAME = 'seorotown';

const mongoURI = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:27017/${DB_NAME}?authSource=admin`;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const clearAllUsers = async () => {
    try {
        console.log('데이터베이스에 연결 중...');
        await connectDB();
        console.log('데이터베이스 연결 성공.');

        console.log('모든 사용자 정보 삭제를 시작합니다...');
        const result = await User.deleteMany({});
        console.log(`
[성공] 총 ${result.deletedCount}개의 사용자 계정을 삭제했습니다.
`);

    } catch (error) {
        console.error('\n사용자 정보 삭제 중 오류가 발생했습니다:', error);
    } finally {
        console.log('데이터베이스 연결을 종료합니다.');
        await mongoose.disconnect();
    }
};

clearAllUsers();