// Contract constants
export const PROTOCOL_FEE_BPS = 200; // 2%
export const EPOCH_DURATION = 15 * 60; // 15 minutes in seconds
export const HALFTIME_BREAK_DURATION = 15 * 60; // 15 minutes
export const HALFTIME_START_EPOCH = 3; // After 3 epochs (45 minutes)

// Event Type constants
export const EVENT_TYPES = {
  GOAL: 0,
  CARD: 1,
} as const;

// Goal Outcomes
export const GOAL_OUTCOMES = {
  TEAM_A: 0,
  TEAM_B: 1,
  GOAL: 2,
  NO_GOAL: 3,
} as const;

// Card Outcomes
export const CARD_OUTCOMES = {
  NO_CARDS: 0,
  YES_CARDS: 1,
} as const;

// Epoch periods for display
export const EPOCH_PERIODS = [
  '0-15 min',
  '15-30 min',
  '30-45 min',
  '45-60 min',
  '60-75 min',
  '75-90 min',
];

// Mock data for development
export const MOCK_MARKETS = [
  {
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    matchDetails: 'Aston Villa villa vs Everton',
    matchStartTime: Math.floor(Date.now() / 1000) + 3600,
    status: 'UPCOMING' as const,
    currentEpoch: 0,
    totalStaked: '4.3 ETH',
  },
  {
    address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    matchDetails: 'West Ham vs Leicester',
    matchStartTime: Math.floor(Date.now() / 1000) + 7200,
    status: 'UPCOMING' as const,
    currentEpoch: 0,
    totalStaked: '4.2 ETH',
  },
];