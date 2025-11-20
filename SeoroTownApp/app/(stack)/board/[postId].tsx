import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  authorName: string;
  authorId?: string;
  createdAt?: string;
}

interface PostDetail {
  _id: string;
  title: string;
  content: string;
  category?: string;
  author?: string;
  userId?: string;
  createdAt?: string;
  comments?: Comment[];
}

interface PostDetailResponse {
  success: boolean;
  message?: string;
  post: PostDetail;
}

export default function BoardDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { token, user } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const fetchPostDetail = useCallback(
    async (refresh = false) => {
      if (!postId) return;
      try {
        setError(null);
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        const { data } = await apiFetch<PostDetailResponse>(`/api/posts/${postId}`, {
          token: token ?? undefined,
        });

        if (!data.success || !data.post) {
          throw new Error(data.message ?? '게시글을 찾을 수 없습니다.');
        }
        setPost(data.post);
      } catch (err) {
        const apiMessage = (err as any)?.data?.message ?? (err as Error).message;
        setError(apiMessage ?? '게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [postId, token]
  );

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim()) {
      Alert.alert('입력 오류', '댓글 내용을 입력해주세요.');
      return;
    }

    if (!token) {
      Alert.alert('인증 오류', '로그인이 필요합니다.');
      router.replace('/');
      return;
    }

    setIsSubmittingComment(true);
    try {
      if (editingCommentId) {
        // 댓글 수정
        const { data } = await apiFetch<{ success: boolean; message?: string; comment?: Comment }>(
          `/api/posts/${postId}/comments/${editingCommentId}`,
          {
            method: 'PUT',
            token,
            body: { content: commentText.trim() },
          }
        );

        if (!data.success) {
          throw new Error(data.message ?? '댓글 수정에 실패했습니다.');
        }

        setEditingCommentId(null);
      } else {
        // 댓글 작성
        const { data } = await apiFetch<{ success: boolean; message?: string; comment?: Comment }>(
          `/api/posts/${postId}/comments`,
          {
            method: 'POST',
            token,
            body: { content: commentText.trim() },
          }
        );

        if (!data.success) {
          throw new Error(data.message ?? '댓글 작성에 실패했습니다.');
        }
      }

      setCommentText('');
      await fetchPostDetail(true);
    } catch (err) {
      const apiMessage = (err as any)?.data?.message ?? (err as Error).message;
      Alert.alert(editingCommentId ? '수정 실패' : '작성 실패', apiMessage ?? '오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  }, [commentText, token, postId, fetchPostDetail, router, editingCommentId]);

  const handleEditComment = useCallback((comment: Comment) => {
    setEditingCommentId(comment._id);
    setCommentText(comment.content);
  }, []);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!token) {
        Alert.alert('인증 오류', '로그인이 필요합니다.');
        return;
      }

      Alert.alert('댓글 삭제', '정말 이 댓글을 삭제하시겠어요?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data } = await apiFetch<{ success: boolean; message?: string }>(
                `/api/posts/${postId}/comments/${commentId}`,
                {
                  method: 'DELETE',
                  token,
                }
              );

              if (!data.success) {
                throw new Error(data.message ?? '댓글 삭제에 실패했습니다.');
              }

              await fetchPostDetail(true);
            } catch (err) {
              const apiMessage = (err as any)?.data?.message ?? (err as Error).message;
              Alert.alert('삭제 실패', apiMessage ?? '댓글 삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]);
    },
    [token, postId, fetchPostDetail]
  );

  const handleEditPost = useCallback(() => {
    router.push(`/(stack)/board/write?postId=${postId}`);
  }, [router, postId]);

  const handleDeletePost = useCallback(async () => {
    if (!token) {
      Alert.alert('인증 오류', '로그인이 필요합니다.');
      return;
    }

    Alert.alert('게시글 삭제', '정말 이 게시글을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const { data } = await apiFetch<{ success: boolean; message?: string }>(
              `/api/posts/${postId}`,
              {
                method: 'DELETE',
                token,
              }
            );

            if (!data.success) {
              throw new Error(data.message ?? '게시글 삭제에 실패했습니다.');
            }

            Alert.alert('삭제 완료', '게시글이 삭제되었습니다.', [
              {
                text: '확인',
                onPress: () => router.back(),
              },
            ]);
          } catch (err) {
            const apiMessage = (err as any)?.data?.message ?? (err as Error).message;
            Alert.alert('삭제 실패', apiMessage ?? '게시글 삭제 중 오류가 발생했습니다.');
          }
        },
      },
    ]);
  }, [token, postId, router]);

  if (isLoading && !post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={styles.loadingText}>게시글을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPostDetail()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>게시글을 찾을 수 없습니다.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>뒤로가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const comments = post.comments ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchPostDetail(true)} />
          }>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={Palette.secondary} />
            </TouchableOpacity>
            <Text style={styles.categoryBadge}>{post.category ?? '게시판'}</Text>
            {user && post.author === user.username && (
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleEditPost}>
                  <Ionicons name="create-outline" size={18} color={Palette.secondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleDeletePost}>
                  <Ionicons name="trash-outline" size={18} color={Palette.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.title}>{post.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{post.author ?? '익명'}</Text>
            <Text style={styles.metaText}>{formatAbsoluteDate(post.createdAt)}</Text>
          </View>

          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{post.content}</Text>
          </View>

          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>댓글 {comments.length}</Text>
          </View>

          {comments.length === 0 ? (
            <View style={styles.emptyComment}>
              <Text style={styles.emptyCommentText}>아직 댓글이 없습니다.</Text>
            </View>
          ) : (
            comments.map(comment => (
              <View key={comment._id} style={styles.commentCard}>
                <View style={styles.commentTop}>
                  <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                  <View style={styles.commentRight}>
                    <Text style={styles.commentDate}>{formatRelativeTime(comment.createdAt)}</Text>
                    {user && comment.authorName === user.username && (
                      <View style={styles.commentActions}>
                        <TouchableOpacity
                          style={styles.commentActionButton}
                          onPress={() => handleEditComment(comment)}>
                          <Ionicons name="create-outline" size={14} color={Palette.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.commentActionButton}
                          onPress={() => handleDeleteComment(comment._id)}>
                          <Ionicons name="trash-outline" size={14} color={Palette.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          )}
        </ScrollView>

        {user && (
          <View style={styles.commentInputContainer}>
            {editingCommentId && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingCommentId(null);
                  setCommentText('');
                }}>
                <Ionicons name="close" size={18} color={Palette.muted} />
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.commentInput}
              placeholder={editingCommentId ? '댓글을 수정하세요...' : '댓글을 입력하세요...'}
              placeholderTextColor={Palette.muted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.commentSubmitButton, isSubmittingComment && styles.commentSubmitDisabled]}
              onPress={handleSubmitComment}
              disabled={isSubmittingComment || !commentText.trim()}>
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatRelativeTime(isoDate?: string) {
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

function formatAbsoluteDate(isoDate?: string) {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Palette.muted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: Palette.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fff4f5',
    borderRadius: 20,
    color: Palette.primary,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.secondary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaText: {
    color: Palette.muted,
  },
  contentCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 28,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: Palette.secondary,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.secondary,
  },
  emptyComment: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  emptyCommentText: {
    color: Palette.muted,
  },
  commentCard: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 12,
  },
  commentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 6,
  },
  commentActionButton: {
    padding: 4,
  },
  commentAuthor: {
    fontWeight: '700',
    color: Palette.secondary,
  },
  commentDate: {
    color: Palette.muted,
    fontSize: 12,
  },
  commentContent: {
    color: Palette.secondary,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    gap: 10,
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: Palette.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: Palette.secondary,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  commentSubmitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitDisabled: {
    opacity: 0.6,
  },
});

