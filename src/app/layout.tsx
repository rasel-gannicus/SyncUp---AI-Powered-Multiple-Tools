import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Ubuntu } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ReduxProvider from "@/Redux/Wrapper/ReduxProvider";
import { Wrapper } from "@/Components/Shared/Wrapper";
import { AuthWrapper } from "@/Components/Shared/AuthWrapper";
import { Analytics } from "@vercel/analytics/react";
import { PWARegister } from "@/Components/Shared/PWARegister";

export const viewport: Viewport = {
  themeColor: "#212528",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "SyncUp - All Productivity Apps in One Place",
  description: "Organize, schedule, and prioritize your daily tasks with ease.",
  applicationName: "SyncUp",
  appleWebApp: {
    capable: true,
    title: "SyncUp",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ReduxProvider>
      <html lang="en">
        <body className={`${ubuntu.className} antialiased`}>
          <PWARegister />
          <AuthWrapper>
            <Wrapper> {children} </Wrapper>
          </AuthWrapper>
          <Toaster position="bottom-center" />
        </body>
      </html>
      <Analytics />
    </ReduxProvider>
  );
}

