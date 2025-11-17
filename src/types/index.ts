export interface Market {
  address: string;
  matchDetails: string;
  matchStartTime: number;
  status: 'LIVE' | 'UPCOMING' | 'RESOLVED';
  currentEpoch: number;
  totalVolume: string;
  teamAName: string;
  teamBName: string;
}

export interface EpochData {
  index: number;
  totalStake: number;
  isResolved: boolean;
  winningOutcome?: number;
  outcomes: {
    [key: number]: number;
  };
}

export interface BetReceipt {
  tokenId: number;
  marketAddress: string;
  eventType: number;
  epochIndex: number;
  outcome: number;
  stakeAmount: string;
  claimed: boolean;
}

// Use object literals instead of const enum
export const EventType = {
  GOAL: 0,
  CARD: 1,
} as const;

export const GoalOutcome = {
  TEAM_A: 0,
  TEAM_B: 1,
} as const;

export const CardOutcome = {
  NO_CARDS: 0,
  YES_CARDS: 1,
} as const;

export interface EpochOutcome {
  percentage: number;
  payout: number;
}

export interface MarketStats {
  totalVolume: string;
  activeMarkets: number;
  totalPredictions: number;
}

// Web3 types
export interface Web3State {
  address?: string;
  isConnected: boolean;
}