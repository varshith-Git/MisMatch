/**
 * SignalingClient — typed WebSocket wrapper for the MisMatch signaling server.
 *
 * Usage:
 *   const client = new SignalingClient('wss://localhost:9443/ws');
 *   client.onMessage = (msg) => { ... };
 *   client.connect();
 *   client.send({ type: 'Skip' });
 *   client.close();
 */

export type SignalMessage =
    // Server → Client
    | { type: 'Waiting' }
    | { type: 'Paired'; you_are_offerer: boolean }
    | { type: 'Offer'; sdp: string }
    | { type: 'Answer'; sdp: string }
    | { type: 'IceCandidate'; candidate: string; sdp_mid: string; sdp_m_line_index: number }
    | { type: 'PeerLeft' }
    // Client → Server
    | { type: 'Skip' }
    | { type: 'Ready' }
    | { type: 'Report' };

// Only log in development — avoids JSON.stringify on large SDP objects in prod
const DEBUG = process.env.NODE_ENV === 'development';

const INITIAL_RETRY_DELAY_MS = 1_000;  // 1s
const MAX_RETRY_DELAY_MS = 30_000; // 30s cap
const MAX_RETRIES = 8;      // ~4 min total before giving up

type MessageHandler = (msg: SignalMessage) => void;

export class SignalingClient {
    private ws: WebSocket | null = null;
    private readonly url: string;
    private retryDelay = INITIAL_RETRY_DELAY_MS;
    private retryCount = 0;
    private retryTimer: ReturnType<typeof setTimeout> | null = null;
    private closed = false; // true when close() is called explicitly

    public onMessage: MessageHandler = () => { };
    public onOpen: () => void = () => { };
    public onClose: () => void = () => { };
    /** Called before each reconnect attempt with the attempt number and delay */
    public onReconnecting: (attempt: number, delayMs: number) => void = () => { };
    /** Called when all retries are exhausted */
    public onGiveUp: () => void = () => { };

    constructor(url: string) {
        this.url = url;
    }

    connect(): void {
        if (this.ws) this.ws.close();
        this.closed = false;

        const ws = new WebSocket(this.url);
        this.ws = ws;

        ws.onopen = () => {
            // Reset backoff on successful connection
            this.retryDelay = INITIAL_RETRY_DELAY_MS;
            this.retryCount = 0;
            if (DEBUG) console.log('[Signaling] Connected');
            this.onOpen();
        };

        ws.onmessage = (event: MessageEvent<string>) => {
            try {
                const msg = JSON.parse(event.data) as SignalMessage;
                if (DEBUG) console.log('[Signaling] ←', msg.type);
                this.onMessage(msg);
            } catch (e) {
                console.error('[Signaling] Failed to parse message:', event.data, e);
            }
        };

        ws.onclose = (event) => {
            if (DEBUG) console.log('[Signaling] Disconnected', event.code);

            // Normal explicit close — don't retry
            if (this.closed) {
                this.onClose();
                return;
            }

            // Abnormal close (network drop, Render cold-start, etc.) — retry
            if (this.retryCount < MAX_RETRIES) {
                this.retryCount++;
                this.onReconnecting(this.retryCount, this.retryDelay);
                if (DEBUG) console.log(`[Signaling] Retry ${this.retryCount}/${MAX_RETRIES} in ${this.retryDelay}ms`);

                this.retryTimer = setTimeout(() => {
                    this.connect();
                }, this.retryDelay);

                // Exponential backoff with jitter (±10%) to avoid thundering herd
                const jitter = this.retryDelay * 0.1 * (Math.random() * 2 - 1);
                this.retryDelay = Math.min(this.retryDelay * 2 + jitter, MAX_RETRY_DELAY_MS);
            } else {
                if (DEBUG) console.log('[Signaling] Max retries reached');
                this.onGiveUp();
                this.onClose();
            }
        };

        ws.onerror = () => {
            // onclose fires after onerror — backoff handled there
            if (DEBUG) console.error('[Signaling] WebSocket error');
        };
    }

    send(msg: SignalMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            const text = JSON.stringify(msg);
            if (DEBUG) console.log('[Signaling] →', msg.type);
            this.ws.send(text);
        } else {
            if (DEBUG) console.warn('[Signaling] Cannot send — not open');
        }
    }

    close(): void {
        this.closed = true;
        if (this.retryTimer !== null) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
        this.ws?.close();
        this.ws = null;
    }
}
