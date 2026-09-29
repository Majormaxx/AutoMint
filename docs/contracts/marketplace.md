# Marketplace Contract API Reference

The Marketplace contract manages listings and sales of bot NFTs, with configurable admin fees.

## Public Functions

### initialize

```rust
pub fn initialize(
  env: Env,
  admin: Address,
  bot_nft: Address,
  fee_bps: u32,
) -> Result<(), MarketplaceError>
```

Initialize the marketplace contract with admin address, bot NFT contract reference, and fee configuration.

- `admin`: The marketplace administrator address
- `bot_nft`: The address of the bot NFT contract
- `fee_bps`: Platform fee in basis points (e.g., 250 = 2.5%)

Returns `MarketplaceError::AlreadyInitialized` if called twice.

---

### list_bot

```rust
pub fn list_bot(
  env: Env,
  seller: Address,
  bot_id: u64,
  price: i128,
  currency: Address,
) -> Result<u64, MarketplaceError>
```

Escrow a bot into the marketplace and create a listing. Requires authorization from `seller`.

- `bot_id`: The ID of the bot NFT to list
- `price`: Sale price in the specified currency (must be > 0)
- `currency`: The token contract address for payment

Returns the new listing ID on success.

Errors:
- `InvalidPrice`: Price must be strictly positive
- `NotInitialized`: Marketplace not initialized
- `BotNotFound`: Bot does not exist
- `NotBotOwner`: Caller is not the bot's owner
- `BotTransferFailed`: Genuine escrow transfer failure

---

### cancel_listing

```rust
pub fn cancel_listing(
  env: Env,
  seller: Address,
  listing_id: u64,
) -> Result<(), MarketplaceError>
```

Cancel a listing and return the escrowed bot to the seller. Requires authorization from `seller`.

Errors:
- `ListingNotFound`: Listing does not exist
- `ListingNotActive`: Listing has already been cancelled or purchased
- `Unauthorized`: Caller is not the original seller
- `NotInitialized`: Marketplace not initialized
- `BotTransferFailed`: Failed to return the bot to seller

---

### buy_bot

```rust
pub fn buy_bot(
  env: Env,
  buyer: Address,
  listing_id: u64,
) -> Result<(), MarketplaceError>
```

Purchase a bot from an active listing. Requires authorization from `buyer` and sufficient currency balance.

Payment is split between the seller (97.5%), the original minter's royalty when `royalty_bps` is set, and the platform fee (2.5%). The fee is retained in the contract and tracked per currency; the admin withdraws it with `withdraw_fees` (#426).

Errors:
- `ListingNotFound`: Listing does not exist
- `ListingNotActive`: Listing is no longer active
- `Unauthorized`: Buyer is the original seller (cannot buy own listing)
- `NotInitialized`: Marketplace not initialized
- `Overflow`: Price calculation overflow
- `PaymentFailed`: Buyer does not have sufficient balance or payment failed
- `BotTransferFailed`: Failed to transfer bot to buyer

---

### get_listing

```rust
pub fn get_listing(env: Env, listing_id: u64) -> Result<Listing, MarketplaceError>
```

Retrieve the details of a specific listing.

Errors:
- `ListingNotFound`: Listing does not exist

---

### get_active_listings

```rust
pub fn get_active_listings(
  env: Env,
  start: u64,
  limit: u32,
) -> Vec<Listing>
```

Retrieve a paginated list of active listings.

- `start`: Offset in the listings index (0-based)
- `limit`: Maximum number of listings to return

Returns an empty vector if no listings are found.

---

### get_user_listings

```rust
pub fn get_user_listings(env: Env, seller: Address) -> Vec<Listing>
```

Retrieve all listings created by a specific seller (both active and inactive).

Returns an empty vector if the seller has no listings.

---

### config

```rust
pub fn config(env: Env) -> Result<Config, MarketplaceError>
```

Retrieve the marketplace configuration (admin, bot_nft address, fee_bps).

Errors:
- `NotInitialized`: Marketplace not initialized

---

### make_offer

