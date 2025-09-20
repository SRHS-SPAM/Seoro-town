# Seoro-town (서울로봇고등학교 커뮤니티)

`Seoro-town`은 서울로봇고등학교 학생 및 졸업생들을 위한 커뮤니티 웹사이트입니다. 게시판, 중고 장터, 실시간 채팅 등의 기능을 통해 교내 구성원 간의 소통과 정보 교류를 돕습니다.

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 |
| :--- | :--- |
| **Backend** | Node.js, Express, Socket.io |
| **Frontend** | React, React Router, Socket.io-client |
| **Database** | MongoDB (with Mongoose) |
| **Deployment** | Docker, Docker Compose, Render |
| **Services** | **Cloudinary** (Image Storage), **SendGrid** (Email Delivery) |

## 🚀 시작하기 (Getting Started)

이 프로젝트는 Docker를 사용하여 로컬 환경에서 간편하게 실행하거나, Render를 통해 클라우드에 배포할 수 있습니다.

### 1. 로컬 환경에서 실행 (Docker)

1.  **프로젝트 클론**
    ```bash
    git clone https://github.com/SRHS-SPAM/Seoro-town.git
    cd Seoro-town
    ```

2.  **환경 변수 설정**
    `backend` 디렉토리에 `.env` 파일을 생성하고 아래 내용을 자신의 환경에 맞게 수정합니다.

    ```env
    # backend/.env

    # MongoDB (Docker Compose)
    MONGO_URI=mongodb://rootuser:rootpass@mongo:27017/seorotown?authSource=admin
    JWT_SECRET=your_super_secret_jwt_key
    PORT=3001

    # Image Storage (Cloudinary)
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret

    # Email Delivery (SendGrid)
    SENDGRID_API_KEY=your_sendgrid_api_key
    SENDGRID_VERIFIED_SENDER=your_verified_sender_email@example.com
    ```

3.  **Docker Compose 실행**
    ```bash
    docker-compose up --build
    ```

4.  **애플리케이션 접속**
    *   프론트엔드: `https://seoro-town.onrender.com`
    *   백엔드 API: `https://seoro-town-backend.onrender.com`

### 2. 클라우드 배포 (Render)

이 프로젝트는 Render.com의 무료 플랜을 사용하여 백엔드와 프론트엔드를 배포하도록 구성되었습니다.

1.  **GitHub 저장소 Fork**: 이 프로젝트를 자신의 GitHub 계정으로 Fork합니다.
2.  **Render에서 서비스 생성**:
    *   **Backend**: Node.js 환경으로 서비스를 생성하고, `backend` 디렉토리를 Root Directory로 지정합니다.
    *   **Frontend**: Static Site 환경으로 서비스를 생성하고, `my-app` 디렉토리를 Root Directory로 지정합니다.
3.  **환경 변수 설정**: Render 백엔드 서비스의 **Environment** 탭에서 위 `2. 환경 변수 설정`에 명시된 모든 변수들을 추가합니다. (`MONGO_URI`는 Render의 MongoDB 애드온을 사용하거나 외부 DB 주소를 입력합니다.)

---

## ✨ 주요 변경 및 개선사항 (Key Changes & Improvements)

### 1. 영구적인 파일 저장을 위한 Cloudinary 도입
- **문제점**: Render의 무료 플랜은 서버가 일정 시간 유휴 상태일 때 잠자기 모드로 전환되며, 이때 로컬 파일 시스템이 초기화되어 사용자가 업로드한 이미지가 모두 사라지는 문제가 있었습니다.
- **해결책**: `multer-disk-storage`를 사용해 서버에 직접 파일을 저장하던 방식에서, `multer-storage-cloudinary`를 사용하도록 변경했습니다. 이제 모든 이미지 파일은 외부 클라우드 스토리지인 **Cloudinary**에 영구적으로 저장되어 서버 상태와 관계없이 안전하게 유지됩니다.

