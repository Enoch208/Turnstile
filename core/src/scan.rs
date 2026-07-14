use serde::{Deserialize, Serialize};

use crate::pools::PoolBalances;
use crate::verdict::Verdict;

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanRequest {
    pub ufvk: String,
    pub birthday: u64,
}

impl std::fmt::Debug for ScanRequest {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ScanRequest")
            .field("ufvk", &"<redacted>")
            .field("birthday", &self.birthday)
            .finish()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub balances: PoolBalances,
    pub verdict: Verdict,
    pub scanned_to_height: u64,
}

impl ScanResult {
    pub fn new(balances: PoolBalances, scanned_to_height: u64) -> Self {
        Self {
            balances,
            verdict: Verdict::from_balances(&balances),
            scanned_to_height,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ScanError {
    #[error("the viewing key is not a valid unified full viewing key")]
    InvalidViewingKey,
    #[error("a spending key was supplied; Turnstile never accepts spending keys")]
    SpendingKeySupplied,
    #[error("birthday height {0} is above the current chain tip")]
    BirthdayAboveTip(u64),
    #[error("could not reach the Zcash network")]
    NetworkUnavailable,
    #[error("scan exceeded the configured depth cap")]
    DepthCapExceeded,
    #[error("the zingolib scan backend is not configured on this server")]
    BackendUnavailable,
}

pub trait WalletScanner {
    fn scan(&self, request: &ScanRequest) -> Result<ScanResult, ScanError>;
}

pub fn validate(request: &ScanRequest, chain_tip: u64) -> Result<(), ScanError> {
    let key = request.ufvk.trim();

    if key.starts_with("secret-extended-key") || key.starts_with("zxviews") {
        return Err(ScanError::SpendingKeySupplied);
    }

    if !key.starts_with("uview") && !key.starts_with("uviewtest") {
        return Err(ScanError::InvalidViewingKey);
    }

    if request.birthday > chain_tip {
        return Err(ScanError::BirthdayAboveTip(request.birthday));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request(ufvk: &str, birthday: u64) -> ScanRequest {
        ScanRequest {
            ufvk: ufvk.to_string(),
            birthday,
        }
    }

    #[test]
    fn a_unified_viewing_key_validates() {
        assert!(validate(&request("uview1abc", 3_000_000), 3_410_000).is_ok());
    }

    #[test]
    fn a_spending_key_is_rejected_by_name() {
        let err = validate(&request("secret-extended-key-main1abc", 1), 3_410_000).unwrap_err();
        assert!(matches!(err, ScanError::SpendingKeySupplied));
    }

    #[test]
    fn a_sapling_extended_spending_key_is_rejected() {
        let err = validate(&request("zxviews1abc", 1), 3_410_000).unwrap_err();
        assert!(matches!(err, ScanError::SpendingKeySupplied));
    }

    #[test]
    fn garbage_is_rejected() {
        let err = validate(&request("not-a-key", 1), 3_410_000).unwrap_err();
        assert!(matches!(err, ScanError::InvalidViewingKey));
    }

    #[test]
    fn a_birthday_past_the_tip_is_rejected() {
        let err = validate(&request("uview1abc", 9_999_999), 3_410_000).unwrap_err();
        assert!(matches!(err, ScanError::BirthdayAboveTip(9_999_999)));
    }

    #[test]
    fn debug_never_prints_the_viewing_key() {
        let printed = format!("{:?}", request("uview1supersecret", 3_000_000));
        assert!(!printed.contains("supersecret"));
        assert!(printed.contains("<redacted>"));
    }

    #[test]
    fn result_derives_its_verdict_from_the_balances() {
        let result = ScanResult::new(PoolBalances::new(0, 0, 320_000_000), 3_410_000);
        assert_eq!(result.verdict, Verdict::Exposed);
    }
}
