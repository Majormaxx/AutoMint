// @ts-nocheck
import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
  }
} as const


/**
 * A buyer's escrowed bid for a bot (#425).
 */
export interface Offer {
  /**
 * Escrowed amount in `currency`'s base units.
 */
amount: i128;
  bot_id: u64;
  buyer: string;
  created_at: u64;
  currency: string;
  /**
 * Ledger timestamp from which the offer can no longer be accepted and
 * anyone may cancel it to refund the buyer.
 */
expires_at: u64;
  id: u64;
  status: OfferStatus;
}


export interface Config {
  admin: string;
  bot_nft: string;
  fee_bps: u32;
  royalty_bps: u32;
}

export type DataKey = {tag: "Listing", values: readonly [u64]} | {tag: "ListingPage", values: readonly [u32]} | {tag: "PageCount", values: void} | {tag: "UserListings", values: readonly [string]} | {tag: "UserPurchases", values: readonly [string]} | {tag: "NextListingId", values: void} | {tag: "Config", values: void} | {tag: "Initialized", values: void} | {tag: "MinPrice", values: readonly [string]} | {tag: "UserActiveListingCount", values: readonly [string]} | {tag: "ListingCap", values: void} | {tag: "Paused", values: void} | {tag: "PendingAdmin", values: void} | {tag: "TierStats", values: readonly [BotTier]} | {tag: "BotListing", values: readonly [u64]} | {tag: "Locked", values: void} | {tag: "AllowedCurrencies", values: void} | {tag: "Offer", values: readonly [u64]} | {tag: "BotOffers", values: readonly [u64]} | {tag: "NextOfferId", values: void} | {tag: "Fees", values: readonly [string]};


export interface Listing {
  active: boolean;
  bot_id: u64;
  bot_tier: BotTier;
  currency: string;
  /**
 * Unix timestamp (seconds) after which the listing is considered expired.
 * `buy_bot` rejects purchases past this time; `reclaim_expired` returns
 * the bot to the seller. Bounded to 1–90 days from `listed_at` (#423).
 */
expires_at: u64;
  id: u64;
  listed_at: u64;
  price: i128;
  seller: string;
}


export interface Purchase {
  bot_id: u64;
  currency: string;
  listing_id: u64;
  price: i128;
  purchased_at: u64;
  seller: string;
}


/**
 * Sales statistics for one bot tier (#432).
 */
export interface TierStats {
  /**
 * Listing holding the floor; `0` when nothing is listed.
 */
floor_listing_id: u64;
  /**
 * Lowest active listing price for this tier; `0` when nothing is listed.
 */
floor_price: i128;
  last_sale_price: i128;
  sale_count: u64;
  tier: BotTier;
  /**
 * Cumulative sale volume in raw base units.
 */
volume: i128;
}

export type OfferStatus = {tag: "Active", values: void} | {tag: "Accepted", values: void} | {tag: "Cancelled", values: void};

export const Errors = {
  1: {message:"AlreadyInitialized"},

  2: {message:"NotInitialized"},

  3: {message:"InvalidPrice"},

  4: {message:"BotTransferFailed"},

  5: {message:"ListingNotFound"},

  6: {message:"NotSeller"},

  7: {message:"ListingInactive"},

  8: {message:"InsufficientFunds"},

  9: {message:"ListingNotActive"},

  10: {message:"Unauthorized"},

  11: {message:"PaymentFailed"},

  12: {message:"Overflow"},

  13: {message:"PriceTooLow"},

  14: {message:"ListingStale"},

  15: {message:"SelfPurchase"},

  16: {message:"TooManyListings"},

  17: {message:"InvalidBotNft"},

  18: {message:"ContractPaused"},

  19: {message:"NoPendingAdmin"},

  20: {message:"BotNotFound"},

  21: {message:"NotBotOwner"},

  22: {message:"Reentrancy"},

  23: {message:"UnsupportedCurrency"},

  24: {message:"ListingExpired"},

  /**
   * `make_offer`: `expires_at` is not in the future (#425).
   */
  25: {message:"InvalidExpiry"},

  26: {message:"OfferNotFound"},

  /**
   * The offer was already accepted or cancelled (#425).
   */
  27: {message:"OfferNotActive"},

  /**
   * `accept_offer`: the offer's `expires_at` has passed (#425).
   */
  28: {message:"OfferExpired"},

  /**
   * `cancel_offer` before expiry by someone other than the buyer (#425).
   */
  29: {message:"NotOfferOwner"},

  /**
   * `make_offer` on a bot the buyer already owns or has listed (#425).
   */
  30: {message:"OfferOnOwnBot"},

  /**
   * The bot already carries `MAX_OFFERS_PER_BOT` open offers (#425).
   */
  31: {message:"TooManyOffers"},

  /**
   * `withdraw_fees` amount was zero or negative (#426).
   */
  32: {message:"InvalidAmount"},

  /**
   * `withdraw_fees` amount exceeds the accrued fee balance (#426).
   */
  33: {message:"InsufficientFees"}
}
export enum Tier {
  Basic = 0,
  Advanced = 1,
  Premium = 2,
}


export interface BotNFT {
  accrual_rate: u64;
  /**
 * Deterministic bonus bps (0..500) on top of the tier base accrual rate.
 */
bonus_bps: u32;
  id: u64;
  minted_at: u64;
  minter: string;
  /**
 * Owner-settable nickname (max 24 bytes). None when unset; callers that
 * need a display name fall back to `tier.name()`.
 */
nickname: Option<string>;
  owner: string;
  tier: BotTier;
  /**
 * Deterministic variant (0..=7) assigned at mint, used for rarity.
 */
variant: u32;
}

export enum BotTier {
  Basic = 0,
  Bronze = 1,
  Silver = 2,
  Gold = 3,
  Diamond = 4,
}

export type DataKey = {tag: "NextId", values: void} | {tag: "Bot", values: readonly [u64]} | {tag: "UserBots", values: readonly [string]} | {tag: "Admin", values: void} | {tag: "Initialized", values: void} | {tag: "Registry", values: void} | {tag: "TierSupply", values: readonly [BotTier]} | {tag: "TierRate", values: readonly [BotTier]} | {tag: "Marketplace", values: void} | {tag: "Accrual", values: void} | {tag: "PaymentToken", values: void} | {tag: "TierIndex", values: readonly [BotTier]};


/**
 * Typed tier descriptor returned by `get_tier_info` and `all_tiers`.
 */
export interface TierInfo {
  name: string;
  price: i128;
  rate: u64;
}

export const Errors = {
  1: {message:"AlreadyInitialized"},

  2: {message:"NotFound"},

  3: {message:"Unauthorized"},

  4: {message:"InvalidTier"},

  5: {message:"BotNotFound"},

  6: {message:"NotOwner"},

  7: {message:"InsufficientFunds"},

  8: {message:"NotInitialized"},

  9: {message:"SupplyCapExceeded"},

  10: {message:"BatchTooLarge"},

  11: {message:"NicknameTooLong"},

  12: {message:"RangeLimitExceeded"},

  /**
   * `withdraw` amount was zero or negative.
   */
  13: {message:"InvalidAmount"},

  /**
   * `withdraw` amount exceeds the treasury balance of the payment token.
   */
  14: {message:"InsufficientTreasury"},

  /**
   * The bot id counter has reached `u64::MAX`; no further bot can be minted.
   */
  15: {message:"Overflow"}
}

export interface StoredBotNFT {
  bonus_bps: u32;
  id: u64;
  minted_at: u64;
  minter: string;
  nickname: Option<string>;
  owner: string;
  tier: BotTier;
  variant: u32;
}

export type DataKey = {tag: "UserProfile", values: readonly [string]} | {tag: "Username", values: readonly [string]} | {tag: "TopUsers", values: void} | {tag: "TotalUsers", values: void} | {tag: "Admin", values: void} | {tag: "Initialized", values: void} | {tag: "Writers", values: void};


export interface Writers {
  accrual: string;
  bot_nft: string;
}


export interface UserProfile {
  address: string;
  bot_count: u32;
  claimed_amt: i128;
  registered_at: u64;
  total_points: u64;
  username: string;
}

export const Errors = {
  1: {message:"AlreadyInitialized"},

  2: {message:"AlreadyRegistered"},

  3: {message:"UsernameTaken"},

  4: {message:"NotRegistered"},

  5: {message:"Unauthorized"},

  6: {message:"NotInitialized"},

  /**
   * The registered-user counter has reached `u32::MAX`.
   */
  7: {message:"Overflow"}
}

export interface Client {
  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: block `list_bot`, `buy_bot` and `update_price`.
   * `cancel_listing` keeps working so sellers can always retrieve bots.
   */
  pause: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  config: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Config>>

