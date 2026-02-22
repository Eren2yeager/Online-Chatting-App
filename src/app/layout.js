import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { SocketProvider } from "@/lib/socket";
import { ToastProvider } from "@/components/layout/ToastContext";
import { NotificationProvider } from "@/components/layout/NotificationContext";
import { UnreadCountProvider } from "@/components/layout/UnreadCountContext";
import { CallProvider } from "@/contexts/CallContext";
import { CallWindow } from "@/components/call";
import {
  getWebsiteStructuredData,
  getOrganizationStructuredData,
} from "@/lib/seo/structuredData";

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "ChatApp - Real-Time Messaging & Video Chat Platform",
    template: "%s | ChatApp",
  },
  description:
    "Connect instantly with friends and family through ChatApp. Enjoy real-time messaging, video calls, group chats, media sharing, and secure communication. Free, fast, and easy to use.",
  keywords: [
    "chat app",
    "real-time messaging",
    "instant messaging",
    "group chat",
    "secure messaging",
    "online chat",
    "free chat app",
    "web chat",
    "messaging platform",
    "chat application",
    "communication app",
  ],
  authors: [{ name: "ChatApp Team" }],
  creator: "ChatApp",
  publisher: "ChatApp",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "ChatApp",
    title: "ChatApp - Real-Time Messaging & Video Chat Platform",
    description:
      "Connect instantly with friends and family through secure real-time messaging, video calls, and group chats.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ChatApp - Real-Time Messaging Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatApp - Real-Time Messaging & Video Chat Platform",
    description:
      "Connect instantly with friends and family through secure real-time messaging, video calls, and group chats.",
    images: ["/og-image.jpg"],
    creator: "@chatapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_CODE,
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChatApp",
  },
};

export const viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  const websiteData = getWebsiteStructuredData();
  const organizationData = getOrganizationStructuredData();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
      </head>
      <body className="bg-white" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <CallProvider>
                <NotificationProvider>
                  <UnreadCountProvider>
                    {children}
                    <CallWindow showInitiatorIfIdle={false} />
                  </UnreadCountProvider>
                </NotificationProvider>
              </CallProvider>
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
