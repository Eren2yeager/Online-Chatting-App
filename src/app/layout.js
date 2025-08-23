import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/providers/SessionProvider';
import SocketProvider from '@/components/providers/SocketProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Online Chatting App',
  description: 'A modern chat application built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
