import { Button } from "./ui/button";
import { ChevronLeft } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useToast } from "./ui/toast";
import { useMarketOperations } from "../hooks/useMarketOperations";
import football from "../assets/football.png";

interface UpcomingMatch {
  id: string;
  team1: string;
  team2: string;
  league: string;
  date: string;
  time: string;
}

interface CreateMarketPageProps {
  onCreateCustomMarket: () => void;
  onBack: () => void;
  onMarketCreated?: (market: { id: string; team1: string; team2: string; image: string }) => void;
}

function parseMatchDateTimeToUnix(dateStr: string, timeStr: string) {
  // dateStr example: "Nov 20, 2025"  timeStr example: "15:00"
  try {
    const combined = `${dateStr} ${timeStr}`; // e.g. "Nov 20, 2025 15:00"
    const d = new Date(combined);
    if (isNaN(d.getTime())) return null;
    return Math.floor(d.getTime() / 1000);
  } catch (e) {
    return null;
  }
}

function CreateMatchButton({ match, onMarketCreated }: { match: UpcomingMatch; onMarketCreated?: (market: { id: string; team1: string; team2: string; image: string; matchStartTime?: number }) => void }) {
  const { toast, dismiss } = useToast();
  const { createMarket, creating, isConnected, waitForMarketAddress } = useMarketOperations();

  const handleCreate = async () => {
    if (!isConnected) {
      toast({ type: 'error', description: 'Please connect your wallet before creating a market' });
      return;
    }

    const matchStartTime = parseMatchDateTimeToUnix(match.date, match.time);
    if (!matchStartTime) {
      toast({ type: 'error', description: 'Invalid match date/time' });
      return;
    }

    const matchDetails = `${match.team1} vs ${match.team2}`.trim();

    try {
      const txHash = await createMarket(matchDetails, matchStartTime, match.team1, match.team2);
      const creatingToastId = toast({ type: 'info', title: 'Creating market', description: 'Transaction submitted', txHash, duration: 0 });

      // wait for factory MarketCreated event
      const { newMarketAddress, blockNumber } = await waitForMarketAddress(txHash as `0x${string}`);

      try { dismiss(creatingToastId); } catch (e) { /* ignore */ }

      if (newMarketAddress) {
        toast({ type: 'success', title: 'Market created', description: `Market: ${newMarketAddress}`, txHash });
        // persist to backend
        try {
          fetch('http://localhost:4000/api/markets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: newMarketAddress,
              address: newMarketAddress,
              team1: match.team1,
              team2: match.team2,
              image: football,
              matchStartTime,
              fromBlock: blockNumber,
            }),
          }).catch((e) => console.debug('persist market failed', e));
        } catch (e) {
          console.debug('persist market failed', e);
        }
        if (onMarketCreated) {
          onMarketCreated({ id: newMarketAddress, team1: match.team1, team2: match.team2, image: football, matchStartTime });
        }
      } else {
        toast({ type: 'success', title: 'Submitted', description: 'Market creation submitted (awaiting confirmation)', txHash });
      }
    } catch (err) {
      console.error(err);
      toast({ type: 'error', description: 'Failed to create market. See console for details.' });
    }
  };

  return (
    <Button onClick={handleCreate} disabled={creating} className="bg-[#3D6734] hover:bg-[#2d4f27]">
      {creating ? 'Creating…' : 'CREATE MARKET'}
    </Button>
  );
}

export function CreateMarketPage({ onCreateCustomMarket, onBack, onMarketCreated }: CreateMarketPageProps) {
  const upcomingMatches: UpcomingMatch[] = [
    {
      id: "1",
      team1: "Manchester United",
      team2: "Arsenal",
      league: "Premier League",
      date: "Nov 20, 2025",
      time: "15:00"
    },
    {
      id: "2",
      team1: "Real Madrid",
      team2: "Barcelona",
      league: "La Liga",
      date: "Nov 21, 2025",
      time: "20:00"
    },
    {
      id: "3",
      team1: "Bayern Munich",
      team2: "Borussia Dortmund",
      league: "Bundesliga",
      date: "Nov 22, 2025",
      time: "17:30"
    },
    {
      id: "4",
      team1: "PSG",
      team2: "Marseille",
      league: "Ligue 1",
      date: "Nov 23, 2025",
      time: "19:00"
    },
    {
      id: "5",
      team1: "Inter Milan",
      team2: "AC Milan",
      league: "Serie A",
      date: "Nov 24, 2025",
      time: "18:45"
    },
    {
      id: "6",
      team1: "Liverpool",
      team2: "Chelsea",
      league: "Premier League",
      date: "Nov 24, 2025",
      time: "16:30"
    },
    {
      id: "7",
      team1: "Atletico Madrid",
      team2: "Valencia",
      league: "La Liga",
      date: "Nov 25, 2025",
      time: "21:00"
    },
    {
      id: "8",
      team1: "Juventus",
      team2: "Napoli",
      league: "Serie A",
      date: "Nov 25, 2025",
      time: "19:45"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] pt-16">
      {/* Search Bar + Create Button (top row) */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ChevronLeft className="size-4 mr-2" />
            Back to Markets
          </Button>
        </div>

        <div className="ml-4">
          <Button onClick={onCreateCustomMarket} className="bg-[#3D6734] hover:bg-[#2d4f27]">
            Create Custom Market
          </Button>
        </div>
      </div>

      {/* Upcoming Matches List */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="space-y-3">
          {upcomingMatches.map((match) => (
            <div
              key={match.id}
              className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 flex items-center justify-between hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src="placeholder"
                    alt={match.team1}
                    className="size-10 rounded object-cover"
                  />
                  <span className="text-white">{match.team1}</span>
                </div>
                
                <span className="text-gray-500">vs</span>
                
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src="placeholder"
                    alt={match.team2}
                    className="size-10 rounded object-cover"
                  />
                  <span className="text-white">{match.team2}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-gray-400">{match.league}</div>
                  <div className="text-xs text-gray-500">
                    {match.date} • {match.time}
                  </div>
                </div>

                <CreateMatchButton match={match} onMarketCreated={onMarketCreated} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
