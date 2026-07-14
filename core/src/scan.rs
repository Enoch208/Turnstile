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
    #[error("birthday height {0} is not a valid block height")]
    BirthdayAboveTip(u64),
    #[error("could not reach the Zcash network")]
    NetworkUnavailable,
    #[error("could not create the ephemeral wallet directory")]
    EphemeralStorageUnavailable,
    #[error("the zingolib scan backend is not compiled into this build")]
    BackendUnavailable,
}

pub fn validate(request: &ScanRequest) -> Result<(), ScanError> {
    let key = request.ufvk.trim();

    if key.starts_with("secret-extended-key")
        || key.starts_with("zxviews")
        || key.starts_with("uskmain")
    {
        return Err(ScanError::SpendingKeySupplied);
    }

    if !key.starts_with("uview") {
        return Err(ScanError::InvalidViewingKey);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request(ufvk: &str) -> ScanRequest {
        ScanRequest {
            ufvk: ufvk.to_string(),
            birthday: 3_000_000,
        }
    }

    #[test]
    fn a_unified_viewing_key_validates() {
        assert!(validate(&request("uview1abc")).is_ok());
    }

    #[test]
    fn a_sapling_extended_spending_key_is_rejected() {
        let err = validate(&request("secret-extended-key-main1abc")).unwrap_err();
        assert!(matches!(err, ScanError::SpendingKeySupplied));
    }

    #[test]
    fn a_sapling_extended_viewing_key_is_rejected_as_a_spending_key_shape() {
        let err = validate(&request("zxviews1abc")).unwrap_err();
        assert!(matches!(err, ScanError::SpendingKeySupplied));
    }

    #[test]
    fn a_unified_spending_key_is_rejected() {
        let err = validate(&request("uskmain1abc")).unwrap_err();
        assert!(matches!(err, ScanError::SpendingKeySupplied));
    }

    #[test]
    fn garbage_is_rejected() {
        let err = validate(&request("not-a-key")).unwrap_err();
        assert!(matches!(err, ScanError::InvalidViewingKey));
    }

    #[test]
    fn debug_never_prints_the_viewing_key() {
        let printed = format!("{:?}", request("uview1supersecret"));
        assert!(!printed.contains("supersecret"));
        assert!(printed.contains("<redacted>"));
    }

    #[test]
    fn an_error_never_echoes_the_viewing_key_back() {
        let err = validate(&request("zxviews1supersecret")).unwrap_err();
        let rendered = format!("{err}");
        assert!(!rendered.contains("supersecret"));
    }

    #[test]
    fn result_derives_its_verdict_from_the_balances() {
        let result = ScanResult::new(PoolBalances::fully_visible(0, 0, 320_000_000), 3_410_000);
        assert_eq!(result.verdict, Verdict::Exposed);
    }

    #[test]
    fn a_result_from_an_orchard_blind_key_is_undetermined() {
        let result = ScanResult::new(PoolBalances::new(Some(0), Some(0), None), 3_410_000);
        assert_eq!(result.verdict, Verdict::Undetermined);
    }
}
