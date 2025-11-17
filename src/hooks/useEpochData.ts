import { useState, useEffect } from 'react';
import { EPOCHAL_MATCH_MARKET_ABI } from '../contracts/abi';
import { usePublicClient } from 'wagmi';
import type { Market, EpochOutcome } from '../types';

// Use the EventType from your types
import { EventType } from '../types';

const EPOCH_DURATION = 15 * 60;
const TOTAL_EPOCHS = 6;

// Define interfaces that extend your existing types
export interface EpochData {
  index: number;
  period: string;
  status: 'Open' | 'Passed' | 'Upcoming';
  outcomes: {
    goal: {
      teamA: EpochOutcome & { stake: number };
      teamB: EpochOutcome & { stake: number };
      totalStake: number;
      resolved: boolean;
      winningOutcome: number;
    };
    card: {
      noCard: EpochOutcome & { stake: number };
      yesCard: EpochOutcome & { stake: number };
      totalStake: number;
      resolved: boolean;
      winningOutcome: number;
    };
  };
}

export const useEpochData = (market: Market | null) => {
  const [epochs, setEpochs] = useState<EpochData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const publicClient = usePublicClient();

  const fetchEpochData = async (): Promise<EpochData[]> => {
    if (!publicClient || !market?.address) {
      throw new Error('Public client or market address not available');
    }

    const epochsData: EpochData[] = [];

    for (let epochIndex = 0; epochIndex < TOTAL_EPOCHS; epochIndex++) {
      try {
        const [goalPool, cardPool] = await Promise.all([
          publicClient.readContract({
            address: market.address as `0x${string}`,
            abi: EPOCHAL_MATCH_MARKET_ABI,
            functionName: 'getEpochPoolDetails',
            args: [EventType.GOAL, BigInt(epochIndex)]
          }),
          publicClient.readContract({
            address: market.address as `0x${string}`,
            abi: EPOCHAL_MATCH_MARKET_ABI,
            functionName: 'getEpochPoolDetails',
            args: [EventType.CARD, BigInt(epochIndex)]
          })
        ]);

        const [goalTotal, goalOutcome0, goalOutcome1, goalResolved, goalWinningOutcome] = goalPool as [bigint, bigint, bigint, boolean, number];
        const [cardTotal, cardOutcome0, cardOutcome1, cardResolved, cardWinningOutcome] = cardPool as [bigint, bigint, bigint, boolean, number];

        const goalTotalStake = Number(goalTotal);
        const cardTotalStake = Number(cardTotal);

        const goalTeamAPercentage = goalTotalStake > 0 ? Math.round((Number(goalOutcome0) / goalTotalStake) * 100) : 50;
        const goalTeamBPercentage = goalTotalStake > 0 ? Math.round((Number(goalOutcome1) / goalTotalStake) * 100) : 50;
        
        const cardNoPercentage = cardTotalStake > 0 ? Math.round((Number(cardOutcome0) / cardTotalStake) * 100) : 50;
        const cardYesPercentage = cardTotalStake > 0 ? Math.round((Number(cardOutcome1) / cardTotalStake) * 100) : 50;

        const calculatePayout = (outcomeStake: number, totalStake: number) => {
          if (outcomeStake === 0) return 2.00;
          const rawPayout = totalStake / outcomeStake;
          return parseFloat((rawPayout * 0.98).toFixed(2));
        };

        const goalTeamAPayout = calculatePayout(Number(goalOutcome0), goalTotalStake);
        const goalTeamBPayout = calculatePayout(Number(goalOutcome1), goalTotalStake);
        const cardNoPayout = calculatePayout(Number(cardOutcome0), cardTotalStake);
        const cardYesPayout = calculatePayout(Number(cardOutcome1), cardTotalStake);

        const currentTime = Math.floor(Date.now() / 1000);
        const epochStartTime = market.matchStartTime + (epochIndex * EPOCH_DURATION);
        const epochEndTime = epochStartTime + EPOCH_DURATION;
        
        let status: 'Open' | 'Passed' | 'Upcoming' = 'Upcoming';
        if (currentTime > epochEndTime) {
          status = 'Passed';
        } else if (currentTime >= epochStartTime && currentTime <= epochEndTime) {
          status = 'Open';
        }

        epochsData.push({
          index: epochIndex,
          period: `${epochIndex * 15}-${(epochIndex + 1) * 15} min`,
          status,
          outcomes: {
            goal: {
              teamA: { 
                percentage: goalTeamAPercentage, 
                payout: goalTeamAPayout,
                stake: Number(goalOutcome0)
              },
              teamB: { 
                percentage: goalTeamBPercentage, 
                payout: goalTeamBPayout,
                stake: Number(goalOutcome1)
              },
              totalStake: goalTotalStake,
              resolved: goalResolved,
              winningOutcome: goalWinningOutcome
            },
            card: {
              noCard: { 
                percentage: cardNoPercentage, 
                payout: cardNoPayout,
                stake: Number(cardOutcome0)
              },
              yesCard: { 
                percentage: cardYesPercentage, 
                payout: cardYesPayout,
                stake: Number(cardOutcome1)
              },
              totalStake: cardTotalStake,
              resolved: cardResolved,
              winningOutcome: cardWinningOutcome
            }
          }
        });

      } catch (error) {
        console.error(`Error fetching epoch ${epochIndex} data:`, error);
        epochsData.push({
          index: epochIndex,
          period: `${epochIndex * 15}-${(epochIndex + 1) * 15} min`,
          status: 'Open',
          outcomes: {
            goal: {
              teamA: { percentage: 50, payout: 1.96, stake: 0 },
              teamB: { percentage: 50, payout: 1.96, stake: 0 },
              totalStake: 0,
              resolved: false,
              winningOutcome: 0
            },
            card: {
              noCard: { percentage: 50, payout: 1.96, stake: 0 },
              yesCard: { percentage: 50, payout: 1.96, stake: 0 },
              totalStake: 0,
              resolved: false,
              winningOutcome: 0
            }
          }
        });
      }
    }

    return epochsData;
  };

  useEffect(() => {
    const loadEpochData = async () => {
      if (!market) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchEpochData();
        setEpochs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load epoch data');
        console.error('Error loading epoch data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEpochData();
  }, [market, publicClient]);

  const refetch = async () => {
    if (!market) return;
    
    setLoading(true);
    try {
      const data = await fetchEpochData();
      setEpochs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refetch epoch data');
    } finally {
      setLoading(false);
    }
  };

  return {
    epochs,
    loading,
    error,
    refetch,
    totalEpochs: TOTAL_EPOCHS
  };
};