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
  | { type: 'Ready' };

type MessageHandler = (msg: SignalMessage) => void;

export class SignalingClient {
  private ws: WebSocket | null = null;
  private readonly url: string;

  public onMessage: MessageHandler = () => {};
  public onOpen: () => void = () => {};
  public onClose: () => void = () => {};

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.ws) this.ws.close();

    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      console.log('[Signaling] Connected to server');
      this.onOpen();
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as SignalMessage;
        console.log('[Signaling] ←', msg.type, msg);
        this.onMessage(msg);
      } catch (e) {
        console.error('[Signaling] Failed to parse message:', event.data, e);
      }
    };

    ws.onclose = () => {
      console.log('[Signaling] Disconnected');
      this.onClose();
    };

    ws.onerror = (err) => {
      console.error('[Signaling] error', err);
    };
  }

  send(msg: SignalMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const text = JSON.stringify(msg);
      console.log('[Signaling] →', msg.type, msg);
      this.ws.send(text);
    } else {
      console.warn('[Signaling] Cannot send — WebSocket not open');
    }
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }
}
