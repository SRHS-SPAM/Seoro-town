import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
    // 💥 roomId와 senderId를 ObjectId 타입으로 변경하여 각 모델을 제대로 참조하도록 합니다.
    roomId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'ChatRoom' 
    },
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' 
    },
    senderName: { 
        type: String 
    },
    message: { 
        type: String, 
        required: true 
    },
    // 💥 timestamps 옵션을 사용하면 createdAt, updatedAt이 자동으로 생성되므로 수동 timestamp는 제거합니다.
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 가상 'id' 필드 추가
ChatMessageSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// 💥💥💥 빠져있던 모델 생성 코드를 추가합니다. 💥💥💥
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

export default ChatMessage;