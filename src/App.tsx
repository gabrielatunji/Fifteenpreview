import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { MarketDetailPage } from "./components/MarketDetailPage";
import { CreateMarketPage } from "./components/CreateMarketPage";

interface Market {
  id: string;
  team1: string;
  team2: string;
  image: string;
}

type Page = "home" | "marketDetail" | "createMarket";

export default function App() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const handleMarketClick = (market: Market) => {
    setSelectedMarket(market);
    setCurrentPage("marketDetail");
  };

  const handleCreateMarket = () => {
    setCurrentPage("createMarket");
  };

  const handleBack = () => {
    setCurrentPage("home");
    setSelectedMarket(null);
  };

  return (
    <div className="size-full">
      {currentPage === "home" && (
        <HomePage 
          onMarketClick={handleMarketClick} 
          onCreateMarket={handleCreateMarket}
        />
      )}
      {currentPage === "marketDetail" && selectedMarket && (
        <MarketDetailPage
          market={selectedMarket}
          onBack={handleBack}
        />
      )}
      {currentPage === "createMarket" && (
        <CreateMarketPage 
          onBack={handleBack}
          onCreateCustomMarket={() => {/* TODO: Implement custom market creation */}}
        />
      )}
    </div>
  );
}