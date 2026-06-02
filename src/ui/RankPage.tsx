/**
 * RankPage — rank.png 디자인 매칭 풀스크린 랭킹.
 *
 * 헤더 → 탭 → TOP3 시상대 → 순위 리스트 → 내 순위 바.
 * 점수는 내 실제 포인트(points)로 순위를 계산한다. (지금은 로컬/모의 봇,
 * 운영 전환 시 토스 리더보드 데이터로 board 만 교체하면 됨.)
 */

import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradientLite } from './Gradient';
import { Decorations } from './Decorations';

interface Entry { name: string; score: number; av: string; up: number; me?: boolean }

// 모의 봇 (rank.png 분위기의 닉네임). 운영: 토스 리더보드로 교체.
const BOTS: Entry[] = [
  { name: '행운이', score: 12470, av: '🐱', up: 0 },
  { name: 'Lucky_77', score: 9850, av: '🐰', up: 1 },
  { name: '코코비', score: 8210, av: '🐹', up: -1 },
  { name: '햇살미녀', score: 7250, av: '🐻', up: 1 },
  { name: '행운v사', score: 6320, av: '🐶', up: 0 },
  { name: '로꼬대장', score: 5780, av: '🦊', up: 2 },
  { name: '콩나무', score: 4910, av: '🐨', up: -1 },
  { name: '클로버', score: 4230, av: '🐸', up: 1 },
  { name: '네잎이', score: 3110, av: '🐥', up: 0 },
];

const TABS = ['전체 랭킹', '친구 랭킹', '월별 랭킹'] as const;

function UpTag({ up }: { up: number }) {
  if (up > 0) return <Text style={[styles.up, styles.upPos]}>▲{up}</Text>;
  if (up < 0) return <Text style={[styles.up, styles.upNeg]}>▼{-up}</Text>;
  return <Text style={[styles.up, styles.upSame]}>–</Text>;
}

function Podium({ e, rank }: { e: Entry; rank: 1 | 2 | 3 }) {
  return (
    <View style={[styles.pod, rank === 1 && styles.podWide]}>
      {rank === 1 && <Text style={styles.crown}>👑</Text>}
      <View style={[styles.ava, rank === 1 && styles.avaFirst]}><Text style={{ fontSize: rank === 1 ? 42 : 32 }}>{e.av}</Text></View>
      <Text style={styles.podNm} numberOfLines={1}>{e.name}</Text>
      <View style={styles.podScWrap}><Text style={styles.podSc}>{e.score.toLocaleString()}P</Text></View>
      <View style={[styles.base, rank === 1 ? styles.base1 : rank === 2 ? styles.base2 : styles.base3]}>
        <Text style={styles.baseNum}>{rank}</Text>
      </View>
    </View>
  );
}

