/**
 * Network metadata and configuration.
 * 
 * Defines supported networks (Ethereum, Optimism, Arbitrum, Base) with:
 * - Chain IDs
 * - Default RPC environment variable keys
 * - Optional suggested fork block numbers
 */

import { Network } from "./config/model.js";

/**
 * Network metadata structure.
 */
export interface NetworkMetadata {
  /** Chain ID */
  chainId: number;
  /** Environment variable key for RPC URL */
  rpcEnvVar: string;
  /** Optional suggested fork block number */
  forkBlock?: number;
}

/**
 * Network metadata map.
 */
export const NETWORK_METADATA: Record<Network, NetworkMetadata> = {
  mainnet: {
    chainId: 1,
    rpcEnvVar: "MAINNET_RPC_URL",
  },
  optimism: {
    chainId: 10,
    rpcEnvVar: "OPTIMISM_RPC_URL",
  },
  arbitrum: {
    chainId: 42161,
    rpcEnvVar: "ARBITRUM_RPC_URL",
  },
  base: {
    chainId: 8453,
    rpcEnvVar: "BASE_RPC_URL",
  },
};

/**
 * Gets metadata for a given network.
 * 
 * @param network - Network identifier
 * @returns NetworkMetadata for the network
 * @throws Error if network is not supported
 */
export function getNetworkMetadata(network: Network): NetworkMetadata {
  const metadata = NETWORK_METADATA[network];
  if (!metadata) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return metadata;
}

/**
 * Checks if a network is supported.
 * 
 * @param network - Network identifier to check
 * @returns true if network is supported
 */
export function isSupportedNetwork(network: string): network is Network {
  return network in NETWORK_METADATA;
}
