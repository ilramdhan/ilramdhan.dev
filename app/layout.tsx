import React from 'react';
import type { Metadata } from 'next';
import '../global.css'; // Assuming you have global css, otherwise this line can be removed or adjusted

export const metadata: Metadata = {
  title: 'DevPortfolio',
  description: 'Professional Portfolio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}