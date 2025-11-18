import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { useToast } from "./ui/toast";
import football from "../assets/football.png";
import { useMarketOperations } from "../hooks/useMarketOperations";
import TimeSelect from "./TimeSelect";

interface CreateCustomMarketPageProps {
  onBack: () => void;
  onMarketCreated?: (market: { id: string; team1: string; team2: string; image: string }) => void;
}

export function CreateCustomMarketPage({ onBack, onMarketCreated }: CreateCustomMarketPageProps) {
  const { createMarket, creating, isConnected, waitForMarketAddress } = useMarketOperations();

  const [teamAName, setTeamAName] = useState<string>("");
  const [teamBName, setTeamBName] = useState<string>("");
  const [leagueName, setLeagueName] = useState<string>("");
  const [marketTerms, setMarketTerms] = useState<string>("");
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const { toast, dismiss } = useToast();

  const [matchDate, setMatchDate] = useState<string>(() => {
    const d = new Date();
    // YYYY-MM-DD
    return d.toISOString().slice(0, 10);
  });

  const [matchTime, setMatchTime] = useState<string>("18:00");

  const getNextDays = (days: number) => {
    const arr: { value: string; label: string }[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const value = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      arr.push({ value, label });
    }
    return arr;
  };

  // Time options are provided by local TimeSelect component (00:00 - 23:45 by default)

  const toUnixSeconds = (date: string, time: string) => {
    // date: YYYY-MM-DD, time: HH:MM
    // Construct a Date in local timezone and return seconds since epoch
    const iso = `${date}T${time}:00`;
    const d = new Date(iso);
    return Math.floor(d.getTime() / 1000);
  };

  const handleCreateMarket = async () => {
    const nextErrors: { [k: string]: string } = {};
    if (!teamAName) nextErrors.teamAName = "Team A (home) is required";
    if (!teamBName) nextErrors.teamBName = "Team B (away) is required";
    if (!leagueName) nextErrors.leagueName = "League is recommended";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!isConnected) {
      toast({ type: "error", description: "Please connect your wallet before creating a market" });
      return;
    }

    const matchStartTime = toUnixSeconds(matchDate, matchTime);
    const matchDetails = `${teamAName} vs ${teamBName}`.trim();

    try {
      // createMarket now returns the tx hash immediately
      const txHash = await createMarket(matchDetails, matchStartTime, teamAName, teamBName);

      // show immediate persistent feedback (duration 0) and include link to BscScan testnet
      const creatingToastId = toast({ type: "info", title: "Creating market", description: `Transaction submitted`, txHash, duration: 0 });

      // Wait for the factory to emit MarketCreated and return the new market address
      const { newMarketAddress, blockNumber } = await waitForMarketAddress(txHash as `0x${string}`);

      // Dismiss the persistent creating toast
      try { dismiss(creatingToastId); } catch (e) { /* ignore */ }

      if (newMarketAddress) {
        // success toast with tx link
        toast({ type: "success", title: "Market created", description: `Market: ${newMarketAddress}`, txHash });
        if (onMarketCreated) {
          const market = { id: newMarketAddress, team1: teamAName, team2: teamBName, image: football, matchStartTime };
          // persist to backend
          try {
            fetch('http://localhost:4000/api/markets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: newMarketAddress,
                address: newMarketAddress,
                team1: teamAName,
                team2: teamBName,
                image: football,
                matchStartTime,
                fromBlock: blockNumber,
              }),
            }).catch((e) => console.debug('persist market failed', e));
          } catch (e) {
            console.debug('persist market failed', e);
          }
          onMarketCreated(market);
          return;
        }
      } else {
        // No address found in logs; show a toast indicating submission and navigate back after a delay
        toast({ type: "success", title: "Submitted", description: "Market creation submitted (awaiting confirmation)", txHash });
        setTimeout(() => onBack(), 2000);
      }
    } catch (err) {
      console.error(err);
      toast({ type: "error", description: "Failed to create market. See console for details." });
    }
  };
  return (
    <div className="min-h-screen bg-[#0d0d0d] pt-16">
      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8 relative">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-white mb-2">Market details</h2>
              <p className="text-sm text-gray-400">Choose carefully, these can't be changed once the market is created</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                aria-label="Close create market"
                onClick={() => onBack()}
                className="w-9 h-9 rounded-md flex items-center justify-center bg-[#0d0d0d] border border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* notifications are handled via the global ToastProvider */}

          <div className="space-y-6">
            {/* Home Team */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeTeam" className="text-gray-300">
                  Home Team (Team A)
                </Label>
                <Input
                  id="homeTeam"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  placeholder="Enter home team name"
                  className="bg-[#0d0d0d] border-gray-700 text-white placeholder:text-gray-500"
                />
                {errors.teamAName && <div className="text-xs text-red-400">{errors.teamAName}</div>}
              </div>

              {/* Away Team */}
              <div className="space-y-2">
                <Label htmlFor="awayTeam" className="text-gray-300">
                  Away Team (Team B)
                </Label>
                <Input
                  id="awayTeam"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  placeholder="Enter away team name"
                  className="bg-[#0d0d0d] border-gray-700 text-white placeholder:text-gray-500"
                />
                {errors.teamBName && <div className="text-xs text-red-400">{errors.teamBName}</div>}
              </div>
            </div>

            {/* League */}
            <div className="space-y-2">
              <Label htmlFor="league" className="text-gray-300">
                League
              </Label>
              <Input
                id="league"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="Enter league name (e.g. Premier League)"
                className="bg-[#0d0d0d] border-gray-700 text-white placeholder:text-gray-500"
              />
              {errors.leagueName && <div className="text-xs text-red-400">{errors.leagueName}</div>}
            </div>

            {/* Match Date & Time (dropdowns) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matchDate" className="text-gray-300">
                  Match Date
                </Label>
                <div>
                  <select
                    id="matchDate"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-md bg-[#0d0d0d] border border-gray-700 text-white"
                  >
                    {getNextDays(30).map((d) => (
                      <option key={d.value} value={d.value} className="bg-[#0d0d0d] text-white">
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.matchDate && <div className="text-xs text-red-400">{errors.matchDate}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="matchTime" className="text-gray-300">
                  Match Time
                </Label>
                <TimeSelect
                  value={matchTime}
                  onChange={(v) => setMatchTime(v)}
                  ariaLabel="Match Time"
                />
                {errors.matchTime && <div className="text-xs text-red-400">{errors.matchTime}</div>}
              </div>
            </div>

            {/* Market Terms */}
            <div className="space-y-2">
              <Label htmlFor="marketTerms" className="text-gray-300">
                Market Terms
              </Label>
              <Textarea
                id="marketTerms"
                value={marketTerms}
                onChange={(e) => setMarketTerms(e.target.value)}
                placeholder="Write market terms and conditions..."
                className="bg-[#0d0d0d] border-gray-700 text-white placeholder:text-gray-500 min-h-[120px] resize-none"
              />
            </div>

            {/* Match Image (placeholder) */}
            <div className="space-y-2">
              <Label className="text-gray-300"> Default Match Image</Label>
              <div className="flex items-center gap-4">
                <img
                  src={football}
                  alt="Match placeholder"
                  className="w-20 h-20 rounded-lg object-cover bg-gray-800"
                />
                <div className="text-sm text-gray-300">Using default match image</div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <Button
              onClick={handleCreateMarket}
              disabled={creating}
              className={`w-full bg-[#3D6734] hover:bg-[#2d4f27] h-12 ${creating ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {creating ? 'Creating…' : 'Create Market'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
