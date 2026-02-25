'use client';

type Status = 'idle' | 'waiting' | 'connected' | 'peer_left' | 'stopped';

interface ControlsProps {
    status: Status;
    onNext: () => void;
    onStop: () => void;
}

export default function Controls({ status, onNext, onStop }: ControlsProps) {
    const isActive = status === 'waiting' || status === 'connected' || status === 'peer_left';

    return (
        <div className="controls">
            <div className="controls-row">
                <button
                    id="btn-next"
                    className="ctrl-btn ctrl-btn-next"
                    onClick={onNext}
                    disabled={!isActive}
                    title="Skip to next stranger (Esc)"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 4l10 8-10 8V4zM19 4v16" />
                    </svg>
                    Next
                </button>

                <button
                    id="btn-stop"
                    className="ctrl-btn ctrl-btn-stop"
                    onClick={onStop}
                    title="End session and go home"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                    Stop
                </button>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="esc-hint">
                <span className="esc-key">Esc</span>
                <span>to skip to next stranger</span>
            </div>
        </div>
    );
}
