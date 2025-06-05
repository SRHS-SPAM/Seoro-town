const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your-secret-key-change-this-in-production';

const USERS_FILE = path.join(__dirname, 'users.json');
const POSTS_FILE = path.join(__dirname, 'boardlist.json');

class SeoulRobotMealScraper {
    constructor() {
        this.baseUrl = "https://srobot.sen.hs.kr";
        this.mealApiUrl = "https://srobot.sen.hs.kr/dggb/module/mlsv/selectMlsvDetailPopup.do";
        this.mlsvId = "2904363";
        this.siteId = "SEL_00001254";
    }

    async getMealData(targetDate = null) {
        if (!targetDate) {
            targetDate = new Date();
        } else {
            targetDate = new Date(targetDate);
        }

        // YYYYMMDD 형식으로 변환
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        const formData = new URLSearchParams({
            'firstRegisterId': '',
            'lastUpdusrId': '',
            'mlsvId': this.mlsvId,
            'siteId': this.siteId,
            'schYmd': dateStr
        });

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://srobot.sen.hs.kr',
            'Referer': 'https://srobot.sen.hs.kr/67183/subMenu.do',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1'
        };

        try {
            console.log(`급식 데이터 요청: ${dateStr}`);
            
            // 메인 페이지 먼저 접근하여 세션 확보
            await axios.get(this.baseUrl + '/67183/subMenu.do', { 
                headers: {
                    ...headers,
                    'Content-Type': undefined
                },
                timeout: 15000
            });

            // 급식 데이터 POST 요청
            const response = await axios.post(this.mealApiUrl, formData, {
                headers,
                timeout: 15000
            });

            if (response.status === 200) {
                console.log('받은 HTML 내용:', response.data.substring(0, 500)); // 디버깅용
                return this.parseMealData(response.data, targetDate);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('급식 데이터 요청 오류:', error.message);
            return null;
        }
    }

