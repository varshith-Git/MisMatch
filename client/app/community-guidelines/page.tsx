'use client';

import Link from 'next/link';
import '@/app/globals.css';

export default function CommunityGuidelinesPage() {
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
                    <h1 className="legal-title">Community Guidelines</h1>
                    <p className="legal-date">Last Updated: February 2026</p>
                </div>

                <div className="legal-content">
                    <h2>Our Philosophy</h2>
                    <p>
                        MisMatch was built to connect people. We want this to be a place to meet strangers, practice languages, and have fascinating temporary conversations. It is NOT a platform for abuse or illicit behavior.
                    </p>

                    <h2>The Zero-Tolerance Rules</h2>
                    <p>
                        If you violate any of the following rules, you will be permanently banned from the signaling server. We employ network-level blocking to prevent repeat offenders.
                    </p>

                    <h3>1. No Nudity or Sexually Explicit Content</h3>
                    <p>
                        MisMatch is strictly strictly non-sexual. Do not broadcast nudity, sexual acts, or sexually explicit material.
                    </p>

                    <h3>2. No Hate Speech or Harassment</h3>
                    <p>
                        We do not tolerate slurs, racism, homophobia, sexism, or targeted harassment of any kind. If a user asks you to stop, stop. If you don't like a conversation, click "Next". Do not engage in abuse.
                    </p>

                    <h3>3. No Violence or Gore</h3>
                    <p>
                        Do not display weapons, self-harm, animal abuse, or unnecessarily graphic violence.
                    </p>

                    <h3>4. No Illegal Activities</h3>
                    <p>
                        Any activity that violates local, state, national, or international law is strictly forbidden. This includes drug sales, solicitation, and distribution of illegal media.
                    </p>

                    <h2>How to Report</h2>
                    <p>
                        If you encounter a user violating these guidelines, please disconnect immediately and navigate to our <Link href="/report">Reporting Page</Link>. Include the exact time of the incident so we can correlate signaling server logs to issue a network ban.
                    </p>
                </div>
            </div>
        </main>
    );
}
