# Seoro-town (서울로봇고등학교 커뮤니티)

`Seoro-town`은 서울로봇고등학교 학생 및 졸업생들을 위한 커뮤니티 웹사이트입니다. 게시판, 중고 장터, 실시간 채팅 등의 기능을 통해 교내 구성원 간의 소통과 정보 교류를 돕습니다.

## 🛠️ 기술 스택 (Tech Stack)

| 구분       | 기술                               |
| ---------- | ---------------------------------- |
| **Backend**  | Node.js, Express, Socket.io        |
| **Frontend** | React, React Router, Socket.io-client |
| **Database** | MongoDB (with Mongoose)            |
| **DevOps**   | Docker, Docker Compose             |

## 🚀 시작하기 (Getting Started)

이 프로젝트는 Docker를 사용하여 간편하게 실행할 수 있습니다.

1.  **프로젝트 클론**
    ```bash
    git clone https://github.com/SRHS-SPAM/Seoro-town.git
    cd Seoro-town
    ```

2.  **환경 변수 설정**
    `backend` 디렉토리의 `.env` 파일을 생성하고 아래와 같이 데이터베이스 및 이메일 서버 정보를 입력합니다.
    ```env
    # backend/.env
    MONGO_URI=mongodb://rootuser:rootpass@mongo:27017/seorotown?authSource=admin
    JWT_SECRET=your_jwt_secret_key
    PORT=3001

    # Nodemailer (Gmail)
    EMAIL_SERVICE=gmail
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_app_password
    ```

3.  **Docker Compose 실행**
    ```bash
    docker-compose up --build
    ```

4.  **애플리케이션 접속**
    *   프론트엔드: `http://localhost:3000`
    *   백엔드 API: `http://localhost:5000`

---

## ⚙️ 1. 백엔드 (Backend)

Express.js를 기반으로 REST API와 WebSocket 통신을 제공합니다.

### 주요 파일 및 기능

#### `server.js`
- **기능**: 백엔드 서버의 메인 진입점입니다.
- **로직**:
    1. `connectDB`를 통해 MongoDB 데이터베이스에 연결합니다.
    2. Express 앱을 생성하고 `cors`, `express.json` 등 필수 미들웨어를 설정합니다.
    3. `/uploads` 경로의 정적 파일을 제공합니다.
    4. 각 기능별로 모듈화된 라우트 (`auth`, `posts` 등)를 동적으로 불러와 API 엔드포인트를 설정합니다.
    5. `http` 서버에 `Socket.io`를 연결하여 실시간 채팅 서버를 초기화하고, `connection`, `sendMessage` 등의 이벤트를 처리합니다.
- **핵심 코드**:
    ```javascript
    // server.js - Socket.io 설정 및 이벤트 처리
    io.on('connection', (socket) => {
        console.log('✅ A user connected:', socket.id);

        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            console.log(`[JOIN] User ${socket.id} joined room ${roomId}`);
        });

        socket.on('sendMessage', async (messageData) => {
            try {
                const newMessage = await ChatMessage.create(messageData);
                io.to(messageData.roomId).emit('receiveMessage', newMessage);
            } catch (error) {
                console.error('Error saving or broadcasting message:', error);
            }
        });
        // ...
    });
    ```

#### `routes/auth.js`
- **기능**: 사용자 인증(회원가입, 로그인) 관련 API를 처리합니다.
- **로직**:
    1.  **이메일 인증 코드 요청** (`/request-code`): `nodemailer`를 사용해 사용자 이메일로 6자리 인증 코드를 발송합니다. 코드는 해시 처리되어 `Verification` 컬렉션에 저장됩니다.
    2.  **인증 코드 검증** (`/verify-code`): 사용자가 입력한 코드와 DB에 저장된 해시를 비교하여 유효성을 검증하고, 성공 시 다음 단계를 위한 임시 토큰(`registrationToken`)을 발급합니다.
    3.  **최종 회원가입** (`/signup`): 임시 토큰, 사용자 이름, 비밀번호를 받아 최종적으로 `User`를 생성합니다.
    4.  **로그인** (`/login`): 이메일/사용자 이름과 비밀번호를 검증하고, 성공 시 JWT(`token`)를 발급합니다.
- **핵심 코드**:
    ```javascript
    // routes/auth.js - 이메일 인증 코드 요청 및 발송
    router.post('/request-code', async (req, res) => {
        // ...
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = await bcrypt.hash(code, 10);

        await Verification.findOneAndUpdate({ email }, { code: hashedCode }, { upsert: true });
        await sendVerificationCodeEmail(email, code); // Nodemailer로 이메일 발송

        res.status(200).json({ success: true, message: '인증 코드가 이메일로 발송되었습니다.' });
    });
    ```

#### `routes/posts.js`
- **기능**: 게시판(CRUD) 관련 API를 처리합니다.
- **로직**:
    - `authenticateToken` 미들웨어를 통해 인증된 사용자만 게시글을 작성, 수정, 삭제할 수 있도록 보호합니다.
    - **GET `/`**: 모든 게시글을 최신순으로 조회합니다.
    - **POST `/`**: 새 게시글을 작성합니다.
    - **GET `/:id`**: 특정 게시글의 상세 내용을 조회합니다.
    - **POST `/:id/comments`**: 특정 게시글에 댓글을 추가합니다.