```rust
pub fn make_offer(
  env: Env,
  buyer: Address,
  bot_id: u64,
  amount: i128,
  currency: Address,
  expires_at: u64,
) -> Result<u64, MarketplaceError>
```

Escrow `amount` of `currency` from `buyer` as a standing offer for `bot_id`, open until `expires_at` (a ledger timestamp; the offer can no longer be accepted from that second on). The bot does not need to be listed. Requires authorization from `buyer`; blocked while paused. Returns the offer id. A bot carries at most `MAX_OFFERS_PER_BOT` (25) open offers.

Errors:
- `InvalidPrice`: `amount` is zero or negative
- `PriceTooLow`: `amount` is below the currency's minimum price (see `get_min_price`)
- `UnsupportedCurrency`: `currency` is not allowlisted
- `InvalidExpiry`: `expires_at` is not in the future
- `BotNotFound`: Bot does not exist
- `OfferOnOwnBot`: The buyer owns the bot, directly or through their own active listing
- `TooManyOffers`: The bot already has 25 open offers
- `PaymentFailed`: The escrow transfer from the buyer failed
- `ContractPaused`, `NotInitialized`

---

### accept_offer

```rust
pub fn accept_offer(
  env: Env,
  seller: Address,
  offer_id: u64,
) -> Result<(), MarketplaceError>
```

Sell the bot to the offer's buyer at the offered amount. The bot moves to the buyer and the escrow is paid out in the same invocation: seller payout, minter royalty (unless the minter is the seller), and the platform fee, which is retained in the contract. The seller must own the bot outright or hold it in escrow through their own active listing, which is deactivated as part of the sale. Other open offers on the bot are left in place for their buyers to cancel. Requires authorization from `seller`; blocked while paused.

Errors:
- `OfferNotFound`, `OfferNotActive`: No such offer, or it was already accepted or cancelled
- `OfferExpired`: `expires_at` has passed
- `SelfPurchase`: The seller is the offer's buyer
- `NotBotOwner`: The seller neither owns the bot nor has it listed
- `BotTransferFailed`, `PaymentFailed`, `Overflow`, `UnsupportedCurrency`, `ContractPaused`, `NotInitialized`

---

### cancel_offer

```rust
pub fn cancel_offer(
  env: Env,
  caller: Address,
  offer_id: u64,
) -> Result<(), MarketplaceError>
```

Cancel an open offer and refund its escrow in full to the buyer. Before `expires_at` only the buyer may cancel; from `expires_at` on anyone may call it (the refund still goes to the buyer), so abandoned escrow can be released by a keeper. Requires authorization from `caller`. Works while paused.

Errors:
- `OfferNotFound`, `OfferNotActive`
- `NotOfferOwner`: Called before expiry by someone other than the buyer
- `PaymentFailed`: The refund transfer failed

---

### get_offer

```rust
pub fn get_offer(env: Env, offer_id: u64) -> Result<Offer, MarketplaceError>
```

One offer by id, whatever its status. Errors with `OfferNotFound`.

---

### get_offers_for_bot

```rust
pub fn get_offers_for_bot(env: Env, bot_id: u64) -> Vec<Offer>
```

Every open offer on `bot_id`, oldest first. Expired offers stay listed until cancelled, so compare `expires_at` with the ledger timestamp before acting on one.

---

### fees_accrued

```rust
pub fn fees_accrued(env: Env, currency: Address) -> i128
```

Platform fees collected in `currency` and not yet withdrawn. Escrowed offer funds are never part of this figure even though they sit in the same token balance.

---

### withdraw_fees

```rust
pub fn withdraw_fees(
  env: Env,
  currency: Address,
  to: Address,
  amount: i128,
) -> Result<(), MarketplaceError>
```

Admin-only. Transfer `amount` of accrued fees in `currency` to `to`. Bounded by `fees_accrued`, so a withdrawal can never touch escrowed offer funds. Emits `fees_wd`.

Errors:
- `InvalidAmount`: `amount` is zero or negative
- `InsufficientFees`: `amount` exceeds `fees_accrued(currency)`
- `PaymentFailed`, `NotInitialized`

---

## Data Types

