import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import "./globals.css";
import { APP_CONFIG } from "@/config/constants";
import { ClientInitializer } from "@/components/shared/ClientInitializer";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

const interSans = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_CONFIG.NAME,
  description: "Hệ thống quản lý tuyển sinh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${interSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ThemeProvider>
          <ClientInitializer />
          <AntdRegistry>
            {children}
          </AntdRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
