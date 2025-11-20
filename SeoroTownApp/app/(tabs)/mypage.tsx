import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/lib/api';

interface UserStats {
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  commentCount?: number;
}

export default function MyPageScreen() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      fetchUserStats();
    } else {
      setIsLoading(false);
    }
  }, [user, token]);

  const fetchUserStats = useCallback(async () => {
    if (!token || !user?._id) return;
    try {
      setIsLoading(true);
      const [profileRes, commentsRes] = await Promise.all([
        apiFetch<{ success: boolean; user?: any }>('/api/users/me', { token }),
        apiFetch<{ success: boolean; comments?: any[] }>(`/api/users/${user._id}/comments`, {
          token,
        }),
      ]);

      if (profileRes.data.success && profileRes.data.user) {
        const commentCount = commentsRes.data.success ? commentsRes.data.comments?.length || 0 : 0;
        setStats({
          postCount: profileRes.data.user.postCount || 0,
          followerCount: profileRes.data.user.followerCount || 0,
          followingCount: profileRes.data.user.followingCount || 0,
          commentCount,
        });
      }
    } catch (error) {
      console.error('사용자 통계 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, user?._id]);

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
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => user && router.push(`/(stack)/mypage/posts?userId=${user._id}`)}>
            <Text style={styles.statValue}>
              {isLoading ? '-' : stats.postCount?.toLocaleString() || 0}
            </Text>
            <Text style={styles.statLabel}>게시글</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => Alert.alert('준비 중', '팔로워 목록은 추후 제공될 예정입니다.')}>
            <Text style={styles.statValue}>
              {isLoading ? '-' : stats.followerCount?.toLocaleString() || 0}
            </Text>
            <Text style={styles.statLabel}>팔로워</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => Alert.alert('준비 중', '팔로잉 목록은 추후 제공될 예정입니다.')}>
            <Text style={styles.statValue}>
              {isLoading ? '-' : stats.followingCount?.toLocaleString() || 0}
            </Text>
            <Text style={styles.statLabel}>팔로잉</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 활동</Text>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => user && router.push(`/(stack)/mypage/posts?userId=${user._id}`)}>
            <View style={styles.shortcutIcon}>
              <Ionicons name="document-text-outline" size={20} color={Palette.primary} />
            </View>
            <Text style={styles.shortcutLabel}>내가 쓴 글</Text>
            <Ionicons name="chevron-forward" size={20} color={Palette.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => user && router.push(`/(stack)/mypage/comments?userId=${user._id}`)}>
            <View style={styles.shortcutIcon}>
              <Ionicons name="chatbubble-outline" size={20} color={Palette.primary} />
            </View>
            <Text style={styles.shortcutLabel}>내가 쓴 댓글</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.commentCount || 0}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Palette.muted} />
          </TouchableOpacity>
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
  badge: {
    backgroundColor: Palette.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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

