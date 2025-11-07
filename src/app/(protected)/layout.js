import Navigation from "@/components/layout/Navigation";
import SecureLayout from "@/components/layout/SecureLayout";
import Header from "@/components/layout/header";
import { NavigationProvider } from "@/components/layout/NavigationContext";
import { MediaFullViewProvider } from "@/components/layout/mediaFullViewContext";
import MediaFullViewer from "@/components/common/mediaFullViewer";
import NotificationPermission from "@/components/layout/NotificationPermission";

export const metadata = {
  title: "ChatApp",
  description: "A modern chat application built with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <SecureLayout>
      <MediaFullViewProvider>
        <NavigationProvider>
          <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 overflow-hidden relative">
              <MediaFullViewer />
              {children}
            </main>
            <Navigation />
          </div>
          {/* Notification Permission Prompt */}
          <NotificationPermission />
        </NavigationProvider>
      </MediaFullViewProvider>
    </SecureLayout>
  );
}
