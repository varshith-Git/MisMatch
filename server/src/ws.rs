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
    messages::SignalMessage,
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
    let (tx, mut rx) = mpsc::channel::<SignalMessage>(64);

    // Split the WebSocket into sender and receiver halves
    let (mut ws_tx, mut ws_rx) = socket.split();

    tracing::info!("Peer connected: {}", peer_id);

    // ── Outbound task: drain the mpsc channel → WebSocket ────────────────
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            match serde_json::to_string(&msg) {
                Ok(text) => {
                    if ws_tx.send(Message::Text(text.into())).await.is_err() {
                        break;
                    }
                }
                Err(e) => {
                    tracing::warn!("Failed to serialize message: {}", e);
                }
            }
        }
    });

    let handle = PeerHandle { id: peer_id, tx };

    // Notify client they are in the queue
    let _ = handle.tx.send(SignalMessage::Waiting).await;

    // Try to pair immediately
    attempt_pair(&state, handle.clone()).await;

    // ── Inbound loop: WebSocket → route messages ──────────────────────────
    while let Some(Ok(raw)) = ws_rx.next().await {
        let text = match raw {
            Message::Text(t) => t,
            Message::Close(_) => break,
            _ => continue,
        };

        let msg: SignalMessage = match serde_json::from_str(&text) {
            Ok(m) => m,
            Err(e) => {
                tracing::warn!("Failed to parse message from {}: {}", peer_id, e);
                continue;
            }
        };

        match msg {
            // ── Skip / Ready ─────────────────────────────────────────────
            SignalMessage::Skip | SignalMessage::Ready => {
                handle_skip(&state, &handle).await;
            }

            // ── Relay messages to partner ────────────────────────────────
            SignalMessage::Offer { .. }
            | SignalMessage::Answer { .. }
            | SignalMessage::IceCandidate { .. } => {
                relay_to_partner(&state, peer_id, msg).await;
            }

            // Ignore server-only messages sent by misbehaving clients
            _ => {}
        }
    }

    // ── Cleanup on disconnect ─────────────────────────────────────────────
    tracing::info!("Peer disconnected: {}", peer_id);
    cleanup(&state, &handle).await;
    send_task.abort();
}

/// Push `peer` into the matchmaking queue; if someone is already waiting,
/// pair them immediately.
async fn attempt_pair(state: &Arc<AppState>, peer: PeerHandle) {
    if let Some(partner) = state.try_pair(peer.clone()).await {
        // peer is the offerer, partner is the answerer
        let _ = peer.tx.send(SignalMessage::Paired { you_are_offerer: true }).await;
        let _ = partner.tx.send(SignalMessage::Paired { you_are_offerer: false }).await;

        tracing::info!("Paired {} ↔ {}", peer.id, partner.id);
    }
    // else: peer was added to the queue and will be notified when someone joins
}

/// Forward an SDP or ICE message to the peer's current partner.
async fn relay_to_partner(state: &Arc<AppState>, from: Uuid, msg: SignalMessage) {
    if let Some(session) = state.sessions.get(&from) {
        let _ = session.partner.tx.send(msg).await;
    }
}

/// Handle skip: end session, notify partner, re-queue both.
async fn handle_skip(state: &Arc<AppState>, peer: &PeerHandle) {
    if let Some(partner) = state.leave_session(peer.id) {
        // Tell partner their peer left
        let _ = partner.tx.send(SignalMessage::PeerLeft).await;

        // Re-queue the partner
        let _ = partner.tx.send(SignalMessage::Waiting).await;
        attempt_pair(state, partner).await;
    }

    // Re-queue self
    let _ = peer.tx.send(SignalMessage::Waiting).await;
    attempt_pair(state, peer.clone()).await;
}

/// Full cleanup on disconnect: remove from session + queue.
async fn cleanup(state: &Arc<AppState>, peer: &PeerHandle) {
    if let Some(partner) = state.leave_session(peer.id) {
        let _ = partner.tx.send(SignalMessage::PeerLeft).await;
        // Re-queue partner so they find a new match
        let _ = partner.tx.send(SignalMessage::Waiting).await;
        attempt_pair(state, partner).await;
    }
    state.leave_queue(peer.id).await;
}
