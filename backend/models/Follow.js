// backend/models/Follow.js

import mongoose from 'mongoose';

const FollowSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // 팔로우 관계의 고유 ID (생성 시 Date.now().toString() 사용)
    followerId: { type: String, required: true, ref: 'User' }, // 팔로우하는 사용자 ID
    followingId: { type: String, required: true, ref: 'User' }  // 팔로우 당하는 사용자 ID
}, { _id: false });

// 팔로워-팔로잉 쌍이 중복되지 않도록 복합 인덱스 설정
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follow = mongoose.model('Follow', FollowSchema);
export default Follow;