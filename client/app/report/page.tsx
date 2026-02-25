'use client';

import Link from 'next/link';
import '@/app/globals.css';
import { useState } from 'react';

export default function ReportPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app this would send the report to the backend.
        // For MisMatch, we simulate the submission.
        setTimeout(() => setSubmitted(true), 600);
    };

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
                    <h1 className="legal-title">Report Abuse</h1>
                    <p className="legal-date">Make MisMatch safer for everyone</p>
                </div>

                <div className="legal-content">
                    {!submitted ? (
                        <>
                            <p>
                                If you encountered a user violating our <Link href="/community-guidelines">Community Guidelines</Link>, please let us know. Because connections are anonymous and P2P, we rely on timestamp correlation to identify abusive nodes on the signaling server.
                            </p>

                            <form onSubmit={handleSubmit} className="report-form">
                                <label className="form-label">
                                    Date & Time of Incident (Your Local Time)
                                    <input type="datetime-local" className="form-input" required />
                                </label>

                                <label className="form-label">
                                    Type of Violation
                                    <select className="form-select" required>
                                        <option value="" disabled selected>Select an option...</option>
                                        <option value="nudity">Nudity or Explicit Content</option>
                                        <option value="harassment">Hate Speech or Harassment</option>
                                        <option value="violence">Violence or Gore</option>
                                        <option value="illegal">Illegal Activity</option>
                                        <option value="spam">Bot or Spam</option>
                                        <option value="other">Other</option>
                                    </select>
                                </label>

                                <label className="form-label">
                                    Additional Details (Optional)
                                    <textarea className="form-textarea" rows={4} placeholder="Any specific details that might help us identify the user..."></textarea>
                                </label>

                                <button type="submit" className="report-btn">Submit Report</button>
                            </form>
                        </>
                    ) : (
                        <div className="report-success">
                            <div className="success-icon">✓</div>
                            <h2>Report Submitted</h2>
                            <p>Thank you for helping keep MisMatch a safe and enjoyable platform. Our automated systems will correlate this timestamp with signaling disconnections to issue network bans.</p>
                            <Link href="/">
                                <button className="report-btn mt-4">Return Home</button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
