'use client';

import Link from 'next/link';
import '@/app/globals.css';

export default function PrivacyPolicyPage() {
    return (
        <main className="legal-root">
            <div className="legal-container">
                <div className="legal-header">
                    <Link href="/" className="back-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Home
                    </Link>
                    <h1 className="legal-title">Privacy Policy</h1>
                    <p className="legal-date">Last Updated: February 2026</p>
                </div>

                <div className="legal-content">
                    <h2>1. Information We Do Not Collect</h2>
                    <p>
                        MisMatch is designed to be an anonymous peer-to-peer communication platform. We do not require you to create an account, nor do we ask for your name, email address, phone number, or any other personally identifiable information (PII).
                    </p>

                    <h2>2. Information We Process Automatically</h2>
                    <p>
                        When you use MisMatch, standard web communication protocols apply. Your IP address may be temporarily exposed to:
                    </p>
                    <ul>
                        <li><strong>Our signaling server:</strong> Exclusively for the purpose of matching you with another peer. IP addresses are NOT logged or stored in any database. Connections are dropped immediately when your session ends.</li>
                        <li><strong>Other peers (WebRTC):</strong> Because video and audio are transmitted peer-to-peer (P2P), your IP address may be visible to the user you are matched with in order to establish the direct connection. This is a fundamental characteristic of WebRTC technology.</li>
                    </ul>

                    <h2>3. WebRTC and Encryption</h2>
                    <p>
                        All video and audio streams are transmitted directly between peers using WebRTC. This traffic is end-to-end encrypted (DTLS/SRTP). Our servers never see, intercept, or record your video or audio data.
                    </p>

                    <h2>4. Cookies and Local Storage</h2>
                    <p>
                        MisMatch does not use tracking cookies or third-party analytics. We may use temporary browser local storage purely to remember UI preferences (e.g., camera/microphone selections), which remain on your device.
                    </p>

                    <h2>5. GDPR and IT Act (India) Compliance</h2>
                    <p>
                        We process minimal data strictly necessary for providing the communication service (Legitimate Interest under GDPR Article 6(1)(f)). Because we do not persistently store any PII, requests for data deletion or access (Right to be Forgotten) cannot yield any user records, as none exist. We comply with the Information Technology Act, 2000 (India) regarding intermediary liability by taking down reported abusive IP patterns where technically feasible.
                    </p>

                    <h2>6. Contact</h2>
                    <p>
                        For privacy inquiries, please contact privacy@valori.systems.
                    </p>
                </div>
            </div>
        </main>
    );
}
