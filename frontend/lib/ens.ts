import { ensClient } from "./client";

export interface EnsIdentity {
  name: string | null;
  avatar: string | null;
  displayName: string; // ENS name or shortened hex fallback
}

export function shortHex(address: string): string {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

/**
 * Resolve an Ethereum address to its ENS name and avatar.
 * Falls back gracefully to shortened hex if no ENS name exists.
 */
export async function resolveEns(address: string): Promise<EnsIdentity> {
  try {
    const name = await ensClient.getEnsName({
      address: address as `0x${string}`,
    });

    let avatar: string | null = null;
    if (name) {
      try {
        avatar = await ensClient.getEnsAvatar({ name });
      } catch {
        // avatar is optional
      }
    }

    return {
      name,
      avatar,
      displayName: name ?? shortHex(address),
    };
  } catch {
    return {
      name: null,
      avatar: null,
      displayName: shortHex(address),
    };
  }
}

/**
 * Resolve multiple addresses in parallel.
 */
export async function resolveEnsMany(
  addresses: string[]
): Promise<Record<string, EnsIdentity>> {
  const unique = [...new Set(addresses)];
  const results = await Promise.all(
    unique.map(async (addr) => [addr, await resolveEns(addr)] as const)
  );
  return Object.fromEntries(results);
}
