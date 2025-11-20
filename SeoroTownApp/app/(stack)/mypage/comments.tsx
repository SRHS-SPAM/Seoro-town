import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  _id: string;
  content: string;
  createdAt?: string;
  postId: string;
  postTitle: string;
  authorId: string;
  authorName: string;
}

interface CommentsResponse {
  success: boolean;
  message?: string;
  comments: Comment[];
}

function formatRelativeTime(isoDate?: string): string {
  if (!isoDate) return '방금 전';
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  return `${weeks}주 전`;
}

export default function MyCommentsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { token } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(
    async (refresh = false) => {
      if (!userId) return;
      try {
        setError(null);
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        const { data } = await apiFetch<CommentsResponse>(`/api/users/${userId}/comments`, {
          token: token ?? undefined,
        });

        if (!data.success || !data.comments) {
          throw new Error(data.message ?? '댓글 목록을 가져오지 못했습니다.');
        }
        setComments(data.comments);
      } catch (err) {
        const apiMessage = (err as any)?.data?.message ?? (err as Error).message;
        setError(apiMessage ?? '댓글 목록을 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId, token]
  );

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => {
      return (
        <TouchableOpacity
          style={styles.commentCard}
          onPress={() => router.push(`/(stack)/board/${item.postId}`)}>
          <View style={styles.commentHeader}>
            <Text style={styles.postTitle} numberOfLines={1}>
              {item.postTitle}
            </Text>
            <Text style={styles.commentDate}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.commentContent} numberOfLines={3}>
            {item.content}
          </Text>
          <View style={styles.commentFooter}>
            <Ionicons name="chatbubble" size={14} color={Palette.primary} />
            <Text style={styles.commentFooterText}>댓글 보기</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [router]
  );

  if (isLoading && comments.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Palette.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>내가 쓴 댓글</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={styles.loadingText}>댓글을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Palette.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내가 쓴 댓글</Text>
        <View style={styles.backButton} />
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={comments}
        keyExtractor={item => item._id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color={Palette.muted} />
            <Text style={styles.emptyTitle}>작성한 댓글이 없습니다.</Text>
            <Text style={styles.emptyDescription}>첫 댓글을 작성해보세요!</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchComments(true)} tintColor={Palette.primary} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Palette.muted,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.primary,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  commentCard: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  postTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Palette.primary,
    marginRight: 8,
  },
  commentDate: {
    fontSize: 12,
    color: Palette.muted,
  },
  commentContent: {
    fontSize: 14,
    color: Palette.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentFooterText: {
    fontSize: 12,
    color: Palette.primary,
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.secondary,
  },
  emptyDescription: {
    color: Palette.muted,
  },
});

