import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';
import { apiFetch, apiUploadImage, apiUpdateWithImage } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/constants/config';

const CATEGORIES = ['재학생', '졸업생'] as const;
type Category = (typeof CATEGORIES)[number];

const MARKET_CATEGORIES = ['교과서', '문제집', '의류', '쿠폰', '기계부품', '전자기기', '공구', '기타'] as const;
type MarketCategory = (typeof MARKET_CATEGORIES)[number];

export default function BoardWriteScreen() {
  const router = useRouter();
  const { type, postId, productId } = useLocalSearchParams<{
    type?: string;
    postId?: string;
    productId?: string;
  }>();
  const { token, user } = useAuth();

  const isMarket = type === 'market';
  const isEdit = !!(postId || productId);
  const editId = isMarket ? productId : postId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category | MarketCategory>(
    isMarket ? '교과서' : '재학생'
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(isEdit);

  useEffect(() => {
    if (isEdit && editId) {
      const fetchData = async () => {
        try {
          setIsLoadingPost(true);
          if (isMarket) {
            const { data } = await apiFetch<{ success: boolean; product?: any }>(
              `/api/market/${editId}`,
              {
                token: token ?? undefined,
              }
            );

            if (data.success && data.product) {
              setTitle(data.product.title ?? '');
              setContent(data.product.content ?? '');
              setPrice(String(data.product.price ?? ''));
              setCategory((data.product.category as MarketCategory) || '교과서');
              if (data.product.imageUrl) {
                setImageUri(`${config.apiBaseUrl}/${data.product.imageUrl}`);
              }
            }
          } else {
            const { data } = await apiFetch<{ success: boolean; post?: any }>(
              `/api/posts/${editId}`,
              {
                token: token ?? undefined,
              }
            );

            if (data.success && data.post) {
              setTitle(data.post.title ?? '');
              setContent(data.post.content ?? '');
              setCategory((data.post.category as Category | MarketCategory) || '재학생');
            }
          }
        } catch (error) {
          Alert.alert('오류', `${isMarket ? '상품' : '게시글'}을 불러오는데 실패했습니다.`);
          router.back();
        } finally {
          setIsLoadingPost(false);
        }
      };

      fetchData();
    }
  }, [isEdit, editId, isMarket, token, router]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '이미지를 선택하려면 사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('입력 오류', '제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('입력 오류', '내용을 입력해주세요.');
      return;
    }
    if (isMarket && !price.trim()) {
      Alert.alert('입력 오류', '가격을 입력해주세요.');
      return;
    }
    if (isMarket && isNaN(Number(price.trim()))) {
      Alert.alert('입력 오류', '가격은 숫자로 입력해주세요.');
      return;
    }

    if (!token) {
      Alert.alert('인증 오류', '로그인이 필요합니다.');
      router.replace('/');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isMarket) {
        if (isEdit && editId) {
          // 중고장터 상품 수정 (이미지 포함)
          const { data } = await apiUpdateWithImage<{ success: boolean; message?: string }>(
            `/api/market/${editId}`,
            imageUri,
            {
              title: title.trim(),
              content: content.trim(),
              category,
              price: price.trim(),
            },
            token
          );

          if (!data.success) {
            throw new Error(data.message ?? '상품 수정에 실패했습니다.');
          }

          Alert.alert('수정 완료', '상품이 성공적으로 수정되었습니다.', [
            {
              text: '확인',
              onPress: () => router.back(),
            },
          ]);
        } else {
          // 중고장터 상품 등록 (이미지 포함)
          if (imageUri) {
            const { data } = await apiUploadImage<{ success: boolean; message?: string }>(
              '/api/market',
              imageUri,
              {
                title: title.trim(),
                content: content.trim(),
                category,
                price: price.trim(),
              },
              token
            );

            if (!data.success) {
              throw new Error(data.message ?? '상품 등록에 실패했습니다.');
            }
          } else {
            // 이미지 없이 등록 (기존 방식)
            const { data } = await apiFetch<{ success: boolean; message?: string }>('/api/market', {
              method: 'POST',
              token,
              body: {
                title: title.trim(),
                content: content.trim(),
                category,
                price: Number(price.trim()),
              },
            });

            if (!data.success) {
              throw new Error(data.message ?? '상품 등록에 실패했습니다.');
            }
          }

          Alert.alert('등록 완료', '상품이 성공적으로 등록되었습니다.', [
            {
              text: '확인',
              onPress: () => router.back(),
            },
          ]);
        }
      } else {
        if (isEdit && postId) {
          // 게시글 수정 (카테고리는 수정 불가)
          const { data } = await apiFetch<{ success: boolean; message?: string }>(
            `/api/posts/${postId}`,
            {
              method: 'PUT',
              token,
              body: { title: title.trim(), content: content.trim() },
            }
          );

          if (!data.success) {
            throw new Error(data.message ?? '게시글 수정에 실패했습니다.');
          }

          Alert.alert('수정 완료', '게시글이 성공적으로 수정되었습니다.', [
            {
              text: '확인',
              onPress: () => router.back(),
            },
          ]);
        } else {
          // 게시글 작성
          const { data } = await apiFetch<{ success: boolean; message?: string }>('/api/posts', {
            method: 'POST',
            token,
            body: { title: title.trim(), content: content.trim(), category },
          });

          if (!data.success) {
            throw new Error(data.message ?? '게시글 작성에 실패했습니다.');
          }

          Alert.alert('작성 완료', '게시글이 성공적으로 작성되었습니다.', [
            {
              text: '확인',
              onPress: () => router.back(),
            },
          ]);
        }
      }
    } catch (error) {
      const apiMessage = (error as any)?.data?.message ?? (error as Error).message;
      Alert.alert('작성 실패', apiMessage ?? '작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPost) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.primary} />
          <Text style={styles.loadingText}>게시글을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Palette.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? (isMarket ? '상품 수정' : '게시글 수정') : isMarket ? '상품 등록' : '새 글 작성'}
          </Text>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>완료</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {!(isEdit && !isMarket) && (
            <View style={styles.categorySection}>
              <Text style={styles.label}>카테고리</Text>
              {isMarket ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryRow}>
                  {MARKET_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                      onPress={() => setCategory(cat as MarketCategory)}>
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextActive,
                        ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.categoryRow}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                      onPress={() => setCategory(cat as Category)}>
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextActive,
                        ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.inputSection}>
            <TextInput
              style={styles.titleInput}
              placeholder={isMarket ? '상품명을 입력하세요' : '제목을 입력하세요'}
              placeholderTextColor={Palette.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {isMarket && (
            <>
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="가격을 입력하세요 (원)"
                  placeholderTextColor={Palette.muted}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>이미지</Text>
                {imageUri ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                      <Ionicons name="close-circle" size={24} color={Palette.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                    <Ionicons name="camera-outline" size={24} color={Palette.primary} />
                    <Text style={styles.imagePickerText}>이미지 선택</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          <View style={styles.inputSection}>
            <TextInput
              style={styles.contentInput}
              placeholder="내용을 입력하세요"
              placeholderTextColor={Palette.muted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  keyboardView: {
    flex: 1,
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.secondary,
  },
  submitButton: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.secondary,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
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
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  inputSection: {
    marginBottom: 20,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.secondary,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  priceInput: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.secondary,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  imageContainer: {
    position: 'relative',
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: Palette.background,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Palette.surface,
    borderRadius: 12,
    padding: 4,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Palette.border,
    borderStyle: 'dashed',
    backgroundColor: Palette.surface,
  },
  imagePickerText: {
    color: Palette.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  contentInput: {
    fontSize: 16,
    color: Palette.secondary,
    minHeight: 300,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.background,
  },
  loadingText: {
    marginTop: 12,
    color: Palette.muted,
  },
});

