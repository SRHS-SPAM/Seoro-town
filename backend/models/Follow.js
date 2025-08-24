import mongoose from 'mongoose';

const FollowSchema = new mongoose.Schema({
    // 💥 followerId와 followingId를 User 모델을 참조하는 ObjectId 타입으로 변경합니다.
    followerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' 
    },
    followingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' 
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 팔로워-팔로잉 쌍이 중복되지 않도록 복합 인덱스 설정 (이 부분은 아주 잘 되어 있습니다)
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// 가상 'id' 필드
FollowSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Follow = mongoose.model('Follow', FollowSchema);

export default Follow;