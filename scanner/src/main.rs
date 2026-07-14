mod routes;
mod zingo;

use std::net::SocketAddr;
use std::sync::Arc;

use anyhow::Result;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use crate::zingo::ZingoScanner;

pub struct AppState {
    pub scanner: ZingoScanner,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "turnstile_scanner=info,tower_http=info".into()),
        )
        .init();

    let state = Arc::new(AppState {
        scanner: ZingoScanner::from_env()?,
    });

    let app = routes::router(state)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive());

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;

    tracing::info!(%addr, "turnstile scanner listening");
    axum::serve(listener, app).await?;

    Ok(())
}
