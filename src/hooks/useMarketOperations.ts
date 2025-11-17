import { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { PREDICTION_MARKET_FACTORY_ABI } from '../contracts/abi';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';

export const useMarketOperations = () => {
  const [creating, setCreating] = useState(false);
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const createMarket = async (matchDetails: string, matchStartTime: number, teamAName: string, teamBName: string) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet to create markets');
    }

    setCreating(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.PREDICTION_MARKET_FACTORY as `0x${string}`,
        abi: PREDICTION_MARKET_FACTORY_ABI,
        functionName: 'createMarket',
        args: [matchDetails, BigInt(matchStartTime), teamAName, teamBName],
      });

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      return hash;
    } catch (error) {
      console.error('Error creating market:', error);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  return {
    createMarket,
    creating,
    isConnected,
  };
};