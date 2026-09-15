import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: '스마트 출결 관리 - 3학년 2반',
  description: '3학년 2반 스마트 출결 관리 및 결석계·체험학습 실시간 알림 시스템',
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
