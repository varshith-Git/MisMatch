use std::{collections::VecDeque, sync::Arc};

use dashmap::DashMap;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::messages::OutboundMsg;

// ── Per-connection TX handle ─────────────────────────────────────────────────

/// A lightweight, cloneable handle to a peer's outgoing message channel.
#[derive(Clone)]
pub struct PeerHandle {
    pub id: Uuid,
    pub tx: mpsc::Sender<OutboundMsg>,
}

// ── Waiting queue ────────────────────────────────────────────────────────────

/// O(1) insert, O(1) pop-front (FIFO), O(1) removal by UUID.
/// VecDeque gives us FIFO order; HashMap gives O(1) lookup for removal.
pub struct WaitingQueue {
    order: VecDeque<Uuid>,
    peers: std::collections::HashMap<Uuid, PeerHandle>,
}

impl WaitingQueue {
    pub fn new() -> Self {
        Self {
            order: VecDeque::new(),
            peers: std::collections::HashMap::new(),
        }
    }

    /// Add a peer to the back of the queue — O(1).
    pub fn push(&mut self, peer: PeerHandle) {
        self.order.push_back(peer.id);
        self.peers.insert(peer.id, peer);
    }

    /// Pop the oldest waiting peer — O(1).
    pub fn pop(&mut self) -> Option<PeerHandle> {
        while let Some(id) = self.order.pop_front() {
            if let Some(peer) = self.peers.remove(&id) {
                return Some(peer);
            }
            // peer was removed by leave_queue — skip stale id
        }
        None
    }

    /// Remove a specific peer by ID — O(1) HashMap removal.
    /// The stale ID in `order` is skipped lazily on next pop().
    pub fn remove(&mut self, id: Uuid) {
        self.peers.remove(&id);
        // stale `id` left in order — cleaned up lazily in pop()
    }

    pub fn is_empty(&self) -> bool {
        self.peers.is_empty()
    }
}

pub type SharedQueue = Arc<tokio::sync::Mutex<WaitingQueue>>;

// ── Active sessions ──────────────────────────────────────────────────────────

/// A matched pair: maps each peer's UUID to its partner's handle.
pub struct Session {
    pub partner: PeerHandle,
}

pub type Sessions = Arc<DashMap<Uuid, Session>>;

// ── App-wide state ───────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct AppState {
    pub waiting: SharedQueue,
    pub sessions: Sessions,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            waiting: Arc::new(tokio::sync::Mutex::new(WaitingQueue::new())),
            sessions: Arc::new(DashMap::new()),
        }
    }

    /// Try to pair the incoming peer with the first peer in the waiting queue.
    /// Returns `Some(partner_handle)` if pairing succeeded, `None` if the peer
    /// was added to the queue instead.
    pub async fn try_pair(&self, incoming: PeerHandle) -> Option<PeerHandle> {
        let mut queue = self.waiting.lock().await;

        if let Some(partner) = queue.pop() {
            // Don't pair a peer with itself (safety guard)
            if partner.id == incoming.id {
                queue.push(incoming);
                return None;
            }

            // Register the session in both directions — O(1) DashMap insert
            self.sessions.insert(incoming.id, Session { partner: partner.clone() });
            self.sessions.insert(partner.id, Session { partner: incoming.clone() });

            Some(partner)
        } else {
            queue.push(incoming);
            None
        }
    }

    /// Remove a peer from an active session and return the partner's handle.
    pub fn leave_session(&self, peer_id: Uuid) -> Option<PeerHandle> {
        if let Some((_, session)) = self.sessions.remove(&peer_id) {
            self.sessions.remove(&session.partner.id);
            Some(session.partner)
        } else {
            None
        }
    }

    /// Remove a peer from the waiting queue — O(1) HashMap removal.
    pub async fn leave_queue(&self, peer_id: Uuid) {
        let mut queue = self.waiting.lock().await;
        queue.remove(peer_id);
    }
}
