import { useState } from 'react';
import { EPOCHAL_MATCH_MARKET_ABI } from '../contracts/abi';
import { usePublicClient, useWalletClient } from 'wagmi';

interface PlaceBetParams {
  marketAddress: string;
  eventType: number;
  epochIndex: number;
  outcome: number;
  amount: string;
}

export const usePlaceBet = () => {
  const [loading, setLoading] = useState(false);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const placeBet = async (params: PlaceBetParams) => {
    if (!walletClient || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      // Convert bet amount to wei
      const amountInWei = BigInt(Math.floor(parseFloat(params.amount) * 1e18));

      const hash = await walletClient.writeContract({
        address: params.marketAddress as `0x${string}`,
        abi: EPOCHAL_MATCH_MARKET_ABI,
        functionName: 'placeBet',
        args: [params.eventType, BigInt(params.epochIndex), params.outcome],
        value: amountInWei,
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });
      
      return hash;
    } finally {
      setLoading(false);
    }
  };

  return {
    placeBet,
    loading,
  };
};