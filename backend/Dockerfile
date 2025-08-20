# backend/Dockerfile
FROM node:20-slim
# Node.js 20 슬림 버전을 기반 이미지로 사용

WORKDIR /app # 컨테이너 내부 작업 디렉토리 설정

# Node.js 종속성 설치 (효율적인 캐싱을 위함)
COPY package.json package-lock.json ./
RUN npm install

# 애플리케이션 소스 코드 복사
COPY . .

# 포트 노출 (Express 서버가 사용하는 포트)
EXPOSE 3001

# 애플리케이션 실행 명령어
CMD ["npm", "start"]