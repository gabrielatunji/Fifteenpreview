import { ethers } from 'ethers';
import { EPOCHAL_MATCH_MARKET_ABI } from '../contracts/abi';

export const getEpochData = async (
  marketAddress: string,
  epochIndex: number,
  provider: ethers.Provider
) => {
  const contract = new ethers.Contract(
    marketAddress,
    EPOCHAL_MATCH_MARKET_ABI,
    provider
  );

  try {
    const [goalPool, cardPool] = await Promise.all([
      contract.getGoalEpochPool(epochIndex),
      contract.getCardEpochPool(epochIndex),
    ]);

    return {
      goalPool,
      cardPool,
    };
  } catch (error) {
    console.error('Error fetching epoch data:', error);
    return null;
  }
};

export const calculatePayout = (
  totalStake: bigint,
  outcomeStake: bigint,
  protocolFeeBps: bigint = BigInt(200) // 2% default
): bigint => {
  if (outcomeStake === BigInt(0)) return BigInt(0);
  
  const fee = (totalStake * protocolFeeBps) / BigInt(10000);
  const netPool = totalStake - fee;
  const payout = (netPool * outcomeStake) / totalStake;
  
  return payout;
};