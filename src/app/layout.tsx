import type { Metadata } from "next";
import "./globals.css";
import { Ubuntu } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ReduxProvider from "@/Redux/Wrapper/ReduxProvider";
import { Wrapper } from "@/Components/Shared/Wrapper";
import { AuthWrapper } from "@/Components/Shared/AuthWrapper";
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "SyncUp - All Productivity Apps in One Place",
  description: "Created by Shafiqul Hasan Rasel",
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