    parseMealData(htmlContent, targetDate) {
        const $ = cheerio.load(htmlContent);
        
        const mealData = {
            breakfast: [],
            lunch: [],
            dinner: []
        };

        try {
            console.log('HTML 파싱 시작...');
            
            // 전체 HTML 구조 확인을 위한 로그
            console.log('전체 테이블 구조:', $('table').length);
            console.log('td.ta_l 요소 개수:', $('td.ta_l').length);
            
            // 다양한 셀렉터로 급식 데이터 찾기
            let mealFound = false;
            
            // 방법 1: 테이블에서 급식 관련 텍스트 찾기
            $('table tr').each((rowIndex, row) => {
                const rowText = $(row).text().trim();
                
                // 날짜 정보가 포함된 행은 스킵
                if (rowText.match(/\d{4}년.*\d{1,2}월.*\d{1,2}일/)) {
                    console.log('날짜 행 스킵:', rowText);
                    return;
                }
                
                // 급식 메뉴가 있는 셀 찾기
                $(row).find('td').each((cellIndex, cell) => {
                    const cellText = $(cell).text().trim();
                    
                    // 날짜나 빈 셀 스킵
                    if (!cellText || 
                        cellText.match(/\d{4}년/) || 
                        cellText.match(/^\d+(\.\d+)?\s*kcal$/)) {
                        return;
                    }
                    
                    // 급식 메뉴로 보이는 텍스트 처리
                    if (cellText.length > 10 && 
                        (cellText.includes('밥') || cellText.includes('국') || 
                         cellText.includes('김치') || cellText.includes('반찬'))) {
                        
                        console.log(`급식 데이터 발견 (행 ${rowIndex}, 셀 ${cellIndex}):`, cellText);
                        
                        const menuItems = this.cleanMenuText(cellText);
                        
                        // 셀 위치나 내용에 따라 시간대 분류
                        if (cellIndex === 0 || cellText.includes('조식') || cellText.includes('아침')) {
                            mealData.breakfast.push(...menuItems);
                        } else if (cellIndex === 1 || cellText.includes('중식') || cellText.includes('점심')) {
                            mealData.lunch.push(...menuItems);
                        } else if (cellIndex === 2 || cellText.includes('석식') || cellText.includes('저녁')) {
                            mealData.dinner.push(...menuItems);
                        } else {
                            // 기본적으로 중식으로 분류
                            mealData.lunch.push(...menuItems);
                        }
                        
                        mealFound = true;
                    }
                });
            });
            
            // 방법 2: 기존 방식으로 다시 시도 (더 세밀한 필터링)
            if (!mealFound) {
                console.log('방법 2: td.ta_l 셀렉터로 재시도');
                
                const mealCells = $('td.ta_l');
                console.log('찾은 셀 개수:', mealCells.length);
                
                mealCells.each((index, element) => {
                    const text = $(element).text().trim();
                    console.log(`셀 ${index}:`, text.substring(0, 100));
                    
                    // 날짜 정보 필터링 강화
                    if (!text || 
                        text.match(/^\d+(\.\d+)?\s*kcal$/) ||
                        text.match(/\d{4}년.*\d{1,2}월.*\d{1,2}일/) ||
                        text.split(' ').length <= 4) { // 단어가 4개 이하면 스킵
                        console.log(`셀 ${index} 스킵됨: 날짜 또는 짧은 텍스트`);
                        return;
                    }
                    
                    // 급식 메뉴로 보이는 텍스트만 처리
                    const menuItems = this.cleanMenuText(text);
                    
                    if (menuItems.length > 0) {
                        console.log(`셀 ${index}에서 메뉴 추출:`, menuItems);
                        
                        // 인덱스에 따른 분류
                        if (index === 0) {
                            mealData.lunch.push(...menuItems);
                        } else if (index === 1) {
                            mealData.dinner.push(...menuItems);
                        } else if (index === 2) {
                            mealData.breakfast.push(...menuItems);
                        }
                        
                        mealFound = true;
                    }
                });
            }
            
            // 방법 3: 전체 텍스트에서 패턴 매칭
            if (!mealFound) {
                console.log('방법 3: 전체 텍스트 패턴 매칭');
                const allText = $('body').text();
                this.extractMealFromText(allText, mealData);
            }

        } catch (parseError) {
            console.error('급식 데이터 파싱 오류:', parseError);
        }

        // 중복 제거 및 정리
        mealData.breakfast = [...new Set(mealData.breakfast)].filter(item => item.length > 0);
        mealData.lunch = [...new Set(mealData.lunch)].filter(item => item.length > 0);
        mealData.dinner = [...new Set(mealData.dinner)].filter(item => item.length > 0);

        console.log('최종 급식 데이터:', mealData);
        return mealData;
    }

    // 텍스트에서 조식, 중식, 석식 구분하여 추출
    extractMealFromText(text, mealData) {
        // 조식, 중식, 석식으로 구분되어 있는 경우
        const sections = text.split(/(?=조식|아침|중식|점심|석식|저녁)/);
        
        sections.forEach(section => {
            const cleanSection = section.trim();
            if (!cleanSection || cleanSection.length < 10) return;
            
            if (cleanSection.startsWith('조식') || cleanSection.startsWith('아침')) {
                const items = this.cleanMenuText(cleanSection.replace(/^(조식|아침)[:\s]*/, ''));
                mealData.breakfast.push(...items);
            } else if (cleanSection.startsWith('중식') || cleanSection.startsWith('점심')) {
                const items = this.cleanMenuText(cleanSection.replace(/^(중식|점심)[:\s]*/, ''));
                mealData.lunch.push(...items);
            } else if (cleanSection.startsWith('석식') || cleanSection.startsWith('저녁')) {
                const items = this.cleanMenuText(cleanSection.replace(/^(석식|저녁)[:\s]*/, ''));
                mealData.dinner.push(...items);
            }
        });
    }

