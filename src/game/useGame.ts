/**
 * useGame — 게임 상태 + 행동을 캡슐화한 훅.
 *
 * 화면은 이 훅만 쓰고, 규칙(순수 리듀서)과 부수효과(저장)는 여기서 합쳐진다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  drawLotto, countMatches, classify, type Rng, MAX_TICKETS,
} from './lotto';
import {
  type GameState, freshState, refillTickets, recordDraw, claimDaily as claimDailyReducer,
  checkAchievements, buyTicketWithPoints, type Achievement,
} from './gamestate';
import { toDateKey } from './dates';
import { GameRepository } from './storage';

const repo = new GameRepository();

export interface DrawOutcome {
  win: number[];
  bonus: number;
  matches: number;
  bonusHit: boolean;
  rank: number;
  label: string;
  emoji: string;
  points: number;
}

export function useGame(now: () => number = () => Date.now(), rng: Rng = Math.random) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<GameState>(() => freshState(now()));
  const stateRef = useRef(state);
  stateRef.current = state;

  const persist = useCallback((next: GameState) => {
    setState(next);
    stateRef.current = next;
    void repo.save(next);
  }, []);

  useEffect(() => {
    let mounted = true;
    repo.load(now()).then((loaded) => {
      if (mounted) {
        setState(refillTickets(loaded, now()));
        setReady(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  // 1초마다 티켓 충전 반영
  useEffect(() => {
    const id = setInterval(() => {
      const refilled = refillTickets(stateRef.current, now());
      if (refilled.tickets !== stateRef.current.tickets) persist(refilled);
      else setState({ ...stateRef.current }); // 타이머 표시 갱신
    }, 1000);
    return () => clearInterval(id);
  }, [persist]);

  const draw = useCallback((picks: number[]): DrawOutcome | null => {
    const cur = refillTickets(stateRef.current, now());
    if (cur.tickets <= 0) return null;
    const { win, bonus } = drawLotto(rng);
    const matches = countMatches(picks, win);
    const bonusHit = picks.includes(bonus);
    const tier = classify(matches, bonusHit);
    const nowStr = new Date(now()).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    let next = recordDraw(cur, tier, matches, bonusHit, nowStr, true);
    next = checkAchievements(next).state;
    persist(next);
    return { win, bonus, matches, bonusHit, rank: tier.rank, label: tier.label, emoji: tier.emoji, points: tier.points };
  }, [persist, rng]);

  const claimDaily = useCallback((): { tickets: number; points: number; streak: number } | null => {
    const res = claimDailyReducer(refillTickets(stateRef.current, now()), toDateKey(new Date(now())));
    if (!res) return null;
    persist(checkAchievements(res.state).state);
    return res.reward;
  }, [persist]);

  const watchAdForTickets = useCallback(() => {
    const cur = refillTickets(stateRef.current, now());
    persist({ ...cur, tickets: Math.min(MAX_TICKETS, cur.tickets + 2) });
  }, [persist]);

  const exchangeTicket = useCallback((cost: number): boolean => {
    const next = buyTicketWithPoints(refillTickets(stateRef.current, now()), cost);
    if (!next) return false;
    persist(next);
    return true;
  }, [persist]);

  const toggleMute = useCallback(() => {
    persist({ ...stateRef.current, muted: !stateRef.current.muted });
  }, [persist]);

  const markOnboarded = useCallback(() => {
    if (!stateRef.current.onboarded) persist({ ...stateRef.current, onboarded: true });
  }, [persist]);

  const reset = useCallback(() => { persist(freshState(now())); }, [persist]);

  const canClaimDaily = state.lastDaily !== toDateKey(new Date(now()));

  return {
    ready, state, canClaimDaily,
    draw, claimDaily, watchAdForTickets, exchangeTicket, toggleMute, markOnboarded, reset,
  };
}

export type { Achievement };
