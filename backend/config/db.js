// backend/config/db.js (MongoDB 연결 최종 버전)

import mongoose from 'mongoose';
import 'dotenv/config'; // .env 파일 로드

const connectDB = async () => {
    try {
        // docker-compose 내부에서 DB 서비스 이름은 'mongodb'
        // .env 파일의 MONGODB_URI 변수를 사용합니다.
        const mongoURI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/seorotown'; 
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true, // Deprecated in Mongoose 6.0, but still safe to use
            useUnifiedTopology: true, // Deprecated in Mongoose 6.0, but still safe to use
        });
        console.log('MongoDB 연결 성공!');
    } catch (error) {
        console.error('MongoDB 연결 실패:', error.message);
        process.exit(1); // 오류 발생 시 애플리케이션 종료
    }
};

export default connectDB;