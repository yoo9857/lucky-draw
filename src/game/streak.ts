/**
 * 연속 출석(streak) 계산 — 순수함수.
 *
 * 날짜는 'YYYY-MM-DD' 문자열(로컬 자정 기준)로 비교한다.
 * Date 객체를 직접 만들지 않고 주입받아 테스트 가능성을 높인다.
 */

/** Date → 'YYYY-MM-DD' (로컬 기준) */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 두 날짜키의 일(day) 차이. b - a. */
export function dayDiff(aKey: string, bKey: string): number {
  const a = new Date(`${aKey}T00:00:00`);
  const b = new Date(`${bKey}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export interface StreakResult {
  /** 갱신된 연속 출석일 */
  streak: number;
  /** 오늘 이미 뽑았는지 */
  alreadyDrawnToday: boolean;
}

/**
 * 마지막 뽑은 날(lastDrawKey)과 오늘(todayKey)을 비교해 streak 를 갱신한다.
 * @param lastDrawKey 마지막 뽑은 날짜키 (없으면 null)
 * @param prevStreak  이전 streak
 */
export function computeStreak(
  lastDrawKey: string | null,
  prevStreak: number,
  todayKey: string,
): StreakResult {
  if (lastDrawKey === null) {
    return { streak: 1, alreadyDrawnToday: false };
  }
  const diff = dayDiff(lastDrawKey, todayKey);
  if (diff === 0) {
    return { streak: prevStreak, alreadyDrawnToday: true };
  }
  if (diff === 1) {
    return { streak: prevStreak + 1, alreadyDrawnToday: false }; // 연속
  }
  return { streak: 1, alreadyDrawnToday: false }; // 하루 이상 거름 → 리셋
}
