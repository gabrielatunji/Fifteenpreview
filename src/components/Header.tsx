import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import logo from "../assets/15-markets.png";
import { useWeb3 } from "../hooks/useWeb3";

interface HeaderProps {
  onCreateMarket?: () => void;
}

export function Header({ onCreateMarket }: HeaderProps) {
  const { address, isConnected, connectWallet, disconnectWallet } = useWeb3();

  const shortAddress = (addr?: string | null) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-[#1a1a1a] border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Fifteen Markets logo" className="h-10 w-10 object-contain" />
            <div className="flex flex-col leading-none">
              <span className="text-white text-lg font-bold">Fifteen</span>
              <span className="text-white text-lg font-bold -mt-0.5">Markets</span>
          </div>
        </div>
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
          <Button
            onClick={() => {
              if (isConnected) {
                disconnectWallet();
              } else {
                connectWallet();
              }
            }}
            className="bg-[#3D6734] hover:bg-[#2d4f27]"
          >
            {isConnected ? shortAddress(address) : 'CONNECT WALLET'}
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