    cleanMenuText(text) {
        if (!text) return [];
        
        console.log('텍스트 정리 전:', text.substring(0, 200));
        
        const cleaned = text
            .replace(/<[^>]*>/g, '') // HTML 태그 제거
            .replace(/\([^)]*\)/g, '') // 괄호 안 내용 제거 (알레르기 정보)
            .replace(/\d+\.\d+\.\d+\.\d+/g, '') // 알레르기 번호 제거 (예: 6.6.18)
            .replace(/\d{4}년\s*\d{1,2}월\s*\d{1,2}일\s*[가-힣]요일/g, '') // 날짜 제거
            .split(/[\n\r,·\s]+/) // 구분자로 분리
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .filter(item => !item.match(/^\d+$/)) // 숫자만 있는 항목 제거
            .filter(item => !item.match(/^\d+\.\d+$/)) // 소수점 숫자 제거
            .filter(item => !item.match(/^\(\d+.*\)$/)) // (숫자) 형태 제거
            .filter(item => !item.match(/^\d{4}년$/)) // 연도 제거
            .filter(item => !item.match(/^\d{1,2}월$/)) // 월 제거
            .filter(item => !item.match(/^\d{1,2}일$/)) // 일 제거
            .filter(item => !item.match(/^[가-힣]요일$/)) // 요일 제거
            .map(item => item.replace(/^\d+\.\s*/, '').trim()) // 앞의 숫자. 제거
            .filter(item => item.length > 1 && !item.match(/^[가-힣]{1}$/)) // 한 글자 제거
            .filter(item => !item.match(/^(조식|중식|석식|아침|점심|저녁)$/)); // 식사 구분자 제거
        
        console.log('텍스트 정리 후:', cleaned);
        return cleaned;
    }
}

// 급식 스크래퍼 인스턴스 생성
const mealScraper = new SeoulRobotMealScraper();

// 급식 데이터 캐시
let cachedMealData = null;
let cacheDate = null;
let lastFetchTime = null;

// 급식 데이터 업데이트 함수
async function updateMealData() {
    try {
        const today = new Date();
        console.log('급식 데이터 업데이트 시작...');
        
        const mealData = await mealScraper.getMealData(today);
        
        if (mealData) {
            cachedMealData = mealData;
            cacheDate = today.toISOString().slice(0, 10);
            lastFetchTime = new Date();
            console.log(`급식 데이터 업데이트 완료: ${cacheDate}`);
            console.log('업데이트된 데이터:', {
                breakfast: mealData.breakfast.length,
                lunch: mealData.lunch.length,
                dinner: mealData.dinner.length
            });
        } else {
            console.log('급식 데이터 업데이트 실패');
        }
    } catch (error) {
        console.error('급식 데이터 업데이트 오류:', error);
    }
}

// 초기 급식 데이터 로드
async function initializeMealData() {
    try {
        console.log('초기 급식 데이터 로드 시작...');
        await updateMealData();
    } catch (error) {
        console.error('초기 급식 데이터 로드 오류:', error);
    }
}

// 스케줄러 설정
// 매일 오전 6시, 오후 12시, 오후 6시에 업데이트
cron.schedule('0 6,12,18 * * *', () => {
    console.log('스케줄러: 급식 데이터 업데이트 실행');
    updateMealData();
}, {
    timezone: "Asia/Seoul"
});

// 서버 시작 시 초기 데이터 로드
initializeMealData();

