import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Local BetData shape used by the prediction form/hook.
type BetData = {
  eventType: number;
  epochIndex: number;
  outcome: number;
  amount: string; // in ETH (e.g. "0.01")
};
import { EPOCHAL_MATCH_MARKET_ABI } from '../contracts/abi';
import { parseEther } from 'viem';

export const usePredictions = () => {
  const [placingBet, setPlacingBet] = useState(false);
  const { isConnected } = useAccount();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const placeBet = async (marketAddress: string, betData: BetData) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setPlacingBet(true);
    
    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: EPOCHAL_MATCH_MARKET_ABI,
        functionName: 'placeBet',
        args: [
          betData.eventType,
          BigInt(betData.epochIndex),
          betData.outcome,
        ],
        value: parseEther(betData.amount),
      });
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    } finally {
      setPlacingBet(false);
    }
  };

  const claimWinnings = async (nftId: number, marketAddress: string) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      writeContract({
        address: marketAddress as `0x${string}`,
        abi: EPOCHAL_MATCH_MARKET_ABI,
        functionName: 'claimWinnings',
        args: [BigInt(nftId)],
      });
    } catch (error) {
      console.error('Error claiming winnings:', error);
      throw error;
    }
  };

  return {
    placeBet,
    claimWinnings,
    placingBet: placingBet || isPending,
    isConfirming,
    isConfirmed,
    error,
  };
};