use std::time::Duration;

use zingo_netutils::{GrpcIndexer, Indexer};

use crate::chain::ChainStatus;
use crate::scan::ScanError;

const TIP_TIMEOUT: Duration = Duration::from_secs(10);

pub async fn chain_tip(indexer_uri: &str) -> Result<u64, ScanError> {
    let uri = indexer_uri
        .parse::<http::Uri>()
        .map_err(|_| ScanError::NetworkUnavailable)?;

    let mut indexer = GrpcIndexer::new(uri)
        .await
        .map_err(|_| ScanError::NetworkUnavailable)?;

    let block = indexer
        .get_latest_block(TIP_TIMEOUT)
        .await
        .map_err(|_| ScanError::NetworkUnavailable)?;

    Ok(block.height)
}

pub async fn chain_status(indexer_uri: &str) -> Result<ChainStatus, ScanError> {
    Ok(ChainStatus::from_height(chain_tip(indexer_uri).await?))
}