// 급식 API 라우트
app.get('/api/meal', async (req, res) => {
    // 캐시 방지 헤더 설정
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
    });
    
    try {
        const today = new Date().toISOString().slice(0, 10);
        const now = new Date();
        
        // 캐시 유효성 검사 (30분 이내)
        const cacheValid = cachedMealData && 
                          cacheDate === today && 
                          lastFetchTime && 
                          (now - lastFetchTime) < 30 * 60 * 1000;

        if (cacheValid) {
            console.log('캐시된 급식 데이터 반환');
            
            const hasData = cachedMealData.breakfast.length > 0 || 
                           cachedMealData.lunch.length > 0 || 
                           cachedMealData.dinner.length > 0;
            
            res.json({
                success: true,
                meal: cachedMealData,
                date: today,
                cached: true,
                hasData: hasData,
                lastUpdated: lastFetchTime.toISOString()
            });
        } else {
            console.log('새로운 급식 데이터 요청');
            
            const mealData = await mealScraper.getMealData();
            
            if (mealData) {
                cachedMealData = mealData;
                cacheDate = today;
                lastFetchTime = now;
                
                const hasData = mealData.breakfast.length > 0 || 
                               mealData.lunch.length > 0 || 
                               mealData.dinner.length > 0;
                
                res.json({
                    success: true,
                    meal: mealData,
                    date: today,
                    cached: false,
                    hasData: hasData,
                    lastUpdated: lastFetchTime.toISOString()
                });
            } else {
                res.json({
                    success: false,
                    message: "급식 정보를 불러올 수 없습니다. 학교 사이트에 문제가 있거나 급식이 없는 날일 수 있습니다.",
                    meal: {
                        breakfast: [],
                        lunch: [],
                        dinner: []
                    },
                    date: today
                });
            }
        }
    } catch (error) {
        console.error('급식 API 오류:', error);
        res.status(500).json({
            success: false,
            message: "서버 오류가 발생했습니다.",
            meal: {
                breakfast: [],
                lunch: [],
                dinner: []
            }
        });
    }
});

// 디버깅용 API 추가
app.get('/api/meal/debug', async (req, res) => {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        const formData = new URLSearchParams({
            'firstRegisterId': '',
            'lastUpdusrId': '',
            'mlsvId': mealScraper.mlsvId,
            'siteId': mealScraper.siteId,
            'schYmd': dateStr
        });

        const response = await axios.post(mealScraper.mealApiUrl, formData, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://srobot.sen.hs.kr',
                'Referer': 'https://srobot.sen.hs.kr/67183/subMenu.do'
            },
            timeout: 15000
        });

        res.json({
            success: true,
            htmlContent: response.data,
            requestDate: dateStr
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 특정 날짜 급식 조회 API
app.get('/api/meal/:date', async (req, res) => {
    try {
        const targetDate = new Date(req.params.date);
        
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)"
            });
        }

        const mealData = await mealScraper.getMealData(targetDate);
        
        if (mealData) {
            const hasData = mealData.breakfast.length > 0 || 
                mealData.lunch.length > 0 || 
                mealData.dinner.length > 0;
            
            res.json({
                success: true,
                meal: mealData,
                date: req.params.date,
                hasData: hasData
            });
        } else {
            res.json({
                success: false,
                message: "해당 날짜의 급식 정보를 불러올 수 없습니다.",
                meal: {
                    breakfast: [],
                    lunch: [],
                    dinner: []
                },
                date: req.params.date
            });
        }
    } catch (error) {
        console.error('특정 날짜 급식 API 오류:', error);
        res.status(500).json({
            success: false,
            message: "서버 오류가 발생했습니다."
        });
    }
});

// 수동 업데이트 API
app.post('/api/meal/update', async (req, res) => {
    try {
        await updateMealData();
        res.json({
            success: true,
            message: "급식 데이터가 업데이트되었습니다.",
            cacheDate: cacheDate,
            lastUpdated: lastFetchTime?.toISOString()
        });
    } catch (error) {
        console.error('수동 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: "업데이트 중 오류가 발생했습니다."
        });
    }
    
    
});


module.exports = { mealScraper, updateMealData, initializeMealData };

// CORS 설정
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', req.body);
    }
    next();
});

const readUsers = async () => {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('users.json 파일이 없어서 새로 생성합니다.');
        return [];
    }
};

