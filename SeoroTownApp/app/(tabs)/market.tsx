import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';

const featuredProducts = [
  {
    id: 'p1',
    title: '레이저 커터용 아크릴 시트',
    price: '15,000원',
    seller: '메이커A',
    condition: '미사용',
    badge: '인기',
  },
  {
    id: 'p2',
    title: 'Raspberry Pi 4 (4GB)',
    price: '65,000원',
    seller: '로봇매니아',
    condition: '상태 A',
    badge: '빠른 거래',
  },
];

const categories = [
  { id: 'device', label: '전자·기자재', icon: 'hardware-chip-outline' },
  { id: 'book', label: '교재·도서', icon: 'book-outline' },
  { id: 'life', label: '생활용품', icon: 'cube-outline' },
  { id: 'uniform', label: '교복·체육복', icon: 'shirt-outline' },
];

export default function MarketScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroSubtitle}>중고 장터</Text>
            <Text style={styles.heroTitle}>학생들끼리 안전하게 거래하세요</Text>
            <Text style={styles.heroDescription}>
              인증된 학생만 이용 가능한 장터입니다. 이미지 5장까지 업로드하고 실시간 채팅으로 거래를
              이어가세요.
            </Text>
            <View style={styles.heroTags}>
              <View style={styles.heroTag}>
                <Ionicons name="shield-checkmark" size={16} color="#fff" />
                <Text style={styles.heroTagText}>실명 인증</Text>
              </View>
              <View style={styles.heroTag}>
                <Ionicons name="flash" size={16} color="#fff" />
                <Text style={styles.heroTagText}>빠른 매칭</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroIconWrapper}>
            <Ionicons name="bag-handle-outline" size={58} color="#fff" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>카테고리</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>전체 보기</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoryGrid}>
            {categories.map(category => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <Ionicons name={category.icon as any} size={26} color={Palette.primary} />
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>오늘의 추천</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>등록하기</Text>
            </TouchableOpacity>
          </View>
          {featuredProducts.map(product => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productBadge}>
                <Text style={styles.productBadgeText}>{product.badge}</Text>
              </View>
              <Text style={styles.productTitle}>{product.title}</Text>
              <Text style={styles.productPrice}>{product.price}</Text>
              <Text style={styles.productMeta}>
                {product.seller} · {product.condition}
              </Text>
              <TouchableOpacity style={styles.productButton}>
                <Text style={styles.productButtonText}>채팅으로 문의</Text>
              </TouchableOpacity>
            </View>
          ))}
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
    color: Palette.muted,
    lineHeight: 20,
  },
  heroTags: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroTagText: {
    color: '#fff',
    fontWeight: '600',
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
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.secondary,
  },
  sectionLink: {
    color: Palette.primary,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: Palette.surface,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  categoryLabel: {
    fontWeight: '600',
    color: Palette.secondary,
  },
  productCard: {
    backgroundColor: Palette.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  productBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff4f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  productBadgeText: {
    color: Palette.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.secondary,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.primary,
    marginTop: 4,
  },
  productMeta: {
    color: Palette.muted,
    marginTop: 4,
    marginBottom: 16,
  },
  productButton: {
    backgroundColor: Palette.primary,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  productButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

