/**
 * 게임 상태 + 순수 리듀서.
 *
 * 부수효과(저장/난수/시간)는 바깥에서 주입하고, 여기서는 "현재 상태 + 입력 →
 * 다음 상태"만 계산한다. 덕분에 티켓 충전·데일리·도전과제 로직을 테스트할 수 있다.
 */

import { MAX_TICKETS, REFILL_MS, type Tier } from './lotto';
import { dayDiff } from './dates';

export interface DrawRecord {
  t: string;
  matches: number;
  bonusHit: boolean;
  rank: number;
  label: string;
  emoji: string;
  points: number;
}

export interface GameState {
  points: number;
  plays: number;
  bestMatch: number;
  tickets: number;
  lastRefill: number; // epoch ms
  streak: number;
  lastDaily: string | null; // dateKey
  achs: Record<string, boolean>;
  history: DrawRecord[];
  muted: boolean;
  onboarded: boolean;
}

export function freshState(now: number): GameState {
  return {
    points: 0, plays: 0, bestMatch: 0,
    tickets: MAX_TICKETS, lastRefill: now,
    streak: 0, lastDaily: null,
    achs: {}, history: [], muted: false, onboarded: false,
  };
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  reward: { points?: number; tickets?: number };
  test: (s: GameState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: '첫 도전', desc: '추첨 1회 하기', icon: '🎬', reward: { tickets: 1 }, test: (s) => s.plays >= 1 },
  { id: 'p10', title: '단골 손님', desc: '10회 플레이', icon: '🔁', reward: { points: 500 }, test: (s) => s.plays >= 10 },
  { id: 'm3', title: '5등 당첨', desc: '3개 맞히기', icon: '🎟️', reward: { points: 300 }, test: (s) => s.bestMatch >= 3 },
  { id: 'm4', title: '4등 당첨', desc: '4개 맞히기', icon: '🎖️', reward: { points: 1500 }, test: (s) => s.bestMatch >= 4 },
  { id: 'm5', title: '고수의 길', desc: '5개 맞히기', icon: '🥉', reward: { tickets: 3 }, test: (s) => s.bestMatch >= 5 },
  { id: 'jack', title: '잭팟!', desc: '6개 전부 맞히기', icon: '🏆', reward: { points: 1_000_000 }, test: (s) => s.bestMatch >= 6 },
  { id: 'st3', title: '삼일천하', desc: '3일 연속 출석', icon: '🔥', reward: { tickets: 2 }, test: (s) => s.streak >= 3 },
  { id: 'st7', title: '개근상', desc: '7일 연속 출석', icon: '🌟', reward: { tickets: 5 }, test: (s) => s.streak >= 7 },
];

export const BOTS: [string, number][] = [
  ['행운왕', 2_300_000], ['로또요정', 780_000], ['클로버킹', 410_000],
  ['숫자술사', 155_000], ['네잎클로버', 62_000], ['오늘의별', 18_500],
  ['행운초보', 4_200], ['뉴비', 600],
];

/** 시간이 지난 만큼 티켓을 충전한 새 상태. */
export function refillTickets(s: GameState, now: number): GameState {
  if (s.tickets >= MAX_TICKETS) return { ...s, lastRefill: now };
  const gained = Math.floor((now - s.lastRefill) / REFILL_MS);
  if (gained <= 0) return s;
  const tickets = Math.min(MAX_TICKETS, s.tickets + gained);
  const lastRefill = tickets >= MAX_TICKETS ? now : s.lastRefill + gained * REFILL_MS;
  return { ...s, tickets, lastRefill };
}

/** 다음 티켓까지 남은 초 (가득이면 0). GameState 의 일부만 받아도 동작. */
export function ticketSecondsLeft(s: Pick<GameState, 'tickets' | 'lastRefill'>, now: number): number {
  if (s.tickets >= MAX_TICKETS) return 0;
  const elapsed = (now - s.lastRefill) % REFILL_MS;
  return Math.ceil((REFILL_MS - elapsed) / 1000);
}

/** 추첨 결과를 상태에 반영(티켓 차감, 포인트/기록/최고기록 갱신). */
export function recordDraw(
  s: GameState, tier: Tier, matches: number, bonusHit: boolean, nowStr: string, spendTicket: boolean,
): GameState {
  const rec: DrawRecord = {
    t: nowStr, matches, bonusHit, rank: tier.rank, label: tier.label, emoji: tier.emoji, points: tier.points,
  };
  return {
    ...s,
    tickets: spendTicket ? Math.max(0, s.tickets - 1) : s.tickets,
    points: s.points + tier.points,
    plays: s.plays + 1,
    bestMatch: Math.max(s.bestMatch, matches),
    history: [rec, ...s.history].slice(0, 20),
  };
}

export interface DailyReward { tickets: number; points: number; streak: number; }

/** 데일리 보상 수령. 이미 오늘 받았으면 null. */
export function claimDaily(s: GameState, todayKey: string): { state: GameState; reward: DailyReward } | null {
  if (s.lastDaily === todayKey) return null;
  const streak = s.lastDaily !== null && dayDiff(s.lastDaily, todayKey) === 1 ? s.streak + 1 : 1;
  const tickets = Math.min(5, 2 + Math.floor(streak / 3));
  const points = 50 * streak;
  const next: GameState = {
    ...s,
    streak,
    lastDaily: todayKey,
    tickets: Math.min(MAX_TICKETS, s.tickets + tickets),
    points: s.points + points,
  };
  return { state: next, reward: { tickets, points, streak } };
}

/** 달성 조건을 만족한 미획득 도전과제를 처리하고 보상을 합산. */
export function checkAchievements(s: GameState): { state: GameState; unlocked: Achievement[] } {
  let next = { ...s, achs: { ...s.achs } };
  const unlocked: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!next.achs[a.id] && a.test(next)) {
      next.achs[a.id] = true;
      if (a.reward.points) next.points += a.reward.points;
      if (a.reward.tickets) next.tickets = Math.min(MAX_TICKETS, next.tickets + a.reward.tickets);
      unlocked.push(a);
    }
  }
  return { state: next, unlocked };
}

/** 포인트로 티켓 1개 교환. 실패 시 null. */
export function buyTicketWithPoints(s: GameState, cost: number): GameState | null {
  if (s.tickets >= MAX_TICKETS || s.points < cost) return null;
  return { ...s, points: s.points - cost, tickets: s.tickets + 1 };
}
