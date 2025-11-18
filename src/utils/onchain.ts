import { PREDICTION_MARKET_FACTORY_ABI } from "../contracts/abi";
import { CONTRACT_ADDRESSES } from "../contracts/addresses";
import { Interface } from "ethers";
import type { PublicClient } from 'viem';

/**
 * Scan MarketCreated events from the factory and return the market address
 * that matches the provided matchDetails and matchStartTime (unix seconds).
 *
 * This scans all logs emitted by the factory (from block 0). For a production
 * system you should limit the block range or index events via a backend.
 */
export async function findMarketAddressByMatch(
  publicClient: PublicClient | undefined,
  matchDetails: string,
  matchStartTime: number,
  fromBlock?: number | bigint,
) {
  if (!publicClient) return undefined;

  try {
    const iface = new Interface(PREDICTION_MARKET_FACTORY_ABI as any);
    const eventFragment = iface.getEvent('MarketCreated');
    const topic0 = (iface as any).getEventTopic(eventFragment);

    // Use viem publicClient.getLogs to fetch logs. Use provided fromBlock when available.
    const fb = fromBlock !== undefined ? BigInt(fromBlock) : 0n;
    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESSES.PREDICTION_MARKET_FACTORY as `0x${string}`,
      fromBlock: fb,
      toBlock: 'latest',
      topics: [topic0],
    } as any);

    for (const l of logs) {
      try {
        // viem log has .topics (string[]) and .data (string)
        const parsed = iface.parseLog({ topics: l.topics as any, data: l.data as any });
        if (parsed && parsed.name === 'MarketCreated') {
          const addr = parsed.args[0];
          const md = parsed.args[1];
          const mst = Number(parsed.args[2]);

          if (md === matchDetails && mst === matchStartTime) {
            return addr as string;
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    return undefined;
  } catch (e) {
    console.error('findMarketAddressByMatch failed', e);
    return undefined;
  }
}