export function RankPage({ visible, points, plays, onClose, onToast }: {
  visible: boolean; points: number; plays: number; onClose: () => void; onToast: (m: string) => void;
}) {
  const [tab, setTab] = useState(0);

  const board: Entry[] = [...BOTS.map((b) => ({ ...b })), { name: '나', score: points, av: '🍀', up: 0, me: true }]
    .sort((a, b) => b.score - a.score);
  const myRank = board.findIndex((x) => x.me) + 1;
  const level = 1 + Math.floor(plays / 3);
  const top = board.slice(0, 3);
  const rest = board.slice(3, 12);

  const onTab = (i: number) => {
    if (i === 0) { setTab(0); return; }
    onToast(i === 1 ? '친구 랭킹은 토스 친구 연동으로 제공돼요' : '월별 랭킹은 시즌제로 제공될 예정이에요');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.fill}>
        <LinearGradientLite colors={['#8E6FE6', '#B98FE0', '#EC9DD2']} style={StyleSheet.absoluteFill} />
        <Decorations />
        <TouchableOpacity style={styles.close} onPress={onClose}><Text style={styles.closeTx}>✕</Text></TouchableOpacity>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>행운 랭킹에서{'\n'}나의 순위를 확인하세요</Text>
          <Text style={styles.sub}>✦ 친구들과 함께 행운을 모아 더 높은 곳을 향해! ✦</Text>

          <View style={styles.tabs}>
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} style={[styles.tab, tab === i && styles.tabOn]} onPress={() => onTab(i)}>
                <Text style={[styles.tabTx, tab === i && styles.tabTxOn]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TOP3 시상대: 2등(좌) 1등(중) 3등(우) */}
          <View style={styles.podium}>
            {top[1] && <Podium e={top[1]} rank={2} />}
            {top[0] && <Podium e={top[0]} rank={1} />}
            {top[2] && <Podium e={top[2]} rank={3} />}
          </View>

          {/* 4위~ 리스트 */}
          <View style={styles.list}>
            {rest.map((e, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rank}>{i + 4}</Text>
                <View style={styles.rowAva}><Text style={{ fontSize: 20 }}>{e.av}</Text></View>
                <Text style={styles.rowNm} numberOfLines={1}>{e.name}</Text>
                <Text style={styles.rowSc}>{e.score.toLocaleString()}P</Text>
                <UpTag up={e.up} />
              </View>
            ))}
          </View>

          {/* 내 순위 바 */}
          <View style={styles.me}>
            <Text style={[styles.rank, styles.meTx]}>{myRank}</Text>
            <View style={[styles.rowAva, styles.meAva]}><Text style={{ fontSize: 20 }}>🍀</Text></View>
            <Text style={[styles.rowNm, styles.meTx]} numberOfLines={1}>나 (Lv.{level})</Text>
            <Text style={[styles.rowSc, styles.meTx]}>{points.toLocaleString()}P</Text>
          </View>

          <Text style={styles.note}>매주 월요일 0시에 랭킹이 초기화돼요 · 점수는 게임 내 포인트 기준</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#9B7BE6' },
  close: { position: 'absolute', top: 44, right: 18, zIndex: 6, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  closeTx: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scroll: { paddingTop: 56, paddingHorizontal: 18, paddingBottom: 36 },
  title: { color: '#fff', textAlign: 'center', fontSize: 21, fontWeight: '800', lineHeight: 28 },
  sub: { color: 'rgba(255,255,255,0.88)', textAlign: 'center', fontSize: 11.5, marginTop: 7, marginBottom: 18, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginBottom: 20 },
  tab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)' },
  tabOn: { backgroundColor: '#7C5CFF' },
  tabTx: { color: 'rgba(255,255,255,0.9)', fontSize: 12.5, fontWeight: '800' },
  tabTxOn: { color: '#fff' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 18 },
  pod: { flex: 1, alignItems: 'center' },
  podWide: { flex: 1.15 },
  crown: { fontSize: 26, marginBottom: -4 },
  ava: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  avaFirst: { width: 80, height: 80, borderRadius: 40, borderColor: '#FFD56B' },
  podNm: { color: '#fff', fontWeight: '800', fontSize: 12.5, marginTop: 7 },
  podScWrap: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 11, paddingVertical: 3, borderRadius: 999, marginTop: 5 },
  podSc: { color: '#fff', fontWeight: '800', fontSize: 12 },
  base: { marginTop: 9, width: '88%', borderTopLeftRadius: 14, borderTopRightRadius: 14, alignItems: 'center', paddingTop: 8 },
  base1: { height: 92, backgroundColor: '#FFC95C' },
  base2: { height: 66, backgroundColor: '#CDD3E0' },
  base3: { height: 50, backgroundColor: '#E2AB7E' },
  baseNum: { color: '#fff', fontWeight: '900', fontSize: 20 },
  list: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 22, paddingHorizontal: 12, paddingVertical: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F1ECFA' },
  rank: { width: 22, textAlign: 'center', fontWeight: '800', color: '#9A92BE', fontSize: 15 },
  rowAva: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1ECFF', alignItems: 'center', justifyContent: 'center' },
  rowNm: { flex: 1, fontWeight: '700', fontSize: 13.5, color: '#2A2150' },
  rowSc: { fontWeight: '800', color: '#7C5CFF', fontSize: 13.5 },
  up: { fontSize: 10.5, fontWeight: '800', width: 26, textAlign: 'right' },
  upPos: { color: '#22C098' }, upNeg: { color: '#FF6B8A' }, upSame: { color: '#C2BCD8' },
  me: { marginTop: 12, backgroundColor: '#7C5CFF', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  meTx: { color: '#fff' },
  meAva: { backgroundColor: 'rgba(255,255,255,0.28)' },
  note: { textAlign: 'center', color: 'rgba(255,255,255,0.72)', fontSize: 10.5, marginTop: 16, lineHeight: 16 },
});
