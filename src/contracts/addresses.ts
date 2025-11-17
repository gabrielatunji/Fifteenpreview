export const CONTRACT_ADDRESSES = {
    PREDICTION_MARKET_FACTORY: '0x10a729326df51763e2276c28b6d889e8ac8da14a',
    EPOCHAL_MATCH_MARKET: '0x59c838bdd0299b264f6c6bf0b4133ac5644eb0e3',
    BET_RECEIPT_NFT: '0xd6b737173b6ea9ddc1f1fe6a82e25d270aa94d29',
} as const;

export const ADMIN_ADDRESS = '0x226C8D1A6ec91D86892AC6e7bb99f324aA80e7Cf';

// Multiple RPC endpoints for fallback
export const BSC_TESTNET_RPC_URLS = [
    'https://data-seed-prebsc-1-s1.binance.org:8545/',
    'https://data-seed-prebsc-2-s1.binance.org:8545/',
    'https://data-seed-prebsc-1-s2.binance.org:8545/',
    'https://bsc-testnet.publicnode.com'
];

// Network configuration
export const NETWORK_CONFIG = {
    chainId: 97, // BSC Testnet
    chainName: 'BNB Smart Chain Testnet',
    rpcUrls: BSC_TESTNET_RPC_URLS,
    blockExplorerUrls: ['https://testnet.bscscan.com/'],
};