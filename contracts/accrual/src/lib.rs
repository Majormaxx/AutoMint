#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env,
};

#[derive(Clone)]
#[contracttype]
pub struct AccrualState {
    pub last_claim_ts: u64,
    pub total_claimed_points: u64,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Config,
    Admin,
    Initialized,
    UserAccrual(Address),
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Config {
    pub points_per_amt: u64,
}

fn read_accrual_state(env: &Env, user: &Address) -> Option<AccrualState> {
    env.storage()
        .persistent()
        .get::<_, UserAccrual>(&DataKey::UserAccrual(user.clone()))
        .map(|a| AccrualState {
            last_claim_ts: a.last_claim_ts,
            total_claimed_points: a.total_claimed_points,
        })
}

#[derive(Clone)]
#[contracttype]
pub struct UserAccrual {
    pub user: Address,
    pub rate: u64,
    pub last_claim_ts: u64,
    pub total_claimed_points: u64,
    pub started_at: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum AccrualError {
    AlreadyInitialized = 1,
    AlreadyStarted = 2,
    NotStarted = 3,
    Unauthorized = 4,
    NotInitialized = 5,
    Overflow = 6,
    InvalidConfig = 7,
}

const LEDGER_BUMP: u32 = 120960;
const LEDGER_THRESHOLD: u32 = 103680;

/// Pure helper to compute points accrued over `elapsed` seconds at `rate` points per hour,
/// plus any `leftover` unminted points carried over from previous claims.
///
/// Returns `Ok((pending_points, total_points))` where `pending_points` is newly accrued points
/// in this interval and `total_points` is `leftover + pending_points`.
/// Returns `Err(AccrualError::Overflow)` on arithmetic overflow.
pub fn compute_pending(
    elapsed: u64,
    rate: u64,
    leftover: u64,
) -> Result<(u64, u64), AccrualError> {
    let product = elapsed.checked_mul(rate).ok_or(AccrualError::Overflow)?;
    let pending = product / 3600;
    let total = leftover
        .checked_add(pending)
        .ok_or(AccrualError::Overflow)?;
    Ok((pending, total))
}

#[contract]
pub struct AccrualContract;

#[contractimpl]
impl AccrualContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        points_per_amt: u64,
    ) -> Result<(), AccrualError> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(AccrualError::AlreadyInitialized);
        }

        if points_per_amt == 0 {
            return Err(AccrualError::InvalidConfig);
        }

        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::Admin, &admin);

        env.storage()
            .instance()
            .set(&DataKey::Config, &Config { points_per_amt });

        env.storage()
            .instance()
            .set(&DataKey::Initialized, &true);

        env.storage()
            .instance()
            .extend_ttl(LEDGER_THRESHOLD, LEDGER_BUMP);

        Ok(())
    }

    pub fn start_accrual(env: Env, user: Address, rate: u64) -> Result<(), AccrualError> {
        user.require_auth();
        if env
            .storage()
            .persistent()
            .has(&DataKey::UserAccrual(user.clone()))
        {
            return Err(AccrualError::AlreadyStarted);
        }
        let accrual = UserAccrual {
            user: user.clone(),
            rate,
            last_claim_ts: env.ledger().timestamp(),
            total_claimed_points: 0,
            started_at: env.ledger().timestamp(),
        };
        env.storage()
            .persistent()
            .set(&DataKey::UserAccrual(user.clone()), &accrual);
        env.storage().persistent().extend_ttl(
            &DataKey::UserAccrual(user.clone()),
            LEDGER_THRESHOLD,
            LEDGER_BUMP,
        );
        env.events().publish(
            (symbol_short!("start"), user.clone()),
            env.ledger().timestamp(),
        );
        Ok(())
    }

    pub fn pending_points(env: Env, user: Address) -> Result<u64, AccrualError> {
        let accrual: UserAccrual = env
            .storage()
            .persistent()
            .get(&DataKey::UserAccrual(user))
            .ok_or(AccrualError::NotStarted)?;
        let current_ts = env.ledger().timestamp();
        let elapsed = if current_ts < accrual.last_claim_ts {
            0
        } else {
            current_ts - accrual.last_claim_ts
        };
        let (pending, _) = compute_pending(elapsed, accrual.rate, accrual.total_claimed_points)?;
        Ok(pending)
    }

    pub fn get_accrual_state(env: Env, user: Address) -> Option<AccrualState> {
        read_accrual_state(&env, &user)
    }

    pub fn claim(
        env: Env,
        user: Address,
        token_contract: Address,
        registry: Address,
    ) -> Result<u64, AccrualError> {
        user.require_auth();

        let accrual: UserAccrual = env
            .storage()
            .persistent()
            .get(&DataKey::UserAccrual(user.clone()))
            .ok_or(AccrualError::NotStarted)?;

        let current_ts = env.ledger().timestamp();
        let is_clock_skew = current_ts < accrual.last_claim_ts;

        let (elapsed, next_last_claim_ts) = if is_clock_skew {
            env.events().publish(
                (symbol_short!("clkskew"), user.clone()),
                (current_ts, accrual.last_claim_ts),
            );
            (0, accrual.last_claim_ts)
        } else {
            (current_ts - accrual.last_claim_ts, current_ts)
        };

        let (pending, updated_points) =
            compute_pending(elapsed, accrual.rate, accrual.total_claimed_points)?;

        let config: Config = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(AccrualError::NotInitialized)?;

        // Number of AMT tokens to mint
        let amt_to_mint = updated_points / config.points_per_amt;

        // Carry forward only leftover points
        let remaining_points = updated_points % config.points_per_amt;

        let reg_client = automint_registry::RegistryContractClient::new(&env, &registry);

        reg_client
            .add_points(&user, &pending);

        if amt_to_mint > 0 {
            let token_client = automint_token::AMTTokenClient::new(&env, &token_contract);

            token_client
                .mint(&user, &(amt_to_mint as i128));

            reg_client
                .add_claimed_amt(&user, &(amt_to_mint as i128));

            env.events().publish(
                (symbol_short!("mint"), user.clone()),
                amt_to_mint as i128,
            );
        }

        // Persist state only after all external calls succeed
        let updated_accrual = UserAccrual {
            user: accrual.user,
            rate: accrual.rate,
            last_claim_ts: next_last_claim_ts,
            total_claimed_points: remaining_points,
            started_at: accrual.started_at,
        };

        env.storage()
            .persistent()
            .set(&DataKey::UserAccrual(user.clone()), &updated_accrual);
        env.storage().persistent().extend_ttl(
            &DataKey::UserAccrual(user.clone()),
            LEDGER_THRESHOLD,
            LEDGER_BUMP,
        );

        env.events().publish(
            (symbol_short!("claim"), user),
            (pending, remaining_points),
        );

        Ok(pending)
    }

    pub fn set_points_per_amt(env: Env, points_per_amt: u64) -> Result<(), AccrualError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(AccrualError::NotInitialized)?;
        admin.require_auth();

        if points_per_amt == 0 {
            return Err(AccrualError::InvalidConfig);
        }

        let current_config: Config = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(AccrualError::NotInitialized)?;
        let old_val = current_config.points_per_amt;

        // Bound changes to at most 2x jump in either direction
        if points_per_amt > old_val.saturating_mul(2) || points_per_amt.saturating_mul(2) < old_val {
            return Err(AccrualError::InvalidConfig);
        }

        env.storage()
            .instance()
            .set(&DataKey::Config, &Config { points_per_amt });

        env.events().publish(
            (symbol_short!("cfg_upd"), admin),
            (old_val, points_per_amt),
        );

        Ok(())
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn config(env: Env) -> Result<Config, AccrualError> {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(AccrualError::NotInitialized)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, testutils::Events, testutils::Ledger, vec, Env, IntoVal, String};

    fn register_user(env: &Env, registry: &Address, user: &Address, name: &str) {
        let reg_client = automint_registry::RegistryContractClient::new(env, registry);
        let _ = reg_client.register(user, &String::from_str(env, name));
    }

    fn setup() -> (
        Env,
        Address,
        Address,
        Address,
        AccrualContractClient<'static>,
    ) {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        let id = env.register_contract(None, AccrualContract);
        let client = AccrualContractClient::new(&env, &id);
        let admin = Address::generate(&env);

        let registry_id = env.register_contract(None, automint_registry::RegistryContract);
        let reg_client = automint_registry::RegistryContractClient::new(&env, &registry_id);
        reg_client.initialize(&admin);

        let token_id = env.register_contract(None, automint_token::AMTToken);
        let token_client = automint_token::AMTTokenClient::new(&env, &token_id);
        token_client.initialize(
            &admin,
            &7u32,
            &String::from_str(&env, "AutoMint Token"),
            &String::from_str(&env, "AMT"),
        );

        client.initialize(&admin, &100_u64);
        (env, admin, registry_id, token_id, client)
    }

    #[test]
    fn test_initialize() {
        let (_env, _admin, _registry, _token, client) = setup();
        let config = client.config();
        assert_eq!(config.points_per_amt, 100);
    }

    #[test]
    fn test_double_initialize_fails() {
        let (_env, admin, _registry, _token, client) = setup();
        assert!(client.try_initialize(&admin, &100_u64).is_err());
    }

    #[test]
    fn test_initialize_zero_points_per_amt_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, AccrualContract);
        let client = AccrualContractClient::new(&env, &id);
        let admin = Address::generate(&env);
        assert!(client.try_initialize(&admin, &0_u64).is_err());
    }

    #[test]
    fn test_start_accrual() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        client.start_accrual(&user, &50_u64);
        assert_eq!(client.pending_points(&user), 0);
    }

    #[test]
    fn test_start_accrual_initializes_correctly() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        let start_ts = env.ledger().timestamp();

        let result = client.try_start_accrual(&user, &50_u64);
        assert!(result.is_ok());

        let state = client.get_accrual_state(&user).unwrap();
        assert_eq!(state.last_claim_ts, start_ts);
        assert_eq!(state.total_claimed_points, 0);
    }

    #[test]
    fn test_double_start_accrual_fails() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        client.start_accrual(&user, &50_u64);
        let result = client.try_start_accrual(&user, &50_u64);
        assert!(result.is_err());
    }

    #[test]
    fn test_pending_points_calculation() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        client.start_accrual(&user, &100_u64);

        env.ledger().with_mut(|ledger| {
            ledger.sequence_number = ledger.sequence_number + 100;
            ledger.timestamp = ledger.timestamp + 500;
        });

        let pending = client.pending_points(&user);
        assert!(pending > 0);
    }

    #[test]
    fn test_claim_resets_timestamp() {
        let (env, _admin, registry, token, client) = setup();
        let user = Address::generate(&env);
        register_user(&env, &registry, &user, "user1");
        // Use low rate so total_points < points_per_amt (no mint triggered)
        client.start_accrual(&user, &1_u64);

        env.ledger().with_mut(|ledger| {
            ledger.sequence_number = ledger.sequence_number + 10;
            ledger.timestamp = ledger.timestamp + 50;
        });

        let _pending = client.claim(&user, &token, &registry);
        assert_eq!(client.pending_points(&user), 0);
    }

    #[test]
    fn test_claim_below_threshold_mints_nothing() {
        let (env, _admin, registry, token, client) = setup();
        let user = Address::generate(&env);
        register_user(&env, &registry, &user, "user1");
        // rate=3600 means 1 point per second, so 50s = 50 points < 100 threshold
        client.start_accrual(&user, &3600_u64);

        env.ledger().with_mut(|ledger| {
            ledger.sequence_number = ledger.sequence_number + 10;
            ledger.timestamp = ledger.timestamp + 50;
        });

        let pending = client.claim(&user, &token, &registry);
        assert_eq!(pending, 50);
    }

    #[test]
    fn test_claim_accumulates_total_claimed() {
        let (env, _admin, registry, token, client) = setup();
        let user = Address::generate(&env);
        register_user(&env, &registry, &user, "user1");
        // rate=3600 means 1 point per second, stays below 100 threshold per claim
        client.start_accrual(&user, &3600_u64);

        env.ledger().with_mut(|ledger| {
            ledger.sequence_number = ledger.sequence_number + 10;
            ledger.timestamp = ledger.timestamp + 30;
        });

        let pending = client.claim(&user, &token, &registry);
        assert_eq!(pending, 30);

        env.ledger().with_mut(|ledger| {
            ledger.sequence_number = ledger.sequence_number + 10;
            ledger.timestamp = ledger.timestamp + 30;
        });

        let pending2 = client.claim(&user, &token, &registry);
        assert_eq!(pending2, 30);
    }

    #[test]
    fn test_claim_not_started_fails() {
        let (env, _admin, registry, token, client) = setup();
        let user = Address::generate(&env);
        assert!(client.try_claim(&user, &token, &registry).is_err());
    }

    #[test]
    fn test_pending_points_uses_hourly_rate() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        // rate=3600 pts/hr, elapsed=3600s → exactly 3600 points
        client.start_accrual(&user, &3600_u64);
        env.ledger().with_mut(|l| { l.timestamp += 3600; });
        assert_eq!(client.pending_points(&user), 3600);
    }

    #[test]
    fn test_accrual_state_read() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        client.start_accrual(&user, &100_u64);
        // pending_points returns 0 at t=0 (no elapsed)
        assert_eq!(client.pending_points(&user), 0);
    }

    #[test]
    fn test_get_accrual_state_returns_none_before_start() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);

        assert!(client.get_accrual_state(&user).is_none());
    }

    #[test]
    fn test_get_accrual_state_returns_started_state() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        client.start_accrual(&user, &100_u64);

        let state = client.get_accrual_state(&user).unwrap();
        assert_eq!(state.last_claim_ts, env.ledger().timestamp());
        assert_eq!(state.total_claimed_points, 0);
    }

    #[test]
    fn test_get_accrual_state_after_pending() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        client.start_accrual(&user, &3600_u64);

        // Advance time so pending_points > 0, but don't claim (avoids cross-contract auth)
        env.ledger().with_mut(|l| {
            l.timestamp += 7200;
        });

        let state = client.get_accrual_state(&user).unwrap();
        assert_eq!(state.total_claimed_points, 0);
        assert_eq!(state.last_claim_ts, env.ledger().timestamp() - 7200);
        assert_eq!(client.pending_points(&user), 7200);
    }

    #[test]
    fn test_get_accrual_state_multiple_users_independent() {
        let (env, _admin, _registry, _token, client) = setup();
        let u1 = Address::generate(&env);
        let u2 = Address::generate(&env);
        client.start_accrual(&u1, &100_u64);
        client.start_accrual(&u2, &200_u64);

        let s1 = client.get_accrual_state(&u1).unwrap();
        let s2 = client.get_accrual_state(&u2).unwrap();
        assert_eq!(s1.total_claimed_points, 0);
        assert_eq!(s2.total_claimed_points, 0);
        assert!(client.get_accrual_state(&Address::generate(&env)).is_none());
    }

    #[test]
    fn test_claim_with_zero_elapsed_returns_zero() {
        let (env, _admin, registry, token, client) = setup();
        let user = Address::generate(&env);
        register_user(&env, &registry, &user, "zeroelapsed");
        client.start_accrual(&user, &100_u64);
        let pending = client.claim(&user, &token, &registry);
        assert_eq!(pending, 0);
    }

    #[test]
    fn test_claim_after_claim_with_no_elapsed_returns_zero() {
        let (env, _admin, registry, token, client) = setup();
        let user = Address::generate(&env);
        register_user(&env, &registry, &user, "noelapsed");
        client.start_accrual(&user, &100_u64);

        env.ledger().with_mut(|l| {
            l.timestamp += 100;
        });
        let _ = client.claim(&user, &token, &registry);
        let pending2 = client.claim(&user, &token, &registry);
        assert_eq!(pending2, 0);
    }

    #[test]
    fn test_claim_unregistered_user_fails() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        assert!(client.try_claim(&user, &_token, &_registry).is_err());
    }

    #[test]
    fn test_start_accrual_with_zero_rate() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        client.start_accrual(&user, &0_u64);

        env.ledger().with_mut(|l| { l.timestamp += 3600; });
        assert_eq!(client.pending_points(&user), 0);
    }

    #[test]
    fn test_pending_points_not_started_fails() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        let result = client.try_pending_points(&user);
        assert!(result.is_err());
    }

    #[test]
    fn test_pending_points_zero_elapsed() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        client.start_accrual(&user, &100_u64);
        assert_eq!(client.pending_points(&user), 0);
    }

    #[test]
    fn test_pending_points_correct_calculation() {
        let (env, _admin, _registry, _token, client) = setup();
        let user = Address::generate(&env);
        client.start_accrual(&user, &3600_u64);

        env.ledger().with_mut(|l| { l.timestamp += 1800; });

        assert_eq!(client.pending_points(&user), 1800);
    }

    #[test]
    fn test_config_returns_correct_values() {
        let (_env, _admin, _registry, _token, client) = setup();
        let config = client.config();
        assert_eq!(config.points_per_amt, 100);
    }

    #[test]
    fn test_config_fails_before_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, AccrualContract);
        let client = AccrualContractClient::new(&env, &id);
        let result = client.try_config();
        assert!(result.is_err());
    }

    #[test]
    fn test_config_persists_across_calls() {
        let (_env, _admin, _registry, _token, client) = setup();
        let c1 = client.config();
        let c2 = client.config();
        assert_eq!(c1.points_per_amt, c2.points_per_amt);
    }

    // Issue #408 tests: compute_pending unification and overflow handling
    #[test]
    fn test_compute_pending_basic() {
        let (pending, total) = compute_pending(3600, 100, 20).unwrap();
        assert_eq!(pending, 100);
        assert_eq!(total, 120);

        let (pending_zero, total_zero) = compute_pending(0, 100, 50).unwrap();
        assert_eq!(pending_zero, 0);
        assert_eq!(total_zero, 50);
    }

    #[test]
    fn test_compute_pending_overflow_elapsed_mul_rate() {
        let res = compute_pending(u64::MAX, 2, 0);
        assert_eq!(res, Err(AccrualError::Overflow));
    }

    #[test]
    fn test_compute_pending_overflow_leftover_add() {
        let res = compute_pending(3600, 10, u64::MAX);
        assert_eq!(res, Err(AccrualError::Overflow));
    }

    #[test]
    fn test_pending_points_and_claim_equivalence_property() {
        let (env, _admin, registry, token, client) = setup();
        let user = Address::generate(&env);
        register_user(&env, &registry, &user, "equiv_user");
        let rate = 7200_u64; // 2 points per sec
        client.start_accrual(&user, &rate);

        for elapsed in [10_u64, 45, 120, 3600, 7200] {
            env.ledger().with_mut(|l| {
                l.timestamp += elapsed;
            });

            let expected_pending = client.pending_points(&user);
            let claimed_pending = client.claim(&user, &token, &registry);
            assert_eq!(expected_pending, claimed_pending);
        }
    }

    // Issue #409 tests: Clock skew / backward timestamp handling
    #[test]
    fn test_backwards_clock_does_not_lose_accrual_and_preserves_last_claim_ts() {
        let (env, _admin, registry, token, client) = setup();
        let user = Address::generate(&env);
        register_user(&env, &registry, &user, "skew_user");
        client.start_accrual(&user, &3600_u64); // 1 pt/sec

        let t0 = env.ledger().timestamp();

        // Advance ledger to t0 + 1000 and claim to establish last_claim_ts = t0 + 1000
        env.ledger().with_mut(|l| {
            l.timestamp = t0 + 1000;
        });
        let initial_claim = client.claim(&user, &token, &registry);
        assert_eq!(initial_claim, 1000);

        let state1 = client.get_accrual_state(&user).unwrap();
        assert_eq!(state1.last_claim_ts, t0 + 1000);

        // Backward clock jump to t0 + 500 (< last_claim_ts)
        env.ledger().with_mut(|l| {
            l.timestamp = t0 + 500;
        });

        // Claim during clock skew: should return 0 and not advance last_claim_ts
        let pending = client.claim(&user, &token, &registry);
        assert_eq!(pending, 0);

        // State last_claim_ts must NOT be set backwards; remains t0 + 1000
        let state2 = client.get_accrual_state(&user).unwrap();
        assert_eq!(state2.last_claim_ts, t0 + 1000);

        // Now ledger advances to t0 + 2000
        env.ledger().with_mut(|l| {
            l.timestamp = t0 + 2000;
        });

        // Full accrual from t0 + 1000 is preserved (1000 pts)
        let pending_after = client.claim(&user, &token, &registry);
        assert_eq!(pending_after, 1000);
    }

    #[test]
    fn test_backwards_clock_emits_event() {
        let (env, _admin, registry, token, client) = setup();
        let user = Address::generate(&env);
        register_user(&env, &registry, &user, "event_user");
        client.start_accrual(&user, &3600_u64);

        let t0 = env.ledger().timestamp();
        env.ledger().with_mut(|l| {
            l.timestamp = t0 + 100;
        });
        let _ = client.claim(&user, &token, &registry);

        // Now step backwards
        env.ledger().with_mut(|l| {
            l.timestamp = t0 + 50;
        });
        let _ = client.claim(&user, &token, &registry);

        let events = env.events().all();
        let has_skew_event = events.iter().any(|e| {
            e.1 == vec![&env, symbol_short!("clkskew").into_val(&env), user.clone().into_val(&env)]
        });
        assert!(has_skew_event);
    }

    // Issue #404 tests: points_per_amt setter with bounds checking & events
    #[test]
    fn test_set_points_per_amt_success() {
        let (env, admin, _registry, _token, client) = setup();
        // Initial is 100, update to 200 (2x jump is allowed)
        let res = client.try_set_points_per_amt(&200_u64);
        assert!(res.is_ok());

        assert_eq!(client.config().points_per_amt, 200);

        let events = env.events().all();
        let has_cfg_event = events.iter().any(|e| {
            e.1 == vec![&env, symbol_short!("cfg_upd").into_val(&env), admin.clone().into_val(&env)]
        });
        assert!(has_cfg_event);
    }

    #[test]
    fn test_set_points_per_amt_rejects_zero() {
        let (_env, _admin, _registry, _token, client) = setup();
        let res = client.try_set_points_per_amt(&0_u64);
        assert_eq!(res, Err(Ok(AccrualError::InvalidConfig)));
    }

    #[test]
    fn test_set_points_per_amt_rejects_excessive_jumps() {
        let (_env, _admin, _registry, _token, client) = setup();
        // Initial is 100: > 200 is excessive increase
        let res_high = client.try_set_points_per_amt(&201_u64);
        assert_eq!(res_high, Err(Ok(AccrualError::InvalidConfig)));

        // < 50 is excessive decrease (drop to less than half)
        let res_low = client.try_set_points_per_amt(&49_u64);
        assert_eq!(res_low, Err(Ok(AccrualError::InvalidConfig)));
    }
}
