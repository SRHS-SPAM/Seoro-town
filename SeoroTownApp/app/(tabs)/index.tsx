import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { useFocusEffect, useRouter } from 'expo-router';

type BoardCategory = '전체' | '재학생' | '졸업생' | '가정통신문';

interface Post {
  _id: string;
  title: string;
  content: string;
  category?: string;
  author?: string;
  createdAt?: string;
  comments?: { _id: string }[];
}

interface PostsResponse {
  success: boolean;
  message?: string;
  posts: Post[];
}

interface MarketProduct {
  _id: string;
  title: string;
  price: number;
  content: string;
  category: string;
  status?: string;
  authorName?: string;
  createdAt?: string;
}

interface MarketResponse {
  success: boolean;
  message?: string;
  products: MarketProduct[];
}

interface ComNotice {
  bbsId: string;
  nttId: string;
  num: string;
  title: string;
  author: string;
  date: string;
  views: string;
}

interface ComResponse {
  success: boolean;
  message?: string;
  list: ComNotice[];
}

const POSTS_PAGE_SIZE = 10;
const MARKET_PAGE_SIZE = 10;
const COM_PAGE_SIZE = 10;

const categoryFilters: BoardCategory[] = ['전체', '재학생', '졸업생', '가정통신문'];

export default function BoardHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [marketProducts, setMarketProducts] = useState<MarketProduct[]>([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [hasLoadedMarket, setHasLoadedMarket] = useState(false);

  const [comNotices, setComNotices] = useState<ComNotice[]>([]);
  const [isLoadingCom, setIsLoadingCom] = useState(false);
  const [comError, setComError] = useState<string | null>(null);
  const [hasLoadedCom, setHasLoadedCom] = useState(false);
  const [comPage, setComPage] = useState(1);
  const [comHasMore, setComHasMore] = useState(true);
  const [isLoadingMoreCom, setIsLoadingMoreCom] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BoardCategory>('전체');
  const [postPage, setPostPage] = useState(1);
  const [marketPage, setMarketPage] = useState(1);

  const fetchPosts = useCallback(
    async (showRefreshing = false) => {
      try {
        setPostsError(null);
        if (showRefreshing) setIsRefreshing(true);
        else setIsLoadingPosts(true);

        const { data } = await apiFetch<PostsResponse>('/api/posts');
        if (!data.success || !data.posts) {
          throw new Error(data.message ?? '게시글을 불러오지 못했습니다.');
        }
        setPosts(data.posts);
        setPostPage(1);
      } catch (error) {
        const apiMessage = (error as any)?.data?.message ?? (error as Error).message;
        setPostsError(apiMessage ?? '게시글 목록을 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingPosts(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  const fetchMarket = useCallback(
    async (showRefreshing = false) => {
      try {
        setMarketError(null);
        if (showRefreshing) setIsRefreshing(true);
        else setIsLoadingMarket(true);

        const { data } = await apiFetch<MarketResponse>('/api/market');
        if (!data.success || !data.products) {
          throw new Error(data.message ?? '중고장터 데이터를 불러오지 못했습니다.');
        }
        setMarketProducts(data.products);
        setMarketPage(1);
      } catch (error) {
        const apiMessage = (error as any)?.data?.message ?? (error as Error).message;
        setMarketError(apiMessage ?? '중고장터 데이터를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingMarket(false);
        setIsRefreshing(false);
        setHasLoadedMarket(true);
      }
    },
    []
  );

  const fetchCom = useCallback(
    async ({
      page = 1,
      append = false,
      refreshing = false,
    }: { page?: number; append?: boolean; refreshing?: boolean } = {}) => {
      try {
        setComError(null);
        if (refreshing) setIsRefreshing(true);
        else if (append) setIsLoadingMoreCom(true);
        else setIsLoadingCom(true);

        const { data } = await apiFetch<ComResponse>(`/api/com?page=${page}`);
        if (!data.success || !data.list) {
          throw new Error(data.message ?? '가정통신문 데이터를 불러오지 못했습니다.');
        }
        setComNotices(prev => (append ? [...prev, ...data.list] : data.list));
        setComPage(page);
        setComHasMore(data.list.length >= COM_PAGE_SIZE);
      } catch (error) {
        const apiMessage = (error as any)?.data?.message ?? (error as Error).message;
        setComError(apiMessage ?? '가정통신문 데이터를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingCom(false);
        setIsLoadingMoreCom(false);
        if (refreshing) setIsRefreshing(false);
        setHasLoadedCom(true);
      }
    },
    []
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (activeCategory !== '가정통신문') {
      setPostPage(1);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (activeCategory === '가정통신문' && !hasLoadedCom && !isLoadingCom) {
      fetchCom({ page: 1 });
    }
  }, [activeCategory, fetchCom, hasLoadedCom, isLoadingCom]);

  const isActiveMarket = false; // 중고장터는 별도 탭에서 관리
  const isActiveCom = activeCategory === '가정통신문';

  useFocusEffect(
    useCallback(() => {
      if (!isActiveMarket && !isActiveCom && posts.length > 0) {
        fetchPosts(true);
      }
    }, [isActiveMarket, isActiveCom, posts.length, fetchPosts])
  );

  const filteredPosts = useMemo(() => {
    if (activeCategory === '전체') return posts;
    return posts.filter(post => post.category === activeCategory);
  }, [posts, activeCategory]);

  const pagedPosts = useMemo(() => {
    if (isActiveMarket || isActiveCom) return [];
    return filteredPosts.slice(0, postPage * POSTS_PAGE_SIZE);
  }, [filteredPosts, isActiveCom, isActiveMarket, postPage]);

  const postHasMore = useMemo(() => {
    if (isActiveMarket || isActiveCom) return false;
    return pagedPosts.length < filteredPosts.length;
  }, [filteredPosts.length, isActiveCom, isActiveMarket, pagedPosts.length]);

  const pagedMarket = useMemo(() => {
    if (!isActiveMarket) return [];
    return marketProducts.slice(0, marketPage * MARKET_PAGE_SIZE);
  }, [isActiveMarket, marketPage, marketProducts]);

  const marketHasMore = useMemo(() => {
    if (!isActiveMarket) return false;
    return pagedMarket.length < marketProducts.length;
  }, [isActiveMarket, marketProducts.length, pagedMarket.length]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => {
    const commentCount = item.comments?.length ?? 0;
    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() =>
          router.push({
            pathname: '/(stack)/board/[postId]',
            params: { postId: item._id },
          })
        }>
        <View style={styles.postBadge}>
          <Text style={styles.postBadgeText}>{item.category ?? '재학생'}</Text>
        </View>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postMeta}>
          {item.author ?? '익명'} · {formatRelativeTime(item.createdAt)}
        </Text>
        <View style={styles.postFooter}>
          <View style={styles.postStat}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={Palette.muted} />
            <Text style={styles.postStatText}>{commentCount}</Text>
          </View>
          <View style={styles.postStat}>
            <Ionicons name="time-outline" size={16} color={Palette.muted} />
            <Text style={styles.postStatText}>{formatAbsoluteDate(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
    },
    [router]
  );

  const renderMarketProduct = useCallback(({ item }: { item: MarketProduct }) => {
    return (
      <TouchableOpacity
        style={styles.marketCard}
        onPress={() => Alert.alert('중고장터 준비 중', '상세 페이지는 추후 제공될 예정입니다.')}>
        <View style={styles.marketHeader}>
          <View style={styles.marketBadge}>
            <Text style={styles.marketBadgeText}>{item.status === 'sold' ? '판매완료' : '판매중'}</Text>
          </View>
          <Text style={styles.marketPrice}>{formatPrice(item.price)}</Text>
        </View>
        <Text style={styles.marketTitle}>{item.title}</Text>
        <Text style={styles.marketMeta}>
          {item.authorName ?? '익명'} · {formatRelativeTime(item.createdAt)}
        </Text>
      </TouchableOpacity>
    );
  }, []);

  const renderComNotice = useCallback(({ item }: { item: ComNotice }) => {
    return (
      <TouchableOpacity
        style={styles.comCard}
        onPress={() =>
          Alert.alert('가정통신문 준비 중', '상세 페이지 및 첨부파일은 곧 제공될 예정입니다.')
        }>
        <View style={styles.comHeader}>
          <Text style={styles.comBadge}>{item.num}</Text>
          <Text style={styles.comDate}>{item.date}</Text>
        </View>
        <Text style={styles.comTitle}>{item.title}</Text>
        <View style={styles.comFooter}>
          <Text style={styles.comMeta}>{item.author}</Text>
          <Text style={styles.comMeta}>조회 {item.views}</Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  const listData = isActiveMarket ? pagedMarket : isActiveCom ? comNotices : pagedPosts;
  const listLoading = isActiveMarket
    ? isLoadingMarket && marketProducts.length === 0
    : isActiveCom
    ? isLoadingCom && comNotices.length === 0
    : isLoadingPosts;
  const currentError = isActiveMarket ? marketError : isActiveCom ? comError : postsError;

  const listHeader = (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroText}>
          <Text style={styles.heroLabel}>서울로봇고 커뮤니티</Text>
          <Text style={styles.heroTitle}>
            {user ? `${user.username}님, 환영합니다!` : '커뮤니티에 로그인해 보세요'}
          </Text>
          <Text style={styles.heroSubtitle}>게시글이 실시간으로 업데이트됩니다.</Text>
        </View>
        <View style={styles.heroBadge}>
          <Ionicons name="school-outline" size={58} color="#fff" />
        </View>
      </View>

      <View style={styles.categoryRow}>
        {categoryFilters.map(category => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryChip, activeCategory === category && styles.categoryChipActive]}
            onPress={() => setActiveCategory(category)}>
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === category && styles.categoryChipTextActive,
              ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {currentError && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.errorText}>{currentError}</Text>
        </View>
      )}
    </>
  );

  const renderListItem = useCallback(
    (info: { item: Post | MarketProduct | ComNotice }) => {
      if (isActiveMarket) return renderMarketProduct({ item: info.item as MarketProduct });
      if (isActiveCom) return renderComNotice({ item: info.item as ComNotice });
      return renderPost({ item: info.item as Post });
    },
    [isActiveMarket, isActiveCom, renderComNotice, renderMarketProduct, renderPost]
  );

  const extractKey = useCallback((item: Post | MarketProduct | ComNotice) => {
    if ('_id' in item && item._id) {
      return item._id;
    }
    if ('nttId' in item && item.nttId) {
      return `com-${item.nttId}`;
    }
    return Math.random().toString(36);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {listLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={styles.loadingText}>
            {isActiveMarket ? '중고장터 글을 불러오는 중...' : '게시글을 불러오는 중...'}
          </Text>
        </View>
      ) : (
        <FlatList<Post | MarketProduct | ComNotice>
          data={listData as (Post | MarketProduct | ComNotice)[]}
          keyExtractor={extractKey}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={Palette.muted} />
              <Text style={styles.emptyTitle}>표시할 게시글이 없습니다.</Text>
              <Text style={styles.emptyDescription}>
                {isActiveMarket
                  ? '중고장터에 등록된 글이 없습니다.'
                  : isActiveCom
                  ? '가정통신문이 아직 동기화되지 않았습니다.'
                  : '새 글을 작성하거나 필터를 변경해 보세요.'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() =>
                isActiveMarket
                  ? fetchMarket(true)
                  : isActiveCom
                  ? fetchCom({ page: 1, refreshing: true })
                  : fetchPosts(true)
              }
              tintColor={Palette.primary}
            />
          }
          ListFooterComponent={
            isActiveCom && comHasMore ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => fetchCom({ page: comPage + 1, append: true })}
                disabled={isLoadingMoreCom}>
                {isLoadingMoreCom ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loadMoreText}>다음 게시물 보기</Text>
                )}
              </TouchableOpacity>
            ) : isActiveMarket && marketHasMore ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => setMarketPage(prev => prev + 1)}>
                <Text style={styles.loadMoreText}>다음 게시물 보기</Text>
              </TouchableOpacity>
            ) : postHasMore ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => setPostPage(prev => prev + 1)}>
                <Text style={styles.loadMoreText}>다음 게시물 보기</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {user && !isActiveCom && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/(stack)/board/write?type=post')}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.fabText}>새 글 작성</Text>
          </TouchableOpacity>
        </View>
      )}
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
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatPrice(value?: number) {
  if (typeof value !== 'number') return '-';
  return `${value.toLocaleString()}원`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Palette.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  heroText: {
    flex: 1,
    marginRight: 16,
  },
  heroLabel: {
    fontSize: 14,
    color: Palette.muted,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.secondary,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: Palette.muted,
  },
  heroChips: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff4f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroChipText: {
    color: Palette.primary,
    fontWeight: '600',
  },
  heroBadge: {
    backgroundColor: Palette.primary,
    width: 90,
    height: 90,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  heroBadgeText: {
    marginTop: 6,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  categoryChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  categoryChipText: {
    color: Palette.secondary,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  postCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  postBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff4f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  postBadgeText: {
    color: Palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.secondary,
  },
  postMeta: {
    marginTop: 4,
    color: Palette.muted,
  },
  postFooter: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    color: Palette.muted,
    fontSize: 12,
  },
  marketCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  marketBadge: {
    backgroundColor: '#fff4f5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  marketBadgeText: {
    color: Palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  marketPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.primary,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.secondary,
  },
  marketMeta: {
    marginTop: 4,
    color: Palette.muted,
  },
  comCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  comHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  comBadge: {
    fontWeight: '700',
    color: Palette.primary,
  },
  comDate: {
    color: Palette.muted,
    fontSize: 12,
  },
  comTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.secondary,
    marginBottom: 8,
  },
  comFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comMeta: {
    color: Palette.muted,
    fontSize: 13,
  },
  loadMoreButton: {
    backgroundColor: Palette.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  loadMoreText: {
    color: '#fff',
    fontWeight: '700',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.background,
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
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Palette.primary,
    shadowColor: Palette.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
