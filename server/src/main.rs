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

    // ── Plain TCP — localhost is a secure context in all modern browsers ──
    // getUserMedia works on http://localhost without HTTPS.
    // For production, put this behind Caddy/nginx with real TLS.
    let addr = "0.0.0.0:9443";
    tracing::info!("MisMatch signaling server → http://{}", addr);
    tracing::info!("WebSocket endpoint         → ws://{}/ws", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind port 9443");

    axum::serve(listener, app)
        .await
        .expect("Server failed");
}
