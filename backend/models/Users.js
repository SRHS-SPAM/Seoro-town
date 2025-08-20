// backend/models/User.js

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // 기존 JSON의 ID를 유지
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // 해시된 비밀번호 저장
    profileImage: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    schedule: { // 시간표 스키마 정의
        type: [[String]], // 2차원 문자열 배열
        default: [ // 프론트엔드의 defaultSchedule과 동일하게 설정
            ["", "월", "화", "수", "목", "금"],
            ["1", "", "", "", "", ""],
            ["2", "", "", "", "", ""],
            ["3", "", "", "", "", ""],
            ["4", "", "", "", "", ""],
            ["5", "", "", "", "", ""],
            ["6", "", "", "", "", ""],
            ["7", "", "", "", "", ""],
        ]
    }
}, { _id: false }); // MongoDB 기본 _id 대신 id 필드를 사용하도록 설정

const User = mongoose.model('User', UserSchema);
export default User;