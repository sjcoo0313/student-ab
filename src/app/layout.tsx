import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: '횡성여자고등학교 스마트 결석신고서 알리미',
  description: '생리결석 및 질병결석 실시간 등교 알림 & 제출 추적 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#fbfaf9] text-[#343433] font-sans antialiased selection:bg-[#ffcd6c] selection:text-[#121212]">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