const writeUsers = async (users) => {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('사용자 데이터 저장 오류:', error);
        throw error;
    }
};

const readPosts = async () => {
    try {
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('boardlist.json 파일이 없어서 새로 생성합니다.');
        const emptyPosts = [];
        await writePosts(emptyPosts);
        return emptyPosts;
    }
};

const writePosts = async (posts) => {
    try {
        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
        console.log('게시글 데이터 저장 완료');
    } catch (error) {
        console.error('게시글 데이터 저장 오류:', error);
        throw error;
    }
};

// 관리자 권한 확인 헬퍼 함수
const isAdmin = (user) => {
    return user?.username === '관리자' || user?.email === 'DBADMIN@dba.com';
};

// 인증 미들웨어
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('Auth header:', authHeader);
    console.log('Extracted token:', token);
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: '액세스 토큰이 필요합니다.' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('토큰 검증 오류:', err);
            return res.status(403).json({ 
                success: false, 
                message: '유효하지 않은 토큰입니다.' 
            });
        }
        console.log('토큰 검증 성공:', user);
        req.user = user;
        next();
    });
};

// 서버 상태 확인
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: '서버가 정상적으로 작동중입니다.',
        timestamp: new Date().toISOString()
    });
});

// 회원가입
app.post('/api/signup', async (req, res) => {
    try {
        console.log('회원가입 요청:', req.body);
        
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
        
        if (users.find(user => user.username === username || user.email === email)) {
            return res.status(400).json({ 
                success: false, 
                message: '이미 존재하는 사용자명 또는 이메일입니다.' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
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

        console.log('회원가입 성공:', username);

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

// 로그인
app.post('/api/login', async (req, res) => {
    try {
        console.log('로그인 요청:', req.body);
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: '아이디와 비밀번호를 입력해주세요.' 
            });
        }

        const users = await readUsers();
        console.log(`총 ${users.length}명의 사용자가 등록되어 있습니다.`);
        
        const user = users.find(u => u.username === username || u.email === username);
        
        if (!user) {
            console.log('사용자를 찾을 수 없음:', username);
            return res.status(401).json({ 
                success: false, 
                message: '아이디 또는 비밀번호가 올바르지 않습니다.' 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            console.log('비밀번호 불일치:', username);
            return res.status(401).json({ 
                success: false, 
                message: '아이디 또는 비밀번호가 올바르지 않습니다.' 
            });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('로그인 성공:', username, isAdmin(user) ? '(관리자)' : '(일반 사용자)');

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

// 사용자 정보 조회
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const users = await readUsers();
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: '사용자를 찾을 수 없습니다.' 
            });
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

// 게시글 목록 조회
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await readPosts();
        console.log('불러온 게시글:', posts.length, '개');
        res.json({
            success: true,
            posts: posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error('게시글 목록 조회 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 게시글 작성
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        console.log('게시글 작성 요청:', req.body);
        console.log('요청 사용자:', req.user, isAdmin(req.user) ? '(관리자)' : '(일반 사용자)');
        
        const { title, content, category } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ 
                success: false, 
                message: '제목과 내용을 입력해주세요.' 
            });
        }

        // 카테고리 기본값 설정
        const postCategory = category || '재학생';

        const posts = await readPosts();
        const newPost = {
            id: Date.now().toString(),
            title: title.trim(),
            content: content.trim(),
            category: postCategory,
            authorId: req.user.id,
            authorName: req.user.username,
            createdAt: new Date().toISOString(),
            comments: []
        };

        posts.push(newPost);
        await writePosts(posts);

        console.log('새 게시글 작성 완료:', {
            title: newPost.title,
            category: newPost.category,
            author: req.user.username,
            id: newPost.id,
            isAdmin: isAdmin(req.user)
        });

        res.status(201).json({
            success: true,
            message: '게시글이 작성되었습니다.',
            post: newPost
        });

    } catch (error) {
        console.error('게시글 작성 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 특정 게시글 조회
app.get('/api/posts/:id', async (req, res) => {
    try {
        const posts = await readPosts();
        const post = posts.find(p => p.id === req.params.id);
        
        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: '게시글을 찾을 수 없습니다.' 
            });
        }

        res.json({ 
            success: true, 
            post: post 
        });
    } catch (error) {
        console.error('게시글 조회 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 게시글 삭제 - 관리자 권한 추가
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        console.log('=== 게시글 삭제 요청 시작 ===');
        console.log('요청된 게시글 ID:', req.params.id, '(타입:', typeof req.params.id, ')');
        console.log('요청 사용자:', req.user);
        console.log('관리자 여부:', isAdmin(req.user));
    
        const posts = await readPosts();
        console.log('boardlist.json에서 불러온 게시글 수:', posts.length);
    
        const requestedId = req.params.id;
        let postIndex = -1;

        postIndex = posts.findIndex(p => {
            if (p.id.toString() === requestedId.toString()) return true;
            if (Number(p.id) === Number(requestedId)) return true;
            if (p.id === requestedId) return true;
            return false;
        });
        
        console.log('찾는 ID:', requestedId, '(타입:', typeof requestedId, ')');
        console.log('찾은 게시글 인덱스:', postIndex);

        console.log('저장된 게시글 ID들:');
        posts.forEach((p, index) => {
            console.log(`  ${index}: ID=${p.id} (${typeof p.id}), 제목=${p.title}, 작성자=${p.authorName || p.author}`);
        });

        if (postIndex === -1) {
            console.log('❌ 게시글을 찾을 수 없음');
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }
        
        const post = posts[postIndex];
        console.log('✅ 찾은 게시글:', {
            id: post.id,
            title: post.title,
            authorId: post.authorId,
            authorName: post.authorName,
            author: post.author
        });

        // 관리자는 모든 게시글 삭제 가능, 일반 사용자는 본인 게시글만 삭제 가능
        const userIsAdmin = isAdmin(req.user);
        const isAuthor = 
            (post.authorId && req.user.id && post.authorId === req.user.id) ||
            (post.authorName && req.user.username && post.authorName === req.user.username) ||
            (post.author && req.user.username && post.author === req.user.username) ||
            (post.authorName && req.user.name && post.authorName === req.user.name) ||
            (post.author && req.user.name && post.author === req.user.name);
    
        console.log('권한 확인:', {
            postAuthorId: post.authorId,
            postAuthorName: post.authorName,
            postAuthor: post.author,
            requestUserId: req.user.id,
            requestUserName: req.user.username,
            requestUserDisplayName: req.user.name,
            isAuthor: isAuthor,
            userIsAdmin: userIsAdmin,
            canDelete: userIsAdmin || isAuthor
        });
        
        // 관리자이거나 작성자인 경우에만 삭제 허용
        if (!userIsAdmin && !isAuthor) {
            console.log('❌ 권한 없음 - 삭제 거부');
            return res.status(403).json({
                success: false,
                message: '본인이 작성한 게시글만 삭제할 수 있습니다.'
            });
        }
        
        // 게시글 삭제
        const deletedPost = posts.splice(postIndex, 1)[0];
        await writePosts(posts);
        
        console.log('✅ 게시글 삭제 완료:', {
            id: deletedPost.id,
            title: deletedPost.title,
            author: deletedPost.authorName || deletedPost.author,
            deletedBy: req.user.username,
            deletedByAdmin: userIsAdmin
        });
        console.log('남은 게시글 수:', posts.length);
        console.log('=== 게시글 삭제 요청 완료 ===');
        
        res.json({
            success: true,
            message: userIsAdmin && !isAuthor ? 
                '관리자 권한으로 게시글이 삭제되었습니다.' : 
                '게시글이 삭제되었습니다.'
        });
        
    } catch (error) {
        console.error('❌ 게시글 삭제 오류:', error);
        console.error('오류 스택:', error.stack);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 댓글 작성
app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
    try {
        console.log('댓글 작성 요청:', {
            postId: req.params.id,
            user: req.user.username,
            isAdmin: isAdmin(req.user),
            content: req.body.content?.substring(0, 50) + '...'
        });

        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ 
                success: false, 
                message: '댓글 내용을 입력해주세요.' 
            });
        }

        const posts = await readPosts();
        const postIndex = posts.findIndex(p => p.id === req.params.id);
        
        if (postIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: '게시글을 찾을 수 없습니다.' 
            });
        }

        const newComment = {
            id: Date.now().toString(),
            content,
            authorId: req.user.id,
            authorName: req.user.username,
            createdAt: new Date().toISOString()
        };

        posts[postIndex].comments.push(newComment);
        await writePosts(posts);

        console.log('새 댓글 작성 완료:', {
            content: content.substring(0, 30) + '...',
            author: req.user.username,
            isAdmin: isAdmin(req.user),
            postTitle: posts[postIndex].title
        });

        res.status(201).json({
            success: true,
            message: '댓글이 작성되었습니다.',
            comment: newComment
        });

    } catch (error) {
        console.error('댓글 작성 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 댓글 조회
app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const posts = await readPosts();
        const post = posts.find(p => p.id === req.params.id);
        
        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: '게시글을 찾을 수 없습니다.' 
            });
        }

        res.json({ 
            success: true, 
            comments: post.comments || [] 
        });
    } catch (error) {
        console.error('댓글 조회 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

// 관리자 전용 - 모든 사용자 목록 조회
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: '관리자만 접근할 수 있습니다.'
            });
        }

        const users = await readUsers();
        const safeUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
        }));

        console.log('관리자가 사용자 목록 조회:', req.user.username);

        res.json({
            success: true,
            users: safeUsers
        });
    } catch (error) {
        console.error('사용자 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 관리자 전용 - 사용자 삭제
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: '관리자만 접근할 수 있습니다.'
            });
        }

        const users = await readUsers();
        const userIndex = users.findIndex(u => u.id === req.params.id);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // 관리자 자신은 삭제할 수 없음
        if (users[userIndex].id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: '자신의 계정은 삭제할 수 없습니다.'
            });
        }

        const deletedUser = users.splice(userIndex, 1)[0];
        await writeUsers(users);

        console.log('관리자가 사용자 삭제:', {
            admin: req.user.username,
            deletedUser: deletedUser.username
        });

        res.json({
            success: true,
            message: '사용자가 삭제되었습니다.'
        });
    } catch (error) {
        console.error('사용자 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '요청한 API를 찾을 수 없습니다.'
    });
});

app.use((error, req, res, next) => {
    console.error('서버 에러:', error);
    res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.'
    });
});

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
    console.log(`API 엔드포인트:`);
    console.log(`   - POST /api/signup - 회원가입`);
    console.log(`   - POST /api/login - 로그인`);
    console.log(`   - GET  /api/user - 사용자 정보`);
    console.log(`   - GET  /api/posts - 게시글 목록`);
    console.log(`   - POST /api/posts - 게시글 작성`);
    console.log(`   - GET  /api/posts/:id - 게시글 조회`);
    console.log(`   - DELETE /api/posts/:id - 게시글 삭제`);
    console.log(`   - POST /api/posts/:id/comments - 댓글 작성`);
    console.log(`   - GET  /api/posts/:id/comments - 댓글 조회`);
    console.log(`   - GET  /api/admin/users - 관리자: 사용자 목록`);
    console.log(`   - DELETE /api/admin/users/:id - 관리자: 사용자 삭제`);
    console.log(`   - GET  /api/health - 서버 상태 확인`);
});

process.on('SIGINT', () => {
    console.log('\n👋 서버를 종료합니다...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 서버를 종료합니다...');
    process.exit(0);
});