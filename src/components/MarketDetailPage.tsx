import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronLeft } from "lucide-react";
import { PredictionChart } from "./PredictionChart";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Market {
  id: string;
  team1: string;
  team2: string;
  image: string;
}

interface MarketDetailPageProps {
  market: Market;
  onBack: () => void;
}

type FilterType = "goal" | "cards";

export function MarketDetailPage({
  market,
  onBack,
}: MarketDetailPageProps) {
  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>("goal");
  const [selectedGoalTeam, setSelectedGoalTeam] = useState<
    "teamA" | "teamB" | null
  >(null);
  const [selectedCardsOption, setSelectedCardsOption] =
    useState<"yes" | "no" | null>(null);

  const currentEpoch = 2;

  const getEpochStatus = (epoch: number) => {
    if (epoch >= 1 && epoch <= 3) return "Open";
    if (epoch === 4) return "Paused";
    if (epoch >= 5 && epoch <= 6) return "Open";
    return "Closed";
  };

  const getEpochTimeRange = (epoch: number) => {
    const ranges: { [key: number]: string } = {
      1: "0-15 mins",
      2: "15-30 mins",
      3: "30-45 mins",
      4: "Halftime",
      5: "45-60 mins",
      6: "60-70 mins"
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
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ChevronLeft className="size-4 mr-2" />
            Back to Markets
          </Button>
          <h1 className="text-white">
            {market.team1} vs {market.team2}
          </h1>
        </div>
      </header>

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
                    src={market.image}
                    alt={`${market.team1} vs ${market.team2}`}
                    className="size-12 rounded object-cover"
                  />
                  <div>
                    <h2 className="text-white">
                      {market.team1} vs {market.team2}
                    </h2>
                    <p className="text-sm text-gray-400">
                      Premier League
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Epoch */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    Current Epoch:
                  </span>
                  <Badge className="bg-[#3D6734]">
                    Epoch {currentEpoch}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  Trading Status: {getEpochStatus(currentEpoch)}
                </div>
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
                            : epoch.status === "Paused"
                              ? "bg-orange-500 text-white"
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
                  <p>• Epochs 1-3: 0-45 mins (Trading Open)</p>
                  <p>• Epoch 4: Halftime Break (Trading Paused)</p>
                  <p>• Epochs 5-6: 45-70 mins (Trading Open)</p>
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
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Your Stake
                        </span>
                        <span className="text-white">
                          0.0 ETH
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Potential Return
                        </span>
                        <span className="text-white">
                          0.0 ETH
                        </span>
                      </div>
                      <Button className="w-full bg-[#3D6734] hover:bg-[#2d4f27]">
                        Place Prediction
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
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Your Stake
                        </span>
                        <span className="text-white">
                          0.0 ETH
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Potential Return
                        </span>
                        <span className="text-white">
                          0.0 ETH
                        </span>
                      </div>
                      <Button className="w-full bg-[#3D6734] hover:bg-[#2d4f27]">
                        Place Prediction
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