- **핵심 코드**:
    ```javascript
    // routes/posts.js - 댓글 작성 API
    router.post('/:id/comments', authenticateToken, async (req, res) => {
        try {
            const { content } = req.body;
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });

            post.comments.push({
                content,
                authorId: req.user._id,
                authorName: req.user.username,
                authorProfileImage: req.user.profileImage
            });
            await post.save();

            res.status(201).json({ success: true, message: '댓글이 작성되었습니다.' });
        } catch (error) {
            res.status(500).json({ success: false, message: '서버 오류' });
        }
    });
    ```

---

## 🎨 2. 프론트엔드 (Frontend)

React 기반의 SPA(Single Page Application)로, 사용자 인터페이스를 제공합니다.

### 주요 파일 및 기능

#### `App.js`
- **기능**: 프론트엔드 애플리케이션의 최상위 컴포넌트입니다.
- **로직**:
    1. `AuthProvider`로 전체 앱을 감싸 전역적으로 인증 상태를 관리할 수 있도록 합니다.
    2. `react-router-dom`의 `BrowserRouter`, `Routes`, `Route`를 사용하여 페이지 라우팅을 설정합니다.
    3. `Navbar`를 상단에 고정하고, URL 경로에 따라 해당 페이지 컴포넌트를 렌더링합니다.
    4. `react-hot-toast`의 `Toaster`를 설정하여 앱 전체에서 알림 메시지를 표시합니다.
- **핵심 코드**:
    ```jsx
    // App.js - 라우팅 설정
    function AppContent() {
      // ...
      return (
        <Router>
          <Toaster position="top-right" />
          <Navbar />
          <main className="main-content">
            <Routes>
                <Route path="/" element={<Boardpage />} />
                <Route path="/Login" element={<Login />} />
                <Route path="/chat/:roomId" element={<ChatRoomPage />} />
                {/* ... 다른 라우트들 ... */}
            </Routes>
          </main>
        </Router>
      );
    }

    function App() {
      return (
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      );
    }
    ```

#### `context/AuthContext.js`
- **기능**: React Context API를 사용하여 앱 전체의 인증 상태를 관리합니다.
- **로직**:
    1. `user` (사용자 정보), `token` 상태를 관리합니다.
    2. `useEffect`를 사용하여 앱이 처음 로드될 때 `localStorage`에 저장된 토큰을 확인하고, 유효한 경우 사용자 정보를 가져와 로그인 상태를 유지합니다.
    3. `login`, `logout` 함수를 제공하여 다른 컴포넌트에서 인증 상태를 변경할 수 있도록 합니다.
    4. `AuthProvider`를 통해 `children`으로 전달되는 모든 컴포넌트에 인증 관련 값과 함수를 제공합니다.
- **핵심 코드**:
    ```jsx
    // context/AuthContext.js - 로그인 상태 유지 로직
    export const AuthProvider = ({ children }) => {
        const [user, setUser] = useState(null);
        const [token, setToken] = useState(null);
        const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                // ... 저장된 토큰을 서버에 보내 유효성 검증 후 user 상태 업데이트
            } else {
                setIsLoading(false);
            }
        }, []);

        const login = (userData, userToken) => {
            localStorage.setItem('token', userToken);
            setToken(userToken);
            setUser(userData);
        };

        // ...
        return (
            <AuthContext.Provider value={authContextValue}>
                {children}
            </AuthContext.Provider>
        );
    };
    ```

---

## 🗃️ 3. 데이터베이스 (Database)

MongoDB를 사용하여 데이터를 저장하고 `Mongoose`를 통해 객체 모델링(ODM)을 합니다.

### 주요 모델 및 기능

#### `config/db.js`
- **기능**: MongoDB 데이터베이스 연결을 설정합니다.
- **로직**:
    - 환경 변수(`MONGO_URI`)에서 접속 정보를 가져와 `mongoose.connect`를 실행합니다.
    - 연결 성공 또는 실패 시 콘솔에 로그를 출력하고, 실패 시 프로세스를 종료하여 앱이 비정상적으로 실행되는 것을 방지합니다.
- **핵심 코드**:
    ```javascript
    // config/db.js
    const connectDB = async () => {
      try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
          console.error('Error: MONGO_URI is not defined...');
          process.exit(1);
        }
        const conn = await mongoose.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
    };
    ```

#### `models/`
- **기능**: 각 데이터 컬렉션의 스키마(Schema)와 모델(Model)을 정의합니다.
- **주요 모델**:
    - **`User.js`**: 사용자 정보 (이름, 이메일, 해시된 비밀번호 등)
    - **`Post.js`**: 게시글 정보 (제목, 내용, 작성자, 댓글 등)
    - **`Product.js`**: 중고 장터 상품 정보
    - **`ChatRoom.js`**: 채팅방 정보 (참여자 등)
    - **`ChatMessage.js`**: 채팅 메시지 정보 (내용, 보낸 사람, 채팅방 ID 등)
    - **`Verification.js`**: 이메일 인증 코드 정보

---