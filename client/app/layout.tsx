import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MisMatch — Meet Strangers Instantly',
  description: 'Anonymous P2P video chat. Meet someone new, skip anytime. No account required.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
