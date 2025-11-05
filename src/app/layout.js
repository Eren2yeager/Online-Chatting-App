import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { SocketProvider } from "@/lib/socket";
import Navigation from "@/components/layout/Navigation";
import SecureLayout from "@/components/layout/SecureLayout";
import Header from "@/components/layout/header";
import { NavigationProvider } from "@/components/layout/NavigationContext";
import { ToastProvider } from "@/components/layout/ToastContext";
import { NotificationProvider } from "@/components/layout/NotificationContext";
import { UnreadCountProvider } from "@/components/layout/UnreadCountContext";

export const metadata = {
  title: "ChatApp",
  description: "A modern chat application built with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <NotificationProvider>
                <UnreadCountProvider>
                  {children}
                </UnreadCountProvider>
              </NotificationProvider>
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
