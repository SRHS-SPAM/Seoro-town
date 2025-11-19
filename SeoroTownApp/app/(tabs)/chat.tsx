import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';

const rooms = [
  { id: 'general', title: '자유 채팅방', members: 58, description: '실시간 학교 이슈 소통' },
  { id: 'project', title: '프로젝트 팀 빌딩', members: 23, description: '팀원을 구해요' },
  { id: 'market', title: '거래 채팅방', members: 12, description: '장터 문의 빠른 전달' },
];

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroSubtitle}>실시간 채팅</Text>
            <Text style={styles.heroTitle}>관심사별 채팅방에서 바로 대화하세요</Text>
            <Text style={styles.heroDescription}>
              웹에서 사용하던 Socket.io 채팅을 모바일에서도 동일하게 사용할 수 있도록 준비 중입니다.
              아래 채팅방을 선택해 실시간 메시지를 주고받으세요.
            </Text>
          </View>
          <View style={styles.heroIconWrapper}>
            <Ionicons name="chatbubbles-outline" size={58} color="#fff" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>추천 채팅방</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>방 만들기</Text>
            </TouchableOpacity>
          </View>
          {rooms.map(room => (
            <TouchableOpacity key={room.id} style={styles.roomCard}>
              <View style={styles.roomIcon}>
                <Ionicons name="people-outline" size={22} color={Palette.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roomTitle}>{room.title}</Text>
                <Text style={styles.roomDescription}>{room.description}</Text>
                <Text style={styles.roomMembers}>{room.members}명 참여 중</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Palette.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={26} color={Palette.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>학생 인증 기반 안전 채팅</Text>
            <Text style={styles.infoDescription}>
              로그인한 사용자만 입장할 수 있으며, 신고 기능과 방장 제어가 그대로 제공됩니다.
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
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: Palette.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Palette.shadow,
    shadowOpacity: 0.1,
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
    marginBottom: 10,
  },
  heroDescription: {
    color: Palette.muted,
    lineHeight: 20,
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
  roomCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  roomIcon: {
    backgroundColor: '#fff4f5',
    padding: 12,
    borderRadius: 16,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.secondary,
  },
  roomDescription: {
    color: Palette.muted,
    marginTop: 4,
  },
  roomMembers: {
    marginTop: 4,
    color: Palette.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.secondary,
  },
  infoDescription: {
    marginTop: 4,
    color: Palette.muted,
  },
});

