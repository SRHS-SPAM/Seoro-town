import mongoose from 'mongoose';

const ChatRoomSchema = new mongoose.Schema({
    // id 필드 삭제
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // participants는 sellerId와 buyerId를 합친 배열
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

ChatRoomSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// 💥💥💥 빠져있던 이 라인을 추가하는 것이 핵심입니다! 💥💥💥
const ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);

export default ChatRoom;