mod messages;
mod state;
mod ws;

use std::sync::Arc;

use axum::{routing::get, Router};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use state::AppState;
use ws::ws_handler;

#[tokio::main]
async fn main() {
    // ── Logging ───────────────────────────────────────────────────────────
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "mismatch_server=debug,tower_http=info".parse().unwrap()),
        )
        .init();

    // ── Shared app state ──────────────────────────────────────────────────
    let state = Arc::new(AppState::new());

    // ── CORS — allow Next.js dev server ───────────────────────────────────
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // ── Router ────────────────────────────────────────────────────────────
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/health", get(|| async { "OK" }))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // ── Plain TCP — Railway injects $PORT, default 9443 for local dev ────
    let port = std::env::var("PORT").unwrap_or_else(|_| "9443".to_string());
    let addr = format!("0.0.0.0:{port}");
    tracing::info!("MisMatch signaling server → http://{}", addr);
    tracing::info!("WebSocket endpoint         → ws://{}/ws", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind port");

    axum::serve(listener, app)
        .await
        .expect("Server failed");
}
