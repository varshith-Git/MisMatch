# MisMatch ⚡

> Anonymous P2P random video chat — meet strangers instantly, skip anytime.

```
User A → WebSocket → Rust Signaling Server ← WebSocket ← User B
         (SDP/ICE relay only, no video on server)
                      ↓
         Browser A ══════════ P2P Video/Audio ══════════ Browser B
                     (DTLS/SRTP encrypted, direct)
```

## Stack

| Layer | Technology |
|---|---|
| Signaling server | Rust + Axum + WebSockets |
| Matchmaking queue | `DashMap` + `tokio::sync::Mutex` |
| TLS (dev) | `rcgen` self-signed |
| P2P video | Browser-native `RTCPeerConnection` |
| Frontend | Next.js 16 (App Router) + Vanilla CSS |
| STUN | `stun.l.google.com:19302` |

## Quick Start

### 1. Start the signaling server

```bash
cd server
cargo run
# → https://0.0.0.0:9443
# → A self-signed cert is auto-generated in certs/
```

> **First time only:** open https://localhost:9443/health in your browser and click "Accept risk / Proceed anyway" to trust the self-signed cert. This is required for the WebSocket to work.

### 2. Start the frontend

```bash
cd client
npm install
npm run dev
# → http://localhost:3000
```

### 3. Test

Open **two browser tabs** at `http://localhost:3000` → click **Start Chatting** in both.  
They will auto-pair and your webcams will connect P2P.

## Swap STUN/TURN

Edit `client/lib/webrtc.ts`:

```ts
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:your-server:3478' },
  {
    urls: 'turn:your-server:3478',
    username: 'user',
    credential: 'password',
  },
];
```

## Production Deployment

1. Replace self-signed cert with a real Let's Encrypt cert in `server/certs/`
2. Point `WS_URL` in `client/app/chat/page.tsx` to your server domain
3. Deploy Coturn for TURN relay (covers 100% of NAT scenarios)

## Project Structure

```
MisMatch/
├── server/               ← Rust signaling server
│   └── src/
│       ├── main.rs       ← Axum bootstrap, TLS, router
│       ├── state.rs      ← WaitingQueue + Sessions
│       ├── ws.rs         ← WebSocket handler + matchmaking
│       ├── messages.rs   ← SignalMessage enum
│       └── tls.rs        ← Self-signed cert generation
└── client/               ← Next.js frontend
    ├── app/
    │   ├── page.tsx      ← Landing page
    │   └── chat/page.tsx ← Chat orchestrator
    ├── components/
    │   ├── VideoGrid.tsx  ← Local + remote video
    │   ├── Controls.tsx   ← Next / Stop buttons
    │   └── StatusBanner   ← Connection status
    └── lib/
        ├── signaling.ts  ← WebSocket client
        └── webrtc.ts     ← RTCPeerConnection wrapper
```