### 2. 안정적인 이메일 전송을 위한 SendGrid 도입
- **문제점**: 회원가입 시 인증 이메일을 발송하기 위해 `nodemailer`로 Gmail의 SMTP 서버에 직접 접속하는 방식은 Render의 네트워크 정책/방화벽으로 인해 `Connection Timeout` 오류를 일으키며 실패했습니다.
- **해결책**: 안정적인 이메일 API 서비스인 **SendGrid**를 도입했습니다. `@sendgrid/mail` 라이브러리를 사용하여 SMTP 직접 접속 대신 HTTP API 요청으로 이메일을 발송하도록 변경하여, 플랫폼의 네트워크 제약 없이 안정적으로 인증 메일을 보낼 수 있게 되었습니다.

### 3. 마이페이지 기능 수정
- **버그 수정 (게시글 수 미표시)**: 마이페이지에서 자신이 작성한 게시글 수가 정상적으로 집계되지 않던 문제를 해결했습니다. (`users.js`의 데이터베이스 조회 로직 오류 수정)
- **UI 일관성 개선 (기본 프로필 이미지)**: 프로필 이미지가 없는 경우, 마이페이지와 게시글 상세페이지에서 표시되는 기본 이미지가 서로 다른 문제를 해결했습니다. 이제 모든 곳에서 동일한 디자인의 아이콘이 표시됩니다. (`Boardinfo.js` 및 관련 CSS 수정)

### 4. 가정통신문 (Com) 페이지 기능 안정화 및 개선
- **핵심 버그 수정 (상세페이지 로딩 불가)**: 학교 웹사이트의 구조 변경으로 인해 가정통신문 상세페이지가 보이지 않던 문제를 해결했습니다.
  - **안정성 확보**: 불안정한 `axios` 직접 호출 방식 대신, 실제 브라우저 환경을 시뮬레이션하는 **Puppeteer** 방식으로 다시 전환하여 안정성을 확보했습니다.
  - **오류 해결**: `Render.com`과 같은 컨테이너 환경에서 Puppeteer 실행 시 발생하던 `ETXTBSY` 오류를 `--no-sandbox` 옵션 추가로 해결했습니다.
  - **크롤링 로직 개선**: 변경된 웹사이트의 `table` 구조에 맞춰 CSS 선택자를 완전히 재작성하여 제목, 작성자, 내용 등 주요 데이터를 다시 정상적으로 수집합니다.
  - **첨부파일 기능 복구**: 자바스크립트 내에 동적으로 생성되던 첨부파일 정보를 파싱하여 다운로드 링크를 다시 정상적으로 제공하도록 수정했습니다.
- **속도 개선 (캐싱)**: 이전에 구현된 캐싱 기능은 그대로 유지하여, 한 번 불러온 페이지는 빠르게 다시 열 수 있습니다.

### 5. 핵심 인증 로직 수정
- **버그 수정 (새로고침 시 로그아웃)**: 사용자가 로그인 후 페이지를 새로고침하면 로그아웃되던 치명적인 버그를 수정했습니다.
  - **원인**: 백엔드의 사용자 정보 API(`/api/users/me`)가 프론트엔드에서 기대하는 데이터 구조와 다른 형식으로 응답하는 것이 원인이었습니다.
  - **해결**: API 응답 형식을 프론트엔드의 인증 로직(`AuthContext.js`)과 일치시켜, 페이지를 새로고침해도 `localStorage`의 JWT 토큰을 통해 로그인 상태가 안정적으로 유지되도록 수정했습니다.

### 6. 게시판 기능 안정화
- **버그 수정 (검색 기능 오류)**: 특정 게시판(`Boardarr.js`)에서 검색 기능을 사용할 때, 일부 데이터에 `authorName` 필드가 없어 앱이 멈추던 문제를 해결했습니다. (올바른 필드명 `author`로 수정 및 안전장치 추가)

---
