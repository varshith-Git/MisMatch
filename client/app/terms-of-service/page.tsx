'use client';

import Link from 'next/link';
import '@/app/globals.css';

export default function TermsOfServicePage() {
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
                    <h1 className="legal-title">Terms of Service</h1>
                    <p className="legal-date">Last Updated: February 2026</p>
                </div>

                <div className="legal-content">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using MisMatch ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not access or use the Service. You must be at least 18 years old to use MisMatch.
                    </p>

                    <h2>2. Description of Service</h2>
                    <p>
                        MisMatch is a platform that randomly pairs two human users for anonymous video and audio communication over a peer-to-peer WebRTC connection. We provide solely the matchmaking signaling; all media flows directly between users.
                    </p>

                    <h2>3. User Conduct</h2>
                    <p>
                        You agree to use the Service in a respectful and lawful manner. You strictly agree NOT to:
                    </p>
                    <ul>
                        <li>Broadcast obscenity, nudity, or sexually explicit content.</li>
                        <li>Harass, threaten, or abuse other users.</li>
                        <li>Engage in illegal activities, including but not limited to the distribution of illicit material.</li>
                        <li>Use automated scripts or bots to spam the matchmaking server.</li>
                    </ul>
                    <p>
                        Failure to comply with these rules will result in a permanent Network Ban. Please read our <Link href="/community-guidelines">Community Guidelines</Link> for more details.
                    </p>

                    <h2>4. Disclaimer of Warranties</h2>
                    <p>
                        The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. MisMatch, its creators, and Valori Systems disclaim all warranties, express or implied, including but not limited to, implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                    </p>

                    <h2>5. Limitation of Liability</h2>
                    <p>
                        To the fullest extent permitted by applicable law, in no event will MisMatch or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly. As a P2P service, we do not control the conduct of other users and you use the Service at your own risk.
                    </p>

                    <h2>6. Governing Law</h2>
                    <p>
                        These Terms shall be governed by the laws of India, without respect to its conflict of laws principles. Any claim or dispute between you and the Service shall be decided exclusively by a court of competent jurisdiction located in India.
                    </p>
                </div>
            </div>
        </main>
    );
}
