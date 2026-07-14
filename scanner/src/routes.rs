use std::sync::Arc;

use axum::Json;
use axum::Router;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use serde::Serialize;
use turnstile_core::{ChainStatus, ScanError, ScanRequest, ScanResult, chain_status};

use crate::AppState;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/status", get(status))
        .route("/scan", post(scan))
        .with_state(state)
}

async fn status(State(state): State<Arc<AppState>>) -> Result<Json<ChainStatus>, ScanFailure> {
    let status = chain_status(state.backend.indexer_uri()).await?;
    Ok(Json(status))
}

#[derive(Serialize)]
struct Health {
    status: &'static str,
    indexer: String,
}

async fn health(State(state): State<Arc<AppState>>) -> Json<Health> {
    Json(Health {
        status: "ok",
        indexer: state.backend.indexer_uri().to_string(),
    })
}

async fn scan(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ScanRequest>,
) -> Result<Json<ScanResult>, ScanFailure> {
    tracing::info!(birthday = request.birthday, "scan requested");

    let result = state.backend.scan(&request).await?;

    tracing::info!(
        verdict = ?result.verdict,
        scanned_to_height = result.scanned_to_height,
        "scan complete"
    );

    Ok(Json(result))
}

struct ScanFailure(ScanError);

impl From<ScanError> for ScanFailure {
    fn from(error: ScanError) -> Self {
        Self(error)
    }
}

#[derive(Serialize)]
struct ErrorBody {
    error: String,
}

impl IntoResponse for ScanFailure {
    fn into_response(self) -> Response {
        let status = match self.0 {
            ScanError::InvalidViewingKey
            | ScanError::SpendingKeySupplied
            | ScanError::BirthdayAboveTip(_) => StatusCode::BAD_REQUEST,
            ScanError::NetworkUnavailable
            | ScanError::EphemeralStorageUnavailable
            | ScanError::BackendUnavailable => StatusCode::SERVICE_UNAVAILABLE,
        };

        tracing::warn!(status = %status, error = %self.0, "scan failed");

        (
            status,
            Json(ErrorBody {
                error: self.0.to_string(),
            }),
        )
            .into_response()
    }
}
