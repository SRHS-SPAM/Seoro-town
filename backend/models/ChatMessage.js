// backend/models/ChatMessage.js

import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
    // ChatMessage는 고유한 _id가 필요 없으므로, MongoDB가 자동으로 생성하도록 둠
    // _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // MongoDB 자동 생성
    roomId: { type: String, required: true, ref: 'ChatRoom' }, // 채팅방 ID 참조
    senderId: { type: String, required: true, ref: 'User' },   // 발신자 User ID 참조
    senderName: { type: String }, // 발신자 이름 (스냅샷)
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}); 

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
export default ChatMessage;