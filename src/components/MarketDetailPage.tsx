import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, Copy } from "lucide-react";
import { useToast } from "./ui/toast";
import { computeEpochFromStart } from "../utils/market";
import { PredictionChart } from "./PredictionChart";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { usePublicClient, useWalletClient } from 'wagmi';
import epochalAbi from '../contracts/abis/EpochalMatchMarkets.json';
import { ethers } from 'ethers';
import { findMarketAddressByMatch } from "../utils/onchain";
import footballPng from "../assets/football.png";

interface Market {
  id: string;
  team1: string;
  team2: string;
  image: string;
  matchStartTime?: number;
}

interface MarketDetailPageProps {
  market: Market;
  onBack: () => void;
}

function middleTruncate(addr: string, start = 10, end = 10) {
  if (!addr) return "";
  if (addr.length <= start + end + 3) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}


type FilterType = "goal" | "cards";

export function MarketDetailPage({
  market,
  onBack,
}: MarketDetailPageProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | undefined>(
    market.id && market.id.startsWith('0x') ? market.id : undefined
  );
  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>("goal");
  const [selectedGoalTeam, setSelectedGoalTeam] = useState<
    "teamA" | "teamB" | null
  >(null);
  const [selectedCardsOption, setSelectedCardsOption] =
    useState<"yes" | "no" | null>(null);
  const [stakeEth, setStakeEth] = useState<string>('0.01');
  const [isPlacing, setIsPlacing] = useState(false);

  const getEpochStatus = (epoch: number | null) => {
    if (epoch === null) return "Closed";
    if (epoch === 4) return "Paused";
    if (epoch >= 1 && epoch <= 6) return "Open";
    return "Closed";
  };

  const { epoch: currentEpoch, status: currentStatus } = computeEpochFromStart(market.matchStartTime);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // If a proper contract address wasn't passed in `market.id`, try to find it on-chain
  // by matching the match details and start time. This allows the MarketDetail page
  // to recover the CA after reloads by scanning the factory events.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (contractAddress) return;
      if (!market.team1 || !market.team2 || !market.matchStartTime) return;

      const matchDetails = `${market.team1} vs ${market.team2}`;

      // Try backend lookup first (fast and durable)
      try {
        const url = `http://localhost:4000/api/markets?team1=${encodeURIComponent(market.team1)}&team2=${encodeURIComponent(market.team2)}&matchStartTime=${encodeURIComponent(String(market.matchStartTime))}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const body = await resp.json();
          if (mounted && body) {
            if (body.address) {
              setContractAddress(body.address);
              return;
            }
            // If backend has fromBlock but not address, use it as starting block for on-chain scan
            const fromBlock = body.fromBlock;
            if (fromBlock) {
              const foundFromBackendBlock = await findMarketAddressByMatch(publicClient, matchDetails, market.matchStartTime, fromBlock);
              if (mounted && foundFromBackendBlock) {
                setContractAddress(foundFromBackendBlock);
                return;
              }
            }
          }
        }
      } catch (e) {
        // ignore backend errors and fallback to on-chain lookup
        console.debug('backend lookup failed', e);
      }

      // Fallback: scan on-chain from genesis if no better info available
      const found = await findMarketAddressByMatch(publicClient, matchDetails, market.matchStartTime);
      if (mounted && found) {
        setContractAddress(found);
      }
    })();
    return () => { mounted = false; };
  }, [contractAddress, market.team1, market.team2, market.matchStartTime, publicClient]);

  const placePrediction = async () => {
    if (!contractAddress) {
      toast({ type: 'error', description: 'Contract address not available' });
      return;
    }

    // Only allow placing when market status is explicitly Open
    if (currentStatus !== 'Open') {
      toast({ type: 'error', description: 'Market is not open for betting' });
      return;
    }

    // Determine eventType: Goal = 0, Cards = 1
    const eventType = selectedFilter === 'goal' ? 0 : 1;

    // Determine outcome value expected by the contract
    let outcome: number | null = null;
    if (selectedFilter === 'goal') {
      if (!selectedGoalTeam) {
        toast({ type: 'error', description: 'Select a team to bet on' });
        return;
      }
      // map teamA -> 0, teamB -> 1
      outcome = selectedGoalTeam === 'teamA' ? 0 : 1;
    } else {
      if (!selectedCardsOption) {
        toast({ type: 'error', description: 'Select yes or no for cards' });
        return;
      }
      // map no -> 0, yes -> 1
      outcome = selectedCardsOption === 'yes' ? 1 : 0;
    }

    // epochIndex: use currentEpoch (as returned by computeEpochFromStart)
    const epochIndex = Number(currentEpoch);

    // parse stake to wei
    let value: bigint;
    try {
      // ethers v6 exports parseEther directly and it returns a bigint
      value = ethers.parseEther(stakeEth);
    } catch (e) {
      toast({ type: 'error', description: 'Invalid stake amount' });
      return;
    }

    if (!walletClient) {
      toast({ type: 'error', description: 'Wallet not connected' });
      return;
    }

    try {
      setIsPlacing(true);
      toast({ type: 'info', description: 'Sending transaction...' });
      const txHash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: epochalAbi as any,
        functionName: 'placeBet',
        args: [BigInt(eventType), BigInt(epochIndex), BigInt(outcome)],
        value,
      });

      // show submitted toast with link (plain string to avoid JSX type issues)
      // ensure the hash string uses the 0x-prefixed template literal type required by viem
      const txHashStrRaw = String(txHash);
      const txHashStr = txHashStrRaw.startsWith('0x') ? txHashStrRaw : `0x${txHashStrRaw}`;
      const txHashHex = txHashStr as `0x${string}`;
      const txLink = `https://testnet.bscscan.com/tx/${txHashHex}`;
      toast({ type: 'info', description: `Tx submitted: ${txHashHex} — ${txLink}` });

      // wait for confirmation
      if (!publicClient) {
        toast({ type: 'error', description: 'Public client not available' });
        setIsPlacing(false);
        return;
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHashHex, timeout: 600_000 });
      // receipt.status may be number (1) or string; accept both
            const statusStr = receipt ? String(receipt.status) : '';
            const success = receipt && (statusStr === 'success' || statusStr === '1' || statusStr === '0x1');
            if (success) {
              toast({ type: 'success', description: `Tx confirmed: ${txHashStr} — ${txLink}` });
            } else {
              toast({ type: 'error', description: `Transaction failed or reverted: ${txHashStr}` });
            }
    } catch (e: any) {
      console.error('placeBet error', e);
      toast({ type: 'error', description: e?.message || 'Transaction failed' });
    } finally {
      setIsPlacing(false);
    }
  };

  const getEpochTimeRange = (epoch: number) => {
    const ranges: { [key: number]: string } = {
      1: "-15 - 0 mins",
      2: "0-15 mins",
      3: "15-30 mins",
      4: "30-45 mins (Halftime)",
      5: "45-60 mins",
      6: "60-75 mins"
    };
    return ranges[epoch] || "";
  };

  const epochs = [
    { number: 1, status: getEpochStatus(1), timeRange: getEpochTimeRange(1) },
    { number: 2, status: getEpochStatus(2), timeRange: getEpochTimeRange(2) },
    { number: 3, status: getEpochStatus(3), timeRange: getEpochTimeRange(3) },
    { number: 4, status: getEpochStatus(4), timeRange: getEpochTimeRange(4) },
    { number: 5, status: getEpochStatus(5), timeRange: getEpochTimeRange(5) },
    { number: 6, status: getEpochStatus(6), timeRange: getEpochTimeRange(6) },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] pt-16">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <ChevronLeft className="size-4 mr-2" />
          Back to Markets
        </Button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8 items-start">
          {/* Left Side - Main Card */}
          <div className="flex-1 max-w-2xl">
            <Card className="p-6 bg-[#1a1a1a] shadow-sm border border-gray-800">
              {/* Match Details */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={footballPng}
                    alt={`${market.team1} vs ${market.team2}`}
                    className="size-12 rounded object-cover"
                  />
                  <div>
                    <h2 className="text-white">
                      {market.team1} vs {market.team2}
                    </h2>
                    <p className="text-sm text-gray-400">Premier League</p>
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-2 min-w-0">
                      <span className="text-gray-400">CA:</span>
                        <span className="text-white font-mono flex-1 min-w-0">{middleTruncate(contractAddress ?? market.id, 10, 10)}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(contractAddress ?? market.id);
                            setCopied(true);
                            toast({ type: 'success', description: 'Contract address copied' });
                            setTimeout(() => setCopied(false), 2000);
                          } catch (e) {
                            toast({ type: 'error', description: 'Failed to copy address' });
                          }
                        }}
                        className="p-1 rounded hover:bg-gray-800 ml-2"
                        aria-label="Copy contract address"
                        title="Copy contract address"
                      >
                        <Copy className="size-4 text-gray-300" />
                      </button>
                      {copied && <span className="ml-2 text-green-400 text-sm">Copied!</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Epoch */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Current Epoch:</span>
                  <Badge className="bg-[#3D6734]">{currentEpoch ? `Epoch ${currentEpoch}` : 'Closed'}</Badge>
                </div>
                <div className="text-xs text-gray-500">Trading Status: {currentStatus}</div>
              </div>

              {/* Chart */}
              <div className="mb-6">
                <h3 className="text-sm text-gray-400 mb-4">
                  Pool Volume
                </h3>
                <PredictionChart volume="$285.42k" />
              </div>

              {/* Epoch Timeline */}
              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-sm text-gray-400 mb-3">
                  Epoch Timeline
                </h3>
                <div className="flex justify-between items-center">
                  {epochs.map((epoch) => (
                    <div
                      key={epoch.number}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`size-8 rounded-full flex items-center justify-center text-xs ${
                          epoch.number === currentEpoch
                            ? "bg-[#3D6734] text-white"
                                : epoch.number === 4
                                  ? "bg-red-600 text-white"
                                  : epoch.status === "Open"
                                    ? "bg-[#3D6734]/30 text-gray-300"
                                    : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {epoch.number}
                      </div>
                      <span className="text-xs text-gray-500">
                        {epoch.timeRange}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-gray-400 bg-[#0d0d0d] p-3 rounded space-y-1">
                  <p>• Epoch 1: 15 mins before start (Trading Open)</p>
                  <p>• Epochs 2-3: 0-30 mins since start (Trading Open)</p>
                  <p>• Epoch 4: 30-45 mins (Halftime - Trading Paused)</p>
                  <p>• Epochs 5-6: 45-75 mins since start (Trading Open)</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Side - Filters */}
          <div className="w-80 space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <Button
                variant={
                  selectedFilter === "goal"
                    ? "default"
                    : "outline"
                }
                onClick={() => setSelectedFilter("goal")}
                className={
                  selectedFilter === "goal"
                    ? "bg-[#3D6734] hover:bg-[#2d4f27] flex-1"
                    : "flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                }
              >
                Goal
              </Button>
              <Button
                variant={
                  selectedFilter === "cards"
                    ? "default"
                    : "outline"
                }
                onClick={() => setSelectedFilter("cards")}
                className={
                  selectedFilter === "cards"
                    ? "bg-[#3D6734] hover:bg-[#2d4f27] flex-1"
                    : "flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                }
              >
                Cards
              </Button>
            </div>

            {/* Filter Content */}
            <Card className="p-6 bg-[#1a1a1a] shadow-sm border border-gray-800">
              {selectedFilter === "goal" ? (
                <div className="space-y-4">
                  <h3 className="text-white mb-4">
                    Which team to score in the next 15 mins?
                  </h3>

                  <Button
                    variant="outline"
                    onClick={() => setSelectedGoalTeam("teamA")}
                    className={`w-full h-20 border-2 ${
                      selectedGoalTeam === "teamA"
                        ? "border-[#3D6734] bg-[#0d0d0d] text-white"
                        : "border-gray-700 bg-[#0d0d0d] text-gray-300 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{market.team1}</span>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setSelectedGoalTeam("teamB")}
                    className={`w-full h-20 border-2 ${
                      selectedGoalTeam === "teamB"
                        ? "border-[#3D6734] bg-[#0d0d0d] text-white"
                        : "border-gray-700 bg-[#0d0d0d] text-gray-300 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{market.team2}</span>
                    </div>
                  </Button>

                  {selectedGoalTeam && (
                    <div className="pt-4 space-y-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">Your Stake (tBNB)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={stakeEth}
                          onChange={(e) => setStakeEth(e.target.value)}
                          className="w-full bg-[#0d0d0d] border border-gray-700 text-white px-3 py-2 rounded"
                        />
                      </div>
                      <Button
                        onClick={placePrediction}
                        disabled={isPlacing || Number(stakeEth) <= 0 || !walletClient || currentStatus !== 'Open'}
                        className={`w-full ${isPlacing || Number(stakeEth) <= 0 || !walletClient || currentStatus !== 'Open' ? 'opacity-60 cursor-not-allowed' : 'bg-[#3D6734] hover:bg-[#2d4f27]'}`}
                      >
                        {isPlacing ? 'Placing...' : 'Place Prediction'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-white mb-4">
                    Will there be yellow cards in the next 15
                    mins?
                  </h3>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setSelectedCardsOption("yes")
                    }
                    className={`w-full h-20 border-2 ${
                      selectedCardsOption === "yes"
                        ? "border-[#3D6734] bg-[#0d0d0d] text-white"
                        : "border-gray-700 bg-[#0d0d0d] text-gray-300 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>Yes</span>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setSelectedCardsOption("no")}
                    className={`w-full h-20 border-2 ${
                      selectedCardsOption === "no"
                        ? "border-[#3D6734] bg-[#0d0d0d] text-white"
                        : "border-gray-700 bg-[#0d0d0d] text-gray-300 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>No</span>
                    </div>
                  </Button>

                  {selectedCardsOption && (
                    <div className="pt-4 space-y-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">Your Stake (tBNB)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={stakeEth}
                          onChange={(e) => setStakeEth(e.target.value)}
                          className="w-full bg-[#0d0d0d] border border-gray-700 text-white px-3 py-2 rounded"
                        />
                      </div>
                      <Button
                        onClick={placePrediction}
                        disabled={isPlacing || Number(stakeEth) <= 0 || !walletClient || currentStatus !== 'Open'}
                        className={`w-full ${isPlacing || Number(stakeEth) <= 0 || !walletClient || currentStatus !== 'Open' ? 'opacity-60 cursor-not-allowed' : 'bg-[#3D6734] hover:bg-[#2d4f27]'}`}
                      >
                        {isPlacing ? 'Placing...' : 'Place Prediction'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Market Terms */}
            <Card className="p-6 bg-[#1a1a1a] shadow-sm border border-gray-800">
              <h3 className="text-white mb-4">Market Terms</h3>
              <div className="text-sm text-gray-400 space-y-2">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                <p>
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}