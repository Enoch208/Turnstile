use anyhow::Result;
use turnstile_core::scan::validate;
use turnstile_core::{ScanError, ScanRequest, ScanResult, WalletScanner};

pub struct ZingoScanner {
    lightwalletd_url: String,
    chain_tip: u64,
}

impl ZingoScanner {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            lightwalletd_url: std::env::var("LIGHTWALLETD_URL")
                .unwrap_or_else(|_| "https://zec.rocks:443".to_string()),
            chain_tip: 0,
        })
    }

    pub fn is_configured(&self) -> bool {
        self.chain_tip > 0
    }

    pub fn lightwalletd_url(&self) -> &str {
        &self.lightwalletd_url
    }
}

impl WalletScanner for ZingoScanner {
    fn scan(&self, request: &ScanRequest) -> Result<ScanResult, ScanError> {
        validate(request, self.chain_tip.max(request.birthday))?;

        if !self.is_configured() {
            return Err(ScanError::BackendUnavailable);
        }

        Err(ScanError::BackendUnavailable)
    }
}
