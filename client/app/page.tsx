'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomePage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [totalMatches, setTotalMatches] = useState<number | null>(null);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fallback to relative API path if deployed, or use the exact Render URL if specified previously
        const res = await fetch('https://mismatch-cx4b.onrender.com/api/stats');
        if (res.ok) {
          const data = await res.json();
          setOnlineCount(data.online);
          setTotalMatches(data.total_matches);
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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <main className="landing-root">
      <div className="home-bg-glow" />

      {/* ── Landing Navigation Header ─────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="logo-wrap">
          <span className="logo-icon">⚡</span>
          <h1 className="logo-text">MisMatch</h1>
        </div>

        <div className="nav-stats">
          {onlineCount !== null && (
            <div className="online-badge">
              <span className="online-dot" /> {onlineCount.toLocaleString()} online
            </div>
          )}
          {totalMatches !== null && totalMatches > 0 && (
            <div className="total-matches-badge">
              🎉 {totalMatches.toLocaleString()} matches
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text-col">
            <h2 className="hero-headline">
              Meet someone new.<br />
              <span className="hero-headline-accent">Instantly. Anonymously. Anywhere.</span>
            </h2>

            <p className="hero-subtext">
              Jump into a live video conversation in seconds. No accounts, no friction, just pure human connection encrypted end-to-end.
            </p>

            <div className="start-container">
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
                  <Link href="/terms-of-service" className="tc-link">Terms of Service</Link>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <div className="hero-visual-col">
            <div className="visual-card">
              <div className="visual-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="visual-body">
                <div className="mock-video placeholder-remote">
                  <div className="mock-avatar">👋</div>
                </div>
                <div className="mock-video placeholder-local">
                  <div className="mock-avatar">📸</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ──────────────────────────────────────────────── */}
      <section className="how-it-works-section">
        <h3 className="section-title">How It Works</h3>
        <p className="section-subtitle">Jump into a conversation in seconds. No friction, just connection.</p>

        <div className="hiw-grid">
          <div className="hiw-card">
            <div className="hiw-icon">📷</div>
            <h4>Camera Ready</h4>
            <p>Yes, you need a working camera and microphone. MisMatch is built for face-to-face human connection.</p>
          </div>
          <div className="hiw-card">
            <div className="hiw-icon">🎭</div>
            <h4>100% Anonymous</h4>
            <p>No accounts, no names, no profiles. What you share on camera is up to you. We do not track who you are.</p>
          </div>
          <div className="hiw-card">
            <div className="hiw-icon">🚀</div>
            <h4>Instant Start</h4>
            <p>Click "Start Chatting", grant browser permissions, and you are immediately placed in the matchmaking queue.</p>
          </div>
          <div className="hiw-card">
            <div className="hiw-icon">🔀</div>
            <h4>Skip Anytime</h4>
            <p>Not vibing? Just click "Next" or press the ESC key to instantly disconnect and seamlessly meet someone else.</p>
          </div>
        </div>
      </section>

      {/* ── Security & Safety Section ─────────────────────────────────────────── */}
      <section className="security-section">
        <div className="security-content">
          <h3 className="section-title">Built for Privacy & Safety</h3>

          <div className="security-features">
            <div className="security-feature">
              <h4>🔒 End-to-End Encrypted</h4>
              <p>
                All video and audio streams are routed directly peer-to-peer using WebRTC (DTLS/SRTP protocols).
                Our servers only facilitate the initial handshake—they <strong>never</strong> see, intercept, or record your media streams.
              </p>
            </div>

            <div className="security-feature">
              <h4>🚩 One-Click Reporting</h4>
              <p>
                We have a zero-tolerance policy for abuse. If you encounter nudity, harassment, or illegal content, click the
                Report flag directly on their video. This instantly drops the connection and logs their node for a potential network ban.
              </p>
            </div>

            <div className="security-feature">
              <h4>🛡️ Zero Data Retention</h4>
              <p>
                Because there are no accounts, there are no databases storing your personal identity. We retain no personally
                identifiable information (PII) after your session concludes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ───────────────────────────────────────────────────────── */}
      <section className="faq-section">
        <h3 className="section-title">Frequently Asked Questions</h3>

        <div className="faq-list">
          {[
            {
              q: "Is MisMatch really free?",
              a: "Yes, 100% free with no hidden tiers, ads, or premium subscriptions."
            },
            {
              q: "Can I use MisMatch on my phone?",
              a: "Absolutely. The site is fully responsive and WebRTC works great on iOS Safari and Android Chrome."
            },
            {
              q: "Who can see my IP address?",
              a: "Because video is peer-to-peer (P2P), your IP address is visible to the specific stranger you are currently connected to—this is how the internet routes the video directly between you. Our signaling server temporarily holds it to make the match, but discards it immediately when you leave."
            },
            {
              q: "What happens if someone violates the guidelines?",
              a: "Users who broadcast illicit material or engage in harassment will be permanently banned at the network level. Our one-click report button helps keep the community clean."
            }
          ].map((faq, i) => (
            <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`} onClick={() => toggleFaq(i)}>
              <div className="faq-question">
                <h4>{faq.q}</h4>
                <span className="faq-toggle">{openFaq === i ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-links">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <span className="footer-dot">•</span>
          <Link href="/terms-of-service">Terms of Service</Link>
          <span className="footer-dot">•</span>
          <Link href="/community-guidelines">Community Guidelines</Link>
          <span className="footer-dot">•</span>
          <Link href="/report">Report Abuse</Link>
        </div>
        <p className="footer-copy">© 2026 MisMatch / Valori Systems. All rights reserved.</p>
      </footer>
    </main>
  );
}
