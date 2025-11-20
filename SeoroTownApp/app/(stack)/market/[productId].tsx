import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { config } from '@/constants/config';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ProductDetail {
  _id: string;
  title: string;
  price: number;
  content: string;
  category: string;
  status?: string;
  authorName?: string;
  authorId?: string;
  createdAt?: string;
  imageUrl?: string;
}

interface ProductDetailResponse {
  success: boolean;
  message?: string;
  product: ProductDetail;
}

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

function formatAbsoluteDate(isoDate?: string) {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

export default function MarketDetailScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { token, user } = useAuth();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductDetail = useCallback(
    async (refresh = false) => {
      if (!productId) return;
      try {
        setError(null);
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);

        const { data } = await apiFetch<ProductDetailResponse>(`/api/market/${productId}`, {
          token: token ?? undefined,
        });

        if (!data.success || !data.product) {
          throw new Error(data.message ?? '상품을 찾을 수 없습니다.');
        }
        setProduct(data.product);
      } catch (err) {
        const apiMessage = (err as any)?.data?.message ?? (err as Error).message;
        setError(apiMessage ?? '상품을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [productId, token]
  );

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  const handleEditProduct = useCallback(() => {
    router.push(`/(stack)/board/write?type=market&productId=${productId}`);
  }, [router, productId]);

  const handleDeleteProduct = useCallback(async () => {
    if (!token) {
      Alert.alert('인증 오류', '로그인이 필요합니다.');
      return;
    }

    Alert.alert('상품 삭제', '정말 이 상품을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const { data } = await apiFetch<{ success: boolean; message?: string }>(
              `/api/market/${productId}`,
              {
                method: 'DELETE',
                token,
              }
            );

            if (!data.success) {
              throw new Error(data.message ?? '상품 삭제에 실패했습니다.');
            }

            Alert.alert('삭제 완료', '상품이 삭제되었습니다.', [
              {
                text: '확인',
                onPress: () => router.back(),
              },
            ]);
          } catch (err) {
            const apiMessage = (err as any)?.data?.message ?? (err as Error).message;
            Alert.alert('삭제 실패', apiMessage ?? '상품 삭제 중 오류가 발생했습니다.');
          }
        },
      },
    ]);
  }, [token, productId, router]);

  if (isLoading && !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={styles.loadingText}>상품을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProductDetail()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>상품을 찾을 수 없습니다.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>뒤로가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAuthor = user && product.authorName === user.username;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchProductDetail(true)} />
        }>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Palette.secondary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {product.status === 'sold' ? '판매완료' : '판매중'}
              </Text>
            </View>
            {isAuthor && (
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleEditProduct}>
                  <Ionicons name="create-outline" size={18} color={Palette.secondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleDeleteProduct}>
                  <Ionicons name="trash-outline" size={18} color={Palette.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{product.category}</Text>
        </View>

        <Text style={styles.title}>{product.title}</Text>

        {product.imageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: product.imageUrl.startsWith('http')
                  ? product.imageUrl
                  : `${config.apiBaseUrl}/${product.imageUrl}`,
              }}
              style={styles.productImage}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{product.authorName ?? '익명'}</Text>
          <Text style={styles.metaText}>{formatAbsoluteDate(product.createdAt)}</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.contentText}>{product.content}</Text>
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
    paddingBottom: 60,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fff4f5',
    borderRadius: 20,
  },
  statusBadgeText: {
    color: Palette.primary,
    fontWeight: '700',
    fontSize: 12,
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
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fff4f5',
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryText: {
    color: Palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.secondary,
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: Palette.background,
  },
  priceContainer: {
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.primary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaText: {
    color: Palette.muted,
    fontSize: 14,
  },
  contentCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: Palette.secondary,
  },
});

