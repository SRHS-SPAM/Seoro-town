import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Palette } from '../constants/theme';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isInitializing } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!identifier || !password) {
      setErrorMessage('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await login({ identifier, password });
      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage((error as Error).message ?? '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc3545" />
          <Text style={styles.loadingText}>로그인 상태 확인 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        {/* Image 컴포넌트를 사용하여 PNG 로고를 표시합니다. */}
        <Image source={{ uri: 'https://robohash.org/seorotown.png' }} style={styles.logoImage} />
        
        <Text style={styles.title}>SEORO-TOWN</Text>
        
        <TextInput
          style={styles.input}
          placeholder="이메일 또는 사용자 이름"
          placeholderTextColor="#adb5bd"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          placeholderTextColor="#adb5bd"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>로그인</Text>
          )}
        </TouchableOpacity>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#495057',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: Palette.border,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 24,
    color: '#495057',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  errorText: {
    marginTop: 16,
    color: '#e03131',
    fontSize: 14,
  },
});
