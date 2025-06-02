

const express = require('express');
    const cors = require('cors');
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    const fs = require('fs').promises;
    const path = require('path');

    const app = express();
    const PORT = 3001;
    const JWT_SECRET = 'your-secret-key'; 
    const USERS_FILE = path.join(__dirname, 'users.json');

    app.use(cors());
    app.use(express.json());

    async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
    }

    async function writeUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    }

    app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: '모든 필드를 입력해주세요.' 
        });
        }

        if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: '비밀번호는 6자 이상이어야 합니다.' 
        });
        }

        const users = await readUsers();
        const existingUser = users.find(user => 
        user.username === username || user.email === email
        );

        if (existingUser) {
        return res.status(400).json({ 
            success: false, 
            message: '이미 존재하는 사용자명 또는 이메일입니다.' 
        });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeUsers(users);

        const token = jwt.sign(
        { id: newUser.id, username: newUser.username, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '24h' }
        );

        res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다!',
        token,
        user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email
        }
        });

    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ 
        success: false, 
        message: '서버 오류가 발생했습니다.' 
        });
    }
    });

    // 로그인 API
    app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 입력값 검증
        if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: '아이디와 비밀번호를 입력해주세요.' 
        });
        }

        // 사용자 찾기
        const users = await readUsers();
        const user = users.find(u => u.username === username || u.email === username);

        if (!user) {
        return res.status(401).json({ 
            success: false, 
            message: '존재하지 않는 사용자입니다.' 
        });
        }

        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
        return res.status(401).json({ 
            success: false, 
            message: '비밀번호가 올바르지 않습니다.' 
        });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
        );

        res.json({
        success: true,
        message: '로그인 성공',
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email
        }
        });

    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ 
        success: false, 
        message: '서버 오류가 발생했습니다.' 
        });
    }
    });

    // JWT 토큰 검증 미들웨어
    const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
        success: false, 
        message: '액세스 토큰이 필요합니다.' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
        return res.status(403).json({ 
            success: false, 
            message: '유효하지 않은 토큰입니다.' 
        });
        }
        req.user = user;
        next();
    });
    };

    // 사용자 정보 조회 API (보호된 라우트 예시)
    app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const users = await readUsers();
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
        return res.status(404).json({ 
            success: false, 
            message: '사용자를 찾을 수 없습니다.' 
        });z
        }

        res.json({
        success: true,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
        }
        });
    } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        res.status(500).json({ 
        success: false, 
        message: '서버 오류가 발생했습니다.' 
        });
    }
    });

    // 서버 시작
    app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
    });

    
