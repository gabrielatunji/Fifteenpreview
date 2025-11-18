import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { PREDICTION_MARKET_FACTORY_ABI } from '../contracts/abi';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import { Interface } from 'ethers';

export const useMarketOperations = () => {
  const [creating, setCreating] = useState(false);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const createMarket = async (matchDetails: string, matchStartTime: number, teamAName: string, teamBName: string) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet to create markets');
    }

    setCreating(true);
    try {
      if (!walletClient) {
        throw new Error('Wallet client not available. Connect your wallet');
      }

      // debug: ensure walletClient is present
      console.debug('walletClient available:', !!walletClient);

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.PREDICTION_MARKET_FACTORY as `0x${string}`,
        abi: PREDICTION_MARKET_FACTORY_ABI as any,
        functionName: 'createMarket',
        args: [matchDetails, BigInt(matchStartTime), teamAName, teamBName],
      });

      // Return the transaction hash immediately so the UI can show feedback.
      return hash as string;
    } catch (error) {
      console.error('Error creating market:', error);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const waitForMarketAddress = async (hash: `0x${string}`) => {
    if (!publicClient) return { newMarketAddress: undefined, blockNumber: undefined };

    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = receipt.logs || [];

      const iface = new Interface(PREDICTION_MARKET_FACTORY_ABI as any);
      let newMarketAddress: string | undefined;
      let blockNumber: number | undefined;

      for (const log of logs) {
        try {
          // allow parsing regardless of emitting address (some providers may normalize addresses differently)
          const parsed = iface.parseLog({ data: (log as any).data, topics: (log as any).topics });
          if (parsed && parsed.name === 'MarketCreated') {
            const addr = parsed.args && parsed.args[0];
            if (addr && typeof addr === 'string') {
              newMarketAddress = addr;
              break;
            }
          }
        } catch (e) {
          // ignore parse errors for non-matching logs
        }
      }

      // try to capture blockNumber from receipt (viem returns bigint)
      try {
        if ((receipt as any).blockNumber !== undefined && (receipt as any).blockNumber !== null) {
          blockNumber = Number((receipt as any).blockNumber);
        }
      } catch (e) {
        blockNumber = undefined;
      }

      return { newMarketAddress, blockNumber };
    } catch (e) {
      console.error('Error waiting for market address:', e);
      return { newMarketAddress: undefined, blockNumber: undefined };
    }
  };

  return {
    createMarket,
    creating,
    isConnected,
    waitForMarketAddress,
  };
};