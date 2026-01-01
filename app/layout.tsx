import React from 'react';
import '../global.css';

export const metadata = {
  title: 'Ilham Ramadhan | Web Portfolio',
  description: 'Ilham Ramadhan\'s personal portfolio website showcasing projects, skills, and blog posts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}