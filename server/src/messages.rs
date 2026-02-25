use serde::{Deserialize, Serialize};

/// All messages exchanged over the WebSocket signaling channel.
/// The `type` field is used as the discriminant tag.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SignalMessage {
    // ── Server → Client ────────────────────────────────────────────────────
    /// Sent immediately on connect: user is in the waiting queue.
    Waiting,

    /// Sent to both peers when a match is found.
    /// `you_are_offerer = true` means this peer must create the SDP Offer.
    Paired { you_are_offerer: bool },

    /// Relayed SDP offer (offerer → answerer, via server).
    Offer { sdp: String },

    /// Relayed SDP answer (answerer → offerer, via server).
    Answer { sdp: String },

    /// Relayed ICE candidate (either direction, via server).
    IceCandidate {
        candidate: String,
        sdp_mid: String,
        sdp_m_line_index: u16,
    },

    /// Partner disconnected or skipped.
    PeerLeft,

    // ── Client → Server ────────────────────────────────────────────────────
    /// Client wants to skip to the next stranger.
    Skip,

    /// Client is ready and waiting for a pair (sent on re-connect / after skip).
    Ready,
}
