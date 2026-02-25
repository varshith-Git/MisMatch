'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('https://mismatch-cx4b.onrender.com/api/stats');
        if (res.ok) {
          const data = await res.json();
          setOnlineCount(data.online);
        }
      } catch (err) {
        // Silently fail if stats endpoint is down
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    if (agreed) router.push('/chat');
  };

  return (
    <main className="home-root">
      {/* Particle canvas via CSS animation — keep layout simple */}
      <div className="home-bg-glow" />

      <div className="home-content">
        {/* Logo / Brand */}
        <div className="logo-wrap">
          <span className="logo-icon">⚡</span>
          <h1 className="logo-text">MisMatch</h1>
        </div>

        <p className="tagline">
          Meet someone new.<br />
          <span className="tagline-accent">Instantly. Anonymously. Anywhere.</span>
        </p>

        {onlineCount !== null && (
          <div className="online-badge">
            <span className="online-dot" /> {onlineCount.toLocaleString()} online now
          </div>
        )}

        <div className="features">
          <div className="feature-pill">🎥 Video chat</div>
          <div className="feature-pill">🔀 Skip anytime</div>
          <div className="feature-pill">🔒 No account</div>
          <div className="feature-pill">⚡ P2P encrypted</div>
        </div>

        {/* Terms checkbox */}
        <label className="tc-label">
          <input
            id="tc-check"
            type="checkbox"
            className="tc-checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="tc-text">
            I am 18+ and agree to the{' '}
            <span className="tc-link">Terms of Service</span>
            {' '}— I will be respectful and will not share inappropriate content.
          </span>
        </label>

        <button
          id="btn-start"
          className={`start-btn ${!agreed ? 'disabled' : ''}`}
          onClick={handleStart}
          disabled={!agreed}
          title={!agreed ? 'Please agree to the terms to continue' : ''}
        >
          <span className="start-btn-inner">
            Start Chatting
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        <p className="disclaimer">
          By clicking Start you confirm you have read and agreed to the terms above.
        </p>
      </div>
    </main>
  );
}
