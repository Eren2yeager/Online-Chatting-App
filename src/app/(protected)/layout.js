import Navigation from "@/components/layout/Navigation";
import SecureLayout from "@/components/layout/SecureLayout";
import Header from "@/components/layout/header";
import { NavigationProvider } from "@/components/layout/NavigationContext";
import { MediaFullViewProvider } from "@/components/layout/mediaFullViewContext";
import { NotificationProvider } from "@/components/layout/NotificationContext";
import MediaFullViewer from "@/components/common/mediaFullViewer";
import NotificationPermission from "@/components/notifications/NotificationPermission";
import ServiceWorkerInit from "@/components/notifications/ServiceWorkerInit";
import NotificationTester from "@/components/notifications/NotificationTester";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <SecureLayout>
      <MediaFullViewProvider>
        <NotificationProvider>
          <NavigationProvider>
            <div className="flex flex-col h-screen">
              <div id="call-navbar-slot" className="flex-shrink-0" />
              <Header />
              <main className="flex-1 overflow-hidden relative">
                <MediaFullViewer />
                {children}
              </main>
              <Navigation />
            </div>
            {/* Notification Permission Prompt */}
            <NotificationPermission />
            {/* Service Worker Initialization */}
            <ServiceWorkerInit />
            {/* Notification Tester (Dev Only) */}
            {/* <NotificationTester /> */}
          </NavigationProvider>
        </NotificationProvider>
      </MediaFullViewProvider>
    </SecureLayout>
  );
}
