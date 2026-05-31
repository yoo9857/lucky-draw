/**
 * 추첨 로직 — 가중 랜덤(weighted random) 순수함수.
 *
 * rng 를 주입받는다 → 시드 고정으로 결정적 테스트가 가능하고,
 * 대량 시행으로 실제 확률이 확률표와 일치하는지 검증할 수 있다.
 */

import { PRIZES, type Prize } from './odds';

/** [0, 1) 난수를 반환하는 함수. 기본은 Math.random. */
export type Rng = () => number;

/**
 * 확률표(PRIZES)에 따라 상품 하나를 추첨한다.
 * @param rng [0,1) 난수 생성기 (테스트 시 고정값 주입)
 */
export function drawPrize(rng: Rng = Math.random): Prize {
  // [0, 100) 구간에 누적 확률을 깔고, 난수가 떨어지는 구간을 선택한다.
  const roll = rng() * 100;
  let cumulative = 0;
  for (const prize of PRIZES) {
    cumulative += prize.probability;
    if (roll < cumulative) {
      return prize;
    }
  }
  // 확률 합계는 100 이라 루프 안에서 반드시 반환되지만,
  // 부동소수 오차로 마지막 경계를 못 넘는 극단적 경우의 폴백(꽝).
  return PRIZES[PRIZES.length - 1]!;
}

/**
 * 연속출석 보너스를 적용한 최종 포인트.
 * 배율 = 1 + min(streak, 7) * 0.1  (최대 +70%)
 */
export function applyStreakBonus(basePoints: number, streak: number): number {
  const multiplier = 1 + Math.min(Math.max(streak, 0), 7) * 0.1;
  return Math.round(basePoints * multiplier);
}
