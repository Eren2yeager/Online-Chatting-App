import './globals.css';
import AuthProvider from '@/components/providers/SessionProvider';
import SocketProvider from '@/components/providers/SocketProvider';

export const metadata = {
  title: 'Online Chatting App',
  description: 'A modern chat application built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className='bg-white'>
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
