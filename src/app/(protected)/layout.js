import Navigation from '@/components/layout/Navigation';
import SecureLayout from '@/components/layout/SecureLayout';
import Header from '@/components/layout/header';
import { NavigationProvider } from '@/components/layout/NavigationContext';
export const metadata = {
  title: 'Online Chatting App',
  description: 'A modern chat application built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className='bg-white'>
          <SecureLayout>
            {/* <SocketProvider> */}
              <NavigationProvider>
                <div className="flex flex-col h-screen">
                  <Header />
                  <main className="flex-1 overflow-hidden relative">
                    {children}
                  </main>
                  <Navigation />
                </div>
              </NavigationProvider>
            {/* </SocketProvider> */}
          </SecureLayout>
      </body>
    </html>
  );
}
