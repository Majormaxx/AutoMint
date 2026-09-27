import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  scValToNative,
  nativeToScVal,
} from "@stellar/stellar-sdk";
import {
  REGISTRY_CONTRACT_ID,
  BOT_NFT_CONTRACT_ID,
  MARKETPLACE_CONTRACT_ID,
  TOKEN_CONTRACT_ID,
  ACCRUAL_CONTRACT_ID,
  STELLAR_NETWORK_PASSPHRASE,
} from "./constants";
import { getServer } from "./stellar";
import type { BotNFT, UserProfile, BotTier, MarketplaceListing, AccrualState } from "@/types";

const toBigInt = (v: unknown): bigint =>
  typeof v === "bigint" ? v : BigInt(String(v ?? 0));

/**
 * Parse a raw scVal map from the registry contract into a typed UserProfile.
 * Handles the tier enum being returned as a string, array, or object.
 */
export function parseUserProfile(
  rawData: Record<string, unknown>
): UserProfile {
  const raw = rawData.points;
  const points = typeof raw === "bigint" ? raw : BigInt(String(raw ?? 0));
  return {
    username: String(rawData.username ?? ""),
    points,
  };
}

/**
 * Parse a raw scVal map from the bot_nft contract into a typed BotNFT.
 * Handles the tier enum being returned as a string, array, or object.
 */
export function parseBotNFT(rawData: Record<string, unknown>): BotNFT {
  let tier: BotTier = "Basic";

  // Handle tier as string
  if (typeof rawData.tier === "string") {
    tier = rawData.tier as BotTier;
  }
  // Handle tier as array (variant index + name)
  else if (Array.isArray(rawData.tier)) {
    const tierName = rawData.tier[1] ?? rawData.tier[0];
    if (typeof tierName === "string") {
      tier = tierName as BotTier;
    }
  }
  // Handle tier as object with variant property
  else if (typeof rawData.tier === "object" && rawData.tier !== null) {
    const tierObj = rawData.tier as Record<string, unknown>;
    tier = (tierObj.variant ?? tierObj.tag ?? "Basic") as BotTier;
  }

  return {
    id: toBigInt(rawData.id),
    name: String(rawData.name ?? ""),
    owner: String(rawData.owner ?? ""),
    tier,
    accrual_rate: toBigInt(rawData.accrual_rate),
    minted_at: Number(rawData.minted_at ?? 0),
    last_claim_timestamp: toBigInt(rawData.last_claim_timestamp),
  };
}

/**
 * Get the AMT token balance for a user.
 * Calls token contract's balance() function.
 */
export async function getAmtBalance(userAddress: string): Promise<bigint> {
  const server = getServer();
  const contract = new Contract(TOKEN_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount(userAddress), { fee: "100", networkPassphrase: "Test SDF Network ; September 2015" }
    )
      .addOperation(
        contract.call("balance", nativeToScVal(userAddress, { type: "address" }))
      )
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    throw new Error("Failed to get AMT balance");
  }

  if (!result.result?.retval) {
    throw new Error("No return value from simulation");
  }

  const balance = scValToNative(result.result.retval);
  return BigInt(balance ?? 0);
}

/**
 * List a bot on the marketplace.
 * Transfers bot to marketplace contract and creates listing.
 */
