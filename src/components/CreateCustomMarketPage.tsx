import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface CreateCustomMarketPageProps {
  onBack: () => void;
}

export function CreateCustomMarketPage({ onBack }: CreateCustomMarketPageProps) {
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
            <h1 className="text-white">Create Custom Market</h1>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8">
          <div className="mb-6">
            <h2 className="text-white mb-2">Market details</h2>
            <p className="text-sm text-gray-400">Choose carefully, these can't be changed once the market is created</p>
          </div>

          <div className="space-y-6">
            {/* Home Team */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeTeam" className="text-gray-300">
                  Home Team
                </Label>
                <Input
                  id="homeTeam"
                  placeholder="Enter home team name"
                  className="bg-[#0d0d0d] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Away Team */}
              <div className="space-y-2">
                <Label htmlFor="awayTeam" className="text-gray-300">
                  Away Team
                </Label>
                <Input
                  id="awayTeam"
                  placeholder="Enter away team name"
                  className="bg-[#0d0d0d] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* League */}
            <div className="space-y-2">
              <Label htmlFor="league" className="text-gray-300">
                League
              </Label>
              <Input
                id="league"
                placeholder="Enter league name (e.g. Premier League)"
                className="bg-[#0d0d0d] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Match Start Time */}
            <div className="space-y-2">
              <Label htmlFor="matchStart" className="text-gray-300">
                Match Start Time
              </Label>
              <Input
                id="matchStart"
                type="datetime-local"
                className="bg-[#0d0d0d] border-gray-700 text-white"
              />
            </div>

            {/* Market Terms */}
            <div className="space-y-2">
              <Label htmlFor="marketTerms" className="text-gray-300">
                Market Terms
              </Label>
              <Textarea
                id="marketTerms"
                placeholder="Write market terms and conditions..."
                className="bg-[#0d0d0d] border-gray-700 text-white placeholder:text-gray-500 min-h-[120px] resize-none"
              />
            </div>

            {/* Upload Section */}
            <div className="space-y-2">
              <Label className="text-gray-300">Match Image</Label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center bg-[#0d0d0d]">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-12 rounded-lg bg-gray-800 flex items-center justify-center">
                    <svg
                      className="size-6 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white mb-1">Select video or image to upload</p>
                    <p className="text-sm text-gray-500">or drag and drop it here</p>
                  </div>
                  <Button className="bg-[#3D6734] hover:bg-[#2d4f27]">
                    Select file
                  </Button>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1 mt-2">
                <p>• Image - max 15mb, .jpg, .gif or .png recommended</p>
                <p>• Video - max 30mb, .mp4 recommended</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <Button className="w-full bg-[#3D6734] hover:bg-[#2d4f27] h-12">
              Create Market
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
