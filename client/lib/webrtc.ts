/**
 * PeerConnection — RTCPeerConnection wrapper for MisMatch.
 *
 * The server tells us whether we are the "offerer" (you_are_offerer: true).
 * Offerer creates the SDP offer, answerer responds with an answer.
 * ICE candidates are exchanged in both directions via the signaling server.
 */

const ICE_SERVERS: RTCIceServer[] = [
    // Google's free public STUN server
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // To add your own TURN server, append:
    // {
    //   urls: 'turn:your-server:3478',
    //   username: 'user',
    //   credential: 'password',
    // },
];

export type IceCandidatePayload = {
    candidate: string;
    sdp_mid: string;
    sdp_m_line_index: number;
};

export class PeerConnection {
    private pc: RTCPeerConnection;

    public onRemoteStream: (stream: MediaStream) => void = () => { };
    public onIceCandidate: (payload: IceCandidatePayload) => void = () => { };
    public onConnectionStateChange: (state: RTCPeerConnectionState) => void = () => { };

    constructor() {
        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Remote track received → assemble into a MediaStream
        this.pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (stream) this.onRemoteStream(stream);
        };

        // ICE candidate ready → relay via signaling server
        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.onIceCandidate({
                    candidate: event.candidate.candidate,
                    sdp_mid: event.candidate.sdpMid ?? '',
                    sdp_m_line_index: event.candidate.sdpMLineIndex ?? 0,
                });
            }
        };

        this.pc.onconnectionstatechange = () => {
            this.onConnectionStateChange(this.pc.connectionState);
        };
    }

    /** Attach local media stream tracks to the peer connection. */
    attachLocalStream(stream: MediaStream): void {
        stream.getTracks().forEach((track) => {
            this.pc.addTrack(track, stream);
        });
    }

    /** Offerer: create and set local SDP offer. Returns offer SDP string. */
    async createOffer(): Promise<string> {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return offer.sdp!;
    }

    /** Answerer: receive the offer, create and send back an answer. */
    async handleOffer(sdp: string): Promise<string> {
        await this.pc.setRemoteDescription({ type: 'offer', sdp });
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer.sdp!;
    }

    /** Offerer: receive the answerer's SDP. */
    async handleAnswer(sdp: string): Promise<void> {
        await this.pc.setRemoteDescription({ type: 'answer', sdp });
    }

    /** Add an ICE candidate received from the signaling server. */
    async addIceCandidate(payload: IceCandidatePayload): Promise<void> {
        try {
            await this.pc.addIceCandidate({
                candidate: payload.candidate,
                sdpMid: payload.sdp_mid,
                sdpMLineIndex: payload.sdp_m_line_index,
            });
        } catch (e) {
            console.warn('[WebRTC] Failed to add ICE candidate:', e);
        }
    }

    /** Close and clean up the peer connection. */
    close(): void {
        this.pc.close();
    }
}
