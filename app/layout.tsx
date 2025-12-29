import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agentic Video Automation',
  description:
    'Autonomous daily YouTube content generator with AI scriptwriting, voiceover, video synthesis, and publishing.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
