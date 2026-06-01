import { createRoute } from '@granite-js/react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Animated,
  Vibration, StyleSheet, Dimensions, ActivityIndicator, Share,
} from 'react-native';
import { LinearGradientLite, PALETTE } from '../ui/Gradient';
import { Confetti } from '../ui/Confetti';
import { useGame, type DrawOutcome } from '../game/useGame';
import { TIER_TABLE, POOL, PICK, MAX_TICKETS, pickRandom } from '../game/lotto';
import { ACHIEVEMENTS, BOTS, ticketSecondsLeft } from '../game/gamestate';
import { showRewardedAd } from '../ads';

export const Route = createRoute('/', { component: GamePage });

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_PAD = 16;
const PANEL_PAD = 12;
const COLS = 9;
const GAP = 5;
const CELL = Math.floor((SCREEN_W - SCREEN_PAD * 2 - PANEL_PAD * 2 - GAP * (COLS - 1)) / COLS);

type SheetId = 'odds' | 'ach' | 'rank' | 'recharge' | 'more' | null;
interface RevealItem { n: number; hit: boolean; bonus: boolean }

function GamePage() {
  const g = useGame();
  const [sel, setSel] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<RevealItem[]>([]);
  const [phase, setPhase] = useState<'idle' | 'drawing' | 'result'>('idle');
  const [outcome, setOutcome] = useState<DrawOutcome | null>(null);
  const [burst, setBurst] = useState(0);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const showToast = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  const buzz = useCallback((ms: number) => { if (!g.state.muted) Vibration.vibrate(ms); }, [g.state.muted]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // 첫 방문 안내
  useEffect(() => {
    if (g.ready && !g.state.onboarded) { setSheet('odds'); g.markOnboarded(); }
  }, [g.ready]);

  const toggle = (n: number) => {
    if (phase === 'drawing') return;
    setSel((cur) => cur.includes(n) ? cur.filter((x) => x !== n) : cur.length < PICK ? [...cur, n].sort((a, b) => a - b) : cur);
  };
  const autoPick = () => { if (phase !== 'drawing') setSel(pickRandom(POOL, PICK)); };

  const onDraw = () => {
    if (sel.length !== PICK || phase === 'drawing') return;
    const result = g.draw(sel);
    if (!result) { setSheet('recharge'); return; }
    setOutcome(result);
    setPhase('drawing');
    setRevealed([]);
    setBurst(0);
    const seq: RevealItem[] = [
      ...result.win.map((n) => ({ n, hit: sel.includes(n), bonus: false })),
      { n: result.bonus, hit: sel.includes(result.bonus), bonus: true },
    ];
    seq.forEach((item, i) => {
      const t = setTimeout(() => {
        setRevealed((cur) => [...cur, item]);
        buzz(item.hit ? 28 : 10);
        if (i === seq.length - 1) {
          const t2 = setTimeout(() => {
            setPhase('result');
            if (result.points > 0) {
              setBurst(Date.now());
              buzz(60);
            }
          }, 600);
          timers.current.push(t2);
        }
      }, i * 380 + 350);
      timers.current.push(t);
    });
  };

  const onDaily = () => {
    const r = g.claimDaily();
    if (!r) { setSheet('more'); return; }
    setBurst(Date.now());
    showToast(`🎁 ${r.streak}일 연속! 티켓 +${r.tickets}, ${r.points}P`);
  };

  const onShare = async () => {
    if (!outcome) return;
    try {
      await Share.share({ message: `오늘의 행운에서 ${outcome.rank > 0 ? outcome.label : outcome.matches + '개 일치'}! 🍀 너도 도전해봐` });
    } catch { /* 사용자가 취소 */ }
  };

  if (!g.ready) {
    return (
      <View style={[styles.fill, styles.center]}>
        <LinearGradientLite colors={PALETTE.bg} style={StyleSheet.absoluteFill} />
        <ActivityIndicator color={PALETTE.brand} size="large" />
      </View>
    );
  }

  const s = g.state;
  const secs = ticketSecondsLeft(s, Date.now());
  const timerText = s.tickets >= MAX_TICKETS ? '가득 찼어요' : `다음 충전 ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const near = outcome && outcome.matches === 5 && !outcome.bonusHit;

  return (
    <View style={styles.fill}>
      <LinearGradientLite colors={PALETTE.bg} style={StyleSheet.absoluteFill} />
      <Confetti burst={burst} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 상태바 */}
        <View style={styles.statusbar}>
          <View style={[styles.glass, styles.chip]}>
            <Text style={styles.chipIc}>🎟️</Text>
            <View><Text style={styles.chipV}>{s.tickets}/{MAX_TICKETS}</Text><Text style={styles.chipL}>{timerText}</Text></View>
          </View>
          <View style={[styles.glass, styles.chip]}>
            <Text style={styles.chipIc}>💎</Text>
            <View><Text style={styles.chipV}>{s.points.toLocaleString()}P</Text><Text style={styles.chipL}>보유 포인트</Text></View>
          </View>
        </View>

        {/* 헤더 */}
        <View style={styles.headrow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>오늘의 행운 🍀</Text>
            <Text style={styles.sub}>번호 6개를 골라 추첨에 도전하세요</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={g.toggleMute}><Text style={{ fontSize: 16 }}>{s.muted ? '🔇' : '🔊'}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.dailyBtn, g.canClaimDaily && styles.dailyOn]} onPress={onDaily}>
            <Text style={[styles.dailyTx, g.canClaimDaily && { color: '#fff' }]}>{g.canClaimDaily ? '🎁 데일리' : `✅ ${s.streak}일`}</Text>
          </TouchableOpacity>
        </View>

        {/* 추첨 무대 */}
        <View style={[styles.glass, styles.stage]}>
          {phase === 'idle' && <Text style={styles.ph}>번호 6개를 고르고{'\n'}‘추첨하기’를 눌러보세요</Text>}
          {phase !== 'idle' && (
            <View style={styles.balls}>
              {revealed.map((b, i) => (
                <React.Fragment key={i}>
                  {b.bonus && <Text style={styles.plus}>+</Text>}
                  <Ball n={b.n} hit={b.hit} bonus={b.bonus} />
                </React.Fragment>
              ))}
              {phase === 'drawing' && revealed.length === 0 && <ActivityIndicator color={PALETTE.brand} />}
            </View>
          )}
          {phase === 'result' && outcome && (
            <View style={styles.verdict}>
              <Text style={styles.vEm}>{outcome.emoji}</Text>
              <Text style={styles.vGr}>{outcome.rank > 0 ? `${outcome.label} · ${outcome.matches}개` : `${outcome.matches}개 일치`}</Text>
              <Text style={styles.vPt}>+{outcome.points.toLocaleString()}P</Text>
              {outcome.rank === 1 ? <Text style={styles.near}>🎉 잭팟! 전설이에요!</Text>
                : near ? <Text style={styles.near}>😫 보너스 하나 차이!</Text>
                : outcome.matches === 2 ? <Text style={[styles.near, { color: PALETTE.muted }]}>아쉽! 하나만 더</Text> : null}
              {outcome.rank > 0 && <TouchableOpacity style={styles.shareBtn} onPress={onShare}><Text style={styles.shareTx}>📤 자랑하기</Text></TouchableOpacity>}
            </View>
          )}
        </View>

        {/* 번호 선택 */}
        <View style={[styles.glass, styles.panel]}>
          <View style={styles.panelHead}>
            <Text style={styles.panelT}>내 번호 (1~45)</Text>
            <Text style={styles.panelC}>{sel.length} / {PICK}</Text>
          </View>
          <View style={styles.grid}>
            {Array.from({ length: POOL }, (_, i) => i + 1).map((n) => {
              const on = sel.includes(n);
              const disabled = phase === 'drawing' || (!on && sel.length >= PICK);
              return (
                <TouchableOpacity key={n} activeOpacity={0.7} disabled={disabled}
                  style={[styles.num, on && styles.numOn, disabled && !on && styles.numDim]} onPress={() => toggle(n)}>
                  <Text style={[styles.numTx, on && { color: '#fff' }]}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 액션 */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.ghost]} onPress={autoPick}><Text style={styles.ghostTx}>🎲 자동</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.primary, (sel.length !== PICK || phase === 'drawing') && styles.btnOff]}
            disabled={sel.length !== PICK || phase === 'drawing'} onPress={onDraw}>
            <Text style={styles.primaryTx}>추첨하기 🎟️1</Text>
          </TouchableOpacity>
        </View>

        {/* 네비 */}
        <View style={styles.nav}>
          {([['odds', '📊', '등급표'], ['ach', '🏅', '도전과제'], ['recharge', '🎫', '충전'], ['rank', '📈', '랭킹'], ['more', '⚙️', '더보기']] as const).map(([id, ic, label]) => (
            <TouchableOpacity key={id} style={styles.navBtn} onPress={() => setSheet(id)}>
              <Text style={styles.navIc}>{ic}</Text><Text style={styles.navTx}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {toast !== '' && <View style={styles.toast}><Text style={styles.toastTx}>{toast}</Text></View>}

      <Sheet id={sheet} state={s} onClose={() => setSheet(null)}
        onWatchAd={async () => {
          showToast('📺 광고 불러오는 중…');
          const r = await showRewardedAd();
          if (!r.supported) { g.watchAdForTickets(); showToast('🎟️ 티켓 +2 (테스트 환경 — 임시 지급)'); return; }
          if (r.rewarded) { g.watchAdForTickets(); showToast('🎟️ 티켓 +2 적립!'); }
          else showToast('광고를 끝까지 봐야 보상을 받아요');
        }}
        onExchange={() => { const ok = g.exchangeTicket(200); showToast(ok ? '🎟️ 티켓 1개 교환' : '💎 포인트 부족(200P)'); }}
        onReset={() => { g.reset(); setSheet(null); setPhase('idle'); setOutcome(null); setRevealed([]); showToast('초기화했어요'); }}
        onMute={g.toggleMute} />
    </View>
  );
}

/* ===== 공 (등장 애니메이션) ===== */
function Ball({ n, hit, bonus }: { n: number; hit: boolean; bonus: boolean }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.ball, bonus && styles.ballBonus, hit && styles.ballHit, { transform: [{ scale }] }]}>
      <Text style={styles.ballTx}>{n}</Text>
      {hit && <View style={styles.check}><Text style={styles.checkTx}>✓</Text></View>}
    </Animated.View>
  );
}

/* ===== 바텀시트 ===== */
function Sheet({ id, state, onClose, onWatchAd, onExchange, onReset, onMute }: {
  id: SheetId; state: ReturnType<typeof useGame>['state']; onClose: () => void;
  onWatchAd: () => void; onExchange: () => void; onReset: () => void; onMute: () => void;
}) {
  if (id === null) return null;
  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {id === 'odds' && <>
            <Text style={styles.sheetH}>당첨 등급 · 확률 🎯</Text>
            <Text style={styles.sheetD}>1~45 중 6개를 골라 추첨 6개 + 보너스 1개와 비교해요. 무료 · 포인트 현금 환전 불가(사행성 없음).</Text>
            {TIER_TABLE.map((t) => (
              <View key={t.rank} style={styles.row}>
                <Text style={[styles.rowN, { flex: 1.3 }]}>{t.emoji} {t.rank}</Text>
                <Text style={[styles.rowM, { flex: 1.3 }]}>{t.cond}</Text>
                <Text style={[styles.rowProb, { flex: 1.2 }]}>{t.prob}</Text>
                <Text style={[styles.rowPt, { flex: 1 }]}>{t.points.toLocaleString()}P</Text>
              </View>
            ))}
            <Text style={styles.note}>· 위 확률은 실제 추첨과 동일해요(정통 6/45).</Text>
          </>}

          {id === 'ach' && <>
            <Text style={styles.sheetH}>도전과제 🏅 {ACHIEVEMENTS.filter((a) => state.achs[a.id]).length}/{ACHIEVEMENTS.length}</Text>
            {ACHIEVEMENTS.map((a) => {
              const done = !!state.achs[a.id];
              const rw = a.reward.points ? `${a.reward.points.toLocaleString()}P` : `🎟️${a.reward.tickets}`;
              return (
                <View key={a.id} style={styles.ach}>
                  <View style={[styles.achIc, done && styles.achIcOn]}><Text style={{ fontSize: 20 }}>{done ? a.icon : '🔒'}</Text></View>
                  <View style={{ flex: 1 }}><Text style={styles.achT}>{a.title}</Text><Text style={styles.achS}>{a.desc} · 보상 {rw}</Text></View>
                  <Text style={[styles.badge, done ? styles.badgeDone : styles.badgeTodo]}>{done ? '완료' : '도전'}</Text>
                </View>
              );
            })}
          </>}

          {id === 'rank' && (() => {
            const board = [...BOTS.map(([nm, sc]) => ({ nm, sc, me: false })), { nm: '나', sc: state.points, me: true }].sort((a, b) => b.sc - a.sc);
            const myRank = board.findIndex((x) => x.me) + 1;
            return <>
              <Text style={styles.sheetH}>랭킹 📈 내 순위 {myRank}위</Text>
              <Text style={styles.sheetD}>누적 포인트 순위 (지금은 로컬/모의 — 출시 땐 토스 리더보드로 전국 랭킹 연동 예정).</Text>
              {board.map((x, i) => (
                <View key={i} style={[styles.rk, x.me && styles.rkMe]}>
                  <Text style={styles.rkRank}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</Text>
                  <Text style={styles.rkNm}>{x.nm}</Text><Text style={styles.rkSc}>{x.sc.toLocaleString()}P</Text>
                </View>
              ))}
            </>;
          })()}

          {id === 'recharge' && <>
            <Text style={styles.sheetH}>티켓 충전 🎫</Text>
            <Text style={styles.sheetD}>티켓이 없어도 괜찮아요. 광고를 보거나 포인트로 바꿀 수 있어요. (10분마다 1개 자동 충전)</Text>
            <TouchableOpacity style={styles.adbtn} onPress={onWatchAd}><Text style={styles.adbtnTx}>📺 광고 보고 티켓 +2</Text></TouchableOpacity>
            <TouchableOpacity style={styles.exbtn} onPress={onExchange}><Text style={styles.exbtnTx}>💎 200P → 🎟️ 티켓 1개</Text></TouchableOpacity>
            <Text style={styles.note}>실제 앱에선 토스 보상형 광고 SDK로 동작해요(여기선 모의).</Text>
          </>}

          {id === 'more' && <>
            <Text style={styles.sheetH}>더보기 ⚙️</Text>
            <View style={styles.ach}><View style={styles.achIc}><Text style={{ fontSize: 20 }}>{state.muted ? '🔇' : '🔊'}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.achT}>효과(진동)</Text><Text style={styles.achS}>추첨·당첨 진동 피드백</Text></View>
              <Text style={[styles.badge, state.muted ? styles.badgeTodo : styles.badgeDone]} onPress={onMute}>{state.muted ? '꺼짐' : '켜짐'}</Text></View>
            <View style={styles.ach}><View style={styles.achIc}><Text style={{ fontSize: 20 }}>↺</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.achT}>기록 초기화</Text><Text style={styles.achS}>포인트·티켓·도전과제 리셋</Text></View>
              <Text style={[styles.badge, styles.badgeTodo]} onPress={onReset}>초기화</Text></View>
            <Text style={[styles.sheetH, { fontSize: 16, marginTop: 16 }]}>최근 기록 🧾</Text>
            {state.history.length === 0 ? <Text style={styles.note}>아직 추첨 기록이 없어요.</Text> :
              state.history.slice(0, 8).map((h, i) => (
                <View key={i} style={styles.row}>
                  <Text style={[styles.rowN, { flex: 1.4 }]}>{h.emoji} {h.rank > 0 ? h.label : h.matches + '개'}</Text>
                  <Text style={[styles.rowM, { flex: 1.4 }]}>{h.t}</Text>
                  <Text style={[styles.rowPt, { flex: 1 }]}>{h.points > 0 ? '+' + h.points.toLocaleString() + 'P' : '-'}</Text>
                </View>
              ))}
          </>}

          <TouchableOpacity style={styles.close} onPress={onClose}><Text style={styles.closeTx}>닫기</Text></TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const G = { brand: PALETTE.brand, ink: PALETTE.ink, muted: PALETTE.muted, gold: '#FF9F45' };
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#EEE7FF' },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: SCREEN_PAD, paddingBottom: 30 },
  glass: { backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  statusbar: { flexDirection: 'row', gap: 10, marginBottom: 12, marginTop: 4 },
  chip: { flex: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipIc: { fontSize: 18 }, chipV: { fontSize: 15, fontWeight: '800', color: G.ink }, chipL: { fontSize: 10.5, color: G.muted, fontWeight: '600' },
  headrow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  h1: { fontSize: 24, fontWeight: '800', color: G.brand }, sub: { fontSize: 12.5, color: G.muted, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  dailyBtn: { paddingHorizontal: 12, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  dailyOn: { backgroundColor: '#FF7AD9' }, dailyTx: { fontSize: 12, fontWeight: '800', color: G.brand },
  stage: { borderRadius: 24, padding: 18, marginBottom: 12, minHeight: 150, alignItems: 'center', justifyContent: 'center' },
  ph: { color: G.muted, fontWeight: '600', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  balls: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center', justifyContent: 'center' },
  ball: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C5CFF' },
  ballBonus: { backgroundColor: '#2FB39A' }, ballHit: { backgroundColor: '#FF9F45' },
  ballTx: { color: '#fff', fontWeight: '800', fontSize: 16 },
  check: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#1FAE78', alignItems: 'center', justifyContent: 'center' },
  checkTx: { color: '#fff', fontSize: 9, fontWeight: '900' },
  plus: { fontSize: 18, fontWeight: '800', color: G.muted, marginHorizontal: 2 },
  verdict: { alignItems: 'center' },
  vEm: { fontSize: 44 }, vGr: { fontSize: 21, fontWeight: '800', color: G.ink, marginTop: 2 }, vPt: { fontSize: 18, fontWeight: '800', color: G.brand },
  near: { fontSize: 13, color: G.gold, fontWeight: '800', marginTop: 4 },
  shareBtn: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(124,92,255,0.12)' },
  shareTx: { color: G.brand, fontWeight: '800', fontSize: 13 },
  panel: { borderRadius: 20, padding: PANEL_PAD, marginBottom: 12 },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  panelT: { fontSize: 13.5, fontWeight: '800', color: G.ink }, panelC: { fontSize: 12.5, fontWeight: '800', color: G.brand },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  num: { width: CELL, height: CELL, borderRadius: CELL / 2, backgroundColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  numOn: { backgroundColor: '#7C5CFF' }, numDim: { opacity: 0.38 }, numTx: { fontWeight: '800', fontSize: 13, color: G.ink },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { borderRadius: 17, paddingVertical: 15, alignItems: 'center' },
  ghost: { flex: 1, backgroundColor: 'rgba(255,255,255,0.6)' }, ghostTx: { color: G.brand, fontWeight: '800', fontSize: 15 },
  primary: { flex: 1.7, backgroundColor: '#7C5CFF' }, primaryTx: { color: '#fff', fontWeight: '800', fontSize: 15.5 }, btnOff: { backgroundColor: '#C9C3E6' },
  nav: { flexDirection: 'row', gap: 7, marginTop: 14 },
  navBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  navIc: { fontSize: 18, marginBottom: 2 }, navTx: { fontSize: 11, fontWeight: '800', color: G.ink },
  toast: { position: 'absolute', bottom: 28, alignSelf: 'center', backgroundColor: 'rgba(42,33,80,0.95)', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 },
  toastTx: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,30,70,0.4)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '86%', backgroundColor: 'rgba(255,255,255,0.97)', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 30 },
  sheetH: { fontSize: 19, fontWeight: '800', color: G.ink, marginBottom: 4 }, sheetD: { fontSize: 12.5, color: G.muted, marginBottom: 14, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(124,92,255,0.12)' },
  rowN: { fontWeight: '800', fontSize: 14, color: G.ink }, rowM: { fontSize: 12.5, color: G.muted, fontWeight: '600' },
  rowProb: { fontSize: 11, color: G.muted, fontWeight: '700', textAlign: 'right' }, rowPt: { fontWeight: '800', color: G.brand, fontSize: 13.5, textAlign: 'right' },
  ach: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(124,92,255,0.12)' },
  achIc: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,92,255,0.1)' }, achIcOn: { backgroundColor: '#FFD56B' },
  achT: { fontWeight: '800', fontSize: 14, color: G.ink }, achS: { fontSize: 11.5, color: G.muted, marginTop: 1 },
  badge: { fontSize: 11, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  badgeDone: { backgroundColor: 'rgba(255,159,69,0.18)', color: '#E07A1F' }, badgeTodo: { backgroundColor: 'rgba(124,92,255,0.1)', color: G.brand },
  rk: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12 },
  rkMe: { backgroundColor: 'rgba(124,92,255,0.12)' }, rkRank: { width: 30, fontWeight: '800', fontSize: 15, textAlign: 'center', color: G.ink },
  rkNm: { flex: 1, fontWeight: '700', fontSize: 14, color: G.ink }, rkSc: { fontWeight: '800', color: G.brand, fontSize: 13.5 },
  adbtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#2FB39A', marginBottom: 10 }, adbtnTx: { color: '#fff', fontWeight: '800', fontSize: 14 },
  exbtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(124,92,255,0.1)' }, exbtnTx: { color: G.brand, fontWeight: '800', fontSize: 14 },
  note: { fontSize: 11.5, color: G.muted, marginTop: 12, lineHeight: 17 },
  close: { marginTop: 18, borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: '#7C5CFF' }, closeTx: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
