use std::{collections::VecDeque, sync::Arc};

use dashmap::DashMap;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::messages::SignalMessage;

// ── Per-connection TX handle ─────────────────────────────────────────────────

/// A lightweight, cloneable handle to a peer's outgoing message channel.
#[derive(Clone)]
pub struct PeerHandle {
    pub id: Uuid,
    pub tx: mpsc::Sender<SignalMessage>,
}

// ── Waiting queue ────────────────────────────────────────────────────────────

/// Peers waiting to be paired. Protected by a Mutex so only one
/// matchmaking pass runs at a time.
pub type WaitingQueue = Arc<tokio::sync::Mutex<VecDeque<PeerHandle>>>;

// ── Active sessions ──────────────────────────────────────────────────────────

/// A matched pair: maps each peer's UUID to its partner's handle.
/// We store both directions so either peer can look up its partner in O(1).
pub struct Session {
    pub partner: PeerHandle,
}

/// All live sessions. Key = this peer's UUID, Value = session data.
pub type Sessions = Arc<DashMap<Uuid, Session>>;

// ── App-wide state ───────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct AppState {
    pub waiting: WaitingQueue,
    pub sessions: Sessions,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            waiting: Arc::new(tokio::sync::Mutex::new(VecDeque::new())),
            sessions: Arc::new(DashMap::new()),
        }
    }

    /// Try to pair the incoming peer with the first peer in the waiting queue.
    /// Returns `Some(partner_handle)` if pairing succeeded, `None` if the peer
    /// was added to the queue instead.
    pub async fn try_pair(&self, incoming: PeerHandle) -> Option<PeerHandle> {
        let mut queue = self.waiting.lock().await;

        if let Some(partner) = queue.pop_front() {
            // Don't pair a peer with itself (shouldn't happen, but guard anyway)
            if partner.id == incoming.id {
                queue.push_back(incoming);
                return None;
            }

            // Register the session in both directions
            self.sessions.insert(
                incoming.id,
                Session {
                    partner: partner.clone(),
                },
            );
            self.sessions.insert(
                partner.id,
                Session {
                    partner: incoming.clone(),
                },
            );

            Some(partner)
        } else {
            queue.push_back(incoming);
            None
        }
    }

    /// Remove a peer from an active session and return the partner's handle
    /// so the caller can notify the partner.
    pub fn leave_session(&self, peer_id: Uuid) -> Option<PeerHandle> {
        if let Some((_, session)) = self.sessions.remove(&peer_id) {
            // Also remove the partner's session entry
            self.sessions.remove(&session.partner.id);
            Some(session.partner)
        } else {
            None
        }
    }

    /// Remove a peer from the waiting queue (used on disconnect before pairing).
    pub async fn leave_queue(&self, peer_id: Uuid) {
        let mut queue = self.waiting.lock().await;
        queue.retain(|p| p.id != peer_id);
    }
}
