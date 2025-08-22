# backend/Dockerfile
FROM node:20-slim

# Install Chromium and its dependencies
RUN apt-get update && apt-get install -y     chromium     fontconfig     fonts-ipafont-gothic     fonts-wqy-zenhei     fonts-thai-tlwg     fonts-kacst     --no-install-recommends &&     rm -rf /var/lib/apt/lists/*
# Node.js 20 슬림 버전을 기반 이미지로 사용

WORKDIR /app

# Node.js 종속성 설치 (효율적인 캐싱을 위함)
COPY package.json package-lock.json ./
RUN npm install

# 애플리케이션 소스 코드 복사
COPY . .

# 포트 노출 (Express 서버가 사용하는 포트)
EXPOSE 3001

# 애플리케이션 실행 명령어
CMD ["npm", "start"]