### Listing

```rust
pub struct Listing {
  pub id: u64,
  pub seller: Address,
  pub bot_id: u64,
  pub bot_tier: BotTier,
  pub price: i128,
  pub currency: Address,
  pub listed_at: u64,           // Ledger timestamp
  pub active: bool,
}
```

Represents a bot listing in the marketplace.

### Config

```rust
pub struct Config {
  pub admin: Address,
  pub bot_nft: Address,
  pub fee_bps: u32,
}
```

Marketplace configuration stored during initialization.

---

### Offer

```rust
pub struct Offer {
    pub id: u64,
    pub buyer: Address,
    pub bot_id: u64,
    pub amount: i128,      // escrowed, in currency base units
    pub currency: Address,
    pub created_at: u64,
    pub expires_at: u64,   // ledger timestamp, exclusive
    pub status: OfferStatus,
}

pub enum OfferStatus {
    Active,
    Accepted,
    Cancelled,
}
```

---

## Error Codes

| Error | Code | Description |
|-------|------|-------------|
| `AlreadyInitialized` | 1 | Marketplace was already initialized |
| `NotInitialized` | 2 | Marketplace has not been initialized |
| `InvalidPrice` | 3 | Price must be strictly positive |
| `BotTransferFailed` | 4 | Genuine escrow transfer failure |
| `ListingNotFound` | 5 | Listing does not exist |
| `NotSeller` | 6 | Caller is not the listing seller |
| `ListingInactive` | 7 | Listing is not active |
| `InsufficientFunds` | 8 | Buyer does not have enough currency |
| `ListingNotActive` | 9 | Listing is no longer active |
| `Unauthorized` | 10 | Caller is not authorized for this action |
| `PaymentFailed` | 11 | Payment transfer failed |
| `Overflow` | 12 | Arithmetic overflow occurred |
| `BotNotFound` | 20 | Bot does not exist (`list_bot`) |
| `NotBotOwner` | 21 | Caller is not the bot's owner (`list_bot`, `accept_offer`) |
| `Reentrancy` | 22 | A state-changing call re-entered the contract |
| `UnsupportedCurrency` | 23 | Currency is not allowlisted |
| `ListingExpired` | 24 | `buy_bot` on a listing past its `expires_at` |
| `InvalidExpiry` | 25 | `make_offer` expiry is not in the future |
| `OfferNotFound` | 26 | Offer does not exist |
| `OfferNotActive` | 27 | Offer was already accepted or cancelled |
| `OfferExpired` | 28 | `accept_offer` after the offer's expiry |
| `NotOfferOwner` | 29 | `cancel_offer` before expiry by someone other than the buyer |
| `OfferOnOwnBot` | 30 | `make_offer` on a bot the buyer owns or has listed |
| `TooManyOffers` | 31 | The bot already carries 25 open offers |
| `InvalidAmount` | 32 | `withdraw_fees` amount is zero or negative |
| `InsufficientFees` | 33 | `withdraw_fees` amount exceeds the accrued balance |

---

## Events

The contract emits the following events:

- `listed(seller, listing_id)` with `(bot_id, price)`
- `cancelled(seller, listing_id)` with `bot_id`
- `bought(buyer, listing_id)` with `(bot_id, price)`
- `offered(buyer, offer_id)` with `(bot_id, amount, expires_at)`
- `offer_acc(seller, buyer)` with `(offer_id, bot_id, amount)`
- `offer_cxl(buyer, offer_id)` with `(bot_id, amount, expired: bool)`
- `fees_wd(admin, to)` with `(currency, amount, remaining)`

---

## Fee Calculation

The platform fee is calculated as:
```
fee = price * fee_bps / 1000
seller_payment = price - fee
```

For example, with a 250 basis point fee (2.5%):
- Listing price: 1000 tokens
- Fee: (1000 * 25) / 1000 = 25 tokens
- Seller receives: 975 tokens
- 25 tokens accrue to `fees_accrued(currency)` inside the contract, for the admin to withdraw with `withdraw_fees`

The same split applies to `accept_offer`, computed on the offered amount.
