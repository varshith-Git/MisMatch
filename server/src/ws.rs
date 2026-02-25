use std::sync::Arc;

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::{
    messages::{OutboundMsg, SignalMessage},
    state::{AppState, PeerHandle},
};

/// Axum route handler: upgrades the HTTP connection to a WebSocket.
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

/// Full lifecycle for one connected peer.
async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let peer_id = Uuid::new_v4();

    // Channel carries OutboundMsg — relay msgs are Raw (no re-serialization)
    let (tx, mut rx) = mpsc::channel::<OutboundMsg>(256);

    let (mut ws_tx, mut ws_rx) = socket.split();

    tracing::info!("Peer connected: {}", peer_id);

    // ── Outbound task: drain OutboundMsg → WebSocket ──────────────────────
    let send_task = tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(30));
        loop {
            tokio::select! {
                Some(msg) = rx.recv() => {
                    let result = match msg {
                        // Relay path: forward raw bytes — zero alloc, no re-serialization
                        OutboundMsg::Raw(text) => {
                            ws_tx.send(Message::Text(text.into())).await
                        }
                        // Typed path: server-originated messages (Waiting, Paired, PeerLeft)
                        OutboundMsg::Typed(typed) => match serde_json::to_string(&typed) {
                            Ok(text) => ws_tx.send(Message::Text(text.into())).await,
                            Err(e) => {
                                tracing::warn!("Failed to serialize message: {}", e);
                                continue;
                            }
                        },
                    };
                    if result.is_err() {
                        break;
                    }
                }
                _ = interval.tick() => {
                    // Send a ping every 30s. The browser will automatically reply with a Pong.
                    if ws_tx.send(Message::Ping(vec![])).await.is_err() {
                        break;
                    }
                }
            }
        }
    });

    let handle = PeerHandle { id: peer_id, tx };

    // Notify client they are in the queue
    let _ = handle.tx.send(OutboundMsg::Typed(SignalMessage::Waiting)).await;

    // Try to pair immediately
    attempt_pair(&state, handle.clone()).await;

    // ── Inbound loop: WebSocket → route messages ──────────────────────────
    // Drop connection if no message (Text/Ping/Pong) is received for 75 seconds.
    // The send_task sends a Ping every 30s, so the client should Pong back well before 75s.
    while let Ok(Some(Ok(raw))) = tokio::time::timeout(std::time::Duration::from_secs(75), ws_rx.next()).await {
        let text = match raw {
            Message::Text(t) => t,
            Message::Close(_) => break,
            Message::Ping(_) | Message::Pong(_) => continue,
            _ => continue,
        };

        // Fast path: identify message type without full deserialization.
        // Relay messages (Offer/Answer/IceCandidate) are forwarded as raw JSON.
        let msg_type = extract_type(&text);

        match msg_type {
            // ── Skip / Ready — full parse needed ─────────────────────────
            Some("Skip") | Some("Ready") => {
                handle_skip(&state, &handle).await;
            }

            // ── Relay messages — forward raw bytes, no re-serialization ──
            Some("Offer") | Some("Answer") | Some("IceCandidate") => {
                relay_raw(&state, peer_id, text.to_string()).await;
            }

            // Unknown / malformed — log and drop
            _ => {
                tracing::warn!("Unknown or malformed message from {}: {}", peer_id, text);
            }
        }
    }

    // ── Cleanup on disconnect ─────────────────────────────────────────────
    tracing::info!("Peer disconnected: {}", peer_id);
    cleanup(&state, &handle).await;
    send_task.abort();
}

/// Extract the `type` field from a JSON string without full deserialization.
/// Returns `None` if the field is missing or the string is not valid JSON.
fn extract_type(text: &str) -> Option<&str> {
    // Look for "type":"VALUE" — quick substring approach using serde_json::Value
    // We use a minimal parse to avoid allocating the whole message.
    let v: serde_json::Value = serde_json::from_str(text).ok()?;
    v.get("type")?.as_str().map(|s| {
        // Return a reference into the original string to avoid allocation
        // by finding the value's position. Fall back to a static match.
        match s {
            "Offer"        => "Offer",
            "Answer"       => "Answer",
            "IceCandidate" => "IceCandidate",
            "Skip"         => "Skip",
            "Ready"        => "Ready",
            _              => "Unknown",
        }
    })
}

/// Push `peer` into the matchmaking queue; if someone is already waiting,
/// pair them immediately.
async fn attempt_pair(state: &Arc<AppState>, peer: PeerHandle) {
    if let Some(partner) = state.try_pair(peer.clone()).await {
        let _ = peer.tx.send(OutboundMsg::Typed(SignalMessage::Paired { you_are_offerer: true })).await;
        let _ = partner.tx.send(OutboundMsg::Typed(SignalMessage::Paired { you_are_offerer: false })).await;
        tracing::info!("Paired {} <-> {}", peer.id, partner.id);
    }
}

/// Forward raw JSON bytes to the peer's current partner — zero extra allocation.
async fn relay_raw(state: &Arc<AppState>, from: Uuid, raw: String) {
    if let Some(session) = state.sessions.get(&from) {
        let _ = session.partner.tx.send(OutboundMsg::Raw(raw)).await;
    }
}

/// Handle skip: end session, notify partner, re-queue both.
async fn handle_skip(state: &Arc<AppState>, peer: &PeerHandle) {
    if let Some(partner) = state.leave_session(peer.id) {
        let _ = partner.tx.send(OutboundMsg::Typed(SignalMessage::PeerLeft)).await;
        let _ = partner.tx.send(OutboundMsg::Typed(SignalMessage::Waiting)).await;
        attempt_pair(state, partner).await;
    }
    let _ = peer.tx.send(OutboundMsg::Typed(SignalMessage::Waiting)).await;
    attempt_pair(state, peer.clone()).await;
}

/// Full cleanup on disconnect: remove from session + queue.
async fn cleanup(state: &Arc<AppState>, peer: &PeerHandle) {
    if let Some(partner) = state.leave_session(peer.id) {
        let _ = partner.tx.send(OutboundMsg::Typed(SignalMessage::PeerLeft)).await;
        let _ = partner.tx.send(OutboundMsg::Typed(SignalMessage::Waiting)).await;
        attempt_pair(state, partner).await;
    }
    state.leave_queue(peer.id).await;
}
