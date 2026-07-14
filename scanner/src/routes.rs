use std::sync::Arc;

use axum::Json;
use axum::Router;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use serde::Serialize;
use turnstile_core::{ScanError, ScanRequest, ScanResult, WalletScanner};

use crate::AppState;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/scan", post(scan))
        .with_state(state)
}

#[derive(Serialize)]
struct Health {
    status: &'static str,
    backend: &'static str,
}

async fn health(State(state): State<Arc<AppState>>) -> Json<Health> {
    Json(Health {
        status: "ok",
        backend: if state.scanner.is_configured() {
            "zingolib"
        } else {
            "unconfigured"
        },
    })
}

async fn scan(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ScanRequest>,
) -> Result<Json<ScanResult>, ScanFailure> {
    tracing::info!(birthday = request.birthday, "scan requested");
    let result = state.scanner.scan(&request)?;
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
            ScanError::DepthCapExceeded => StatusCode::PAYLOAD_TOO_LARGE,
            ScanError::NetworkUnavailable | ScanError::BackendUnavailable => {
                StatusCode::SERVICE_UNAVAILABLE
            }
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
