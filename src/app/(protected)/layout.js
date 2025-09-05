import Navigation from "@/components/layout/Navigation";
import SecureLayout from "@/components/layout/SecureLayout";
import Header from "@/components/layout/header";
import { NavigationProvider } from "@/components/layout/NavigationContext";
import { MediaFullViewContextProvider } from "@/components/layout/mediaFullViewContext";
import MediaFullViewer from "@/components/common/mediaFullViewer";
export const metadata = {
  title: "Online Chatting App",
  description: "A modern chat application built with Next.js",
};

export default function RootLayout({ children }) {
  return (

        <SecureLayout>
          {/* <SocketProvider> */}
          <MediaFullViewContextProvider>
            <NavigationProvider>
              <div className="flex flex-col h-screen">
                <Header />
                <main className="flex-1 overflow-hidden relative">
                <MediaFullViewer/>
                  {children}
                </main>
                <Navigation />
              </div>
            </NavigationProvider>
            {/* </SocketProvider> */}
          </MediaFullViewContextProvider>
        </SecureLayout>

  );
}
