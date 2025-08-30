import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Verification from '../models/Verification.js';

const router = express.Router();

// --- Helper function to send 6-digit verification code --- //
async function sendVerificationCodeEmail(email, code) {
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Seoro-town" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '[Seoro-town] 회원가입 인증 코드 안내',
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                <h2>Seoro-town 회원가입 인증 코드</h2>
                <p>회원가입을 완료하려면 아래 인증 코드를 입력해주세요.</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f2f2f2; padding: 10px; border-radius: 5px;">
                    ${code}
                </p>
                <p>이 코드는 3분 동안 유효합니다.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification code email sent to ${email}`);
    } catch (error) {
        console.error('Error sending verification code email:', error);
        throw new Error('인증 코드 이메일 발송에 실패했습니다.');
    }
}

// --- 1. Request Verification Code --- //
router.post('/request-code', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
        const hashedCode = await bcrypt.hash(code, 10);

        // Upsert to handle resend requests gracefully
        await Verification.findOneAndUpdate(
            { email },
            { code: hashedCode },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await sendVerificationCodeEmail(email, code);

        res.status(200).json({ success: true, message: '인증 코드가 이메일로 발송되었습니다.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

// --- 2. Verify Code and get Registration Token --- //
router.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ success: false, message: '이메일과 인증 코드를 모두 입력해주세요.' });
        }

        const verificationDoc = await Verification.findOne({ email });
        if (!verificationDoc) {
            return res.status(400).json({ success: false, message: '인증 코드가 만료되었거나 요청된 적 없습니다. 다시 요청해주세요.' });
        }

        const isMatch = await bcrypt.compare(code, verificationDoc.code);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: '인증 코드가 올바르지 않습니다.' });
        }

        // Issue a short-lived token to proceed to the final registration step
        const registrationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });

        // Clean up the verification document
        await Verification.deleteOne({ email });

        res.status(200).json({ success: true, message: '이메일 인증이 완료되었습니다.', registrationToken });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});


// --- 3. Final Signup --- //
router.post('/signup', async (req, res) => {
    try {
        const { registrationToken, username, password } = req.body;
        if (!registrationToken || !username || !password) {
            return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ success: false, message: '회원가입 세션이 만료되었습니다. 이메일 인증부터 다시 진행해주세요.' });
        }

        const { email } = decoded;

        // Double-check user existence right before creation
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            const message = existingUser.email === email ? '이미 사용 중인 이메일입니다.' : '이미 사용 중인 사용자 이름입니다.';
            return res.status(400).json({ success: false, message });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            email,
            password: hashedPassword,
            username,
            isEmailVerified: true // Verified from the start
        });
        await newUser.save();

        res.status(201).json({ success: true, message: '회원가입이 성공적으로 완료되었습니다.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});


// --- Login Route (largely unchanged) --- //
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });

        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });

        // This check is kept as a safeguard, though new users will always be verified.
        if (!user.isEmailVerified) {
            return res.status(401).json({ 
                success: false, 
                message: '이메일 인증이 완료되지 않은 계정입니다. 관리자에게 문의하세요.' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
        
        const payload = { id: user._id, username: user.username, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ success: true, token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

export default router;
