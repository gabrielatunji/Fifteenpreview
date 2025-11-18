export type EpochStatus = 'Upcoming' | 'Open' | 'Paused' | 'Closed' | 'Resolved';

export function computeEpochFromStart(matchStartTime?: number): { epoch: number | null; status: EpochStatus } {
  if (!matchStartTime) return { epoch: null, status: 'Closed' };
  const now = Math.floor(Date.now() / 1000);
  const diffMinutes = (now - matchStartTime) / 60;

  // Epoch windows relative to matchStartTime in minutes:
  // Epoch 1: [-15, 0)
  // Epoch 2: [0, 15)
  // Epoch 3: [15, 30)
  // Epoch 4: [30, 45) -> Paused
  // Epoch 5: [45, 60)
  // Epoch 6: [60, 75)

  if (diffMinutes < -15) return { epoch: null, status: 'Upcoming' };
  if (diffMinutes >= -15 && diffMinutes < 0) return { epoch: 1, status: 'Open' };
  if (diffMinutes >= 0 && diffMinutes < 15) return { epoch: 2, status: 'Open' };
  if (diffMinutes >= 15 && diffMinutes < 30) return { epoch: 3, status: 'Open' };
  if (diffMinutes >= 30 && diffMinutes < 45) return { epoch: 4, status: 'Paused' };
  if (diffMinutes >= 45 && diffMinutes < 60) return { epoch: 5, status: 'Open' };
  if (diffMinutes >= 60 && diffMinutes < 75) return { epoch: 6, status: 'Open' };

  return { epoch: null, status: 'Closed' };
}

export interface MarketLike {
  id: string;
  team1: string;
  team2: string;
  image: string;
  matchStartTime?: number;
  status?: 'live' | 'upcoming' | 'resolved';
}

export function derivePageCategory(market: MarketLike): 'live' | 'upcoming' | 'resolved' {
  if (market.status === 'resolved') return 'resolved';
  if (market.matchStartTime) {
    const { status } = computeEpochFromStart(market.matchStartTime);
    if (status === 'Upcoming') return 'upcoming';
    if (status === 'Open' || status === 'Paused' || status === 'Closed') return 'live';
    return 'live';
  }
  // fallback to explicit status or upcoming
  if (market.status === 'live') return 'live';
  if (market.status === 'upcoming') return 'upcoming';
  return 'resolved';
}
