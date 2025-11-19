import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

const shortcuts = [
  { id: 'profile', label: '프로필 수정', icon: 'person-outline' },
  { id: 'schedule', label: '시간표 관리', icon: 'calendar-outline' },
  { id: 'follows', label: '팔로우 목록', icon: 'people-outline' },
];

export default function MyPageScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() ?? 'S'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.username ?? '로그인 필요'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? 'email@example.com'}</Text>
            <Text style={styles.profileRole}>
              {user?.role === 'admin' ? '관리자' : '일반 사용자'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user ? '12' : '-'}</Text>
            <Text style={styles.statLabel}>게시글</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user ? '34' : '-'}</Text>
            <Text style={styles.statLabel}>팔로워</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user ? '18' : '-'}</Text>
            <Text style={styles.statLabel}>팔로잉</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 액션</Text>
          {shortcuts.map(item => (
            <TouchableOpacity key={item.id} style={styles.shortcutCard}>
              <View style={styles.shortcutIcon}>
                <Ionicons name={item.icon as any} size={20} color={Palette.primary} />
              </View>
              <Text style={styles.shortcutLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={Palette.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.alertCard}>
          <Ionicons name="information-circle-outline" size={26} color={Palette.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>모바일 버전 알림</Text>
            <Text style={styles.alertDescription}>
              프로필 이미지 업로드, 시간표 편집 등 웹에서 제공하는 기능을 차근차근 이식하고 있습니다.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: Palette.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    shadowColor: Palette.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fff4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.primary,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.secondary,
  },
  profileEmail: {
    color: Palette.muted,
    marginTop: 2,
  },
  profileRole: {
    marginTop: 6,
    color: Palette.primary,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: Palette.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.secondary,
  },
  statLabel: {
    marginTop: 4,
    color: Palette.muted,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.secondary,
    marginBottom: 12,
  },
  shortcutCard: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  shortcutIcon: {
    backgroundColor: '#fff4f5',
    padding: 10,
    borderRadius: 14,
  },
  shortcutLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.secondary,
  },
  alertCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.secondary,
  },
  alertDescription: {
    marginTop: 4,
    color: Palette.muted,
  },
});

