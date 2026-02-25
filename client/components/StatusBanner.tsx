'use client';

type Status = 'idle' | 'waiting' | 'connected' | 'peer_left' | 'stopped';

const STATUS_CONFIG: Record<Status, { icon: string; text: string; cls: string }> = {
    idle: { icon: '⏳', text: 'Starting camera…', cls: 'status-idle' },
    waiting: { icon: '🔍', text: 'Finding a stranger…', cls: 'status-waiting' },
    connected: { icon: '🟢', text: 'Connected', cls: 'status-connected' },
    peer_left: { icon: '👋', text: 'Stranger disconnected', cls: 'status-peer-left' },
    stopped: { icon: '🔴', text: 'Session ended', cls: 'status-stopped' },
};

export default function StatusBanner({ status }: { status: Status }) {
    const { icon, text, cls } = STATUS_CONFIG[status];

    return (
        <div className={`status-banner ${cls}`}>
            <span className="status-icon">{icon}</span>
            <span className="status-text">{text}</span>
            {status === 'waiting' && <span className="status-pulse" />}
        </div>
    );
}
