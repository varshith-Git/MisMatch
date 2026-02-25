'use client';

import { useEffect, useRef } from 'react';

type Status = 'idle' | 'waiting' | 'connected' | 'peer_left' | 'stopped';

interface VideoGridProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    status: Status;
    onReport: () => void;
}

export default function VideoGrid({ localStream, remoteStream, status, onReport }: VideoGridProps) {
    const localRef = useRef<HTMLVideoElement>(null);
    const remoteRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localRef.current && localStream) {
            localRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteRef.current) {
            remoteRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const isConnected = status === 'connected';

    return (
        <div className="video-grid">
            {/* Remote video — large / primary */}
            <div className={`video-tile video-remote ${isConnected ? 'connected' : 'waiting'}`}>
                <video
                    ref={remoteRef}
                    autoPlay
                    playsInline
                    className={`video-el ${!isConnected ? 'blurred' : ''}`}
                />
                {!isConnected && (
                    <div className="video-overlay">
                        {status === 'waiting' && (
                            <div className="overlay-content">
                                <div className="spinner" />
                                <p>Finding someone…</p>
                            </div>
                        )}
                        {status === 'peer_left' && (
                            <div className="overlay-content">
                                <span className="overlay-icon">👋</span>
                                <p>Stranger left</p>
                                <p className="overlay-sub">Click Next to meet someone new</p>
                            </div>
                        )}
                        {status === 'idle' && (
                            <div className="overlay-content">
                                <div className="spinner" />
                                <p>Starting camera…</p>
                            </div>
                        )}
                    </div>
                )}

                {isConnected && (
                    <button
                        className="report-flag-btn"
                        onClick={onReport}
                        title="Report this user"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                            <line x1="4" y1="22" x2="4" y2="15"></line>
                        </svg>
                        <span>Report</span>
                    </button>
                )}

                <span className="video-label video-label-remote">Stranger</span>
            </div>

            {/* Local video — equal half */}
            <div className="video-tile video-local">
                <video
                    ref={localRef}
                    autoPlay
                    playsInline
                    muted
                    className="video-el"
                />
                <span className="video-label video-label-local">You</span>
            </div>
        </div>
    );
}
