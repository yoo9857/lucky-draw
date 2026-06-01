/**
 * 영속화 추상화.
 *
 * 상위(화면)는 GameRepository 인터페이스에만 의존한다. 저장 백엔드
 * (인메모리 / AsyncStorage / 앱인토스 storage SDK / 서버)는 갈아끼워도
 * 게임 로직은 영향받지 않는다.
 *
 * MVP: InMemoryStore. 운영: KeyValueStore 구현체만 교체.
 * 랭킹/티켓 검증은 서버 전환 시 서버 권위로 옮긴다(클라 조작 방지).
 */

import { type GameState, freshState } from './gamestate';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export class InMemoryStore implements KeyValueStore {
  private map = new Map<string, string>();
  async getItem(key: string): Promise<string | null> {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
}

const STORAGE_KEY = 'lucky-draw/state/v2';

export class GameRepository {
  constructor(private store: KeyValueStore = new InMemoryStore()) {}

  async load(now: number): Promise<GameState> {
    const raw = await this.store.getItem(STORAGE_KEY);
    if (!raw) return freshState(now);
    try {
      return { ...freshState(now), ...(JSON.parse(raw) as Partial<GameState>) };
    } catch {
      return freshState(now);
    }
  }

  async save(state: GameState): Promise<void> {
    await this.store.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
