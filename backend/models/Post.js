import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    authorName: { type: String, required: true },
    authorProfileImage: { type: String, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

commentSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true }, // 작성자 이름 (표시용)
    // 💥💥💥 이 필드는 절대 삭제하면 안 됩니다! 💥💥💥
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User'  // 'User' 모델의 _id와 연결됨
    },
    category: { type: String, default: '기타' },
    image: { type: String, default: null },
    comments: [commentSchema]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

postSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Post = mongoose.model('Post', postSchema);

export default Post;