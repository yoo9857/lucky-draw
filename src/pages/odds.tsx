import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { PRIZES } from '../game/odds';

export const Route = createRoute('/odds', {
  component: OddsPage,
});

const BRAND = '#0064FF';

/**
 * 당첨 확률 안내 — 확률형 콘텐츠 투명성(고지) 화면.
 * 확률표(PRIZES)를 그대로 노출하므로 실제 추첨 확률과 항상 일치한다.
 */
function OddsPage() {
  const navigation = Route.useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>당첨 확률 안내</Text>
      <Text style={styles.desc}>
        아래 확률은 실제 추첨에 사용되는 값과 동일해요. {'\n'}참가비는 없으며, 보상은 게임 내
        행운 포인트로만 지급돼요(현금 환전 불가).
      </Text>

      <View style={styles.table}>
        <View style={[styles.row, styles.head]}>
          <Text style={[styles.cell, styles.headText, styles.gradeCol]}>등급</Text>
          <Text style={[styles.cell, styles.headText, styles.probCol]}>확률</Text>
          <Text style={[styles.cell, styles.headText, styles.ptCol]}>포인트</Text>
        </View>
        {PRIZES.map((p) => (
          <View key={p.grade} style={styles.row}>
            <Text style={[styles.cell, styles.gradeCol]}>
              {p.emoji} {p.label}
            </Text>
            <Text style={[styles.cell, styles.probCol]}>{p.probability}%</Text>
            <Text style={[styles.cell, styles.ptCol]}>{p.points.toLocaleString()}P</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>
        · 하루 1회만 참여할 수 있어요.{'\n'}· 연속 출석 시 획득 포인트가 최대 70%까지
        늘어나요.{'\n'}· 본 게임은 사행성 요소가 없는 무료 캐주얼 게임이에요.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('/')}>
        <Text style={styles.buttonText}>돌아가기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A202C', marginBottom: 12 },
  desc: { fontSize: 14, color: '#718096', lineHeight: 21, marginBottom: 20 },
  table: { backgroundColor: 'white', borderRadius: 14, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EDF2F7',
  },
  head: { backgroundColor: '#EDF2F7' },
  headText: { fontWeight: 'bold', color: '#4A5568' },
  cell: { fontSize: 15, color: '#1A202C' },
  gradeCol: { flex: 2 },
  probCol: { flex: 1, textAlign: 'center' },
  ptCol: { flex: 1, textAlign: 'right' },
  note: { fontSize: 13, color: '#A0AEC0', lineHeight: 20, marginTop: 18 },
  button: {
    backgroundColor: BRAND,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
