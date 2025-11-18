import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { PredictionChart } from "./PredictionChart";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { derivePageCategory } from "../utils/market";
import { useToast } from "./ui/toast";
import { useWalletClient, usePublicClient, useAccount } from "wagmi";
import EpochalMatchMarketsABI from "../contracts/abis/EpochalMatchMarkets.json";
import BetReceiptNFTABI from "../contracts/abis/BetReceiptNFT.json";
import footballPng from "../assets/football.png";

// Helper: query on-chain epoch resolution for a market contract
async function fetchOnChainEpochResults(
  publicClient: any,
  marketAddress: string,
  teamA: string,
  teamB: string
): Promise<{ epochResults: { epoch: number; goalTeam: string | null; cards: string | null }[] }> {
  const results: { epoch: number; goalTeam: string | null; cards: string | null }[] = [];
  if (!publicClient || !marketAddress || typeof marketAddress !== 'string' || !marketAddress.startsWith('0x')) return { epochResults: [] };

  const EPOCHS = [1, 2, 3, 4, 5, 6];
  try {
    for (const epoch of EPOCHS) {
      let goalResolved = false;
      let goalWinningOutcome: number | null = null;
      let cardsResolved = false;
      let cardsWinningOutcome: number | null = null;

      try {
        const goalPool = await (publicClient as any).readContract({
          address: marketAddress,
          abi: EpochalMatchMarketsABI as any,
          functionName: 'getEpochPoolDetails',
          args: [0, epoch],
        });
        // expected: [totalStake, outcome0Stake, outcome1Stake, isResolved, winningOutcome]
        goalResolved = Boolean(goalPool?.[3]);
        goalWinningOutcome = typeof goalPool?.[4] !== 'undefined' ? Number(goalPool[4]) : null;
      } catch (e) {
        console.debug('goal pool read failed', marketAddress, epoch, e);
      }

      try {
        const cardsPool = await (publicClient as any).readContract({
          address: marketAddress,
          abi: EpochalMatchMarketsABI as any,
          functionName: 'getEpochPoolDetails',
          args: [1, epoch],
        });
        cardsResolved = Boolean(cardsPool?.[3]);
        cardsWinningOutcome = typeof cardsPool?.[4] !== 'undefined' ? Number(cardsPool[4]) : null;
      } catch (e) {
        console.debug('cards pool read failed', marketAddress, epoch, e);
      }

      if (goalResolved || cardsResolved) {
        const goalTeam = goalResolved && goalWinningOutcome !== null
          ? (goalWinningOutcome === 0 ? teamA : teamB)
          : null;
        const cards = cardsResolved && cardsWinningOutcome !== null
          ? (cardsWinningOutcome === 0 ? 'No cards' : 'Yes cards')
          : null;

        results.push({ epoch, goalTeam, cards });
      }
    }
  } catch (err) {
    console.debug('fetchOnChainEpochResults error', err);
  }
  return { epochResults: results };
}

// (removed unused ERC721_MIN_ABI)

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatCompact(ms: number) {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days >= 1) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (hours >= 1) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}
interface Market {
  id: string;
  team1: string;
  team2: string;
  image: string;
  status?: "live" | "upcoming" | "resolved";
  epochResults?: { epoch: number; goalTeam: string; cards: string }[];
  page?: 'live' | 'upcoming' | 'resolved';
  matchStartTime?: number;
}

interface HomePageProps {
  onMarketClick: (market: Market) => void;
  onCreateMarket?: () => void;
}

