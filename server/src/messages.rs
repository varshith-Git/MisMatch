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
    Paired { you_are_offerer: bool },

    /// Partner disconnected or skipped.
    PeerLeft,

    // ── Client → Server ────────────────────────────────────────────────────
    /// Client wants to skip to the next stranger.
    Skip,

    /// Client is ready and waiting for a pair.
    Ready,

    /// Client reports the current partner for abuse.
    Report,

    // ── Relay (Client → Server → Client) ──────────────────────────────────
    // These are parsed only to identify their type; the raw bytes are
    // forwarded directly to avoid a double alloc (parse + re-serialize).
    // Full parse still happens here for type-checking.
    Offer { sdp: String },
    Answer { sdp: String },
    IceCandidate {
        candidate: String,
        sdp_mid: String,
        sdp_m_line_index: u16,
    },
}

/// An outbound message from the server to a client.
/// Either a typed message that needs serialization, or a pre-serialized
/// raw JSON string forwarded directly from another peer (zero extra alloc).
#[derive(Debug, Clone)]
pub enum OutboundMsg {
    /// Server-originated message — serialized at send time.
    Typed(SignalMessage),
    /// Raw JSON from another peer — forwarded as-is, no re-serialization.
    Raw(String),
}
