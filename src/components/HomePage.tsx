import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { PredictionChart } from "./PredictionChart";
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logo from "figma:asset/b6a5dde33854917905718e88631df160c25281e0.png";

interface Market {
  id: string;
  team1: string;
  team2: string;
  image: string;
  status?: "live" | "upcoming" | "resolved";
  epochResults?: { epoch: number; goalTeam: string; cards: string }[];
}

interface HomePageProps {
  onMarketClick: (market: Market) => void;
  onCreateMarket: () => void;
}

export function HomePage({ onMarketClick, onCreateMarket }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "resolved">("live");

  const liveMarkets: Market[] = [
    {
      id: "1",
      team1: "Arsenal",
      team2: "Manchester United",
      image: "placeholder",
      status: "live"
    },
    {
      id: "2",
      team1: "Liverpool",
      team2: "Chelsea",
      image: "placeholder",
      status: "live"
    },
    {
      id: "3",
      team1: "Manchester City",
      team2: "Tottenham",
      image: "placeholder",
      status: "live"
    },
    {
      id: "4",
      team1: "Newcastle",
      team2: "Brighton",
      image: "placeholder",
      status: "live"
    },
    {
      id: "5",
      team1: "Aston Villa",
      team2: "West Ham",
      image: "placeholder",
      status: "live"
    },
    {
      id: "6",
      team1: "Everton",
      team2: "Fulham",
      image: "placeholder",
      status: "live"
    },
    {
      id: "7",
      team1: "Wolves",
      team2: "Brentford",
      image: "placeholder",
      status: "live"
    },
    {
      id: "8",
      team1: "Crystal Palace",
      team2: "Bournemouth",
      image: "placeholder",
      status: "live"
    },
    {
      id: "9",
      team1: "Nottingham Forest",
      team2: "Luton Town",
      image: "placeholder",
      status: "live"
    },
    {
      id: "10",
      team1: "Sheffield United",
      team2: "Burnley",
      image: "placeholder",
      status: "live"
    },
    {
      id: "11",
      team1: "Real Madrid",
      team2: "Atletico Madrid",
      image: "placeholder",
      status: "live"
    },
    {
      id: "12",
      team1: "Barcelona",
      team2: "Sevilla",
      image: "placeholder",
      status: "live"
    }
  ];

  const upcomingMarkets: Market[] = [
    {
      id: "13",
      team1: "Bayern Munich",
      team2: "Borussia Dortmund",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "14",
      team1: "PSG",
      team2: "Marseille",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "15",
      team1: "Inter Milan",
      team2: "AC Milan",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "16",
      team1: "Juventus",
      team2: "Napoli",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "17",
      team1: "Ajax",
      team2: "Feyenoord",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "18",
      team1: "Benfica",
      team2: "Porto",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "19",
      team1: "Celtic",
      team2: "Rangers",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "20",
      team1: "Lyon",
      team2: "Monaco",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "21",
      team1: "Galatasaray",
      team2: "Fenerbahce",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "22",
      team1: "Sporting CP",
      team2: "Braga",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "23",
      team1: "Lazio",
      team2: "Roma",
      image: "placeholder",
      status: "upcoming"
    },
    {
      id: "24",
      team1: "Atletico Madrid",
      team2: "Real Sociedad",
      image: "placeholder",
      status: "upcoming"
    }
  ];

  const resolvedMarkets: Market[] = [
    {
      id: "25",
      team1: "Real Madrid",
      team2: "Barcelona",
      image: "placeholder",
      status: "resolved",
      epochResults: [
        { epoch: 1, goalTeam: "Real Madrid", cards: "No cards" },
        { epoch: 2, goalTeam: "Barcelona", cards: "Yes cards" },
        { epoch: 3, goalTeam: "Real Madrid", cards: "No cards" },
        { epoch: 5, goalTeam: "Barcelona", cards: "Yes cards" },
        { epoch: 6, goalTeam: "Real Madrid", cards: "No cards" }
      ]
    },
    {
      id: "26",
      team1: "Bayern Munich",
      team2: "Dortmund",
      image: "placeholder",
      status: "resolved",
      epochResults: [
        { epoch: 1, goalTeam: "Bayern Munich", cards: "Yes cards" },
        { epoch: 2, goalTeam: "Dortmund", cards: "No cards" },
        { epoch: 3, goalTeam: "Bayern Munich", cards: "Yes cards" },
        { epoch: 5, goalTeam: "Dortmund", cards: "No cards" },
        { epoch: 6, goalTeam: "Bayern Munich", cards: "Yes cards" }
      ]
    },
    {
      id: "27",
      team1: "PSG",
      team2: "Marseille",
      image: "placeholder",
      status: "resolved",
      epochResults: [
        { epoch: 1, goalTeam: "PSG", cards: "No cards" },
        { epoch: 2, goalTeam: "PSG", cards: "Yes cards" },
        { epoch: 3, goalTeam: "Marseille", cards: "No cards" },
        { epoch: 5, goalTeam: "PSG", cards: "Yes cards" },
        { epoch: 6, goalTeam: "Marseille", cards: "No cards" }
      ]
    },
    {
      id: "28",
      team1: "Inter Milan",
      team2: "AC Milan",
      image: "placeholder",
      status: "resolved",
      epochResults: [
        { epoch: 1, goalTeam: "Inter Milan", cards: "Yes cards" },
        { epoch: 2, goalTeam: "Inter Milan", cards: "No cards" },
        { epoch: 3, goalTeam: "AC Milan", cards: "Yes cards" },
        { epoch: 5, goalTeam: "Inter Milan", cards: "No cards" },
        { epoch: 6, goalTeam: "AC Milan", cards: "Yes cards" }
      ]
    },
    {
      id: "29",
      team1: "Liverpool",
      team2: "Manchester City",
      image: "placeholder",
      status: "resolved",
      epochResults: [
        { epoch: 1, goalTeam: "Liverpool", cards: "No cards" },
        { epoch: 2, goalTeam: "Manchester City", cards: "Yes cards" },
        { epoch: 3, goalTeam: "Liverpool", cards: "No cards" },
        { epoch: 5, goalTeam: "Manchester City", cards: "No cards" },
        { epoch: 6, goalTeam: "Liverpool", cards: "Yes cards" }
      ]
    },
    {
      id: "30",
      team1: "Juventus",
      team2: "Napoli",
      image: "placeholder",
      status: "resolved",
      epochResults: [
        { epoch: 1, goalTeam: "Juventus", cards: "Yes cards" },
        { epoch: 2, goalTeam: "Napoli", cards: "No cards" },
        { epoch: 3, goalTeam: "Juventus", cards: "Yes cards" },
        { epoch: 5, goalTeam: "Napoli", cards: "Yes cards" },
        { epoch: 6, goalTeam: "Juventus", cards: "No cards" }
      ]
    },
    {
      id: "31",
      team1: "Arsenal",
      team2: "Chelsea",
      image: "placeholder",
      status: "resolved",
      epochResults: [
        { epoch: 1, goalTeam: "Arsenal", cards: "No cards" },
        { epoch: 2, goalTeam: "Chelsea", cards: "Yes cards" },
        { epoch: 3, goalTeam: "Arsenal", cards: "No cards" },
        { epoch: 5, goalTeam: "Arsenal", cards: "Yes cards" },
        { epoch: 6, goalTeam: "Chelsea", cards: "No cards" }
      ]
    },
    {
      id: "32",
      team1: "Atletico Madrid",
      team2: "Valencia",
      image: "placeholder",
      status: "resolved",
      epochResults: [
        { epoch: 1, goalTeam: "Atletico Madrid", cards: "Yes cards" },
        { epoch: 2, goalTeam: "Valencia", cards: "No cards" },
        { epoch: 3, goalTeam: "Atletico Madrid", cards: "Yes cards" },
        { epoch: 5, goalTeam: "Valencia", cards: "No cards" },
        { epoch: 6, goalTeam: "Atletico Madrid", cards: "Yes cards" }
      ]
    }
  ];

  const getCurrentMarkets = () => {
    switch (activeTab) {
      case "live":
        return liveMarkets;
      case "upcoming":
        return upcomingMarkets;
      case "resolved":
        return resolvedMarkets;
      default:
        return liveMarkets;
    }
  };

  const markets = getCurrentMarkets();

  const volumes = ["$250.88k", "$182.45k", "$310.22k", "$195.67k", "$275.33k", "$220.19k", "$298.54k", "$165.78k", "$342.90k", "$208.15k", "$267.82k", "$189.43k"];

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <img src={logo} alt="Logo" className="h-8" />
          
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
              <Input
                placeholder="Search Markets"
                className="pl-10 bg-[#0d0d0d] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={onCreateMarket} className="bg-[#3D6734] hover:bg-[#2d4f27]">
              CREATE MARKET
            </Button>
            <Button className="bg-[#3D6734] hover:bg-[#2d4f27]">
              CONNECT WALLET
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs and Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-4">
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
          {markets.map((market, index) => (
            <div
              key={market.id}
              className="bg-[#1a1a1a] rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-800"
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

              {market.status === "resolved" && market.epochResults ? (
                <div className="bg-[#0d0d0d] rounded p-3 space-y-2">
                  {market.epochResults.map((result) => (
                    <div key={result.epoch} className="flex items-center justify-between gap-3 pb-2 border-b border-gray-800 last:border-b-0 last:pb-0">
                      <div className="text-xs text-gray-300 flex-1">
                        <span className="text-gray-500">Epoch {result.epoch}:</span> {result.goalTeam}, {result.cards}
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#3D6734] hover:bg-[#2d4f27] h-7 px-3 text-xs"
                      >
                        Claim Winnings
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
                    onClick={() => market.status === "live" && onMarketClick(market)}
                    className={`w-full ${
                      market.status === "upcoming"
                        ? "bg-gray-700 hover:bg-gray-600 cursor-default"
                        : "bg-[#3D6734] hover:bg-[#2d4f27]"
                    }`}
                    disabled={market.status === "upcoming"}
                  >
                    {market.status === "upcoming" ? "UPCOMING" : "PREDICT NOW"}
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}