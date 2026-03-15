import { createPublicClient, http } from "viem";
import { baseSepolia, mainnet } from "viem/chains";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

// Ethereum mainnet client — used exclusively for ENS resolution
export const ensClient = createPublicClient({
  chain: mainnet,
  transport: http("https://cloudflare-eth.com"),
});
