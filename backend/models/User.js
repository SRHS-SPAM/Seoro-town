import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, '사용자 이름은 필수 항목입니다.'], 
        unique: true,
        trim: true
    },
    // 💥💥💥 빠져있는 email 필드를 다시 추가해야 합니다! 💥💥💥
    email: { 
        type: String, 
        required: [true, '이메일은 필수 항목입니다.'], 
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String, 
        required: [true, '비밀번호는 필수 항목입니다.']
    },
    // 이 필드들도 필요하다면 주석을 해제하세요.
    profileImage: { 
        type: String, 
        default: null 
    },
    role: { 
        type: String, 
        default: 'user',
        enum: ['user', 'admin']
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    schedule: { 
        type: [[String]],
        default: [
            ["", "월", "화", "수", "목", "금"],
            ["1", "", "", "", "", ""],
            ["2", "", "", "", "", ""],
            ["3", "", "", "", "", ""],
            ["4", "", "", "", "", ""],
            ["5", "", "", "", "", ""],
            ["6", "", "", "", "", ""],
            ["7", "", "", "", "", ""],
        ]
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

UserSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// 💥 변수 이름이 `userSchema`에서 `UserSchema`로 변경되었습니다.
const User = mongoose.model('User', UserSchema); 
export default User;