/**
 * useGame — 게임 상태 + 행동(뽑기)을 캡슐화한 훅.
 *
 * 화면(UI)은 이 훅만 쓰면 되고, 추첨/연속출석/저장 같은 규칙은 모두 여기에 모인다.
 * 규칙(순수함수)과 부수효과(저장)를 분리해 테스트·교체가 쉽다.
 */

import { useCallback, useEffect, useState } from 'react';
import { drawPrize, applyStreakBonus, type Rng } from './draw';
import { computeStreak, toDateKey } from './streak';
import { GameRepository, type GameState, INITIAL_STATE, type DrawRecord } from './storage';
import type { Prize } from './odds';

// MVP: 앱 생애주기 동안 공유되는 단일 리포지토리(인메모리).
// 운영 전환 시 여기서 실제 저장소 구현체를 주입한다.
const repo = new GameRepository();

export interface DrawOutcome {
  prize: Prize;
  earnedPoints: number; // 보너스 적용 후
}

export interface UseGame {
  ready: boolean;
  state: GameState;
  alreadyDrawnToday: boolean;
  lastOutcome: DrawOutcome | null;
  draw: () => Promise<DrawOutcome | null>;
}

export function useGame(now: () => Date = () => new Date(), rng: Rng = Math.random): UseGame {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [lastOutcome, setLastOutcome] = useState<DrawOutcome | null>(null);

  useEffect(() => {
    let mounted = true;
    repo.load().then((loaded) => {
      if (mounted) {
        setState(loaded);
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const todayKey = toDateKey(now());
  const alreadyDrawnToday = state.lastDrawKey === todayKey;

  const draw = useCallback(async (): Promise<DrawOutcome | null> => {
    // 일일 1회 제한 (사행성/과몰입 방지). 이미 뽑았으면 차단.
    const check = computeStreak(state.lastDrawKey, state.streak, todayKey);
    if (check.alreadyDrawnToday) {
      return null;
    }

    const prize = drawPrize(rng);
    const earnedPoints = applyStreakBonus(prize.points, check.streak);
    const record: DrawRecord = { dateKey: todayKey, grade: prize.grade, points: earnedPoints };

    const next: GameState = {
      totalPoints: state.totalPoints + earnedPoints,
      streak: check.streak,
      lastDrawKey: todayKey,
      history: [record, ...state.history].slice(0, 100), // 최근 100건 보관
    };

    setState(next);
    const outcome: DrawOutcome = { prize, earnedPoints };
    setLastOutcome(outcome);
    await repo.save(next); // 부수효과는 마지막에
    return outcome;
  }, [state, todayKey, rng]);

  return { ready, state, alreadyDrawnToday, lastOutcome, draw };
}
