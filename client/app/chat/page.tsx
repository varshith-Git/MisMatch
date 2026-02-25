'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignalingClient } from '@/lib/signaling';
import { PeerConnection } from '@/lib/webrtc';
import VideoGrid from '@/components/VideoGrid';
import Controls from '@/components/Controls';
import StatusBanner from '@/components/StatusBanner';

// Change this to wss://your-server if deployed (with TLS reverse proxy)
const WS_URL = 'wss://mismatch-cx4b.onrender.com/ws';

type ChatStatus = 'idle' | 'waiting' | 'connected' | 'peer_left' | 'stopped';

export default function ChatPage() {
    const router = useRouter();

    const [status, setStatus] = useState<ChatStatus>('idle');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    // Refs so event handlers always see the latest state
    const sigRef = useRef<SignalingClient | null>(null);
    const pcRef = useRef<PeerConnection | null>(null);
    const isOffererRef = useRef(false);

    // ── Online Count ────────────────────────────────────────────────────────
    const [onlineCount, setOnlineCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('https://mismatch-cx4b.onrender.com/api/stats');
                if (res.ok) {
                    const data = await res.json();
                    setOnlineCount(data.online);
                }
            } catch (err) { }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 15000);
        return () => clearInterval(interval);
    }, []);

    // ── Get camera / mic ────────────────────────────────────────────────────
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setLocalStream(stream);
            })
            .catch((err) => {
                console.error('getUserMedia failed:', err);
                alert('Camera / microphone access is required. Please allow in your browser.');
            });

        return () => {
            localStream?.getTracks().forEach((t) => t.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Build a fresh PeerConnection and wire up handlers ───────────────────
    const buildPeerConnection = useCallback(
        (sig: SignalingClient, stream: MediaStream): PeerConnection => {
            const pc = new PeerConnection();
            pc.attachLocalStream(stream);

            pc.onRemoteStream = (rs) => {
                setRemoteStream(rs);
                setStatus('connected');
            };

            pc.onIceCandidate = (payload) => {
                sig.send({ type: 'IceCandidate', ...payload });
            };

            pc.onConnectionStateChange = (state) => {
                if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    setStatus('peer_left');
                    setRemoteStream(null);
                }
            };

            return pc;
        },
        []
    );

    // ── Connect to the signaling server ─────────────────────────────────────
    const connect = useCallback(
        (stream: MediaStream) => {
            // Clean up any previous connection
            sigRef.current?.close();
            pcRef.current?.close();
            setRemoteStream(null);

            const sig = new SignalingClient(WS_URL);
            sigRef.current = sig;

            sig.onMessage = async (msg) => {
                switch (msg.type) {
                    case 'Waiting':
                        setStatus('waiting');
                        break;

                    case 'Paired': {
                        isOffererRef.current = msg.you_are_offerer;
                        const pc = buildPeerConnection(sig, stream);
                        pcRef.current = pc;

                        if (msg.you_are_offerer) {
                            // Create offer immediately — no delay needed, PC is ready on construction
                            const sdp = await pc.createOffer();
                            sig.send({ type: 'Offer', sdp });
                        }
                        break;
                    }

                    case 'Offer': {
                        const pc = pcRef.current;
                        if (!pc) break;
                        const sdp = await pc.handleOffer(msg.sdp);
                        sig.send({ type: 'Answer', sdp });
                        break;
                    }

                    case 'Answer': {
                        await pcRef.current?.handleAnswer(msg.sdp);
                        break;
                    }

                    case 'IceCandidate': {
                        await pcRef.current?.addIceCandidate(msg);
                        break;
                    }

                    case 'PeerLeft':
                        setStatus('peer_left');
                        setRemoteStream(null);
                        pcRef.current?.close();
                        pcRef.current = null;
                        break;
                }
            };

            sig.connect();
        },
        [buildPeerConnection]
    );

    // Connect once the local stream is ready
    useEffect(() => {
        if (localStream) {
            connect(localStream);
        }
        return () => {
            sigRef.current?.close();
            pcRef.current?.close();
        };
    }, [localStream, connect]);

    // ── Controls ─────────────────────────────────────────────────────────────
    const handleNext = useCallback(() => {
        setStatus('waiting');
        setRemoteStream(null);
        pcRef.current?.close();
        pcRef.current = null;
        sigRef.current?.send({ type: 'Skip' });
    }, []);

    const handleReport = useCallback(() => {
        if (confirm("Are you sure you want to report this user and disconnect?")) {
            sigRef.current?.send({ type: 'Report' });
            handleNext();
        }
    }, [handleNext]);

    // ── Esc key → Next ────────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleNext();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleNext]);

    const handleStop = useCallback(() => {
        setStatus('stopped');
        sigRef.current?.close();
        pcRef.current?.close();
        localStream?.getTracks().forEach((t) => t.stop());
        router.push('/');
    }, [localStream, router]);

    return (
        <main className="chat-root">
            <div className="chat-header">
                <span className="chat-logo">⚡ MisMatch</span>
                <StatusBanner status={status} />
                <div className="chat-header-right">
                    {onlineCount !== null && (
                        <div className="chat-online-badge">
                            <span className="online-dot" /> {onlineCount.toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            <VideoGrid
                localStream={localStream}
                remoteStream={remoteStream}
                status={status}
                onReport={handleReport}
            />

            <Controls
                status={status}
                onNext={handleNext}
                onStop={handleStop}
            />
        </main>
    );
}
