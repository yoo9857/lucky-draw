import { PRIZES, totalProbability } from './odds';
import { drawPrize, applyStreakBonus } from './draw';
import { computeStreak, toDateKey, dayDiff } from './streak';

describe('odds', () => {
  it('확률 합계는 정확히 100 이어야 한다', () => {
    expect(totalProbability()).toBeCloseTo(100, 6);
  });
});

describe('drawPrize', () => {
  const seq = (values: number[]) => {
    let i = 0;
    return () => values[i++ % values.length]!;
  };

  it('roll 0 → 첫 등급(잭팟)', () => {
    expect(drawPrize(() => 0).grade).toBe('JACKPOT');
  });

  it('roll 0.999... → 마지막 등급(꽝)', () => {
    expect(drawPrize(() => 0.999999).grade).toBe('MISS');
  });

  it('경계값: 잭팟 확률 직후(0.1%)는 2등 구간', () => {
    // roll = 0.0011 * 100 = 0.11 > 0.1 → JACKPOT 다음 구간
    expect(drawPrize(() => 0.0011).grade).toBe('SECOND');
  });

  it('대량 시행 분포가 확률표와 근사해야 한다', () => {
    const N = 100_000;
    const rng = seq(Array.from({ length: 997 }, (_, i) => (i + 0.5) / 997));
    const counts: Record<string, number> = {};
    for (let i = 0; i < N; i++) {
      const g = drawPrize(rng).grade;
      counts[g] = (counts[g] ?? 0) + 1;
    }
    for (const p of PRIZES) {
      const observed = ((counts[p.grade] ?? 0) / N) * 100;
      expect(observed).toBeCloseTo(p.probability, 0); // ±0.5%p 이내
    }
  });
});

describe('applyStreakBonus', () => {
  it('streak 0 → 배율 1.0', () => {
    expect(applyStreakBonus(100, 0)).toBe(100);
  });
  it('streak 3 → +30%', () => {
    expect(applyStreakBonus(100, 3)).toBe(130);
  });
  it('streak 상한 7 (+70%) 초과해도 70% 유지', () => {
    expect(applyStreakBonus(100, 20)).toBe(170);
  });
});

describe('streak', () => {
  it('toDateKey/dayDiff 기본 동작', () => {
    expect(toDateKey(new Date('2026-05-31T09:00:00'))).toBe('2026-05-31');
    expect(dayDiff('2026-05-30', '2026-05-31')).toBe(1);
  });

  it('첫 출석 → streak 1', () => {
    expect(computeStreak(null, 0, '2026-05-31')).toEqual({
      streak: 1,
      alreadyDrawnToday: false,
    });
  });

  it('같은 날 재시도 → 이미 뽑음', () => {
    const r = computeStreak('2026-05-31', 3, '2026-05-31');
    expect(r.alreadyDrawnToday).toBe(true);
    expect(r.streak).toBe(3);
  });

  it('연속 다음날 → streak +1', () => {
    expect(computeStreak('2026-05-30', 3, '2026-05-31').streak).toBe(4);
  });

  it('하루 이상 거름 → streak 1 리셋', () => {
    expect(computeStreak('2026-05-28', 5, '2026-05-31').streak).toBe(1);
  });
});
