import { Stack } from 'expo-router';
import React from 'react';
import { Palette } from '@/constants/theme';

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Palette.background,
        },
      }}>
      <Stack.Screen name="board/[postId]" options={{ title: '게시글 상세' }} />
      <Stack.Screen name="board/write" options={{ title: '글 작성' }} />
      <Stack.Screen name="market/[productId]" options={{ title: '상품 상세' }} />
    </Stack>
  );
}

