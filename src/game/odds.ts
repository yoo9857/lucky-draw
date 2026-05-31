/**
 * 확률표 — 단일 진실 공급원(Single Source of Truth).
 *
 * 이 표 하나가 (1) 추첨 로직과 (2) 확률 고지 화면을 동시에 구동한다.
 * 따라서 "표시 확률 ≠ 실제 확률" 같은 사기 가능성이 구조적으로 차단된다.
 *
 * 사행성 회피: 보상은 게임 내 행운 포인트(현금 환전 불가)뿐이다.
 */

export type Grade = 'JACKPOT' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FIFTH' | 'MISS';

export interface Prize {
  grade: Grade;
  label: string; // 사용자 표시용
  emoji: string;
  /** 당첨 확률(%) — 모든 prize 의 합은 반드시 100 */
  probability: number;
  /** 획득 행운 포인트 (환전 불가) */
  points: number;
}

export const PRIZES: readonly Prize[] = [
  { grade: 'JACKPOT', label: '잭팟', emoji: '🏆', probability: 0.1, points: 1000 },
  { grade: 'SECOND', label: '2등', emoji: '🥇', probability: 1.0, points: 300 },
  { grade: 'THIRD', label: '3등', emoji: '🥈', probability: 5.0, points: 100 },
  { grade: 'FOURTH', label: '4등', emoji: '🥉', probability: 20.0, points: 30 },
  { grade: 'FIFTH', label: '5등', emoji: '🎟️', probability: 40.0, points: 10 },
  { grade: 'MISS', label: '꽝', emoji: '💨', probability: 33.9, points: 0 },
] as const;

/** 확률 합계(런타임/테스트 검증용). 100 이어야 한다. */
export function totalProbability(): number {
  return PRIZES.reduce((sum, p) => sum + p.probability, 0);
}
