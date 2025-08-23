import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    userId: {
        type: String, // User 모델의 커스텀 'id' 필드와 연결
        required: true,
        ref: 'User' // User 모델을 참조합니다.
    },
    image: {
        type: String,
        default: null
    },
    comments: [
        {
            id: { type: String, required: true },
            content: { type: String, required: true },
            authorId: { type: String, required: true },
            authorName: { type: String, required: true },
            authorProfileImage: { type: String, default: null },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: true // 생성/수정 시간을 자동으로 기록해줍니다.
});

const Post = mongoose.model('Post', PostSchema);
export default Post;
