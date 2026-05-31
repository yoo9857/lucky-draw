/**
 * 영속화 추상화.
 *
 * 스펙 격리 원칙: 상위(화면) 코드는 GameRepository 인터페이스에만 의존한다.
 * 저장 백엔드(인메모리 / AsyncStorage / 앱인토스 storage SDK)는 갈아끼워도
 * 화면 코드에 영향이 없다.
 *
 * - MVP/샌드박스: InMemoryStore (앱 재시작 시 초기화)
 * - 운영: 앱인토스 storage SDK(with-storage 예시)나 AsyncStorage 로 KeyValueStore
 *   구현체만 교체.  ↓ TODO 참고
 */

import type { Grade } from './odds';

export interface DrawRecord {
  dateKey: string;
  grade: Grade;
  points: number;
}

export interface GameState {
  totalPoints: number;
  streak: number;
  lastDrawKey: string | null;
  history: DrawRecord[];
}

export const INITIAL_STATE: GameState = {
  totalPoints: 0,
  streak: 0,
  lastDrawKey: null,
  history: [],
};

/** 단순 key-value 저장소 인터페이스 (백엔드 교체 지점). */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/** 인메모리 구현 — 의존성 없이 동작. MVP/테스트용. */
export class InMemoryStore implements KeyValueStore {
  private map = new Map<string, string>();
  async getItem(key: string): Promise<string | null> {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
}

const STORAGE_KEY = 'lucky-draw/state/v1';

/** 게임 상태 저장/로드 리포지토리. */
export class GameRepository {
  constructor(private store: KeyValueStore = new InMemoryStore()) {}

  async load(): Promise<GameState> {
    const raw = await this.store.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_STATE };
    try {
      return { ...INITIAL_STATE, ...(JSON.parse(raw) as Partial<GameState>) };
    } catch {
      // 손상된 데이터는 초기 상태로 복구(앱이 죽지 않게)
      return { ...INITIAL_STATE };
    }
  }

  async save(state: GameState): Promise<void> {
    await this.store.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

/*
 * TODO(운영 전환): 아래처럼 실제 저장소로 교체.
 *
 *   import AsyncStorage from '@react-native-async-storage/async-storage';
 *   const repo = new GameRepository(AsyncStorage);
 *
 * 또는 앱인토스 storage SDK 래퍼로 KeyValueStore 구현.
 * 단, 일일 1회 제한·랭킹은 v2 에서 반드시 서버에서 검증(클라 조작 방지).
 */
