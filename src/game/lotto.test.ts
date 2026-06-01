import { pickRandom, drawLotto, countMatches, classify, POOL, PICK } from './lotto';
import {
  freshState, refillTickets, ticketSecondsLeft, recordDraw, claimDaily, checkAchievements, buyTicketWithPoints,
} from './gamestate';
import { REFILL_MS, MAX_TICKETS } from './lotto';

const seq = (vals: number[]) => { let i = 0; return () => vals[i++ % vals.length]!; };

describe('lotto draw', () => {
  it('pickRandom: 중복 없이 count개, 범위 내, 정렬', () => {
    const r = pickRandom(45, 6, seq([0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.4]));
    expect(r).toHaveLength(6);
    expect(new Set(r).size).toBe(6);
    expect(Math.min(...r)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...r)).toBeLessThanOrEqual(45);
    expect([...r].sort((a, b) => a - b)).toEqual(r);
  });

  it('drawLotto: 메인 6 + 보너스 1, 보너스는 메인과 겹치지 않음', () => {
    const { win, bonus } = drawLotto(Math.random);
    expect(win).toHaveLength(PICK);
    expect(win).not.toContain(bonus);
    expect(POOL).toBe(45);
  });

  it('countMatches: 교집합 개수', () => {
    expect(countMatches([1, 2, 3, 4, 5, 6], [4, 5, 6, 7, 8, 9])).toBe(3);
  });
});

describe('classify (등급)', () => {
  it('6개 → 1등', () => expect(classify(6, false).rank).toBe(1));
  it('5개+보너스 → 2등', () => expect(classify(5, true).rank).toBe(2));
  it('5개 → 3등', () => expect(classify(5, false).rank).toBe(3));
  it('4개 → 4등', () => expect(classify(4, false).rank).toBe(4));
  it('3개 → 5등', () => expect(classify(3, false).rank).toBe(5));
  it('2개 → 꽝', () => expect(classify(2, false).rank).toBe(0));
});

describe('tickets', () => {
  it('시간 경과만큼 충전, 최대 초과 안 함', () => {
    const s = { ...freshState(0), tickets: 1, lastRefill: 0 };
    const r = refillTickets(s, REFILL_MS * 2);
    expect(r.tickets).toBe(3);
    const full = refillTickets({ ...s, tickets: 4 }, REFILL_MS * 10);
    expect(full.tickets).toBe(MAX_TICKETS);
  });
  it('가득이면 남은 시간 0', () => {
    expect(ticketSecondsLeft({ ...freshState(0), tickets: MAX_TICKETS }, 0)).toBe(0);
  });
});

describe('recordDraw', () => {
  it('티켓 차감 + 포인트/최고기록/기록 갱신', () => {
    const s = { ...freshState(0), tickets: 3, points: 100 };
    const tier = classify(3, false); // 5등 100P
    const n = recordDraw(s, tier, 3, false, '1/1 00:00', true);
    expect(n.tickets).toBe(2);
    expect(n.points).toBe(200);
    expect(n.bestMatch).toBe(3);
    expect(n.plays).toBe(1);
    expect(n.history).toHaveLength(1);
  });
});

describe('claimDaily / streak', () => {
  it('첫 수령 → streak 1', () => {
    const res = claimDaily(freshState(0), '2026-06-01');
    expect(res?.reward.streak).toBe(1);
  });
  it('연속 다음날 → streak +1', () => {
    const s = { ...freshState(0), lastDaily: '2026-05-31', streak: 4 };
    expect(claimDaily(s, '2026-06-01')?.reward.streak).toBe(5);
  });
  it('이미 오늘 받음 → null', () => {
    const s = { ...freshState(0), lastDaily: '2026-06-01' };
    expect(claimDaily(s, '2026-06-01')).toBeNull();
  });
});

describe('achievements', () => {
  it('첫 플레이 후 first 달성 + 보상', () => {
    const s = { ...freshState(0), plays: 1, tickets: 2 };
    const { state, unlocked } = checkAchievements(s);
    expect(unlocked.map((a) => a.id)).toContain('first');
    expect(state.tickets).toBe(3); // first 보상 티켓 +1
    expect(state.achs.first).toBe(true);
  });
  it('이미 달성한 건 중복 보상 안 줌', () => {
    const s = { ...freshState(0), plays: 1, achs: { first: true }, tickets: 2 };
    expect(checkAchievements(s).unlocked).toHaveLength(0);
  });
});

describe('buyTicketWithPoints', () => {
  it('포인트 충분하면 교환', () => {
    const s = { ...freshState(0), points: 500, tickets: 2 };
    const n = buyTicketWithPoints(s, 200);
    expect(n?.points).toBe(300);
    expect(n?.tickets).toBe(3);
  });
  it('포인트 부족/가득이면 null', () => {
    expect(buyTicketWithPoints({ ...freshState(0), points: 50 }, 200)).toBeNull();
    expect(buyTicketWithPoints({ ...freshState(0), points: 999, tickets: MAX_TICKETS }, 200)).toBeNull();
  });
});
