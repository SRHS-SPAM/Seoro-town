import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

type MarketCategory = '전체' | '교과서' | '문제집' | '의류' | '쿠폰' | '기계부품' | '전자기기' | '공구' | '기타';

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

const MARKET_PAGE_SIZE = 10;
const MARKET_CATEGORIES: MarketCategory[] = ['전체', '교과서', '문제집', '의류', '쿠폰', '기계부품', '전자기기', '공구', '기타'];

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
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

export default function MarketScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('전체');
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(
    async (showRefreshing = false) => {
      try {
        setError(null);
        if (showRefreshing) setIsRefreshing(true);
        else setIsLoading(true);

        const categoryParam = activeCategory === '전체' ? '' : `?category=${encodeURIComponent(activeCategory)}`;
        const { data } = await apiFetch<MarketResponse>(`/api/market${categoryParam}`);
        if (!data.success || !data.products) {
          throw new Error(data.message ?? '상품 목록을 가져오지 못했습니다.');
        }
        setProducts(data.products);
        setPage(1);
      } catch (err) {
        const apiMessage = (err as any)?.data?.message ?? (err as Error).message;
        setError(apiMessage ?? '상품 목록을 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeCategory]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === '전체') return products;
    return products.filter(product => product.category === activeCategory);
  }, [products, activeCategory]);

  const pagedProducts = useMemo(() => {
    return filteredProducts.slice(0, page * MARKET_PAGE_SIZE);
  }, [filteredProducts, page]);

  const hasMore = useMemo(() => {
    return pagedProducts.length < filteredProducts.length;
  }, [pagedProducts.length, filteredProducts.length]);

  const renderProduct = useCallback(
    ({ item }: { item: MarketProduct }) => {
      return (
        <TouchableOpacity
          style={styles.productCard}
          onPress={() => router.push({ pathname: '/(stack)/market/[productId]', params: { productId: item._id } })}>
          <View style={styles.productHeader}>
            <View style={styles.productBadge}>
              <Text style={styles.productBadgeText}>
                {item.status === 'sold' ? '판매완료' : '판매중'}
              </Text>
            </View>
            <Text style={styles.productCategory}>{item.category}</Text>
          </View>
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.productContent} numberOfLines={2}>
            {item.content}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.productMeta}>
              {item.authorName ?? '익명'} · {formatRelativeTime(item.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [router]
  );

  const listHeader = (
    <>
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroSubtitle}>서로당근</Text>
          <Text style={styles.heroTitle}>안전하게 거래하세요!</Text>
          <Text style={styles.heroDescription}>상품이 실시간으로 업데이트됩니다.</Text>
        </View>
        <View style={styles.heroIconWrapper}>
          <Ionicons name="bag-handle-outline" size={58} color="#fff" />
        </View>
      </View>

      <View style={styles.categoryRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}>
          {MARKET_CATEGORIES.map(category => (
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
        </ScrollView>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );

  if (isLoading && products.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={styles.loadingText}>상품 목록을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={pagedProducts}
        keyExtractor={item => item._id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={48} color={Palette.muted} />
            <Text style={styles.emptyTitle}>등록된 상품이 없습니다.</Text>
            <Text style={styles.emptyDescription}>
              {activeCategory === '전체'
                ? '첫 상품을 등록해보세요!'
                : `${activeCategory} 카테고리에 등록된 상품이 없습니다.`}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchProducts(true)} tintColor={Palette.primary} />
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => setPage(prev => prev + 1)}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loadMoreText}>더 보기</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />

      {user && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/(stack)/board/write?type=market')}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.fabText}>새 글 작성</Text>
          </TouchableOpacity>
        </View>
      )}
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
    gap: 12,
    backgroundColor: Palette.background,
  },
  loadingText: {
    color: Palette.muted,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: Palette.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: Palette.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroSubtitle: {
    color: Palette.primary,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.secondary,
    marginBottom: 8,
  },
  heroDescription: {
    marginTop: 6,
    fontSize: 14,
    color: Palette.muted,
  },
  heroIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: Palette.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  categoryRow: {
    marginBottom: 16,
  },
  categoryScroll: {
    gap: 10,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: '#fff',
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
  productCard: {
    backgroundColor: Palette.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productBadge: {
    backgroundColor: '#fff4f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  productBadgeText: {
    color: Palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  productCategory: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.secondary,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.primary,
    marginBottom: 8,
  },
  productContent: {
    fontSize: 14,
    color: Palette.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productMeta: {
    color: Palette.muted,
    fontSize: 12,
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
