import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';

/**
 * 앱의 전체적인 레이아웃과 네비게이션(페이지 이동) 스택을 정의합니다.
 * 모든 페이지는 이 레이아웃을 통해 렌더링됩니다.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        {/* 'index' 스크린(로그인 화면)의 헤더를 숨깁니다. */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
