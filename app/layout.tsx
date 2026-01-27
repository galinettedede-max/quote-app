import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DEX Aggregator Performance Comparator',
  description: 'Compare performance metrics across DEX aggregators',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
