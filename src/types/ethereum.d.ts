import { EIP1193Provider } from '@wagmi/core';

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}