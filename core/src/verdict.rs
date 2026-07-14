use serde::{Deserialize, Serialize};

use crate::pools::PoolBalances;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Verdict {
    Exposed,
    Partial,
    Ready,
}

impl Verdict {
    pub fn from_balances(balances: &PoolBalances) -> Self {
        if balances.has_orchard_funds() {
            Self::Exposed
        } else if balances.is_empty() {
            Self::Ready
        } else {
            Self::Partial
        }
    }

    pub fn requires_migration(&self) -> bool {
        matches!(self, Self::Exposed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn orchard_funds_are_exposed() {
        let verdict = Verdict::from_balances(&PoolBalances::new(0, 0, 320_000_000));
        assert_eq!(verdict, Verdict::Exposed);
        assert!(verdict.requires_migration());
    }

    #[test]
    fn orchard_funds_are_exposed_even_alongside_other_pools() {
        let verdict = Verdict::from_balances(&PoolBalances::new(100, 200, 1));
        assert_eq!(verdict, Verdict::Exposed);
    }

    #[test]
    fn sapling_and_transparent_only_is_partial() {
        let verdict = Verdict::from_balances(&PoolBalances::new(100, 200, 0));
        assert_eq!(verdict, Verdict::Partial);
        assert!(!verdict.requires_migration());
    }

    #[test]
    fn empty_wallet_is_ready() {
        assert_eq!(
            Verdict::from_balances(&PoolBalances::default()),
            Verdict::Ready
        );
    }
}
