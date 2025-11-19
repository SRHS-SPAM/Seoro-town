const DEFAULT_API_URL = 'https://seoro-town-backend.onrender.com/';

export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
};

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn(
    `[config] EXPO_PUBLIC_API_URL이 정의되지 않았습니다. 기본값(${DEFAULT_API_URL})을 사용합니다.`
  );
}