export function HomePage({ onMarketClick }: HomePageProps) {
  const { toast } = useToast();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "resolved">("live");
  const [claimLoadingMap, setClaimLoadingMap] = useState<Record<string, boolean>>({});

  const handleClaimWinnings = async (market: Market, epochIndex: number) => {
    const loadingKey = `${market.id}:${epochIndex}`;

    if (!market.id || typeof market.id !== 'string' || !market.id.startsWith('0x')) {
      toast({ type: 'error', description: 'This market does not have a contract address to claim from.' });
      return;
    }
    if (!walletClient || !accountAddress) {
      toast({ type: 'error', description: 'Wallet not connected. Please connect your wallet.' });
      return;
    }

    if (!publicClient) {
      toast({ type: 'error', description: 'Public client unavailable.' });
      return;
    }

    setClaimLoadingMap((s) => ({ ...s, [loadingKey]: true }));
    try {
      // read betReceiptNFT address from market contract
      const nftAddress = await (publicClient as any).readContract({
        address: market.id as `0x${string}`,
        abi: EpochalMatchMarketsABI as any,
        functionName: 'betReceiptNFT',
        args: [],
      }) as `0x${string}`;

      if (!nftAddress || !String(nftAddress).startsWith('0x')) {
        toast({ type: 'error', description: 'Market does not expose a betReceiptNFT contract.' });
        return;
      }

      // Use getBetReceiptsByOwner to fetch tokenIds owned by the user (secure and efficient)
      let tokenIds: bigint[] = [];
      try {
        const ids = await (publicClient as any).readContract({
          address: nftAddress,
          abi: BetReceiptNFTABI as any,
          functionName: 'getBetReceiptsByOwner',
          args: [accountAddress],
        });
        tokenIds = Array.isArray(ids) ? ids.map((i: any) => BigInt(i)) : [];
      } catch (e) {
        // fallback: try balanceOf + tokenOfOwnerByIndex approach could be added if needed
        console.debug('getBetReceiptsByOwner failed', e);
      }

      if (!tokenIds.length) {
        // Fallback: scan Transfer logs for tokens sent to the account on this NFT contract
        try {
          const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
          const toTopic = `0x${accountAddress?.replace(/^0x/, '').padStart(64, '0')}`;
          const logs = await (publicClient as any).getLogs({ address: nftAddress, topics: [transferTopic, null, toTopic] });
          if (Array.isArray(logs) && logs.length) {
            for (const lg of logs) {
              try {
                // tokenId is indexed as topic[3] (padded hex)
                const topicToken = lg.topics && lg.topics[3];
                if (!topicToken) continue;
                const tid = BigInt(topicToken);
                tokenIds.push(tid);
              } catch (tokErr) {
                console.debug('parse token from log failed', tokErr);
              }
            }
          }
        } catch (logErr) {
          console.debug('log scan failed', logErr);
        }
      }

      if (!tokenIds.length) {
        toast({ type: 'error', description: 'No bet receipt NFTs found for your wallet.' });
        return;
      }

      let foundTokenId: bigint | null = null;
      // iterate and verify metadata on-chain via betMetadata
      for (const tokenId of tokenIds) {
        try {
          const meta = await (publicClient as any).readContract({
            address: nftAddress,
            abi: BetReceiptNFTABI as any,
            functionName: 'betMetadata',
            args: [tokenId],
          });

          // meta structure: { marketAddress, eventType, epochIndex, outcome, stakeAmount }
          const metaMarket = String(meta?.marketAddress || '').toLowerCase();
          const metaEpoch = Number(meta?.epochIndex);

          if (metaMarket === String(market.id).toLowerCase() && !Number.isNaN(metaEpoch) && metaEpoch === epochIndex) {
            // ensure ownerOf is current account (defense-in-depth)
            try {
              const owner = await (publicClient as any).readContract({
                address: nftAddress,
                abi: BetReceiptNFTABI as any,
                functionName: 'ownerOf',
                args: [tokenId],
              });
              if (String(owner).toLowerCase() === String(accountAddress).toLowerCase()) {
                foundTokenId = tokenId;
                break;
              }
            } catch (ownerErr) {
              console.debug('ownerOf failed', ownerErr);
            }
          }
        } catch (metaErr) {
          console.debug('read betMetadata failed', metaErr);
          continue;
        }
      }

      if (!foundTokenId) {
        toast({ type: 'error', description: 'No matching bet receipt NFT found for this market/epoch in your wallet.' });
        return;
      }

      const writeRes = await walletClient.writeContract({
        address: market.id as `0x${string}`,
        abi: EpochalMatchMarketsABI as any,
        functionName: 'claimWinnings',
        args: [foundTokenId],
      });

      // normalize tx hash: walletClient may return a string or an object
      let txHash: string | undefined;
      try {
        if (typeof writeRes === 'string') txHash = writeRes;
        else if (writeRes && typeof writeRes === 'object') txHash = (writeRes as any).hash || (writeRes as any).transactionHash || (writeRes as any).request || String(writeRes);
      } catch (e) {
        txHash = String(writeRes);
      }

      if (!txHash || !String(txHash).startsWith('0x')) {
        toast({ type: 'info', description: 'Claim transaction submitted (hash unavailable from wallet client).' });
      } else {
        toast({ type: 'info', description: `Claim submitted: ${txHash}` });
        try {
          await (publicClient as any).waitForTransactionReceipt({ hash: txHash as `0x${string}` });
          toast({ type: 'success', description: 'Winnings claimed successfully' });
        } catch (waitErr) {
          console.debug('wait error', waitErr);
          toast({ type: 'error', description: 'Transaction may have failed or timed out' });
        }
      }

    } catch (err) {
      console.error(err);
      toast({ type: 'error', description: 'Failed to claim winnings: ' + (err as any)?.message });
    } finally {
      setClaimLoadingMap((s) => ({ ...s, [loadingKey]: false }));
    }
  };

  const nowSec = Math.floor(Date.now() / 1000);

  const liveMarkets: Market[] = [
    {
      id: "1",
      team1: "Arsenal",
      team2: "Manchester United",
      image: footballPng,
      status: "live",
      matchStartTime: nowSec - 10 * 60 // started 10 minutes ago
    },
    { id: "2", team1: "Liverpool", team2: "Chelsea", image: footballPng, status: "live" },
    { id: "3", team1: "Manchester City", team2: "Tottenham", image: footballPng, status: "live" },
    { id: "4", team1: "Newcastle", team2: "Brighton", image: footballPng, status: "live" },
    { id: "5", team1: "Aston Villa", team2: "West Ham", image: footballPng, status: "live" },
    { id: "6", team1: "Everton", team2: "Fulham", image: footballPng, status: "live" },
    { id: "7", team1: "Wolves", team2: "Brentford", image: footballPng, status: "live" },
    { id: "8", team1: "Crystal Palace", team2: "Bournemouth", image: footballPng, status: "live" },
    { id: "9", team1: "Nottingham Forest", team2: "Luton Town", image: footballPng, status: "live" },
    { id: "10", team1: "Sheffield United", team2: "Burnley", image: footballPng, status: "live" },
    { id: "11", team1: "Real Madrid", team2: "Atletico Madrid", image: footballPng, status: "live" },
    { id: "12", team1: "Barcelona", team2: "Sevilla", image: footballPng, status: "live" }
  ];

  // mock upcoming matches placed well into the future so polled/real markets appear first
  const upcomingBase = nowSec + 60 * 60 * 24 * 7; // one week from now
  const upcomingMarkets: Market[] = [
    { id: "13", team1: "Bayern Munich", team2: "Borussia Dortmund", image: footballPng, status: "upcoming", matchStartTime: upcomingBase + 0 * 86400 },
    { id: "14", team1: "PSG", team2: "Marseille", image: footballPng, status: "upcoming", matchStartTime: upcomingBase + 1 * 86400 },
    { id: "15", team1: "Inter Milan", team2: "AC Milan", image: footballPng, status: "upcoming", matchStartTime: upcomingBase + 2 * 86400 },
    { id: "16", team1: "Juventus", team2: "Napoli", image: footballPng, status: "upcoming", matchStartTime: upcomingBase + 3 * 86400 },
    { id: "17", team1: "Ajax", team2: "Feyenoord", image: footballPng, status: "upcoming" },
    { id: "18", team1: "Benfica", team2: "Porto", image: footballPng, status: "upcoming" },
    { id: "19", team1: "Celtic", team2: "Rangers", image: footballPng, status: "upcoming" },
    { id: "20", team1: "Lyon", team2: "Monaco", image: footballPng, status: "upcoming" },
    { id: "21", team1: "Galatasaray", team2: "Fenerbahce", image: footballPng, status: "upcoming" },
    { id: "22", team1: "Sporting CP", team2: "Braga", image: footballPng, status: "upcoming" },
    { id: "23", team1: "Lazio", team2: "Roma", image: footballPng, status: "upcoming" },
    { id: "24", team1: "Atletico Madrid", team2: "Real Sociedad", image: footballPng, status: "upcoming" }
  ];

  const resolvedMarkets: Market[] = [
    { id: "25", team1: "Real Madrid", team2: "Barcelona", image: footballPng, status: "resolved", epochResults: [ { epoch: 1, goalTeam: "Real Madrid", cards: "No cards" }, { epoch: 2, goalTeam: "Barcelona", cards: "Yes cards" }, { epoch: 3, goalTeam: "Real Madrid", cards: "No cards" }, { epoch: 5, goalTeam: "Barcelona", cards: "Yes cards" }, { epoch: 6, goalTeam: "Real Madrid", cards: "No cards" } ] },
    { id: "26", team1: "Bayern Munich", team2: "Dortmund", image: footballPng, status: "resolved", epochResults: [ { epoch: 1, goalTeam: "Bayern Munich", cards: "Yes cards" }, { epoch: 2, goalTeam: "Dortmund", cards: "No cards" }, { epoch: 3, goalTeam: "Bayern Munich", cards: "Yes cards" }, { epoch: 5, goalTeam: "Dortmund", cards: "No cards" }, { epoch: 6, goalTeam: "Bayern Munich", cards: "Yes cards" } ] },
    { id: "27", team1: "PSG", team2: "Marseille", image: footballPng, status: "resolved", epochResults: [ { epoch: 1, goalTeam: "PSG", cards: "No cards" }, { epoch: 2, goalTeam: "PSG", cards: "Yes cards" }, { epoch: 3, goalTeam: "Marseille", cards: "No cards" }, { epoch: 5, goalTeam: "PSG", cards: "Yes cards" }, { epoch: 6, goalTeam: "Marseille", cards: "No cards" } ] },
    { id: "28", team1: "Inter Milan", team2: "AC Milan", image: footballPng, status: "resolved", epochResults: [ { epoch: 1, goalTeam: "Inter Milan", cards: "Yes cards" }, { epoch: 2, goalTeam: "Inter Milan", cards: "No cards" }, { epoch: 3, goalTeam: "AC Milan", cards: "Yes cards" }, { epoch: 5, goalTeam: "Inter Milan", cards: "No cards" }, { epoch: 6, goalTeam: "AC Milan", cards: "Yes cards" } ] },
    { id: "29", team1: "Liverpool", team2: "Manchester City", image: footballPng, status: "resolved", epochResults: [ { epoch: 1, goalTeam: "Liverpool", cards: "No cards" }, { epoch: 2, goalTeam: "Manchester City", cards: "Yes cards" }, { epoch: 3, goalTeam: "Liverpool", cards: "No cards" }, { epoch: 5, goalTeam: "Manchester City", cards: "No cards" }, { epoch: 6, goalTeam: "Liverpool", cards: "Yes cards" } ] },
    { id: "30", team1: "Juventus", team2: "Napoli", image: footballPng, status: "resolved", epochResults: [ { epoch: 1, goalTeam: "Juventus", cards: "Yes cards" }, { epoch: 2, goalTeam: "Napoli", cards: "No cards" }, { epoch: 3, goalTeam: "Juventus", cards: "Yes cards" }, { epoch: 5, goalTeam: "Napoli", cards: "Yes cards" }, { epoch: 6, goalTeam: "Juventus", cards: "No cards" } ] },
    { id: "31", team1: "Arsenal", team2: "Chelsea", image: footballPng, status: "resolved", epochResults: [ { epoch: 1, goalTeam: "Arsenal", cards: "No cards" }, { epoch: 2, goalTeam: "Chelsea", cards: "Yes cards" }, { epoch: 3, goalTeam: "Arsenal", cards: "No cards" }, { epoch: 5, goalTeam: "Arsenal", cards: "Yes cards" }, { epoch: 6, goalTeam: "Chelsea", cards: "No cards" } ] },
    { id: "32", team1: "Atletico Madrid", team2: "Valencia", image: footballPng, status: "resolved", epochResults: [ { epoch: 1, goalTeam: "Atletico Madrid", cards: "Yes cards" }, { epoch: 2, goalTeam: "Valencia", cards: "No cards" }, { epoch: 3, goalTeam: "Atletico Madrid", cards: "Yes cards" }, { epoch: 5, goalTeam: "Valencia", cards: "No cards" }, { epoch: 6, goalTeam: "Atletico Madrid", cards: "Yes cards" } ] }
  ];

  const [markets, setMarkets] = useState<Market[]>(() => {
    // remove mock upcoming fixtures that lack a matchStartTime so they don't show in the UI
    const upcomingWithTime = upcomingMarkets.filter((m) => typeof m.matchStartTime === 'number');
    const all = [...liveMarkets, ...upcomingWithTime, ...resolvedMarkets];
    return all.map((m) => ({ ...m, page: derivePageCategory(m) }));
  });

  // Fetch persisted markets from backend and merge them into the markets state.
  // This makes newly created markets (saved by create flows) appear in the lists.
  useEffect(() => {
    let mounted = true;

    const fetchAndMerge = async () => {
      try {
        const resp = await fetch('http://localhost:4000/api/markets');
        if (!mounted || !resp.ok) return;
        const rows = await resp.json();
        if (!Array.isArray(rows)) return;

        setMarkets((prev) => {
          // Build markets with polled rows first so backend data shows up before mock fixtures
          const prevById = new Map(prev.map((p) => [p.id, p]));
          const merged: Market[] = [];

          for (const r of rows) {
            const id = r.address || r.id;
            if (!id) continue;
            const existing = prevById.get(id) || undefined;
            const marketItem: Market = {
              id,
              team1: r.team1 || r.teamA || 'Team A',
              team2: r.team2 || r.teamB || 'Team B',
              image: r.image || footballPng,
              matchStartTime: r.matchStartTime ? Number(r.matchStartTime) : undefined,
              page: undefined,
            };
            marketItem.page = derivePageCategory({ ...existing, ...marketItem });
            merged.push({ ...existing, ...marketItem });

            // Kick off an async on-chain verification for epoch results; update state when found
            (async () => {
              try {
                const { epochResults } = await fetchOnChainEpochResults(publicClient, String(id), marketItem.team1, marketItem.team2);
                if (epochResults && epochResults.length) {
                  setMarkets((cur) => cur.map((m) => {
                    if (m.id !== id) return m;
                    return { ...m, status: 'resolved', epochResults, page: 'resolved' } as Market;
                  }));
                }
              } catch (err) {
                console.debug('on-chain resolution check failed for', id, err);
              }
            })();
          }

          // append previous items that weren't in the polled rows
          for (const p of prev) {
            if (!merged.find((m) => m.id === p.id)) merged.push(p);
          }

          // remove any lingering mock upcoming entries that don't have a matchStartTime
          const filtered = merged.filter((m) => {
            // if an entry is labelled upcoming but has no start time, exclude it
            if ((m as any).status === 'upcoming' && (m.matchStartTime === undefined || m.matchStartTime === null)) return false;
            return true;
          });

          return filtered;
        });
      } catch (e) {
        console.debug('Failed to fetch persisted markets', e);
      }
    };

    // initial fetch
    fetchAndMerge();

    // poll the backend every 5 seconds to pick up newly created markets
    const id = setInterval(fetchAndMerge, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Periodically refresh market page categories and update only changed cards.
  useEffect(() => {
    const id = setInterval(() => {
      setMarkets((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          const newPage = derivePageCategory(m);
          if (newPage !== m.page) {
            changed = true;
            return { ...m, page: newPage };
          }
          return m;
        });
        return changed ? next : prev;
      });
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // Per-second tick to update countdown displays without reloading the page.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // sort all markets by soonest matchStartTime so the UI shows nearest matches first
  const sortedMarkets = [...markets].sort((a, b) => {
    const aStart = a.matchStartTime ?? Number.POSITIVE_INFINITY;
    const bStart = b.matchStartTime ?? Number.POSITIVE_INFINITY;
    return aStart - bStart;
  });
  // compute page dynamically per-render so markets become 'live' 15 minutes before start
  // and ensure Upcoming only contains markets with a real matchStartTime (>15 minutes away)
  const visibleMarkets = sortedMarkets.filter((m) => {
    const cat = derivePageCategory(m);
    if (activeTab === 'upcoming') {
      // Only consider as upcoming if there's a defined matchStartTime and derivePageCategory says 'upcoming'
      return typeof m.matchStartTime === 'number' && cat === 'upcoming';
    }
    return cat === activeTab;
  });

  const volumes = ["$250.88k", "$182.45k", "$310.22k", "$195.67k", "$275.33k", "$220.19k", "$298.54k", "$165.78k", "$342.90k", "$208.15k", "$267.82k", "$189.43k"];

  return (
    <div className="min-h-screen bg-[#0d0d0d] pt-16">
      {/* Tabs and Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setActiveTab("live")}
                className={activeTab === "live" ? "bg-[#3D6734] hover:bg-[#2d4f27] rounded-lg px-6" : "bg-transparent hover:bg-gray-800 text-gray-400 rounded-lg px-6"}
              >
                Live
              </Button>
              <Button 
                onClick={() => setActiveTab("upcoming")}
                className={activeTab === "upcoming" ? "bg-[#3D6734] hover:bg-[#2d4f27] rounded-lg px-6" : "bg-transparent hover:bg-gray-800 text-gray-400 rounded-lg px-6"}
              >
                Upcoming
              </Button>
              <Button 
                onClick={() => setActiveTab("resolved")}
                className={activeTab === "resolved" ? "bg-[#3D6734] hover:bg-[#2d4f27] rounded-lg px-6" : "bg-transparent hover:bg-gray-800 text-gray-400 rounded-lg px-6"}
              >
                Resolved
              </Button>
            </div>
          </div>

        {/* Resolved Page Search Bar */}
        {activeTab === "resolved" && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
              <Input
                placeholder="Search by CA"
                className="pl-10 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        )}

        {/* Market Cards Grid */}
        <div className={`grid gap-6 ${activeTab === "resolved" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}>
          {visibleMarkets.map((market, index) => {
            const matchStart = market.matchStartTime ? market.matchStartTime * 1000 : undefined;
            let countdownMs: number | undefined;
            if (activeTab === 'upcoming' && matchStart) {
              countdownMs = matchStart - nowMs;
            }
            if (activeTab === 'live' && matchStart) {
              const end = matchStart + 75 * 60 * 1000;
              countdownMs = end - nowMs;
            }
            const countdownCompact = countdownMs ? formatCompact(countdownMs) : undefined;
            const countdownLabel = countdownMs
              ? (activeTab === 'upcoming' ? `Starts in` : `Ends in`)
              : undefined;

            return (
            <div
              key={market.id}
              className="bg-[#1a1a1a] rounded-lg shadow-sm p-4 hover:shadow-md transition-all duration-300 transform-gpu border border-gray-800 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <ImageWithFallback
                  src={market.image}
                  alt={`${market.team1} vs ${market.team2}`}
                  className="size-10 rounded object-cover"
                />
                <div className="text-sm text-white">
                  {market.team1} vs {market.team2}
                </div>
              </div>
              {/* Compact countdown moved here (just below match details). Grey but visible. */}
              {countdownCompact && countdownLabel && (
                <div className="text-xs text-gray-300 mt-1 mb-3 flex items-center gap-2">
                  <span className="text-gray-400">›</span>
                  <span className="whitespace-nowrap">{countdownLabel} {countdownCompact}</span>
                </div>
              )}

              {market.status === "resolved" && market.epochResults ? (
                <div className="bg-[#0d0d0d] rounded p-3 space-y-2">
                  {market.epochResults.map((result) => (
                    <div key={result.epoch} className="flex items-center justify-between gap-3 pb-2 border-b border-gray-800 last:border-b-0 last:pb-0">
                      <div className="text-xs text-gray-300 flex-1">
                        <span className="text-gray-500">Epoch {result.epoch}:</span> {result.goalTeam}, {result.cards}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleClaimWinnings(market, result.epoch)}
                        disabled={Boolean(claimLoadingMap[`${market.id}:${result.epoch}`])}
                        className="bg-[#3D6734] hover:bg-[#2d4f27] h-7 px-3 text-xs"
                      >
                        {claimLoadingMap[`${market.id}:${result.epoch}`] ? 'Claiming…' : 'Claim Winnings'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <PredictionChart compact volume={market.status === "upcoming" ? "$0" : volumes[index % volumes.length]} />
                  </div>

                  <Button
                    onClick={() => onMarketClick(market)}
                    className={`w-full ${
                      market.page === "upcoming"
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-[#3D6734] hover:bg-[#2d4f27]"
                    }`}
                  >
                    {market.page === "upcoming" ? "UPCOMING" : "PREDICT NOW"}
                  </Button>
                </>
              )}
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}
