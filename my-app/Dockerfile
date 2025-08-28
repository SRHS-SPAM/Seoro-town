# my-app/Dockerfile

# 1단계: React 앱 빌드
FROM node:20-slim as builder

WORKDIR /app

# 빌드 시 주입할 환경 변수를 선언합니다.
ARG REACT_APP_API_URL
# 빌드 과정에서 사용할 환경 변수로 설정합니다.
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build # React 앱 빌드

# 2단계: 빌드된 정적 파일을 Nginx로 서빙
FROM nginx:alpine

# Nginx 기본 설정 파일 삭제
RUN rm /etc/nginx/conf.d/default.conf

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 React 앱 정적 파일 복사
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx 기본 HTTP 포트
EXPOSE 80

# Nginx 실행 명령어
CMD ["nginx", "-g", "daemon off;"]