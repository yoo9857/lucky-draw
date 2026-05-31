import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useGame } from '../game/useGame';

export const Route = createRoute('/', {
  component: HomePage,
});

const BRAND = '#0064FF';

function HomePage() {
  const navigation = Route.useNavigation();
  const { ready, state, alreadyDrawnToday, lastOutcome, draw } = useGame();
  const [drawing, setDrawing] = useState(false);

  const onDraw = async () => {
    if (alreadyDrawnToday || drawing) return;
    setDrawing(true);
    // 살짝 긴장감을 주는 짧은 지연(연출). v1.1 에서 애니메이션으로 대체.
    await new Promise((r) => setTimeout(r, 600));
    await draw();
    setDrawing(false);
  };

  if (!ready) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 행운 🍀</Text>
      <Text style={styles.subtitle}>하루 한 번, 무료로 행운을 뽑아보세요</Text>

      {/* 상태 카드 */}
      <View style={styles.statsRow}>
        <Stat label="보유 포인트" value={`${state.totalPoints.toLocaleString()}P`} />
        <Stat label="연속 출석" value={`${state.streak}일🔥`} />
      </View>

      {/* 결과 / 뽑기 영역 */}
      <View style={styles.resultBox}>
        {drawing ? (
          <>
            <ActivityIndicator size="large" color={BRAND} />
            <Text style={styles.resultHint}>두근두근... 행운을 뽑는 중</Text>
          </>
        ) : lastOutcome ? (
          <>
            <Text style={styles.resultEmoji}>{lastOutcome.prize.emoji}</Text>
            <Text style={styles.resultGrade}>{lastOutcome.prize.label}</Text>
            <Text style={styles.resultPoints}>+{lastOutcome.earnedPoints.toLocaleString()}P</Text>
          </>
        ) : alreadyDrawnToday ? (
          <>
            <Text style={styles.resultEmoji}>✅</Text>
            <Text style={styles.resultHint}>오늘 행운은 이미 뽑았어요</Text>
          </>
        ) : (
          <>
            <Text style={styles.resultEmoji}>🎁</Text>
            <Text style={styles.resultHint}>오늘의 행운이 기다리고 있어요</Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, (alreadyDrawnToday || drawing) && styles.buttonDisabled]}
        onPress={onDraw}
        disabled={alreadyDrawnToday || drawing}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {alreadyDrawnToday ? '내일 다시 만나요' : '행운 뽑기'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('/odds')}>
        <Text style={styles.link}>당첨 확률 보기</Text>
      </TouchableOpacity>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F7F8FA', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: 'bold', color: '#1A202C', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#718096', textAlign: 'center', marginTop: 8, marginBottom: 28 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
  statLabel: { fontSize: 12, color: '#A0AEC0', marginTop: 4 },
  resultBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 180,
  },
  resultEmoji: { fontSize: 56 },
  resultGrade: { fontSize: 26, fontWeight: 'bold', color: '#1A202C', marginTop: 8 },
  resultPoints: { fontSize: 20, fontWeight: 'bold', color: BRAND, marginTop: 4 },
  resultHint: { fontSize: 15, color: '#718096', marginTop: 12 },
  button: {
    backgroundColor: BRAND,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#CBD5E0' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  link: { color: BRAND, fontSize: 14, textAlign: 'center', marginTop: 18 },
});
