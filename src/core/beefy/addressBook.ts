/**
 * Beefy infrastructure address book.
 * 
 * Stores Beefy-specific infrastructure addresses per network:
 * - Vault factory (for cloning vaults)
 * - Keeper
 * - Fee configurator
 * - Fee recipient
 */

import { Network } from "../config/model.js";

/**
 * Beefy infrastructure addresses for a network.
 */
export interface BeefyAddresses {
  /** Vault factory address */
  vaultFactory: string;
  /** Keeper address */
  keeper: string;
  /** Fee configurator address */
  beefyFeeConfig: string;
  /** Fee recipient address */
  beefyFeeRecipient: string;
}

/**
 * Beefy address book: network -> addresses
 * 
 * TODO: Populate with actual Beefy addresses or document placeholder usage
 */
const ADDRESS_BOOK: Partial<Record<Network, BeefyAddresses>> = {
  mainnet: {
    vaultFactory: "", // TODO: Add actual addresses
    keeper: "",
    beefyFeeConfig: "",
    beefyFeeRecipient: "",
  },
  optimism: {
    vaultFactory: "",
    keeper: "",
    beefyFeeConfig: "",
    beefyFeeRecipient: "",
  },
  arbitrum: {
    vaultFactory: "",
    keeper: "",
    beefyFeeConfig: "",
    beefyFeeRecipient: "",
  },
  base: {
    vaultFactory: "",
    keeper: "",
    beefyFeeConfig: "",
    beefyFeeRecipient: "",
  },
};

/**
 * Gets Beefy addresses for a given network.
 * 
 * @param network - Target network
 * @returns BeefyAddresses for the network
 * @throws Error if network is not supported or addresses are missing
 */
export function getBeefyAddresses(network: Network): BeefyAddresses {
  const addresses = ADDRESS_BOOK[network];
  if (!addresses) {
    throw new Error(`Beefy addresses not found for network: ${network}`);
  }
  return addresses;
}

/**
 * Gets vault factory address for a network.
 * 
 * @param network - Target network
 * @returns Vault factory address
 */
export function getVaultFactory(network: Network): string {
  return getBeefyAddresses(network).vaultFactory;
}

/**
 * Gets keeper address for a network.
 * 
 * @param network - Target network
 * @returns Keeper address
 */
export function getKeeper(network: Network): string {
  return getBeefyAddresses(network).keeper;
}

/**
 * Gets fee configurator address for a network.
 * 
 * @param network - Target network
 * @returns Fee configurator address
 */
export function getFeeConfig(network: Network): string {
  return getBeefyAddresses(network).beefyFeeConfig;
}

/**
 * Gets fee recipient address for a network.
 * 
 * @param network - Target network
 * @returns Fee recipient address
 */
export function getFeeRecipient(network: Network): string {
  return getBeefyAddresses(network).beefyFeeRecipient;
}
