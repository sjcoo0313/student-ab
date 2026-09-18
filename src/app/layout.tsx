import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: '스마트 출결 관리 시스템',
  description: '스마트 출결 관리 및 결석계·체험학습 실시간 알림 시스템',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '출결관리',
  },
};

export const viewport = {
  themeColor: '#ffcd6c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="출결관리" />
      </head>
      <body className="min-h-screen bg-[#fbfaf9] text-[#343433] font-sans antialiased selection:bg-[#ffcd6c] selection:text-[#121212]">
        <ServiceWorkerRegister />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
