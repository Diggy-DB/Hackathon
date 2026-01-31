import './globals.css';
import type { ReactNode } from 'react';
import Header from '../src/components/Header';

export const metadata = {
  title: 'StoryForge',
  description: 'Collaborative cinematic + anime storytelling.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-movie-bg text-white min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
