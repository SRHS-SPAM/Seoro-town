// backend/models/ChatRoom.js

import mongoose from 'mongoose';

const ChatRoomSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // 채팅방 ID
    productId: { type: String, ref: 'Product' }, // 어떤 상품에 대한 채팅방인지
    productTitle: { type: String }, // 추가
    productImageUrl: { type: String }, // 추가
    participants: [
        {
            id: { type: String, required: true, ref: 'User' },
            username: { type: String, required: true },
            profileImage: { type: String, default: null }
        }
    ],
    createdAt: { type: Date, default: Date.now }
}, {});

const ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);
export default ChatRoom;