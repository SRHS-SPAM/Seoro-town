// backend/models/Post.js

import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
    id: { type: String, required: true }, // 댓글 ID
    content: { type: String, required: true },
    authorId: { type: String, required: true, ref: 'User' }, // 작성자 User ID 참조
    authorName: { type: String }, // User에서 가져온 이름 (저장 시점의 스냅샷)
    authorProfileImage: { type: String, default: null }, // User에서 가져온 프로필 이미지 (스냅샷)
    createdAt: { type: Date, default: Date.now }
}, { _id: false }); // 댓글은 MongoDB 기본 _id 대신 id 필드를 사용 (선택 사항)

const PostSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // 게시글 ID
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: '재학생' },
    authorId: { type: String, required: true, ref: 'User' }, // 작성자 User ID 참조
    authorName: { type: String }, // User에서 가져온 이름 (저장 시점의 스냅샷)
    authorProfileImage: { type: String, default: null }, // User에서 가져온 프로필 이미지 (스냅샷)
    createdAt: { type: Date, default: Date.now },
    comments: [CommentSchema] // 댓글은 Post 문서 내부에 내장된 배열
}, { _id: false }); // 게시글은 MongoDB 기본 _id 대신 id 필드를 사용 (권장)

const Post = mongoose.model('Post', PostSchema);
export default Post;