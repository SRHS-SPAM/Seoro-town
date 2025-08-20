// backend/models/ChatRoom.js

import mongoose from 'mongoose';

const ChatRoomSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // 채팅방 ID (MarketDetail의 productId와 일치하거나 별도 생성)
    productId: { type: String, ref: 'Product' }, // 어떤 상품에 대한 채팅방인지 (선택 사항, Product ID 참조)
    participants: [{ type: String, required: true, ref: 'User' }], // 참여자 User ID 배열
    createdAt: { type: Date, default: Date.now }
}, { _id: false }); // _id 대신 id 필드 사용

const ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);
export default ChatRoom;