// src/hooks/useMarketUpdates.ts - Fixed version
import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { EPOCHAL_MATCH_MARKET_ABI } from '../contracts/abi';
import { decodeEventLog } from 'viem';

interface MarketUpdate {
  type: 'NEW_EPOCH' | 'GOAL_SCORED' | 'CARD_ISSUED' | 'BET_PLACED';
  marketAddress: string;
  data: any;
  timestamp: number;
}

export const useMarketUpdates = (marketAddresses: string[]) => {
  const [updates, setUpdates] = useState<MarketUpdate[]>([]);
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!publicClient || marketAddresses.length === 0) return;

    const unwatchFns: (() => void)[] = [];

    // Watch for BetPlaced events
    marketAddresses.forEach(address => {
      const unwatch = publicClient.watchContractEvent({
        address: address as `0x${string}`,
        abi: EPOCHAL_MATCH_MARKET_ABI,
        eventName: 'BetPlaced',
        onLogs: (logs) => {
          logs.forEach(log => {
            try {
              const decoded = decodeEventLog({
                abi: EPOCHAL_MATCH_MARKET_ABI,
                data: log.data,
                topics: log.topics,
              });
              
              setUpdates(prev => [...prev, {
                type: 'BET_PLACED',
                marketAddress: address,
                data: decoded.args,
                timestamp: Date.now()
              }]);
            } catch (error) {
              console.error('Error decoding BetPlaced event:', error);
            }
          });
        },
      });
      unwatchFns.push(unwatch);
    });

    return () => {
      unwatchFns.forEach(unwatch => unwatch());
    };
  }, [publicClient, marketAddresses]);

  return updates;
};