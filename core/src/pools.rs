use serde::{Deserialize, Serialize};

pub const ZATOSHI_PER_ZEC: u64 = 100_000_000;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PoolBalances {
    pub transparent: u64,
    pub sapling: u64,
    pub orchard: u64,
}

impl PoolBalances {
    pub fn new(transparent: u64, sapling: u64, orchard: u64) -> Self {
        Self {
            transparent,
            sapling,
            orchard,
        }
    }

    pub fn total(&self) -> u64 {
        self.transparent + self.sapling + self.orchard
    }

    pub fn is_empty(&self) -> bool {
        self.total() == 0
    }

    pub fn has_orchard_funds(&self) -> bool {
        self.orchard > 0
    }
}

pub fn zatoshi_to_zec(zatoshi: u64) -> f64 {
    zatoshi as f64 / ZATOSHI_PER_ZEC as f64
}

pub fn format_zec(zatoshi: u64) -> String {
    format!("{:.8}", zatoshi_to_zec(zatoshi))
        .trim_end_matches('0')
        .trim_end_matches('.')
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn total_sums_every_pool() {
        let balances = PoolBalances::new(1, 2, 3);
        assert_eq!(balances.total(), 6);
    }

    #[test]
    fn empty_wallet_has_no_funds() {
        assert!(PoolBalances::default().is_empty());
    }

    #[test]
    fn orchard_dust_still_counts_as_exposure() {
        assert!(PoolBalances::new(0, 0, 1).has_orchard_funds());
    }

    #[test]
    fn zatoshi_converts_to_zec() {
        assert_eq!(zatoshi_to_zec(ZATOSHI_PER_ZEC), 1.0);
        assert_eq!(zatoshi_to_zec(50_000_000), 0.5);
    }

    #[test]
    fn format_trims_trailing_zeros_without_losing_precision() {
        assert_eq!(format_zec(320_000_000), "3.2");
        assert_eq!(format_zec(ZATOSHI_PER_ZEC), "1");
        assert_eq!(format_zec(1), "0.00000001");
        assert_eq!(format_zec(0), "0");
    }
}
