import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface UpcomingMatch {
  id: string;
  team1: string;
  team2: string;
  league: string;
  date: string;
  time: string;
}

interface CreateMarketPageProps {
  onBack: () => void;
  onCreateCustomMarket: () => void;
}

export function CreateMarketPage({ onBack, onCreateCustomMarket }: CreateMarketPageProps) {
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
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              ← Back
            </Button>
            <h1 className="text-white">Create Market</h1>
          </div>

          <Button
            onClick={onCreateCustomMarket}
            className="bg-[#3D6734] hover:bg-[#2d4f27]"
          >
            Create Custom Market
          </Button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
          <Input
            placeholder="Search upcoming matches..."
            className="pl-10 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
          />
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

                <Button className="bg-[#3D6734] hover:bg-[#2d4f27]">
                  CREATE MARKET
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
