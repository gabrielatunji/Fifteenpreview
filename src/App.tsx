import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { MarketDetailPage } from "./components/MarketDetailPage";
import { CreateMarketPage } from "./components/CreateMarketPage";
import { CreateCustomMarketPage } from "./components/CreateCustomMarketPage";
import { Header } from "./components/Header";
import { ToastProvider } from "./components/ui/toast";

interface Market {
  id: string;
  team1: string;
  team2: string;
  image: string;
  matchStartTime?: number;
}

type Page = "home" | "marketDetail" | "createMarket" | "createCustomMarket";

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

  const handleCreateCustomMarket = () => {
    setCurrentPage("createCustomMarket");
  };

  const handleBack = () => {
    setCurrentPage("home");
    setSelectedMarket(null);
  };

  const handleBackToCreateMarket = () => {
    setCurrentPage("createMarket");
  };

  const handleMarketCreated = (market: Market) => {
    setSelectedMarket(market);
    setCurrentPage("marketDetail");
  };
  return (
    <ToastProvider>
      <div className="size-full">
        <Header onCreateMarket={handleCreateMarket} />
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
            onCreateCustomMarket={handleCreateCustomMarket}
            onMarketCreated={handleMarketCreated}
          />
        )}
        {currentPage === "createCustomMarket" && (
          <CreateCustomMarketPage 
            onBack={handleBackToCreateMarket}
            onMarketCreated={handleMarketCreated}
          />
        )}
      </div>
    </ToastProvider>
  );
}