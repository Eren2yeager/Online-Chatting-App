/**
 * Dynamic Web App Manifest generation
 * Provides PWA capabilities and improves mobile SEO
 */
export default function manifest() {
  return {
    name: "ChatApp - Real-Time Messaging Platform",
    short_name: "ChatApp",
    description: "Connect instantly with friends through secure real-time messaging and video calls",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8B5CF6",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    categories: ["social", "communication"],
    screenshots: [
      {
        src: "/screenshot-1.jpg",
        sizes: "1280x720",
        type: "image/jpeg"
      }
    ]
  };
}
