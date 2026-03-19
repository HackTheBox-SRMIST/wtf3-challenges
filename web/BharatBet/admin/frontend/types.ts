export enum GameStatus {
  WAITING = 'WAITING',
  FLYING = 'FLYING',
  CRASHED = 'CRASHED',
}

export interface User {
  username: string;
  balance: number;
  token?: string;
  avatar?: string;
  flags: string[];
}

export interface GameRound {
  id: string;
  seed: string;
  result: number;
  hash: string;
  startTime: number;
}

export interface Bet {
  userId: string;
  username: string;
  amount: number;
  cashOutMultiplier?: number;
  winAmount?: number;
  avatar?: string;
}

export interface HistoryItem {
  roundId: string;
  multiplier: number;
  seed: string;
}
