import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Production 환경이 아닐 때만 .env 파일을 사용합니다.
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const connectDB = async () => {
  try {
    // --- 진단용 로그 추가 시작 ---
    console.log(`[DEBUG] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[DEBUG] MONGO_URI (first 15 chars): ${process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 15) + '...' : 'undefined'}`);
    // --- 진단용 로그 추가 끝 ---

    // MongoDB Atlas 연결 문자열(MONGO_URI)을 환경 변수에서 가져옵니다.
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('Error: MONGO_URI is not defined in environment variables.');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // 연결 실패 시 프로세스 종료
  }
};

export default connectDB;