export async function listBot(
  userAddress: string,
  botId: bigint,
  price: bigint
): Promise<string> {
  const server = getServer();
  const contract = new Contract(MARKETPLACE_CONTRACT_ID);

  const txBuilder = new TransactionBuilder(
    await server.getAccount(userAddress),
    { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
  )
    .addOperation(
      contract.call(
        "list_bot",
        nativeToScVal(botId, { type: "u128" }),
        nativeToScVal(price, { type: "u128" })
      )
    )
    .setTimeout(30)
    .build();

  return txBuilder.toXDR();
}

/**
 * Buy a bot from the marketplace.
 * Transfers AMT tokens to seller and bot to buyer.
 */
export async function buyBot(address: string, listingId: number): Promise<string> {
  const server = getServer();
  const contract = new Contract(MARKETPLACE_CONTRACT_ID);

  const txBuilder = new TransactionBuilder(
    await server.getAccount(address), { fee: "100", networkPassphrase: "Test SDF Network ; September 2015" }
  )
    .addOperation(
      contract.call("buy_bot", nativeToScVal(listingId, { type: "u128" }))
    )
    .setTimeout(30)
    .build();

  return txBuilder.toXDR();
}

/**
 * Fetch the leaderboard of top users by points.
 */
export async function getLeaderboard(limit: number = 50): Promise<UserProfile[]> {
  const server = getServer();
  const contract = new Contract(REGISTRY_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount((window as any).selectedPublicKey), { fee: "100", networkPassphrase: "Test SDF Network ; September 2015" }
    )
      .addOperation(
        contract.call("leaderboard", nativeToScVal(limit, { type: "u32" }))
      )
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    return [];
  }

  if (!result.result?.retval) return [];

  const raw = scValToNative(result.result.retval);
  if (!Array.isArray(raw)) return [];

  return raw.map((entry: Record<string, unknown>) => parseUserProfile(entry));
}

/**
 * Mint a bot of a specific tier.
 */
export async function mintTierBot(address: string, tier: string, token: string): Promise<string> {
  const server = getServer();
  const contract = new Contract(BOT_NFT_CONTRACT_ID);

  const txBuilder = new TransactionBuilder(
    await server.getAccount(address), { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
  )
    .addOperation(
      contract.call(
        "mint_tier",
        nativeToScVal(address, { type: "address" }),
        nativeToScVal(tier, { type: "symbol" }),
        nativeToScVal(token, { type: "address" })
      )
    )
    .setTimeout(30)
    .build();

  return txBuilder.toXDR();
}

/**
 * Cancel a marketplace listing.
 * Returns the bot to the seller's wallet.
 */
export async function cancelListing(
  userAddress: string,
  listingId: bigint
): Promise<string> {
  const server = getServer();
  const contract = new Contract(MARKETPLACE_CONTRACT_ID);

  const txBuilder = new TransactionBuilder(
    await server.getAccount(userAddress),
    { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
  )
    .addOperation(
      contract.call(
        "cancel_listing",
        nativeToScVal(listingId, { type: "u128" })
      )
    )
    .setTimeout(30)
    .build();

  return txBuilder.toXDR();
}

/**
 * Get all active marketplace listings.
 * Returns array of listing objects.
 */
export async function getActiveListings(): Promise<MarketplaceListing[]> {
  const server = getServer();
  const contract = new Contract(MARKETPLACE_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount((window as any).selectedPublicKey), { fee: "100", networkPassphrase: "Test SDF Network ; September 2015" }
    )
      .addOperation(contract.call("get_active_listings"))
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    return [];
  }

  if (!result.result?.retval) {
    return [];
  }

  const listingsRaw = scValToNative(result.result.retval);

  if (!Array.isArray(listingsRaw)) {
    return [];
  }

  return listingsRaw.map((listing: Record<string, unknown>) => ({
    id: toBigInt(listing.id),
    seller: String(listing.seller ?? ""),
    bot_id: toBigInt(listing.bot_id),
    price: toBigInt(listing.price),
    listed_at: toBigInt(listing.listed_at),
  }));
}

/**
 * Get marketplace listings for a specific user.
 * Returns array of listings where user is the seller.
 */
export async function getUserListings(
  userAddress: string
): Promise<MarketplaceListing[]> {
  const server = getServer();
  const contract = new Contract(MARKETPLACE_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount(userAddress), { fee: "100", networkPassphrase: "Test SDF Network ; September 2015" }
    )
      .addOperation(
        contract.call("get_user_listings", nativeToScVal(userAddress, { type: "address" }))
      )
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    return [];
  }

  if (!result.result?.retval) {
    return [];
  }

  const listingsRaw = scValToNative(result.result.retval);

  if (!Array.isArray(listingsRaw)) {
    return [];
  }

  return listingsRaw.map((listing: Record<string, unknown>) => ({
    id: toBigInt(listing.id),
    seller: String(listing.seller ?? ""),
    bot_id: toBigInt(listing.bot_id),
    price: toBigInt(listing.price),
    listed_at: toBigInt(listing.listed_at),
  }));
}

