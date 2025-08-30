import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const router = express.Router();

//--- Helper function to send verification email ---//
async function sendVerificationEmail(user, req) {
    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // IMPORTANT: You must configure these environment variables in Render.
    // For Gmail, you might need to create an "App Password".
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail', 'sendgrid'
        auth: {
            user: process.env.EMAIL_USER, // Your email address
            pass: process.env.EMAIL_PASS, // Your email password or app password
        },
    });

    const verificationLink = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${token}`;
    
    const mailOptions = {
        from: `"Seoro-town" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Seoro-town 계정 인증을 완료해주세요.',
        html: `
            <p>안녕하세요, ${user.username}님!</p>
            <p>Seoro-town에 가입해주셔서 감사합니다. 아래 버튼을 클릭하여 이메일 주소를 인증해주세요.</p>
            <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block;">
                이메일 인증하기
            </a>
            <p>이 링크는 1시간 동안 유효합니다.</p>
            <p>만약 직접 가입하지 않으셨다면 이 이메일을 무시하셔도 좋습니다.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
        // In a real app, you might want to handle this more gracefully
    }
}


router.post('/signup', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });

        let existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            // If user exists but is not verified, we can resend the verification email.
            if (!existingUser.isEmailVerified && existingUser.email === email) {
                await sendVerificationEmail(existingUser, req);
                return res.status(200).json({ 
                    success: true, 
                    message: '이미 가입된 이메일입니다. 인증 이메일을 다시 전송했습니다. 이메일함을 확인해주세요.' 
                });
            }
            const message = existingUser.email === email ? '이미 사용 중인 이메일입니다.' : '이미 사용 중인 사용자 이름입니다.';
            return res.status(400).json({ success: false, message });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            email,
            password: hashedPassword,
            username
        });
        await newUser.save();

        // Send verification email
        await sendVerificationEmail(newUser, req);

        res.status(201).json({ 
            success: true, 
            message: '회원가입이 완료되었습니다. 이메일 인증을 위해 이메일함을 확인해주세요.' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

//--- New route for email verification ---//
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() },
        });

        if (!user) {
            // This link is invalid or has expired.
            // Redirect to a frontend page explaining the failure.
            // IMPORTANT: You must create this page in your frontend application.
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/email-verification?success=false`);
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        // Redirect to a frontend page explaining the success.
        // IMPORTANT: You must create this page in your frontend application.
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/email-verification?success=true`);

    } catch (error) {
        console.error(error);
        // Redirect to a failure page on error
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/email-verification?success=false`);
    }
});


router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });

        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });

        //--- Check if email is verified ---//
        if (!user.isEmailVerified) {
            return res.status(401).json({ 
                success: false, 
                message: '이메일 인증이 필요합니다. 이메일함을 확인해주세요.' 
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