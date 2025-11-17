import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';
import { ADMIN_ADDRESS } from '../contracts/addresses';

export const useWeb3 = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Check if connected address is the admin/deployer
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!address) {
        setIsAdmin(false);
        return;
      }

      // Use the admin address from addresses.ts
      setIsAdmin(address.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
    };

    checkAdminStatus();
  }, [address]);

  const connectWallet = async (connectorId?: string) => {
    try {
      let connector;
      
      if (connectorId) {
        // Connect to specific wallet
        connector = connectors.find(c => c.id === connectorId);
      } else {
        // Default to injected (MetaMask)
        connector = connectors.find(c => c.id === 'injected');
      }

      if (connector) {
        connect({ connector });
        setShowWalletModal(false);
      } else {
        throw new Error('Wallet connector not found');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const openWalletModal = () => {
    setShowWalletModal(true);
  };

  const closeWalletModal = () => {
    setShowWalletModal(false);
  };

  const disconnectWallet = () => {
    disconnect();
  };

  return {
    address,
    isConnected,
    isAdmin,
    showWalletModal,
    connectors,
    connectWallet,
    disconnectWallet,
    openWalletModal,
    closeWalletModal,
  };
};