  /**
   * Construct and simulate a bot_nft transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  bot_nft: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a buy_bot transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  buy_bot: ({buyer, listing_id}: {buyer: string, listing_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a unpause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: resume trading after `pause`.
   */
  unpause: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a list_bot transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Escrow `bot_id` from `seller` into the marketplace contract, record a
   * `Listing` at `price` in `currency`, and return the new listing ID.
   */
  list_bot: ({seller, bot_id, price, currency, duration_secs}: {seller: string, bot_id: u64, price: i128, currency: string, duration_secs: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * One offer by id, whatever its status.
   */
  get_offer: ({offer_id}: {offer_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Offer>>>

  /**
   * Construct and simulate a is_paused transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_paused: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set the admin and bot_nft addresses. Fails with `AlreadyInitialized` if
   * called twice. Validates bot_nft contract responds to admin() call.
   */
  initialize: ({admin, bot_nft, fee_bps, royalty_bps}: {admin: string, bot_nft: string, fee_bps: u32, royalty_bps: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a make_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Escrow `amount` of `currency` from `buyer` as a standing offer for
   * `bot_id`, open until `expires_at` (ledger timestamp, exclusive).
   * 
   * The bot does not need to be listed. The offer is rejected when the
   * buyer already owns the bot, outright or through their own active
   * listing, when `currency` is not allowlisted, when `amount` is below the
   * currency's minimum price, or when the bot already carries
   * `MAX_OFFERS_PER_BOT` open offers.
   */
  make_offer: ({buyer, bot_id, amount, currency, expires_at}: {buyer: string, bot_id: u64, amount: i128, currency: string, expires_at: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a tier_stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sales statistics for one tier (all zeros before any activity).
   */
  tier_stats: ({tier}: {tier: BotTier}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<TierStats>>

  /**
   * Construct and simulate a get_listing transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retrieve a listing by ID. Historical listings (bought/cancelled/stale)
   * remain readable with `active == false`; only an ID that was never
   * assigned returns `ListingNotFound`. This is intentional (see module
   * docs): auditability over hiding.
   */
  get_listing: ({listing_id}: {listing_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Listing>>>

  /**
   * Construct and simulate a set_bot_nft transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_bot_nft: ({new_bot_nft}: {new_bot_nft: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_fee_bps transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_fee_bps: ({new_fee_bps}: {new_fee_bps: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a accept_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Step two of an admin transfer: the nominated address accepts and becomes
   * admin. Fails with `NoPendingAdmin` if nobody was proposed.
   */
  accept_admin: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a accept_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Accept offer `offer_id` as `seller`: the bot moves to the buyer and the
   * escrowed funds are paid out in the same invocation, so neither side
   * can end up with both or neither.
   * 
   * The seller must own the bot outright, or hold it in escrow through
   * their own active listing, which is deactivated as part of the sale.
   * The platform fee is retained in the contract (see `withdraw_fees`), the
   * royalty goes to the original minter unless the minter is the seller.
   */
  accept_offer: ({seller, offer_id}: {seller: string, offer_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_offer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel an open offer and refund its escrow in full. Before expiry only
   * the offer's buyer may cancel; once `expires_at` has passed anyone may
   * call it (the refund always goes to the buyer), so stale escrow never
   * depends on the buyer coming back.
   */
  cancel_offer: ({caller, offer_id}: {caller: string, offer_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a compact_page transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless: drop tombstoned (inactive / missing) ids from `page` so
   * the slot count reflects live listings. Cursors are id-based so this is
   * safe at any time. Returns the number of ids removed.
   */
  compact_page: ({page}: {page: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a fees_accrued transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Platform fees accrued in `currency` and still held by the contract.
   * Escrowed offer funds are never part of this figure.
   */
  fees_accrued: ({currency}: {currency: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a market_stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sales statistics for every tier, in tier order (Basic .. Diamond).
   */
  market_stats: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<TierStats>>>

  /**
   * Construct and simulate a on_bot_moved transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deactivate any active listing for `bot_id`. Permissioned to `bot_nft` contract.
   */
  on_bot_moved: ({bot_id}: {bot_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a update_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Change the price of an active listing. Only the seller may call it, and
   * the new price must satisfy the same rules as `list_bot`.
   * Order: existence -> authorization -> state validity -> effects.
   */
  update_price: ({seller, listing_id, new_price}: {seller: string, listing_id: u64, new_price: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_min_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Return the configured minimum price for `currency`. If the admin has not
   * set an explicit floor, the default `ceil(10_000/fee_bps)` (or `1` when
   * `fee_bps == 0`) is returned. Every accepted price guarantees
   * `price * fee_bps / 10_000 >= 1` when `fee_bps > 0`.
   */
  get_min_price: ({currency}: {currency: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a pending_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The address nominated by `propose_admin`, if a transfer is pending.
   */
  pending_admin: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a propose_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Step one of an admin transfer: the current admin nominates `new_admin`.
   * Nothing changes until `new_admin` calls `accept_admin`; proposing again
   * replaces the pending nomination.
   */
  propose_admin: ({new_admin}: {new_admin: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_min_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: set the minimum price for `currency`. `min_price` must be
   * strictly positive. Emits `min_price_updated`.
   */
  set_min_price: ({currency, min_price}: {currency: string, min_price: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a withdraw_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: move `amount` of accrued fees in `currency` to `to`.
   * Bounded by `fees_accrued`, so escrowed offer funds cannot be drained.
   */
  withdraw_fees: ({currency, to, amount}: {currency: string, to: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_listing transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a listing and return the escrowed bot to its seller.
   * 
   * This is the escape hatch: it is intentionally NOT blocked while the
   * marketplace is paused, so sellers can always retrieve escrowed bots.
   * Order: existence -> authorization -> state validity -> effects.
   */
  cancel_listing: ({seller, listing_id}: {seller: string, listing_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_listing_cap transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_listing_cap: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a next_listing_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Return the next listing ID that will be assigned (i.e. `NextListingId`).
   * This is the public enumeration cursor — tooling should use it instead of
   * scanning `get_listing` over an unbounded range. The value is `1` before
   * any listing has been created.
   */
  next_listing_id: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a reclaim_expired transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionless: return an expired, still-active listing's escrowed bot
   * to the original seller. Anyone may trigger this; the bot always returns
   * to the seller, never to the caller (#423).
   */
  reclaim_expired: ({listing_id}: {listing_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_listing_cap transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_listing_cap: ({new_cap}: {new_cap: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_user_listings transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_listings: ({seller}: {seller: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<Listing>>>

  /**
   * Construct and simulate a get_offers_for_bot transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Every open (`Active`) offer on `bot_id`, oldest first. Expired offers
   * stay listed until someone cancels them, so callers should compare
   * `expires_at` with the ledger timestamp.
   */
  get_offers_for_bot: ({bot_id}: {bot_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<Offer>>>

  /**
   * Construct and simulate a get_user_purchases transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_purchases: ({buyer, limit}: {buyer: string, limit: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<Purchase>>>

  /**
   * Construct and simulate a listing_page_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Number of listing pages allocated.
   */
  listing_page_count: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_active_listings transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Return up to `limit` active listings with id greater than `cursor`,
   * plus the cursor to pass to the next call (#333).
   * 
   * `cursor` is a listing ID (0 = start), NOT a positional index, so it stays
   * valid when listings are cancelled, sold or compacted mid-pagination:
   * every active listing is visited exactly once. The scan examines at most
   * `limit * 4` index entries per call, so a page may be short when many
   * tombstones are skipped; keep paging until the returned cursor equals the
   * one passed in (nothing left to scan).
   * 
   * - `limit == 0` returns `(empty, cursor)`.
   * - Inactive listings (tombstones), missing records and listings whose bot
   * is no longer escrowed here are skipped.
   */
  get_active_listings: ({cursor, limit}: {cursor: u64, limit: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [Array<Listing>, u64]>>

  /**
   * Construct and simulate a get_listing_for_bot transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Return the active listing ID for a bot, if one exists. Returns
   * `ListingNotFound` if the bot is not listed or its listing was cancelled/sold.
   */
  get_listing_for_bot: ({bot_id}: {bot_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a is_allowed_currency transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if a currency is in the allowlist (#325)
   */
  is_allowed_currency: ({currency}: {currency: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a add_allowed_currency transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: add a currency to the allowlist (#325)
   */
  add_allowed_currency: ({currency}: {currency: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_listings_filtered transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Bounded page of active listings matching optional tier and inclusive
   * price constraints. `cursor` is a listing ID (0 = start), as in
   * `get_active_listings`; at most `MAX_FILTER_SCAN` index entries are
   * examined and at most 50 listings returned. Returns the next cursor;
   * stop when it equals the cursor passed in.
   */
  get_listings_filtered: ({tier, min_price, max_price, cursor, limit}: {tier: Option<BotTier>, min_price: Option<i128>, max_price: Option<i128>, cursor: u64, limit: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [Array<Listing>, u64]>>

  /**
   * Construct and simulate a remove_allowed_currency transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: remove a currency from the allowlist (#325)
   */
  remove_allowed_currency: ({currency}: {currency: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_user_active_listing_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_active_listing_count: ({seller}: {seller: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a burn transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Burn a bot, removing it from storage, decrementing tier supply,
   * removing it from owner's bot list and tier index, and decrementing the owner's
   * count in the registry contract (#398).
   */
  burn: ({bot_id, owner}: {bot_id: u64, owner: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  admin: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a get_bot transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bot: ({bot_id}: {bot_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<BotNFT>>>

  /**
   * Construct and simulate a next_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The next bot id that will be assigned. Callers use it as the exclusive
   * upper bound when paginating with `get_bots_range` (#391).
   */
  next_id: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a bump_bot transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionlessly refresh the persistent storage TTL of a single bot (#397).
   */
  bump_bot: ({bot_id}: {bot_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer: ({bot_id, from, to}: {bot_id: u64, from: string, to: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only withdrawal of accumulated tier payments (#322).
   * 
   * `mint_tier` takes the payment token as a per-call argument (no token is
   * stored yet), so the token to withdraw is passed explicitly. The balance
   * is checked up front so an over-withdrawal fails before any transfer.
   */
  withdraw: ({token, to, amount}: {token: string, to: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a all_tiers transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Every tier's descriptor, in tier order (Basic .. Diamond).
   */
  all_tiers: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<TierInfo>>>

  /**
   * Construct and simulate a mint_tier transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mint_tier: ({owner, tier}: {owner: string, tier: Tier}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a token_uri transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Off-chain verifiable descriptor. The traits are derived deterministically
   * from sha256(bot_id, minted_at, owner); this URI exposes the derivation
   * inputs so anyone can recompute `variant`/`bonus_bps` and confirm rarity.
   */
  token_uri: ({bot_id}: {bot_id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a admin_mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-controlled mint (no payment) for airdrops / grants. Distinguishable
   * from a purchase via the `grant` event.
   */
  admin_mint: ({to, tier}: {to: string, tier: BotTier}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, registry, payment_token}: {admin: string, registry: string, payment_token: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a mint_basic transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mint_basic: ({owner}: {owner: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a rename_bot transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set or clear the owner-chosen nickname for a bot. Max 24 bytes; pass
   * an empty string to clear. Only the current owner may rename.
   */
  rename_bot: ({bot_id, name}: {bot_id: u64, name: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_accrual transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_accrual: ({accrual}: {accrual: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_tier_info transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_tier_info: ({tier}: {tier: BotTier}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<TierInfo>>

  /**
   * Construct and simulate a get_user_bots transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_bots: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a payment_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  payment_token: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a set_tier_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_tier_rate: ({tier, rate}: {tier: BotTier, rate: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a bump_user_bots transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Permissionlessly refresh the persistent storage TTL of a user's bot list
   * and all bots owned by that user (#397).
   */
  bump_user_bots: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_bots_range transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Up to `limit` existing bots whose ids fall in `[start_id, start_id + limit)`,
   * skipping ids with no stored entry (burned or not yet minted). `limit`
   * above `MAX_RANGE_LIMIT` (100) returns `RangeLimitExceeded` (#391).
   */
  get_bots_range: ({start_id, limit}: {start_id: u64, limit: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Array<BotNFT>>>>

  /**
   * Construct and simulate a set_marketplace transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_marketplace: ({marketplace}: {marketplace: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a admin_mint_batch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Batch admin mint for airdrops. All-or-nothing: if any single mint fails
   * (e.g. supply cap), the whole batch is rolled back. Capped by MAX_BATCH_SIZE.
   */
  admin_mint_batch: ({recipients}: {recipients: Array<readonly [string, BotTier]>}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<Array<u64>>>>

  /**
   * Construct and simulate a get_bots_by_tier transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Return a page of bot IDs for a specific tier (#398).
   * 
   * Paged in buckets of `TIER_PAGE_SIZE` (10). Bounded to guarantee predictable
   * simulation cost without client-side N+1 filtering.
   */
  get_bots_by_tier: ({tier, page}: {tier: BotTier, page: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a treasury_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Balance of `token` held by this contract (accumulated tier payments).
   */
  treasury_balance: ({token}: {token: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_user_total_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_total_rate: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_user_bots_detailed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Full `BotNFT` records for up to the first `MAX_DETAILED_BOTS` bots
   * owned by `user`, in ownership order. Replaces the N+1 fan-out of
   * `get_user_bots` + `get_bot` with a single simulation; the cap is
   * enforced here, contract-side, and callers paginate past it with the
   * ID-based getters (#483).
   */
  get_user_bots_detailed: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<BotNFT>>>

  /**
   * Construct and simulate a get_user transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<UserProfile>>>

  /**
   * Construct and simulate a register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  register: ({user, username}: {user: string, username: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_admin: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a add_points transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_points: ({user, points}: {user: string, points: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin}: {admin: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_writers transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_writers: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<Writers>>>

  /**
   * Construct and simulate a set_writers transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_writers: ({accrual, bot_nft}: {accrual: string, bot_nft: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a total_users transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  total_users: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a is_registered transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_registered: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a add_claimed_amt transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_claimed_amt: ({user, amount}: {user: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_leaderboard transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Top users by points, highest first. Reads the maintained `TopUsers`
   * list and hydrates at most `min(limit, LEADERBOARD_SIZE)` profiles, so the
   * cost does not depend on the total number of users. Equal totals are
   * ordered by who reached the total first (earlier wins), deterministically.
   */
  get_leaderboard: ({limit}: {limit: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<UserProfile>>>

  /**
   * Construct and simulate a decrement_bot_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  decrement_bot_count: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a increment_bot_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  increment_bot_count: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAH9BZG1pbi1vbmx5OiBibG9jayBgbGlzdF9ib3RgLCBgYnV5X2JvdGAgYW5kIGB1cGRhdGVfcHJpY2VgLgpgY2FuY2VsX2xpc3RpbmdgIGtlZXBzIHdvcmtpbmcgc28gc2VsbGVycyBjYW4gYWx3YXlzIHJldHJpZXZlIGJvdHMuAAAAAAVwYXVzZQAAAAAAAAAAAAABAAAD6QAAA+0AAAAAAAAH0AAAABBNYXJrZXRwbGFjZUVycm9y",
        "AAAAAAAAAAAAAAAGY29uZmlnAAAAAAAAAAAAAQAAB9AAAAAGQ29uZmlnAAA=",
        "AAAAAAAAAAAAAAAHYm90X25mdAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAAHYnV5X2JvdAAAAAACAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAACmxpc3RpbmdfaWQAAAAAAAYAAAABAAAD6QAAA+0AAAAAAAAH0AAAABBNYXJrZXRwbGFjZUVycm9y",
        "AAAAAAAAAClBZG1pbi1vbmx5OiByZXN1bWUgdHJhZGluZyBhZnRlciBgcGF1c2VgLgAAAAAAAAd1bnBhdXNlAAAAAAAAAAABAAAD6QAAA+0AAAAAAAAH0AAAABBNYXJrZXRwbGFjZUVycm9y",
        "AAAAAQAAAChBIGJ1eWVyJ3MgZXNjcm93ZWQgYmlkIGZvciBhIGJvdCAoIzQyNSkuAAAAAAAAAAVPZmZlcgAAAAAAAAgAAAArRXNjcm93ZWQgYW1vdW50IGluIGBjdXJyZW5jeWAncyBiYXNlIHVuaXRzLgAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAZib3RfaWQAAAAAAAYAAAAAAAAABWJ1eWVyAAAAAAAAEwAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAAIY3VycmVuY3kAAAATAAAAbUxlZGdlciB0aW1lc3RhbXAgZnJvbSB3aGljaCB0aGUgb2ZmZXIgY2FuIG5vIGxvbmdlciBiZSBhY2NlcHRlZCBhbmQKYW55b25lIG1heSBjYW5jZWwgaXQgdG8gcmVmdW5kIHRoZSBidXllci4AAAAAAAAKZXhwaXJlc19hdAAAAAAABgAAAAAAAAACaWQAAAAAAAYAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAtPZmZlclN0YXR1cwA=",
        "AAAAAAAAAIhFc2Nyb3cgYGJvdF9pZGAgZnJvbSBgc2VsbGVyYCBpbnRvIHRoZSBtYXJrZXRwbGFjZSBjb250cmFjdCwgcmVjb3JkIGEKYExpc3RpbmdgIGF0IGBwcmljZWAgaW4gYGN1cnJlbmN5YCwgYW5kIHJldHVybiB0aGUgbmV3IGxpc3RpbmcgSUQuAAAACGxpc3RfYm90AAAABQAAAAAAAAAGc2VsbGVyAAAAAAATAAAAAAAAAAZib3RfaWQAAAAAAAYAAAAAAAAABXByaWNlAAAAAAAACwAAAAAAAAAIY3VycmVuY3kAAAATAAAAAAAAAA1kdXJhdGlvbl9zZWNzAAAAAAAABgAAAAEAAAPpAAAABgAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAABAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAdib3RfbmZ0AAAAABMAAAAAAAAAB2ZlZV9icHMAAAAABAAAAAAAAAALcm95YWx0eV9icHMAAAAABA==",
        "AAAAAAAAACVPbmUgb2ZmZXIgYnkgaWQsIHdoYXRldmVyIGl0cyBzdGF0dXMuAAAAAAAACWdldF9vZmZlcgAAAAAAAAEAAAAAAAAACG9mZmVyX2lkAAAABgAAAAEAAAPpAAAH0AAAAAVPZmZlcgAAAAAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==",
        "AAAAAAAAAAAAAAAJaXNfcGF1c2VkAAAAAAAAAAAAAAEAAAAB",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAFQAAAAEAAAAAAAAAB0xpc3RpbmcAAAAAAQAAAAYAAAABAAAAb1BhZ2VkIGxpc3RpbmctSUQgaW5kZXg6IHBhZ2UgYG5gIGhvbGRzIGF0IG1vc3QgYExJU1RJTkdfUEFHRV9TSVpFYCBpZHMKaW4gYXNjZW5kaW5nIG9yZGVyIChwZXJzaXN0ZW50IHN0b3JhZ2UpLgAAAAALTGlzdGluZ1BhZ2UAAAAAAQAAAAQAAAAAAAAAQ051bWJlciBvZiBsaXN0aW5nIHBhZ2VzIGFsbG9jYXRlZCAoaW5zdGFuY2Ugc3RvcmFnZSwgYSBzaW5nbGUgdTMyKS4AAAAACVBhZ2VDb3VudAAAAAAAAAEAAAAAAAAADFVzZXJMaXN0aW5ncwAAAAEAAAATAAAAAQAAAAAAAAANVXNlclB1cmNoYXNlcwAAAAAAAAEAAAATAAAAAAAAAAAAAAANTmV4dExpc3RpbmdJZAAAAAAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAAAAAAAAAAALSW5pdGlhbGl6ZWQAAAAAAQAAAAAAAAAITWluUHJpY2UAAAABAAAAEwAAAAEAAAAAAAAAFlVzZXJBY3RpdmVMaXN0aW5nQ291bnQAAAAAAAEAAAATAAAAAAAAAAAAAAAKTGlzdGluZ0NhcAAAAAAAAAAAAAAAAAAGUGF1c2VkAAAAAAAAAAAAAAAAAAxQZW5kaW5nQWRtaW4AAAABAAAAAAAAAAlUaWVyU3RhdHMAAAAAAAABAAAH0AAAAAdCb3RUaWVyAAAAAAEAAAAAAAAACkJvdExpc3RpbmcAAAAAAAEAAAAGAAAAAAAAAAAAAAAGTG9ja2VkAAAAAAAAAAAAAAAAABFBbGxvd2VkQ3VycmVuY2llcwAAAAAAAAEAAAAsQW4gZXNjcm93ZWQgb2ZmZXIgYnkgaWQgKHBlcnNpc3RlbnQpICgjNDI1KS4AAAAFT2ZmZXIAAAAAAAABAAAABgAAAAEAAAA7T3BlbiBvZmZlciBpZHMgZm9yIGEgYm90LCBvbGRlc3QgZmlyc3QgKHBlcnNpc3RlbnQpICgjNDI1KS4AAAAACUJvdE9mZmVycwAAAAAAAAEAAAAGAAAAAAAAACpOZXh0IG9mZmVyIGlkIHRvIGFzc2lnbiAoaW5zdGFuY2UpICgjNDI1KS4AAAAAAAtOZXh0T2ZmZXJJZAAAAAABAAAATVBsYXRmb3JtIGZlZXMgYWNjcnVlZCBwZXIgY3VycmVuY3kgYW5kIG5vdCB5ZXQgd2l0aGRyYXduIChwZXJzaXN0ZW50KSAoIzQyNikuAAAAAAAABEZlZXMAAAABAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAAB0xpc3RpbmcAAAAACQAAAAAAAAAGYWN0aXZlAAAAAAABAAAAAAAAAAZib3RfaWQAAAAAAAYAAAAAAAAACGJvdF90aWVyAAAH0AAAAAdCb3RUaWVyAAAAAAAAAAAIY3VycmVuY3kAAAATAAAA1FVuaXggdGltZXN0YW1wIChzZWNvbmRzKSBhZnRlciB3aGljaCB0aGUgbGlzdGluZyBpcyBjb25zaWRlcmVkIGV4cGlyZWQuCmBidXlfYm90YCByZWplY3RzIHB1cmNoYXNlcyBwYXN0IHRoaXMgdGltZTsgYHJlY2xhaW1fZXhwaXJlZGAgcmV0dXJucwp0aGUgYm90IHRvIHRoZSBzZWxsZXIuIEJvdW5kZWQgdG8gMeKAkzkwIGRheXMgZnJvbSBgbGlzdGVkX2F0YCAoIzQyMykuAAAACmV4cGlyZXNfYXQAAAAAAAYAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAlsaXN0ZWRfYXQAAAAAAAAGAAAAAAAAAAVwcmljZQAAAAAAAAsAAAAAAAAABnNlbGxlcgAAAAAAEw==",
        "AAAAAAAAAIpTZXQgdGhlIGFkbWluIGFuZCBib3RfbmZ0IGFkZHJlc3Nlcy4gRmFpbHMgd2l0aCBgQWxyZWFkeUluaXRpYWxpemVkYCBpZgpjYWxsZWQgdHdpY2UuIFZhbGlkYXRlcyBib3RfbmZ0IGNvbnRyYWN0IHJlc3BvbmRzIHRvIGFkbWluKCkgY2FsbC4AAAAAAAppbml0aWFsaXplAAAAAAAEAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAB2JvdF9uZnQAAAAAEwAAAAAAAAAHZmVlX2JwcwAAAAAEAAAAAAAAAAtyb3lhbHR5X2JwcwAAAAAEAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==",
        "AAAAAAAAAaxFc2Nyb3cgYGFtb3VudGAgb2YgYGN1cnJlbmN5YCBmcm9tIGBidXllcmAgYXMgYSBzdGFuZGluZyBvZmZlciBmb3IKYGJvdF9pZGAsIG9wZW4gdW50aWwgYGV4cGlyZXNfYXRgIChsZWRnZXIgdGltZXN0YW1wLCBleGNsdXNpdmUpLgoKVGhlIGJvdCBkb2VzIG5vdCBuZWVkIHRvIGJlIGxpc3RlZC4gVGhlIG9mZmVyIGlzIHJlamVjdGVkIHdoZW4gdGhlCmJ1eWVyIGFscmVhZHkgb3ducyB0aGUgYm90LCBvdXRyaWdodCBvciB0aHJvdWdoIHRoZWlyIG93biBhY3RpdmUKbGlzdGluZywgd2hlbiBgY3VycmVuY3lgIGlzIG5vdCBhbGxvd2xpc3RlZCwgd2hlbiBgYW1vdW50YCBpcyBiZWxvdyB0aGUKY3VycmVuY3kncyBtaW5pbXVtIHByaWNlLCBvciB3aGVuIHRoZSBib3QgYWxyZWFkeSBjYXJyaWVzCmBNQVhfT0ZGRVJTX1BFUl9CT1RgIG9wZW4gb2ZmZXJzLgAAAAptYWtlX29mZmVyAAAAAAAFAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAABmJvdF9pZAAAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAhjdXJyZW5jeQAAABMAAAAAAAAACmV4cGlyZXNfYXQAAAAAAAYAAAABAAAD6QAAAAYAAAfQAAAAEE1hcmtldHBsYWNlRXJyb3I=",
        "AAAAAAAAAD5TYWxlcyBzdGF0aXN0aWNzIGZvciBvbmUgdGllciAoYWxsIHplcm9zIGJlZm9yZSBhbnkgYWN0aXZpdHkpLgAAAAAACnRpZXJfc3RhdHMAAAAAAAEAAAAAAAAABHRpZXIAAAfQAAAAB0JvdFRpZXIAAAAAAQAAB9AAAAAJVGllclN0YXRzAAAA",
        "AAAAAQAAAAAAAAAAAAAACFB1cmNoYXNlAAAABgAAAAAAAAAGYm90X2lkAAAAAAAGAAAAAAAAAAhjdXJyZW5jeQAAABMAAAAAAAAACmxpc3RpbmdfaWQAAAAAAAYAAAAAAAAABXByaWNlAAAAAAAACwAAAAAAAAAMcHVyY2hhc2VkX2F0AAAABgAAAAAAAAAGc2VsbGVyAAAAAAAT",
        "AAAAAAAAAO1SZXRyaWV2ZSBhIGxpc3RpbmcgYnkgSUQuIEhpc3RvcmljYWwgbGlzdGluZ3MgKGJvdWdodC9jYW5jZWxsZWQvc3RhbGUpCnJlbWFpbiByZWFkYWJsZSB3aXRoIGBhY3RpdmUgPT0gZmFsc2VgOyBvbmx5IGFuIElEIHRoYXQgd2FzIG5ldmVyCmFzc2lnbmVkIHJldHVybnMgYExpc3RpbmdOb3RGb3VuZGAuIFRoaXMgaXMgaW50ZW50aW9uYWwgKHNlZSBtb2R1bGUKZG9jcyk6IGF1ZGl0YWJpbGl0eSBvdmVyIGhpZGluZy4AAAAAAAALZ2V0X2xpc3RpbmcAAAAAAQAAAAAAAAAKbGlzdGluZ19pZAAAAAAABgAAAAEAAAPpAAAH0AAAAAdMaXN0aW5nAAAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==",
        "AAAAAAAAAAAAAAALc2V0X2JvdF9uZnQAAAAAAQAAAAAAAAALbmV3X2JvdF9uZnQAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAEE1hcmtldHBsYWNlRXJyb3I=",
        "AAAAAAAAAAAAAAALc2V0X2ZlZV9icHMAAAAAAQAAAAAAAAALbmV3X2ZlZV9icHMAAAAABAAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAEE1hcmtldHBsYWNlRXJyb3I=",
        "AAAAAQAAAClTYWxlcyBzdGF0aXN0aWNzIGZvciBvbmUgYm90IHRpZXIgKCM0MzIpLgAAAAAAAAAAAAAJVGllclN0YXRzAAAAAAAABgAAADZMaXN0aW5nIGhvbGRpbmcgdGhlIGZsb29yOyBgMGAgd2hlbiBub3RoaW5nIGlzIGxpc3RlZC4AAAAAABBmbG9vcl9saXN0aW5nX2lkAAAABgAAAEZMb3dlc3QgYWN0aXZlIGxpc3RpbmcgcHJpY2UgZm9yIHRoaXMgdGllcjsgYDBgIHdoZW4gbm90aGluZyBpcyBsaXN0ZWQuAAAAAAALZmxvb3JfcHJpY2UAAAAACwAAAAAAAAAPbGFzdF9zYWxlX3ByaWNlAAAAAAsAAAAAAAAACnNhbGVfY291bnQAAAAAAAYAAAAAAAAABHRpZXIAAAfQAAAAB0JvdFRpZXIAAAAAKUN1bXVsYXRpdmUgc2FsZSB2b2x1bWUgaW4gcmF3IGJhc2UgdW5pdHMuAAAAAAAABnZvbHVtZQAAAAAACw==",
        "AAAAAAAAAINTdGVwIHR3byBvZiBhbiBhZG1pbiB0cmFuc2ZlcjogdGhlIG5vbWluYXRlZCBhZGRyZXNzIGFjY2VwdHMgYW5kIGJlY29tZXMKYWRtaW4uIEZhaWxzIHdpdGggYE5vUGVuZGluZ0FkbWluYCBpZiBub2JvZHkgd2FzIHByb3Bvc2VkLgAAAAAMYWNjZXB0X2FkbWluAAAAAAAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAEE1hcmtldHBsYWNlRXJyb3I=",
        "AAAAAAAAAcFBY2NlcHQgb2ZmZXIgYG9mZmVyX2lkYCBhcyBgc2VsbGVyYDogdGhlIGJvdCBtb3ZlcyB0byB0aGUgYnV5ZXIgYW5kIHRoZQplc2Nyb3dlZCBmdW5kcyBhcmUgcGFpZCBvdXQgaW4gdGhlIHNhbWUgaW52b2NhdGlvbiwgc28gbmVpdGhlciBzaWRlCmNhbiBlbmQgdXAgd2l0aCBib3RoIG9yIG5laXRoZXIuCgpUaGUgc2VsbGVyIG11c3Qgb3duIHRoZSBib3Qgb3V0cmlnaHQsIG9yIGhvbGQgaXQgaW4gZXNjcm93IHRocm91Z2gKdGhlaXIgb3duIGFjdGl2ZSBsaXN0aW5nLCB3aGljaCBpcyBkZWFjdGl2YXRlZCBhcyBwYXJ0IG9mIHRoZSBzYWxlLgpUaGUgcGxhdGZvcm0gZmVlIGlzIHJldGFpbmVkIGluIHRoZSBjb250cmFjdCAoc2VlIGB3aXRoZHJhd19mZWVzYCksIHRoZQpyb3lhbHR5IGdvZXMgdG8gdGhlIG9yaWdpbmFsIG1pbnRlciB1bmxlc3MgdGhlIG1pbnRlciBpcyB0aGUgc2VsbGVyLgAAAAAAAAxhY2NlcHRfb2ZmZXIAAAACAAAAAAAAAAZzZWxsZXIAAAAAABMAAAAAAAAACG9mZmVyX2lkAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAEE1hcmtldHBsYWNlRXJyb3I=",
        "AAAAAAAAAPNDYW5jZWwgYW4gb3BlbiBvZmZlciBhbmQgcmVmdW5kIGl0cyBlc2Nyb3cgaW4gZnVsbC4gQmVmb3JlIGV4cGlyeSBvbmx5CnRoZSBvZmZlcidzIGJ1eWVyIG1heSBjYW5jZWw7IG9uY2UgYGV4cGlyZXNfYXRgIGhhcyBwYXNzZWQgYW55b25lIG1heQpjYWxsIGl0ICh0aGUgcmVmdW5kIGFsd2F5cyBnb2VzIHRvIHRoZSBidXllciksIHNvIHN0YWxlIGVzY3JvdyBuZXZlcgpkZXBlbmRzIG9uIHRoZSBidXllciBjb21pbmcgYmFjay4AAAAADGNhbmNlbF9vZmZlcgAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAIb2ZmZXJfaWQAAAAGAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==",
        "AAAAAAAAAMNQZXJtaXNzaW9ubGVzczogZHJvcCB0b21ic3RvbmVkIChpbmFjdGl2ZSAvIG1pc3NpbmcpIGlkcyBmcm9tIGBwYWdlYCBzbwp0aGUgc2xvdCBjb3VudCByZWZsZWN0cyBsaXZlIGxpc3RpbmdzLiBDdXJzb3JzIGFyZSBpZC1iYXNlZCBzbyB0aGlzIGlzCnNhZmUgYXQgYW55IHRpbWUuIFJldHVybnMgdGhlIG51bWJlciBvZiBpZHMgcmVtb3ZlZC4AAAAADGNvbXBhY3RfcGFnZQAAAAEAAAAAAAAABHBhZ2UAAAAEAAAAAQAAAAQ=",
        "AAAAAAAAAHdQbGF0Zm9ybSBmZWVzIGFjY3J1ZWQgaW4gYGN1cnJlbmN5YCBhbmQgc3RpbGwgaGVsZCBieSB0aGUgY29udHJhY3QuCkVzY3Jvd2VkIG9mZmVyIGZ1bmRzIGFyZSBuZXZlciBwYXJ0IG9mIHRoaXMgZmlndXJlLgAAAAAMZmVlc19hY2NydWVkAAAAAQAAAAAAAAAIY3VycmVuY3kAAAATAAAAAQAAAAs=",
        "AAAAAAAAAEJTYWxlcyBzdGF0aXN0aWNzIGZvciBldmVyeSB0aWVyLCBpbiB0aWVyIG9yZGVyIChCYXNpYyAuLiBEaWFtb25kKS4AAAAAAAxtYXJrZXRfc3RhdHMAAAAAAAAAAQAAA+oAAAfQAAAACVRpZXJTdGF0cwAAAA==",
        "AAAAAAAAAE9EZWFjdGl2YXRlIGFueSBhY3RpdmUgbGlzdGluZyBmb3IgYGJvdF9pZGAuIFBlcm1pc3Npb25lZCB0byBgYm90X25mdGAgY29udHJhY3QuAAAAAAxvbl9ib3RfbW92ZWQAAAABAAAAAAAAAAZib3RfaWQAAAAAAAYAAAABAAAD6QAAA+0AAAAAAAAH0AAAABBNYXJrZXRwbGFjZUVycm9y",
        "AAAAAAAAAMBDaGFuZ2UgdGhlIHByaWNlIG9mIGFuIGFjdGl2ZSBsaXN0aW5nLiBPbmx5IHRoZSBzZWxsZXIgbWF5IGNhbGwgaXQsIGFuZAp0aGUgbmV3IHByaWNlIG11c3Qgc2F0aXNmeSB0aGUgc2FtZSBydWxlcyBhcyBgbGlzdF9ib3RgLgpPcmRlcjogZXhpc3RlbmNlIC0+IGF1dGhvcml6YXRpb24gLT4gc3RhdGUgdmFsaWRpdHkgLT4gZWZmZWN0cy4AAAAMdXBkYXRlX3ByaWNlAAAAAwAAAAAAAAAGc2VsbGVyAAAAAAATAAAAAAAAAApsaXN0aW5nX2lkAAAAAAAGAAAAAAAAAAluZXdfcHJpY2UAAAAAAAALAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==",
        "AAAAAAAAAQBSZXR1cm4gdGhlIGNvbmZpZ3VyZWQgbWluaW11bSBwcmljZSBmb3IgYGN1cnJlbmN5YC4gSWYgdGhlIGFkbWluIGhhcyBub3QKc2V0IGFuIGV4cGxpY2l0IGZsb29yLCB0aGUgZGVmYXVsdCBgY2VpbCgxMF8wMDAvZmVlX2JwcylgIChvciBgMWAgd2hlbgpgZmVlX2JwcyA9PSAwYCkgaXMgcmV0dXJuZWQuIEV2ZXJ5IGFjY2VwdGVkIHByaWNlIGd1YXJhbnRlZXMKYHByaWNlICogZmVlX2JwcyAvIDEwXzAwMCA+PSAxYCB3aGVuIGBmZWVfYnBzID4gMGAuAAAADWdldF9taW5fcHJpY2UAAAAAAAABAAAAAAAAAAhjdXJyZW5jeQAAABMAAAABAAAACw==",
        "AAAAAAAAAENUaGUgYWRkcmVzcyBub21pbmF0ZWQgYnkgYHByb3Bvc2VfYWRtaW5gLCBpZiBhIHRyYW5zZmVyIGlzIHBlbmRpbmcuAAAAAA1wZW5kaW5nX2FkbWluAAAAAAAAAAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAALBTdGVwIG9uZSBvZiBhbiBhZG1pbiB0cmFuc2ZlcjogdGhlIGN1cnJlbnQgYWRtaW4gbm9taW5hdGVzIGBuZXdfYWRtaW5gLgpOb3RoaW5nIGNoYW5nZXMgdW50aWwgYG5ld19hZG1pbmAgY2FsbHMgYGFjY2VwdF9hZG1pbmA7IHByb3Bvc2luZyBhZ2FpbgpyZXBsYWNlcyB0aGUgcGVuZGluZyBub21pbmF0aW9uLgAAAA1wcm9wb3NlX2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAEE1hcmtldHBsYWNlRXJyb3I=",
        "AAAAAAAAAHNBZG1pbi1vbmx5OiBzZXQgdGhlIG1pbmltdW0gcHJpY2UgZm9yIGBjdXJyZW5jeWAuIGBtaW5fcHJpY2VgIG11c3QgYmUKc3RyaWN0bHkgcG9zaXRpdmUuIEVtaXRzIGBtaW5fcHJpY2VfdXBkYXRlZGAuAAAAAA1zZXRfbWluX3ByaWNlAAAAAAAAAgAAAAAAAAAIY3VycmVuY3kAAAATAAAAAAAAAAltaW5fcHJpY2UAAAAAAAALAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==",
        "AAAAAAAAAIZBZG1pbi1vbmx5OiBtb3ZlIGBhbW91bnRgIG9mIGFjY3J1ZWQgZmVlcyBpbiBgY3VycmVuY3lgIHRvIGB0b2AuCkJvdW5kZWQgYnkgYGZlZXNfYWNjcnVlZGAsIHNvIGVzY3Jvd2VkIG9mZmVyIGZ1bmRzIGNhbm5vdCBiZSBkcmFpbmVkLgAAAAAADXdpdGhkcmF3X2ZlZXMAAAAAAAADAAAAAAAAAAhjdXJyZW5jeQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAABBNYXJrZXRwbGFjZUVycm9y",
        "AAAAAgAAAAAAAAAAAAAAC09mZmVyU3RhdHVzAAAAAAMAAAAAAAAAAAAAAAZBY3RpdmUAAAAAAAAAAAAAAAAACEFjY2VwdGVkAAAAAAAAAAAAAAAJQ2FuY2VsbGVkAAAA",
        "AAAAAAAAAQVDYW5jZWwgYSBsaXN0aW5nIGFuZCByZXR1cm4gdGhlIGVzY3Jvd2VkIGJvdCB0byBpdHMgc2VsbGVyLgoKVGhpcyBpcyB0aGUgZXNjYXBlIGhhdGNoOiBpdCBpcyBpbnRlbnRpb25hbGx5IE5PVCBibG9ja2VkIHdoaWxlIHRoZQptYXJrZXRwbGFjZSBpcyBwYXVzZWQsIHNvIHNlbGxlcnMgY2FuIGFsd2F5cyByZXRyaWV2ZSBlc2Nyb3dlZCBib3RzLgpPcmRlcjogZXhpc3RlbmNlIC0+IGF1dGhvcml6YXRpb24gLT4gc3RhdGUgdmFsaWRpdHkgLT4gZWZmZWN0cy4AAAAAAAAOY2FuY2VsX2xpc3RpbmcAAAAAAAIAAAAAAAAABnNlbGxlcgAAAAAAEwAAAAAAAAAKbGlzdGluZ19pZAAAAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAEE1hcmtldHBsYWNlRXJyb3I=",
        "AAAAAAAAAAAAAAAPZ2V0X2xpc3RpbmdfY2FwAAAAAAAAAAABAAAABA==",
        "AAAAAAAAAPlSZXR1cm4gdGhlIG5leHQgbGlzdGluZyBJRCB0aGF0IHdpbGwgYmUgYXNzaWduZWQgKGkuZS4gYE5leHRMaXN0aW5nSWRgKS4KVGhpcyBpcyB0aGUgcHVibGljIGVudW1lcmF0aW9uIGN1cnNvciDigJQgdG9vbGluZyBzaG91bGQgdXNlIGl0IGluc3RlYWQgb2YKc2Nhbm5pbmcgYGdldF9saXN0aW5nYCBvdmVyIGFuIHVuYm91bmRlZCByYW5nZS4gVGhlIHZhbHVlIGlzIGAxYCBiZWZvcmUKYW55IGxpc3RpbmcgaGFzIGJlZW4gY3JlYXRlZC4AAAAAAAAPbmV4dF9saXN0aW5nX2lkAAAAAAAAAAABAAAABg==",
        "AAAAAAAAALlQZXJtaXNzaW9ubGVzczogcmV0dXJuIGFuIGV4cGlyZWQsIHN0aWxsLWFjdGl2ZSBsaXN0aW5nJ3MgZXNjcm93ZWQgYm90CnRvIHRoZSBvcmlnaW5hbCBzZWxsZXIuIEFueW9uZSBtYXkgdHJpZ2dlciB0aGlzOyB0aGUgYm90IGFsd2F5cyByZXR1cm5zCnRvIHRoZSBzZWxsZXIsIG5ldmVyIHRvIHRoZSBjYWxsZXIgKCM0MjMpLgAAAAAAAA9yZWNsYWltX2V4cGlyZWQAAAAAAQAAAAAAAAAKbGlzdGluZ19pZAAAAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAEE1hcmtldHBsYWNlRXJyb3I=",
        "AAAAAAAAAAAAAAAPc2V0X2xpc3RpbmdfY2FwAAAAAAEAAAAAAAAAB25ld19jYXAAAAAABAAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAEE1hcmtldHBsYWNlRXJyb3I=",
        "AAAAAAAAAAAAAAARZ2V0X3VzZXJfbGlzdGluZ3MAAAAAAAABAAAAAAAAAAZzZWxsZXIAAAAAABMAAAABAAAD6gAAB9AAAAAHTGlzdGluZwA=",
        "AAAAAAAAAK9FdmVyeSBvcGVuIChgQWN0aXZlYCkgb2ZmZXIgb24gYGJvdF9pZGAsIG9sZGVzdCBmaXJzdC4gRXhwaXJlZCBvZmZlcnMKc3RheSBsaXN0ZWQgdW50aWwgc29tZW9uZSBjYW5jZWxzIHRoZW0sIHNvIGNhbGxlcnMgc2hvdWxkIGNvbXBhcmUKYGV4cGlyZXNfYXRgIHdpdGggdGhlIGxlZGdlciB0aW1lc3RhbXAuAAAAABJnZXRfb2ZmZXJzX2Zvcl9ib3QAAAAAAAEAAAAAAAAABmJvdF9pZAAAAAAABgAAAAEAAAPqAAAH0AAAAAVPZmZlcgAAAA==",
        "AAAAAAAAAAAAAAASZ2V0X3VzZXJfcHVyY2hhc2VzAAAAAAACAAAAAAAAAAVidXllcgAAAAAAABMAAAAAAAAABWxpbWl0AAAAAAAABAAAAAEAAAPqAAAH0AAAAAhQdXJjaGFzZQ==",
        "AAAAAAAAACJOdW1iZXIgb2YgbGlzdGluZyBwYWdlcyBhbGxvY2F0ZWQuAAAAAAASbGlzdGluZ19wYWdlX2NvdW50AAAAAAAAAAAAAQAAAAQ=",
        "AAAABAAAAAAAAAAAAAAAEE1hcmtldHBsYWNlRXJyb3IAAAAhAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAAAxJbnZhbGlkUHJpY2UAAAADAAAAAAAAABFCb3RUcmFuc2ZlckZhaWxlZAAAAAAAAAQAAAAAAAAAD0xpc3RpbmdOb3RGb3VuZAAAAAAFAAAAAAAAAAlOb3RTZWxsZXIAAAAAAAAGAAAAAAAAAA9MaXN0aW5nSW5hY3RpdmUAAAAABwAAAAAAAAARSW5zdWZmaWNpZW50RnVuZHMAAAAAAAAIAAAAAAAAABBMaXN0aW5nTm90QWN0aXZlAAAACQAAAAAAAAAMVW5hdXRob3JpemVkAAAACgAAAAAAAAANUGF5bWVudEZhaWxlZAAAAAAAAAsAAAAAAAAACE92ZXJmbG93AAAADAAAAAAAAAALUHJpY2VUb29Mb3cAAAAADQAAAAAAAAAMTGlzdGluZ1N0YWxlAAAADgAAAAAAAAAMU2VsZlB1cmNoYXNlAAAADwAAAAAAAAAPVG9vTWFueUxpc3RpbmdzAAAAABAAAAAAAAAADUludmFsaWRCb3ROZnQAAAAAAAARAAAAAAAAAA5Db250cmFjdFBhdXNlZAAAAAAAEgAAAAAAAAAOTm9QZW5kaW5nQWRtaW4AAAAAABMAAAAAAAAAC0JvdE5vdEZvdW5kAAAAABQAAAAAAAAAC05vdEJvdE93bmVyAAAAABUAAAAAAAAAClJlZW50cmFuY3kAAAAAABYAAAAAAAAAE1Vuc3VwcG9ydGVkQ3VycmVuY3kAAAAAFwAAAAAAAAAOTGlzdGluZ0V4cGlyZWQAAAAAABgAAAA3YG1ha2Vfb2ZmZXJgOiBgZXhwaXJlc19hdGAgaXMgbm90IGluIHRoZSBmdXR1cmUgKCM0MjUpLgAAAAANSW52YWxpZEV4cGlyeQAAAAAAABkAAAAAAAAADU9mZmVyTm90Rm91bmQAAAAAAAAaAAAAM1RoZSBvZmZlciB3YXMgYWxyZWFkeSBhY2NlcHRlZCBvciBjYW5jZWxsZWQgKCM0MjUpLgAAAAAOT2ZmZXJOb3RBY3RpdmUAAAAAABsAAAA7YGFjY2VwdF9vZmZlcmA6IHRoZSBvZmZlcidzIGBleHBpcmVzX2F0YCBoYXMgcGFzc2VkICgjNDI1KS4AAAAADE9mZmVyRXhwaXJlZAAAABwAAABEYGNhbmNlbF9vZmZlcmAgYmVmb3JlIGV4cGlyeSBieSBzb21lb25lIG90aGVyIHRoYW4gdGhlIGJ1eWVyICgjNDI1KS4AAAANTm90T2ZmZXJPd25lcgAAAAAAAB0AAABCYG1ha2Vfb2ZmZXJgIG9uIGEgYm90IHRoZSBidXllciBhbHJlYWR5IG93bnMgb3IgaGFzIGxpc3RlZCAoIzQyNSkuAAAAAAANT2ZmZXJPbk93bkJvdAAAAAAAAB4AAABAVGhlIGJvdCBhbHJlYWR5IGNhcnJpZXMgYE1BWF9PRkZFUlNfUEVSX0JPVGAgb3BlbiBvZmZlcnMgKCM0MjUpLgAAAA1Ub29NYW55T2ZmZXJzAAAAAAAAHwAAADNgd2l0aGRyYXdfZmVlc2AgYW1vdW50IHdhcyB6ZXJvIG9yIG5lZ2F0aXZlICgjNDI2KS4AAAAADUludmFsaWRBbW91bnQAAAAAAAAgAAAAPmB3aXRoZHJhd19mZWVzYCBhbW91bnQgZXhjZWVkcyB0aGUgYWNjcnVlZCBmZWUgYmFsYW5jZSAoIzQyNikuAAAAAAAQSW5zdWZmaWNpZW50RmVlcwAAACE=",
        "AAAAAAAAApxSZXR1cm4gdXAgdG8gYGxpbWl0YCBhY3RpdmUgbGlzdGluZ3Mgd2l0aCBpZCBncmVhdGVyIHRoYW4gYGN1cnNvcmAsCnBsdXMgdGhlIGN1cnNvciB0byBwYXNzIHRvIHRoZSBuZXh0IGNhbGwgKCMzMzMpLgoKYGN1cnNvcmAgaXMgYSBsaXN0aW5nIElEICgwID0gc3RhcnQpLCBOT1QgYSBwb3NpdGlvbmFsIGluZGV4LCBzbyBpdCBzdGF5cwp2YWxpZCB3aGVuIGxpc3RpbmdzIGFyZSBjYW5jZWxsZWQsIHNvbGQgb3IgY29tcGFjdGVkIG1pZC1wYWdpbmF0aW9uOgpldmVyeSBhY3RpdmUgbGlzdGluZyBpcyB2aXNpdGVkIGV4YWN0bHkgb25jZS4gVGhlIHNjYW4gZXhhbWluZXMgYXQgbW9zdApgbGltaXQgKiA0YCBpbmRleCBlbnRyaWVzIHBlciBjYWxsLCBzbyBhIHBhZ2UgbWF5IGJlIHNob3J0IHdoZW4gbWFueQp0b21ic3RvbmVzIGFyZSBza2lwcGVkOyBrZWVwIHBhZ2luZyB1bnRpbCB0aGUgcmV0dXJuZWQgY3Vyc29yIGVxdWFscyB0aGUKb25lIHBhc3NlZCBpbiAobm90aGluZyBsZWZ0IHRvIHNjYW4pLgoKLSBgbGltaXQgPT0gMGAgcmV0dXJucyBgKGVtcHR5LCBjdXJzb3IpYC4KLSBJbmFjdGl2ZSBsaXN0aW5ncyAodG9tYnN0b25lcyksIG1pc3NpbmcgcmVjb3JkcyBhbmQgbGlzdGluZ3Mgd2hvc2UgYm90CmlzIG5vIGxvbmdlciBlc2Nyb3dlZCBoZXJlIGFyZSBza2lwcGVkLgAAABNnZXRfYWN0aXZlX2xpc3RpbmdzAAAAAAIAAAAAAAAABmN1cnNvcgAAAAAABgAAAAAAAAAFbGltaXQAAAAAAAAEAAAAAQAAA+0AAAACAAAD6gAAB9AAAAAHTGlzdGluZwAAAAAG",
        "AAAAAAAAAIxSZXR1cm4gdGhlIGFjdGl2ZSBsaXN0aW5nIElEIGZvciBhIGJvdCwgaWYgb25lIGV4aXN0cy4gUmV0dXJucwpgTGlzdGluZ05vdEZvdW5kYCBpZiB0aGUgYm90IGlzIG5vdCBsaXN0ZWQgb3IgaXRzIGxpc3Rpbmcgd2FzIGNhbmNlbGxlZC9zb2xkLgAAABNnZXRfbGlzdGluZ19mb3JfYm90AAAAAAEAAAAAAAAABmJvdF9pZAAAAAAABgAAAAEAAAPpAAAABgAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==",
        "AAAAAAAAAC5DaGVjayBpZiBhIGN1cnJlbmN5IGlzIGluIHRoZSBhbGxvd2xpc3QgKCMzMjUpAAAAAAATaXNfYWxsb3dlZF9jdXJyZW5jeQAAAAABAAAAAAAAAAhjdXJyZW5jeQAAABMAAAABAAAAAQ==",
        "AAAAAAAAADJBZG1pbi1vbmx5OiBhZGQgYSBjdXJyZW5jeSB0byB0aGUgYWxsb3dsaXN0ICgjMzI1KQAAAAAAFGFkZF9hbGxvd2VkX2N1cnJlbmN5AAAAAQAAAAAAAAAIY3VycmVuY3kAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAQTWFya2V0cGxhY2VFcnJvcg==",
        "AAAAAAAAATRCb3VuZGVkIHBhZ2Ugb2YgYWN0aXZlIGxpc3RpbmdzIG1hdGNoaW5nIG9wdGlvbmFsIHRpZXIgYW5kIGluY2x1c2l2ZQpwcmljZSBjb25zdHJhaW50cy4gYGN1cnNvcmAgaXMgYSBsaXN0aW5nIElEICgwID0gc3RhcnQpLCBhcyBpbgpgZ2V0X2FjdGl2ZV9saXN0aW5nc2A7IGF0IG1vc3QgYE1BWF9GSUxURVJfU0NBTmAgaW5kZXggZW50cmllcyBhcmUKZXhhbWluZWQgYW5kIGF0IG1vc3QgNTAgbGlzdGluZ3MgcmV0dXJuZWQuIFJldHVybnMgdGhlIG5leHQgY3Vyc29yOwpzdG9wIHdoZW4gaXQgZXF1YWxzIHRoZSBjdXJzb3IgcGFzc2VkIGluLgAAABVnZXRfbGlzdGluZ3NfZmlsdGVyZWQAAAAAAAAFAAAAAAAAAAR0aWVyAAAD6AAAB9AAAAAHQm90VGllcgAAAAAAAAAACW1pbl9wcmljZQAAAAAAA+gAAAALAAAAAAAAAAltYXhfcHJpY2UAAAAAAAPoAAAACwAAAAAAAAAGY3Vyc29yAAAAAAAGAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD7QAAAAIAAAPqAAAH0AAAAAdMaXN0aW5nAAAAAAY=",
        "AAAAAAAAADdBZG1pbi1vbmx5OiByZW1vdmUgYSBjdXJyZW5jeSBmcm9tIHRoZSBhbGxvd2xpc3QgKCMzMjUpAAAAABdyZW1vdmVfYWxsb3dlZF9jdXJyZW5jeQAAAAABAAAAAAAAAAhjdXJyZW5jeQAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAABBNYXJrZXRwbGFjZUVycm9y",
        "AAAAAAAAAAAAAAAdZ2V0X3VzZXJfYWN0aXZlX2xpc3RpbmdfY291bnQAAAAAAAABAAAAAAAAAAZzZWxsZXIAAAAAABMAAAABAAAABA==",
        "AAAAAAAAALVCdXJuIGEgYm90LCByZW1vdmluZyBpdCBmcm9tIHN0b3JhZ2UsIGRlY3JlbWVudGluZyB0aWVyIHN1cHBseSwKcmVtb3ZpbmcgaXQgZnJvbSBvd25lcidzIGJvdCBsaXN0IGFuZCB0aWVyIGluZGV4LCBhbmQgZGVjcmVtZW50aW5nIHRoZSBvd25lcidzCmNvdW50IGluIHRoZSByZWdpc3RyeSBjb250cmFjdCAoIzM5OCkuAAAAAAAABGJ1cm4AAAACAAAAAAAAAAZib3RfaWQAAAAAAAYAAAAAAAAABW93bmVyAAAAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAC0JvdE5GVEVycm9yAA==",
        "AAAAAAAAAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAA+kAAAATAAAH0AAAAAtCb3RORlRFcnJvcgA=",
        "AAAAAwAAAAAAAAAAAAAABFRpZXIAAAADAAAAAAAAAAVCYXNpYwAAAAAAAAAAAAAAAAAACEFkdmFuY2VkAAAAAQAAAAAAAAAHUHJlbWl1bQAAAAAC",
        "AAAAAAAAAAAAAAAHZ2V0X2JvdAAAAAABAAAAAAAAAAZib3RfaWQAAAAAAAYAAAABAAAD6QAAB9AAAAAGQm90TkZUAAAAAAfQAAAAC0JvdE5GVEVycm9yAA==",
        "AAAAAAAAAIBUaGUgbmV4dCBib3QgaWQgdGhhdCB3aWxsIGJlIGFzc2lnbmVkLiBDYWxsZXJzIHVzZSBpdCBhcyB0aGUgZXhjbHVzaXZlCnVwcGVyIGJvdW5kIHdoZW4gcGFnaW5hdGluZyB3aXRoIGBnZXRfYm90c19yYW5nZWAgKCMzOTEpLgAAAAduZXh0X2lkAAAAAAAAAAABAAAABg==",
        "AAAAAAAAAEtQZXJtaXNzaW9ubGVzc2x5IHJlZnJlc2ggdGhlIHBlcnNpc3RlbnQgc3RvcmFnZSBUVEwgb2YgYSBzaW5nbGUgYm90ICgjMzk3KS4AAAAACGJ1bXBfYm90AAAAAQAAAAAAAAAGYm90X2lkAAAAAAAGAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAALQm90TkZURXJyb3IA",
        "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAAZib3RfaWQAAAAAAAYAAAAAAAAABGZyb20AAAATAAAAAAAAAAJ0bwAAAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAC0JvdE5GVEVycm9yAA==",
        "AAAAAAAAARBBZG1pbi1vbmx5IHdpdGhkcmF3YWwgb2YgYWNjdW11bGF0ZWQgdGllciBwYXltZW50cyAoIzMyMikuCgpgbWludF90aWVyYCB0YWtlcyB0aGUgcGF5bWVudCB0b2tlbiBhcyBhIHBlci1jYWxsIGFyZ3VtZW50IChubyB0b2tlbiBpcwpzdG9yZWQgeWV0KSwgc28gdGhlIHRva2VuIHRvIHdpdGhkcmF3IGlzIHBhc3NlZCBleHBsaWNpdGx5LiBUaGUgYmFsYW5jZQppcyBjaGVja2VkIHVwIGZyb250IHNvIGFuIG92ZXItd2l0aGRyYXdhbCBmYWlscyBiZWZvcmUgYW55IHRyYW5zZmVyLgAAAAh3aXRoZHJhdwAAAAMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAC0JvdE5GVEVycm9yAA==",
        "AAAAAQAAAAAAAAAAAAAABkJvdE5GVAAAAAAACQAAAAAAAAAMYWNjcnVhbF9yYXRlAAAABgAAAEZEZXRlcm1pbmlzdGljIGJvbnVzIGJwcyAoMC4uNTAwKSBvbiB0b3Agb2YgdGhlIHRpZXIgYmFzZSBhY2NydWFsIHJhdGUuAAAAAAAJYm9udXNfYnBzAAAAAAAABAAAAAAAAAACaWQAAAAAAAYAAAAAAAAACW1pbnRlZF9hdAAAAAAAAAYAAAAAAAAABm1pbnRlcgAAAAAAEwAAAHVPd25lci1zZXR0YWJsZSBuaWNrbmFtZSAobWF4IDI0IGJ5dGVzKS4gTm9uZSB3aGVuIHVuc2V0OyBjYWxsZXJzIHRoYXQKbmVlZCBhIGRpc3BsYXkgbmFtZSBmYWxsIGJhY2sgdG8gYHRpZXIubmFtZSgpYC4AAAAAAAAIbmlja25hbWUAAAPoAAAAEAAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAR0aWVyAAAH0AAAAAdCb3RUaWVyAAAAAEBEZXRlcm1pbmlzdGljIHZhcmlhbnQgKDAuLj03KSBhc3NpZ25lZCBhdCBtaW50LCB1c2VkIGZvciByYXJpdHkuAAAAB3ZhcmlhbnQAAAAABA==",
        "AAAAAAAAADpFdmVyeSB0aWVyJ3MgZGVzY3JpcHRvciwgaW4gdGllciBvcmRlciAoQmFzaWMgLi4gRGlhbW9uZCkuAAAAAAAJYWxsX3RpZXJzAAAAAAAAAAAAAAEAAAPqAAAH0AAAAAhUaWVySW5mbw==",
        "AAAAAAAAAAAAAAAJbWludF90aWVyAAAAAAAAAgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAR0aWVyAAAH0AAAAARUaWVyAAAAAQAAA+kAAAAGAAAH0AAAAAtCb3RORlRFcnJvcgA=",
        "AAAAAAAAANlPZmYtY2hhaW4gdmVyaWZpYWJsZSBkZXNjcmlwdG9yLiBUaGUgdHJhaXRzIGFyZSBkZXJpdmVkIGRldGVybWluaXN0aWNhbGx5CmZyb20gc2hhMjU2KGJvdF9pZCwgbWludGVkX2F0LCBvd25lcik7IHRoaXMgVVJJIGV4cG9zZXMgdGhlIGRlcml2YXRpb24KaW5wdXRzIHNvIGFueW9uZSBjYW4gcmVjb21wdXRlIGB2YXJpYW50YC9gYm9udXNfYnBzYCBhbmQgY29uZmlybSByYXJpdHkuAAAAAAAACXRva2VuX3VyaQAAAAAAAAEAAAAAAAAABmJvdF9pZAAAAAAABgAAAAEAAAPpAAAAEAAAB9AAAAALQm90TkZURXJyb3IA",
        "AAAAAwAAAAAAAAAAAAAAB0JvdFRpZXIAAAAABQAAAAAAAAAFQmFzaWMAAAAAAAAAAAAAAAAAAAZCcm9uemUAAAAAAAEAAAAAAAAABlNpbHZlcgAAAAAAAgAAAAAAAAAER29sZAAAAAMAAAAAAAAAB0RpYW1vbmQAAAAABA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAADAAAAAAAAAAAAAAABk5leHRJZAAAAAAAAQAAAAAAAAADQm90AAAAAAEAAAAGAAAAAQAAAAAAAAAIVXNlckJvdHMAAAABAAAAEwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAALSW5pdGlhbGl6ZWQAAAAAAAAAAAAAAAAIUmVnaXN0cnkAAAABAAAAAAAAAApUaWVyU3VwcGx5AAAAAAABAAAH0AAAAAdCb3RUaWVyAAAAAAEAAAAAAAAACFRpZXJSYXRlAAAAAQAAB9AAAAAHQm90VGllcgAAAAAAAAAAAAAAAAtNYXJrZXRwbGFjZQAAAAAAAAAAAAAAAAdBY2NydWFsAAAAAAAAAAAAAAAADFBheW1lbnRUb2tlbgAAAAEAAAAAAAAACVRpZXJJbmRleAAAAAAAAAEAAAfQAAAAB0JvdFRpZXIA",
        "AAAAAAAAAHBBZG1pbi1jb250cm9sbGVkIG1pbnQgKG5vIHBheW1lbnQpIGZvciBhaXJkcm9wcyAvIGdyYW50cy4gRGlzdGluZ3Vpc2hhYmxlCmZyb20gYSBwdXJjaGFzZSB2aWEgdGhlIGBncmFudGAgZXZlbnQuAAAACmFkbWluX21pbnQAAAAAAAIAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAR0aWVyAAAH0AAAAAdCb3RUaWVyAAAAAAEAAAPpAAAABgAAB9AAAAALQm90TkZURXJyb3IA",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAwAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAhyZWdpc3RyeQAAABMAAAAAAAAADXBheW1lbnRfdG9rZW4AAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAALQm90TkZURXJyb3IA",
        "AAAAAAAAAAAAAAAKbWludF9iYXNpYwAAAAAAAQAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAA+kAAAAGAAAH0AAAAAtCb3RORlRFcnJvcgA=",
        "AAAAAAAAAIFTZXQgb3IgY2xlYXIgdGhlIG93bmVyLWNob3NlbiBuaWNrbmFtZSBmb3IgYSBib3QuIE1heCAyNCBieXRlczsgcGFzcwphbiBlbXB0eSBzdHJpbmcgdG8gY2xlYXIuIE9ubHkgdGhlIGN1cnJlbnQgb3duZXIgbWF5IHJlbmFtZS4AAAAAAAAKcmVuYW1lX2JvdAAAAAAAAgAAAAAAAAAGYm90X2lkAAAAAAAGAAAAAAAAAARuYW1lAAAAEAAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAC0JvdE5GVEVycm9yAA==",
        "AAAAAQAAAEJUeXBlZCB0aWVyIGRlc2NyaXB0b3IgcmV0dXJuZWQgYnkgYGdldF90aWVyX2luZm9gIGFuZCBgYWxsX3RpZXJzYC4AAAAAAAAAAAAIVGllckluZm8AAAADAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAFcHJpY2UAAAAAAAALAAAAAAAAAARyYXRlAAAABg==",
        "AAAAAAAAAAAAAAALc2V0X2FjY3J1YWwAAAAAAQAAAAAAAAAHYWNjcnVhbAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAALQm90TkZURXJyb3IA",
        "AAAAAAAAAAAAAAANZ2V0X3RpZXJfaW5mbwAAAAAAAAEAAAAAAAAABHRpZXIAAAfQAAAAB0JvdFRpZXIAAAAAAQAAB9AAAAAIVGllckluZm8=",
        "AAAAAAAAAAAAAAANZ2V0X3VzZXJfYm90cwAAAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAA+oAAAAG",
        "AAAAAAAAAAAAAAANcGF5bWVudF90b2tlbgAAAAAAAAAAAAABAAAD6QAAABMAAAfQAAAAC0JvdE5GVEVycm9yAA==",
        "AAAAAAAAAAAAAAANc2V0X3RpZXJfcmF0ZQAAAAAAAAIAAAAAAAAABHRpZXIAAAfQAAAAB0JvdFRpZXIAAAAAAAAAAARyYXRlAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAC0JvdE5GVEVycm9yAA==",
        "AAAABAAAAAAAAAAAAAAAC0JvdE5GVEVycm9yAAAAAA8AAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAQAAAAAAAAAITm90Rm91bmQAAAACAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAADAAAAAAAAAAtJbnZhbGlkVGllcgAAAAAEAAAAAAAAAAtCb3ROb3RGb3VuZAAAAAAFAAAAAAAAAAhOb3RPd25lcgAAAAYAAAAAAAAAEUluc3VmZmljaWVudEZ1bmRzAAAAAAAABwAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAgAAAAAAAAAEVN1cHBseUNhcEV4Y2VlZGVkAAAAAAAACQAAAAAAAAANQmF0Y2hUb29MYXJnZQAAAAAAAAoAAAAAAAAAD05pY2tuYW1lVG9vTG9uZwAAAAALAAAAAAAAABJSYW5nZUxpbWl0RXhjZWVkZWQAAAAAAAwAAAAnYHdpdGhkcmF3YCBhbW91bnQgd2FzIHplcm8gb3IgbmVnYXRpdmUuAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAADQAAAERgd2l0aGRyYXdgIGFtb3VudCBleGNlZWRzIHRoZSB0cmVhc3VyeSBiYWxhbmNlIG9mIHRoZSBwYXltZW50IHRva2VuLgAAABRJbnN1ZmZpY2llbnRUcmVhc3VyeQAAAA4AAABIVGhlIGJvdCBpZCBjb3VudGVyIGhhcyByZWFjaGVkIGB1NjQ6Ok1BWGA7IG5vIGZ1cnRoZXIgYm90IGNhbiBiZSBtaW50ZWQuAAAACE92ZXJmbG93AAAADw==",
        "AAAAAAAAAHBQZXJtaXNzaW9ubGVzc2x5IHJlZnJlc2ggdGhlIHBlcnNpc3RlbnQgc3RvcmFnZSBUVEwgb2YgYSB1c2VyJ3MgYm90IGxpc3QKYW5kIGFsbCBib3RzIG93bmVkIGJ5IHRoYXQgdXNlciAoIzM5NykuAAAADmJ1bXBfdXNlcl9ib3RzAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAC0JvdE5GVEVycm9yAA==",
        "AAAAAAAAANZVcCB0byBgbGltaXRgIGV4aXN0aW5nIGJvdHMgd2hvc2UgaWRzIGZhbGwgaW4gYFtzdGFydF9pZCwgc3RhcnRfaWQgKyBsaW1pdClgLApza2lwcGluZyBpZHMgd2l0aCBubyBzdG9yZWQgZW50cnkgKGJ1cm5lZCBvciBub3QgeWV0IG1pbnRlZCkuIGBsaW1pdGAKYWJvdmUgYE1BWF9SQU5HRV9MSU1JVGAgKDEwMCkgcmV0dXJucyBgUmFuZ2VMaW1pdEV4Y2VlZGVkYCAoIzM5MSkuAAAAAAAOZ2V0X2JvdHNfcmFuZ2UAAAAAAAIAAAAAAAAACHN0YXJ0X2lkAAAABgAAAAAAAAAFbGltaXQAAAAAAAAEAAAAAQAAA+kAAAPqAAAH0AAAAAZCb3RORlQAAAAAB9AAAAALQm90TkZURXJyb3IA",
        "AAAAAQAAAAAAAAAAAAAADFN0b3JlZEJvdE5GVAAAAAgAAAAAAAAACWJvbnVzX2JwcwAAAAAAAAQAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAltaW50ZWRfYXQAAAAAAAAGAAAAAAAAAAZtaW50ZXIAAAAAABMAAAAAAAAACG5pY2tuYW1lAAAD6AAAABAAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAEdGllcgAAB9AAAAAHQm90VGllcgAAAAAAAAAAB3ZhcmlhbnQAAAAABA==",
        "AAAAAAAAAAAAAAAPc2V0X21hcmtldHBsYWNlAAAAAAEAAAAAAAAAC21hcmtldHBsYWNlAAAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAAAtCb3RORlRFcnJvcgA=",
        "AAAAAAAAAJRCYXRjaCBhZG1pbiBtaW50IGZvciBhaXJkcm9wcy4gQWxsLW9yLW5vdGhpbmc6IGlmIGFueSBzaW5nbGUgbWludCBmYWlscwooZS5nLiBzdXBwbHkgY2FwKSwgdGhlIHdob2xlIGJhdGNoIGlzIHJvbGxlZCBiYWNrLiBDYXBwZWQgYnkgTUFYX0JBVENIX1NJWkUuAAAAEGFkbWluX21pbnRfYmF0Y2gAAAABAAAAAAAAAApyZWNpcGllbnRzAAAAAAPqAAAD7QAAAAIAAAATAAAH0AAAAAdCb3RUaWVyAAAAAAEAAAPpAAAD6gAAAAYAAAfQAAAAC0JvdE5GVEVycm9yAA==",
        "AAAAAAAAALRSZXR1cm4gYSBwYWdlIG9mIGJvdCBJRHMgZm9yIGEgc3BlY2lmaWMgdGllciAoIzM5OCkuCgpQYWdlZCBpbiBidWNrZXRzIG9mIGBUSUVSX1BBR0VfU0laRWAgKDEwKS4gQm91bmRlZCB0byBndWFyYW50ZWUgcHJlZGljdGFibGUKc2ltdWxhdGlvbiBjb3N0IHdpdGhvdXQgY2xpZW50LXNpZGUgTisxIGZpbHRlcmluZy4AAAAQZ2V0X2JvdHNfYnlfdGllcgAAAAIAAAAAAAAABHRpZXIAAAfQAAAAB0JvdFRpZXIAAAAAAAAAAARwYWdlAAAABAAAAAEAAAPqAAAABg==",
        "AAAAAAAAAEVCYWxhbmNlIG9mIGB0b2tlbmAgaGVsZCBieSB0aGlzIGNvbnRyYWN0IChhY2N1bXVsYXRlZCB0aWVyIHBheW1lbnRzKS4AAAAAAAAQdHJlYXN1cnlfYmFsYW5jZQAAAAEAAAAAAAAABXRva2VuAAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAATZ2V0X3VzZXJfdG90YWxfcmF0ZQAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAAG",
        "AAAAAAAAASFGdWxsIGBCb3RORlRgIHJlY29yZHMgZm9yIHVwIHRvIHRoZSBmaXJzdCBgTUFYX0RFVEFJTEVEX0JPVFNgIGJvdHMKb3duZWQgYnkgYHVzZXJgLCBpbiBvd25lcnNoaXAgb3JkZXIuIFJlcGxhY2VzIHRoZSBOKzEgZmFuLW91dCBvZgpgZ2V0X3VzZXJfYm90c2AgKyBgZ2V0X2JvdGAgd2l0aCBhIHNpbmdsZSBzaW11bGF0aW9uOyB0aGUgY2FwIGlzCmVuZm9yY2VkIGhlcmUsIGNvbnRyYWN0LXNpZGUsIGFuZCBjYWxsZXJzIHBhZ2luYXRlIHBhc3QgaXQgd2l0aCB0aGUKSUQtYmFzZWQgZ2V0dGVycyAoIzQ4MykuAAAAAAAAFmdldF91c2VyX2JvdHNfZGV0YWlsZWQAAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAA+oAAAfQAAAABkJvdE5GVAAA",
        "AAAAAAAAAAAAAAAIZ2V0X3VzZXIAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPpAAAH0AAAAAtVc2VyUHJvZmlsZQAAAAfQAAAADVJlZ2lzdHJ5RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAIcmVnaXN0ZXIAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAIdXNlcm5hbWUAAAAQAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAANUmVnaXN0cnlFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAPpAAAAEwAAB9AAAAANUmVnaXN0cnlFcnJvcgAAAA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABwAAAAEAAAAAAAAAC1VzZXJQcm9maWxlAAAAAAEAAAATAAAAAQAAAAAAAAAIVXNlcm5hbWUAAAABAAAAEAAAAAAAAACvQm91bmRlZCBsZWFkZXJib2FyZCAoIzMzMik6IGBWZWM8KEFkZHJlc3MsIHU2NCk+YCBvZiBhdCBtb3N0CmBMRUFERVJCT0FSRF9TSVpFYCBlbnRyaWVzLCBzb3J0ZWQgYnkgcG9pbnRzIGRlc2NlbmRpbmcuIFRpZXM6IHRoZSB1c2VyCndobyByZWFjaGVkIHRoYXQgdG90YWwgZmlyc3QgcmFua3MgaGlnaGVyLgAAAAAIVG9wVXNlcnMAAAAAAAAAAAAAAApUb3RhbFVzZXJzAAAAAAAAAAAAAAAAAAVBZG1pbgAAAAAAAAAAAAAAAAAAC0luaXRpYWxpemVkAAAAAAAAAAAAAAAAB1dyaXRlcnMA",
        "AAAAAQAAAAAAAAAAAAAAB1dyaXRlcnMAAAAAAgAAAAAAAAAHYWNjcnVhbAAAAAATAAAAAAAAAAdib3RfbmZ0AAAAABM=",
        "AAAAAAAAAAAAAAAKYWRkX3BvaW50cwAAAAAAAgAAAAAAAAAEdXNlcgAAABMAAAAAAAAABnBvaW50cwAAAAAABgAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADVJlZ2lzdHJ5RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAANUmVnaXN0cnlFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X3dyaXRlcnMAAAAAAAAAAAEAAAPoAAAH0AAAAAdXcml0ZXJzAA==",
        "AAAAAAAAAAAAAAALc2V0X3dyaXRlcnMAAAAAAgAAAAAAAAAHYWNjcnVhbAAAAAATAAAAAAAAAAdib3RfbmZ0AAAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1SZWdpc3RyeUVycm9yAAAA",
        "AAAAAAAAAAAAAAALdG90YWxfdXNlcnMAAAAAAAAAAAEAAAAE",
        "AAAAAAAAAAAAAAANaXNfcmVnaXN0ZXJlZAAAAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAAAE=",
        "AAAAAQAAAAAAAAAAAAAAC1VzZXJQcm9maWxlAAAAAAYAAAAAAAAAB2FkZHJlc3MAAAAAEwAAAAAAAAAJYm90X2NvdW50AAAAAAAABAAAAAAAAAALY2xhaW1lZF9hbXQAAAAACwAAAAAAAAANcmVnaXN0ZXJlZF9hdAAAAAAAAAYAAAAAAAAADHRvdGFsX3BvaW50cwAAAAYAAAAAAAAACHVzZXJuYW1lAAAAEA==",
        "AAAAAAAAAAAAAAAPYWRkX2NsYWltZWRfYW10AAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA1SZWdpc3RyeUVycm9yAAAA",
        "AAAAAAAAARtUb3AgdXNlcnMgYnkgcG9pbnRzLCBoaWdoZXN0IGZpcnN0LiBSZWFkcyB0aGUgbWFpbnRhaW5lZCBgVG9wVXNlcnNgCmxpc3QgYW5kIGh5ZHJhdGVzIGF0IG1vc3QgYG1pbihsaW1pdCwgTEVBREVSQk9BUkRfU0laRSlgIHByb2ZpbGVzLCBzbyB0aGUKY29zdCBkb2VzIG5vdCBkZXBlbmQgb24gdGhlIHRvdGFsIG51bWJlciBvZiB1c2Vycy4gRXF1YWwgdG90YWxzIGFyZQpvcmRlcmVkIGJ5IHdobyByZWFjaGVkIHRoZSB0b3RhbCBmaXJzdCAoZWFybGllciB3aW5zKSwgZGV0ZXJtaW5pc3RpY2FsbHkuAAAAAA9nZXRfbGVhZGVyYm9hcmQAAAAAAQAAAAAAAAAFbGltaXQAAAAAAAAEAAAAAQAAA+oAAAfQAAAAC1VzZXJQcm9maWxlAA==",
        "AAAABAAAAAAAAAAAAAAADVJlZ2lzdHJ5RXJyb3IAAAAAAAAHAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAAEUFscmVhZHlSZWdpc3RlcmVkAAAAAAAAAgAAAAAAAAANVXNlcm5hbWVUYWtlbgAAAAAAAAMAAAAAAAAADU5vdFJlZ2lzdGVyZWQAAAAAAAAEAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAAFAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAABgAAADNUaGUgcmVnaXN0ZXJlZC11c2VyIGNvdW50ZXIgaGFzIHJlYWNoZWQgYHUzMjo6TUFYYC4AAAAACE92ZXJmbG93AAAABw==",
        "AAAAAAAAAAAAAAATZGVjcmVtZW50X2JvdF9jb3VudAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADVJlZ2lzdHJ5RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAATaW5jcmVtZW50X2JvdF9jb3VudAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAADVJlZ2lzdHJ5RXJyb3IAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    pause: this.txFromJSON<Result<void>>,
        config: this.txFromJSON<Config>,
        bot_nft: this.txFromJSON<string>,
        buy_bot: this.txFromJSON<Result<void>>,
        unpause: this.txFromJSON<Result<void>>,
        list_bot: this.txFromJSON<Result<u64>>,
        get_offer: this.txFromJSON<Result<Offer>>,
        is_paused: this.txFromJSON<boolean>,
        initialize: this.txFromJSON<Result<void>>,
        make_offer: this.txFromJSON<Result<u64>>,
        tier_stats: this.txFromJSON<TierStats>,
        get_listing: this.txFromJSON<Result<Listing>>,
        set_bot_nft: this.txFromJSON<Result<void>>,
        set_fee_bps: this.txFromJSON<Result<void>>,
        accept_admin: this.txFromJSON<Result<void>>,
        accept_offer: this.txFromJSON<Result<void>>,
        cancel_offer: this.txFromJSON<Result<void>>,
        compact_page: this.txFromJSON<u32>,
        fees_accrued: this.txFromJSON<i128>,
        market_stats: this.txFromJSON<Array<TierStats>>,
        on_bot_moved: this.txFromJSON<Result<void>>,
        update_price: this.txFromJSON<Result<void>>,
        get_min_price: this.txFromJSON<i128>,
        pending_admin: this.txFromJSON<Option<string>>,
        propose_admin: this.txFromJSON<Result<void>>,
        set_min_price: this.txFromJSON<Result<void>>,
        withdraw_fees: this.txFromJSON<Result<void>>,
        cancel_listing: this.txFromJSON<Result<void>>,
        get_listing_cap: this.txFromJSON<u32>,
        next_listing_id: this.txFromJSON<u64>,
        reclaim_expired: this.txFromJSON<Result<void>>,
        set_listing_cap: this.txFromJSON<Result<void>>,
        get_user_listings: this.txFromJSON<Array<Listing>>,
        get_offers_for_bot: this.txFromJSON<Array<Offer>>,
        get_user_purchases: this.txFromJSON<Array<Purchase>>,
        listing_page_count: this.txFromJSON<u32>,
        get_active_listings: this.txFromJSON<readonly [Array<Listing>, u64]>,
        get_listing_for_bot: this.txFromJSON<Result<u64>>,
        is_allowed_currency: this.txFromJSON<boolean>,
        add_allowed_currency: this.txFromJSON<Result<void>>,
        get_listings_filtered: this.txFromJSON<readonly [Array<Listing>, u64]>,
        remove_allowed_currency: this.txFromJSON<Result<void>>,
        get_user_active_listing_count: this.txFromJSON<u32>,
        burn: this.txFromJSON<Result<void>>,
        admin: this.txFromJSON<Result<string>>,
        get_bot: this.txFromJSON<Result<BotNFT>>,
        next_id: this.txFromJSON<u64>,
        bump_bot: this.txFromJSON<Result<void>>,
        transfer: this.txFromJSON<Result<void>>,
        withdraw: this.txFromJSON<Result<void>>,
        all_tiers: this.txFromJSON<Array<TierInfo>>,
        mint_tier: this.txFromJSON<Result<u64>>,
        token_uri: this.txFromJSON<Result<string>>,
        admin_mint: this.txFromJSON<Result<u64>>,
        initialize: this.txFromJSON<Result<void>>,
        mint_basic: this.txFromJSON<Result<u64>>,
        rename_bot: this.txFromJSON<Result<void>>,
        set_accrual: this.txFromJSON<Result<void>>,
        get_tier_info: this.txFromJSON<TierInfo>,
        get_user_bots: this.txFromJSON<Array<u64>>,
        payment_token: this.txFromJSON<Result<string>>,
        set_tier_rate: this.txFromJSON<Result<void>>,
        bump_user_bots: this.txFromJSON<Result<void>>,
        get_bots_range: this.txFromJSON<Result<Array<BotNFT>>>,
        set_marketplace: this.txFromJSON<Result<void>>,
        admin_mint_batch: this.txFromJSON<Result<Array<u64>>>,
        get_bots_by_tier: this.txFromJSON<Array<u64>>,
        treasury_balance: this.txFromJSON<i128>,
        get_user_total_rate: this.txFromJSON<u64>,
        get_user_bots_detailed: this.txFromJSON<Array<BotNFT>>,
        get_user: this.txFromJSON<Result<UserProfile>>,
        register: this.txFromJSON<Result<void>>,
        get_admin: this.txFromJSON<Result<string>>,
        add_points: this.txFromJSON<Result<void>>,
        initialize: this.txFromJSON<Result<void>>,
        get_writers: this.txFromJSON<Option<Writers>>,
        set_writers: this.txFromJSON<Result<void>>,
        total_users: this.txFromJSON<u32>,
        is_registered: this.txFromJSON<boolean>,
        add_claimed_amt: this.txFromJSON<Result<void>>,
        get_leaderboard: this.txFromJSON<Array<UserProfile>>,
        decrement_bot_count: this.txFromJSON<Result<void>>,
        increment_bot_count: this.txFromJSON<Result<void>>
  }
}