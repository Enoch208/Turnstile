use pepper_sync::config::{SyncConfig, TransparentAddressDiscovery};
use zingolib::config::{ChainType, ClientConfig, WalletConfig};
use zingolib::lightclient::LightClient;
use zingolib::wallet::WalletSettings;

use crate::pools::PoolBalances;
use crate::scan::{ScanError, ScanRequest, ScanResult, validate};

pub struct ScanBackend {
    indexer_uri: String,
}

impl ScanBackend {
    pub fn new(indexer_uri: impl Into<String>) -> Self {
        Self {
            indexer_uri: indexer_uri.into(),
        }
    }

    pub fn from_env() -> Self {
        Self::new(
            std::env::var("LIGHTWALLETD_URL")
                .unwrap_or_else(|_| "https://zec.rocks:443".to_string()),
        )
    }

    pub fn indexer_uri(&self) -> &str {
        &self.indexer_uri
    }

    pub async fn scan(&self, request: &ScanRequest) -> Result<ScanResult, ScanError> {
        validate(request)?;

        let birthday = u32::try_from(request.birthday)
            .map_err(|_| ScanError::BirthdayAboveTip(request.birthday))?;

        let uri = self
            .indexer_uri
            .parse::<http::Uri>()
            .map_err(|_| ScanError::NetworkUnavailable)?;

        let wallet_dir = tempfile::tempdir().map_err(|_| ScanError::EphemeralStorageUnavailable)?;

        let settings = WalletSettings {
            sync_config: SyncConfig {
                transparent_address_discovery: TransparentAddressDiscovery::recovery(),
                ..SyncConfig::default()
            },
            ..WalletSettings::default()
        };

        let config = ClientConfig::builder()
            .set_chain_type(ChainType::Mainnet)
            .set_indexer_uri(uri)
            .set_wallet_dir(wallet_dir.path().to_path_buf())
            .set_wallet_config(WalletConfig::Ufvk {
                ufvk: request.ufvk.trim().to_string(),
                birthday,
                wallet_settings: settings,
            })
            .build();

        let outcome = run(config).await;

        drop(wallet_dir);

        outcome
    }
}

async fn run(config: ClientConfig) -> Result<ScanResult, ScanError> {
    let mut client = LightClient::new(config, true)
        .await
        .map_err(|_| ScanError::InvalidViewingKey)?;

    let sync = client
        .sync_and_await()
        .await
        .map_err(|_| ScanError::NetworkUnavailable)?;

    let balance = client
        .account_balance(zip32::AccountId::ZERO)
        .await
        .map_err(|_| ScanError::NetworkUnavailable)?;

    Ok(ScanResult::new(
        PoolBalances::new(
            balance.total_transparent_balance.map(|z| z.into_u64()),
            balance.total_sapling_balance.map(|z| z.into_u64()),
            balance.total_orchard_balance.map(|z| z.into_u64()),
        ),
        u32::from(sync.sync_end_height) as u64,
    ))
}