/**
 * Register a user in the registry contract.
 */
export async function registerUser(userAddress: string, username: string): Promise<string> {
  const server = getServer();
  const contract = new Contract(REGISTRY_CONTRACT_ID);

  const txBuilder = new TransactionBuilder(
    await server.getAccount(userAddress),
    { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
  )
    .addOperation(
      contract.call("register", nativeToScVal(userAddress, { type: "address" }), nativeToScVal(username, { type: "string" }))
    )
    .setTimeout(30)
    .build();

  return txBuilder.toXDR();
}

/**
 * Mint a basic bot from the bot_nft contract.
 */
export async function mintBasicBot(userAddress: string): Promise<string> {
  const server = getServer();
  const contract = new Contract(BOT_NFT_CONTRACT_ID);

  const txBuilder = new TransactionBuilder(
    await server.getAccount(userAddress),
    { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
  )
    .addOperation(
      contract.call("mint_basic", nativeToScVal(userAddress, { type: "address" }))
    )
    .setTimeout(30)
    .build();

  return txBuilder.toXDR();
}

/**
 * Start accrual for a user in the accrual contract.
 */
export async function startAccrual(userAddress: string, rate: number): Promise<string> {
  const server = getServer();
  const contract = new Contract(ACCRUAL_CONTRACT_ID);

  const txBuilder = new TransactionBuilder(
    await server.getAccount(userAddress),
    { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
  )
    .addOperation(
      contract.call("start_accrual", nativeToScVal(userAddress, { type: "address" }), nativeToScVal(rate, { type: "u32" }))
    )
    .setTimeout(30)
    .build();

  return txBuilder.toXDR();
}

/**
 * Get accrual state for a user from the accrual contract.
 */
export async function getAccrualState(userAddress: string): Promise<AccrualState | null> {
  const server = getServer();
  const contract = new Contract(ACCRUAL_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount(userAddress),
      { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("get_accrual_state", nativeToScVal(userAddress, { type: "address" })))
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    return null;
  }

  if (!result.result?.retval) {
    return null;
  }

  const stateRaw = scValToNative(result.result.retval);

  if (!stateRaw) {
    return null;
  }

  return {
    last_claim_ts: BigInt(stateRaw.last_claim_ts ?? 0),
    total_claimed_points: BigInt(stateRaw.total_claimed_points ?? 0),
  };
}

/**
 * Get pending (unclaimed) points accrued for a user since their last claim.
 * Calls the accrual contract's pending_points() function.
 */
export async function getPendingPoints(userAddress: string): Promise<bigint> {
  const server = getServer();
  const contract = new Contract(ACCRUAL_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount(userAddress),
      { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("pending_points", nativeToScVal(userAddress, { type: "address" })))
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    return BigInt(0);
  }

  if (!result.result?.retval) {
    return BigInt(0);
  }

  return toBigInt(scValToNative(result.result.retval));
}

/**
 * Get the accrual contract configuration (points_per_amt).
 * Calls the accrual contract's config() function.
 */
export async function getAccrualConfig(callerAddress?: string): Promise<{ points_per_amt: bigint } | null> {
  const server = getServer();
  const contract = new Contract(ACCRUAL_CONTRACT_ID);
  const source = callerAddress ?? (typeof window !== "undefined" ? (window as any)?.selectedPublicKey : undefined);

  if (!source) {
    return { points_per_amt: BigInt(POINTS_PER_AMT) };
  }

  try {
    const result = await server.simulateTransaction(
      new TransactionBuilder(
        await server.getAccount(source),
        { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
      )
        .addOperation(contract.call("config"))
        .setTimeout(30)
        .build()
    );

    if (SorobanRpc.Api.isSimulationError(result) || !result.result?.retval) {
      return { points_per_amt: BigInt(POINTS_PER_AMT) };
    }

    const configRaw = scValToNative(result.result.retval);
    if (!configRaw) return { points_per_amt: BigInt(POINTS_PER_AMT) };

    return {
      points_per_amt: toBigInt(configRaw.points_per_amt),
    };
  } catch {
    return { points_per_amt: BigInt(POINTS_PER_AMT) };
  }
}

/**
 * Claim accrued points, converting them to AMT tokens where the points
 * threshold is met. Calls the accrual contract's claim() function.
 */
export async function claimPoints(userAddress: string): Promise<string> {
  const server = getServer();
  const contract = new Contract(ACCRUAL_CONTRACT_ID);

  const txBuilder = new TransactionBuilder(
    await server.getAccount(userAddress),
    { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
  )
    .addOperation(
      contract.call(
        "claim",
        nativeToScVal(userAddress, { type: "address" }),
        nativeToScVal(TOKEN_CONTRACT_ID, { type: "address" }),
        nativeToScVal(REGISTRY_CONTRACT_ID, { type: "address" })
      )
    )
    .setTimeout(30)
    .build();

  return txBuilder.toXDR();
}

/**
 * Get user profile from the registry contract.
 */
export async function getUserProfile(userAddress: string): Promise<UserProfile | null> {
  const server = getServer();
  const contract = new Contract(REGISTRY_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount(userAddress),
      { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("get_user", nativeToScVal(userAddress, { type: "address" })))
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    return null;
  }

  if (!result.result?.retval) {
    return null;
  }

  const profileRaw = scValToNative(result.result.retval);

  if (!profileRaw) {
    return null;
  }

  return parseUserProfile(profileRaw);
}

/**
 * Check whether a user is registered in the registry contract.
 */
export async function isRegistered(userAddress: string): Promise<boolean> {
  const server = getServer();
  const contract = new Contract(REGISTRY_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount(userAddress),
      { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("is_registered", nativeToScVal(userAddress, { type: "address" })))
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    return false;
  }

  if (!result.result?.retval) {
    return false;
  }

  return Boolean(scValToNative(result.result.retval));
}

/**
 * Get the list of bot IDs owned by a user from the bot_nft contract.
 */
export async function getUserBots(userAddress: string): Promise<bigint[]> {
  const server = getServer();
  const contract = new Contract(BOT_NFT_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount(userAddress),
      { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("get_user_bots", nativeToScVal(userAddress, { type: "address" })))
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    return [];
  }

  if (!result.result?.retval) {
    return [];
  }

  const raw = scValToNative(result.result.retval);
  if (!Array.isArray(raw)) return [];

  return raw.map((id) => toBigInt(id));
}

/**
 * Get a single bot's full record by ID from the bot_nft contract.
 */
export async function getBotById(
  userAddress: string,
  botId: bigint
): Promise<BotNFT | null> {
  const server = getServer();
  const contract = new Contract(BOT_NFT_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount(userAddress),
      { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("get_bot", nativeToScVal(botId, { type: "u64" })))
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    return null;
  }

  if (!result.result?.retval) {
    return null;
  }

  const raw = scValToNative(result.result.retval);
  if (!raw) return null;

  return parseBotNFT(raw as Record<string, unknown>);
}

/**
 * Get a user's combined accrual rate across all owned bots from the
 * bot_nft contract.
 */
export async function getUserTotalRate(userAddress: string): Promise<bigint> {
  const server = getServer();
  const contract = new Contract(BOT_NFT_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(
      await server.getAccount(userAddress),
      { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("get_user_total_rate", nativeToScVal(userAddress, { type: "address" })))
      .setTimeout(30)
      .build()
  );

  if (SorobanRpc.Api.isSimulationError(result)) {
    return BigInt(0);
  }

  if (!result.result?.retval) {
    return BigInt(0);
  }

  return toBigInt(scValToNative(result.result.retval));
}
