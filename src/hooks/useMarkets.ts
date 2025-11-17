import { useState, useEffect, useCallback, useRef } from 'react';
import type { Market } from '../types';
import { PREDICTION_MARKET_FACTORY_ABI, EPOCHAL_MATCH_MARKET_ABI } from '../contracts/abi';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import { usePublicClient } from 'wagmi';

export const useMarkets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();
  
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const fetchMarkets = useCallback(async (): Promise<Market[]> => {
    if (!publicClient) {
      return [];
    }

    try {
      const factoryContract = {
        address: CONTRACT_ADDRESSES.PREDICTION_MARKET_FACTORY as `0x${string}`,
        abi: PREDICTION_MARKET_FACTORY_ABI,
      };

      const marketAddresses = await publicClient.readContract({
        ...factoryContract,
        functionName: 'getAllDeployedMarkets',
      }) as `0x${string}`[];

      if (!marketAddresses || marketAddresses.length === 0) {
        return [];
      }

      // Filter out invalid addresses
      const validMarketAddresses = marketAddresses.filter(address => 
        address && 
        address !== '0x0000000000000000000000000000000000000000' &&
        address.toLowerCase() !== CONTRACT_ADDRESSES.EPOCHAL_MATCH_MARKET.toLowerCase()
      );

      if (validMarketAddresses.length === 0) {
        return [];
      }

      const marketsData: Market[] = [];

      for (const address of validMarketAddresses) {
        try {
          const marketContract = {
            address,
            abi: EPOCHAL_MATCH_MARKET_ABI,
          };

          const marketData = await Promise.allSettled([
            publicClient.readContract({ ...marketContract, functionName: 'matchDetails' }),
            publicClient.readContract({ ...marketContract, functionName: 'matchStartTime' }),
            publicClient.readContract({ ...marketContract, functionName: 'teamAName' }),
            publicClient.readContract({ ...marketContract, functionName: 'teamBName' }),
            publicClient.readContract({ ...marketContract, functionName: 'getMatchStatus' }),
            publicClient.readContract({ ...marketContract, functionName: 'getCumulativeMatchVolume' }),
          ]);

          // Extract values with explicit type assertions
          const matchDetails = marketData[0].status === 'fulfilled' ? (marketData[0].value as string) : 'Unknown Match';
          const matchStartTime = marketData[1].status === 'fulfilled' ? (marketData[1].value as bigint) : 0n;
          const teamAName = marketData[2].status === 'fulfilled' ? (marketData[2].value as string) : 'Team A';
          const teamBName = marketData[3].status === 'fulfilled' ? (marketData[3].value as string) : 'Team B';
          const matchStatus = marketData[4].status === 'fulfilled' ? (marketData[4].value as bigint) : 0n;
          const totalVolume = marketData[5].status === 'fulfilled' ? (marketData[5].value as bigint) : 0n; // Fixed: explicit bigint type

          // Get current epoch
          let currentEpoch = 0n;
          try {
            currentEpoch = await publicClient.readContract({
              ...factoryContract,
              functionName: 'getCurrentEpochIndex',
              args: [matchStartTime]
            }) as bigint;
          } catch {
            // Use default value
          }

          // Convert contract status
          let status: 'LIVE' | 'UPCOMING' | 'RESOLVED' = 'UPCOMING';
          const statusNumber = Number(matchStatus);
          
          if (statusNumber === 1) status = 'LIVE';
          else if (statusNumber === 2) status = 'RESOLVED';

          marketsData.push({
            address,
            matchDetails,
            matchStartTime: Number(matchStartTime),
            status,
            currentEpoch: Number(currentEpoch),
            totalVolume: totalVolume.toString(),
            teamAName,
            teamBName,
          });

        } catch (error) {
          console.error(`Error processing market ${address}:`, error);
        }
      }

      return marketsData;

    } catch (error) {
      console.error('Error fetching markets:', error);
      throw new Error('Failed to fetch markets from blockchain');
    }
  }, [publicClient]);

  const refetchMarkets = useCallback(async () => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const marketsData = await fetchMarkets();
      if (mountedRef.current) {
        setMarkets(marketsData);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load markets';
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [fetchMarkets]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Initial load
    refetchMarkets();

    // Set up refresh interval - only refresh every 15 minutes
    const intervalId = setInterval(() => {
      if (mountedRef.current && !loadingRef.current) {
        refetchMarkets();
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [refetchMarkets]);

  // Helper functions
  const getUpcomingMarkets = useCallback(() => 
    markets.filter(market => market.status === 'UPCOMING'), [markets]);
  
  const getLiveMarkets = useCallback(() => 
    markets.filter(market => market.status === 'LIVE'), [markets]);
  
  const getResolvedMarkets = useCallback(() => 
    markets.filter(market => market.status === 'RESOLVED'), [markets]);

  return { 
    markets, 
    loading, 
    error, 
    refetchMarkets,
    upcomingMarkets: getUpcomingMarkets(),
    liveMarkets: getLiveMarkets(),
    resolvedMarkets: getResolvedMarkets()
  };
};