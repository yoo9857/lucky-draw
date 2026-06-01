/**
 * 로또 6/45 핵심 로직 — 순수함수(RNG 주입 → 결정적 테스트 가능).
 *
 * 메인 6개 + 보너스 1개를 뽑고, 사용자가 고른 6개와 비교해 등급을 정한다.
 * 등급/확률표는 단일 소스로, UI 고지 화면과 추첨 판정이 같은 정의를 쓴다.
 */

export const POOL = 45;
export const PICK = 6;
export const MAX_TICKETS = 5;
export const REFILL_MS = 10 * 60 * 1000; // 10분당 티켓 1개

export type Rng = () => number;

export interface Tier {
  rank: number; // 0 = 꽝
  label: string;
  emoji: string;
  points: number;
}

/** 맞은 개수(+보너스)로 등급 판정. 정통 6/45 규칙. */
export function classify(matches: number, bonusHit: boolean): Tier {
  if (matches === 6) return { rank: 1, label: '1등 잭팟', emoji: '🏆', points: 1_000_000 };
  if (matches === 5 && bonusHit) return { rank: 2, label: '2등', emoji: '🥈', points: 50_000 };
  if (matches === 5) return { rank: 3, label: '3등', emoji: '🥉', points: 5_000 };
  if (matches === 4) return { rank: 4, label: '4등', emoji: '🎖️', points: 1_000 };
  if (matches === 3) return { rank: 5, label: '5등', emoji: '🎟️', points: 100 };
  return { rank: 0, label: '꽝', emoji: '💨', points: 0 };
}

/** 등급 고지표 (실제 6/45 당첨 확률 포함 — 확률형 콘텐츠 표시 의무 충족) */
export const TIER_TABLE: { rank: string; cond: string; prob: string; points: number; emoji: string }[] = [
  { rank: '1등', cond: '6개 일치', prob: '1 / 8,145,060', points: 1_000_000, emoji: '🏆' },
  { rank: '2등', cond: '5개 + 보너스', prob: '1 / 1,357,510', points: 50_000, emoji: '🥈' },
  { rank: '3등', cond: '5개 일치', prob: '1 / 35,724', points: 5_000, emoji: '🥉' },
  { rank: '4등', cond: '4개 일치', prob: '1 / 733', points: 1_000, emoji: '🎖️' },
  { rank: '5등', cond: '3개 일치', prob: '1 / 45', points: 100, emoji: '🎟️' },
  { rank: '꽝', cond: '2개 이하', prob: '약 95.8%', points: 0, emoji: '💨' },
];

/** 1..pool 중 count개를 중복 없이 뽑아 오름차순 반환 (Fisher–Yates). */
export function pickRandom(pool: number, count: number, rng: Rng = Math.random): number[] {
  const a = Array.from({ length: pool }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a.slice(0, count).sort((x, y) => x - y);
}

export interface DrawResult {
  win: number[]; // 당첨 메인 6개 (정렬됨)
  bonus: number; // 보너스 1개
}

/** 메인 6개 + 보너스 1개를 한 번에 뽑는다(서로 중복 없음). */
export function drawLotto(rng: Rng = Math.random): DrawResult {
  const all = pickRandom(POOL, PICK + 1, rng);
  return { win: all.slice(0, PICK).sort((a, b) => a - b), bonus: all[PICK]! };
}

/** 사용자 번호와 당첨 메인 번호의 일치 개수. */
export function countMatches(user: number[], win: number[]): number {
  const s = new Set(win);
  return user.filter((n) => s.has(n)).length;
}
