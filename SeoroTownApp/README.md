# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## 개발 시작하기

1. 의존성 설치

   ```bash
   cd SeoroTownApp
   npm install
   ```

2. 환경변수 설정  
   Expo는 `EXPO_PUBLIC_*` 접두사를 가진 변수를 번들에 포함합니다. 루트에 `.env` 파일을 만들고 다음 값을 채워주세요.

   ```
   EXPO_PUBLIC_API_URL=https://seoro-town-backend.onrender.com
   ```

3. 앱 실행

   ```bash
   npx expo start
   ```

   QR 코드를 스캔하거나 Android/iOS 시뮬레이터, Expo Go에서 열 수 있습니다.

## API 유틸

`constants/config.ts`에서 API 기본 URL을 관리하고, `lib/api.ts`에서 fetch 래퍼를 제공합니다.

```ts
import { apiFetch } from '../lib/api';

await apiFetch('/api/auth/login', {
  method: 'POST',
  body: { identifier, password },
});
```

## 기타 정보

- 파일 기반 라우팅: `app` 디렉토리
- 린트: `npm run lint`
- Expo Router, React Navigation, React Native Reanimated 등 최신 Expo SDK 54 스택을 사용합니다.

더 자세한 Expo 문서는 [https://docs.expo.dev](https://docs.expo.dev)에서 확인하세요.
