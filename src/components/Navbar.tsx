'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  Smartphone, 
  GraduationCap, 
  BarChart3, 
  Users, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Trash2,
  Lock,
  LogOut
} from 'lucide-react';
import { 
  getNotifications, 
  markNotificationsAsRead, 
  clearAllAbsenceData, 
  clearAllNotifications,
  wipeEntireDatabase, 
  loadSampleMockData, 
  resetMockData, 
  getMyStudent,
  subscribeToSyncEvents,
  isTeacherLoggedIn,
  setTeacherLoggedIn
} from '@/lib/storage';
import { playSubmitPingSound, playRemindSound } from '@/lib/sound';
import { checkAndRunAutomatedReminders } from '@/lib/reminders';
import { SystemNotification } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<SystemNotification | null>(null);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);

  useEffect(() => {
    setNotifications(getNotifications());
    setIsTeacher(isTeacherLoggedIn());

    // ⏰ 3차례 정기 자동 리마인드 (09:30, 12:30, 14:30) 20초 주기 자동 검사
    checkAndRunAutomatedReminders();
    const reminderInterval = setInterval(() => {
      checkAndRunAutomatedReminders();
    }, 20000);

    const unsubscribe = subscribeToSyncEvents((type, payload) => {
      setNotifications(getNotifications());
      if (type === 'TEACHER_AUTH_CHANGED' || type === 'RESET_ALL') {
        setIsTeacher(isTeacherLoggedIn());
      }

      if (type === 'NOTIFICATIONS_UPDATED' && Array.isArray(payload) && payload.length > 0) {
        const latest = payload[0] as SystemNotification;
        if (!latest.read) {
          const myStudent = getMyStudent();
          if (pathname === '/') {
            // 학생 모바일 화면에서는 본인의 알림만 토스트 표시 및 차임 사운드
            if (myStudent && (latest.studentNum === myStudent.studentNum || latest.studentName === myStudent.name)) {
              setToastMessage(latest);
              if (soundEnabled) {
                playRemindSound();
              }
            }
          } else {
            // 교사 화면에서는 전체 알림 및 효과음 재생
            setToastMessage(latest);
            if (soundEnabled) {
              if (latest.type === 'SUBMIT_PING') {
                playSubmitPingSound();
              } else if (latest.type === 'SCHEDULED_REMIND' || latest.type === 'REMIND_ALERT') {
                playRemindSound();
              }
            }
          }
        }
      }
    });

    return () => {
      clearInterval(reminderInterval);
      unsubscribe();
    };
  }, [soundEnabled, pathname]);

  const isStudentRoute = pathname === '/';
  const myStudent = getMyStudent();
  const visibleNotifications = isStudentRoute
    ? (myStudent 
        ? notifications.filter(n => n.studentNum === myStudent.studentNum && n.studentName === myStudent.name) 
        : [])
    : notifications;

  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  const handleOpenNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) {
      markNotificationsAsRead();
      setNotifications(getNotifications());
    }
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const handleClearAbsenceOnly = () => {
    clearAllAbsenceData();
    setIsResetModalOpen(false);
    alert('모든 결석 데이터와 알림이 깨끗하게 삭제되었습니다. (0건)');
    window.location.reload();
  };

  const handleWipeAll = () => {
    if (confirm('학생 명단과 모든 결석 기록을 완전히 삭제하시겠습니까?')) {
      wipeEntireDatabase();
      setIsResetModalOpen(false);
      alert('모든 데이터가 완전히 삭제되었습니다.');
      window.location.reload();
    }
  };

  const handleLoadSample = () => {
    loadSampleMockData();
    setIsResetModalOpen(false);
    alert('샘플 목업 데이터가 복원되었습니다.');
    window.location.reload();
  };

  const handleTeacherLogout = () => {
    if (confirm('교사 모드를 종료하고 학생 화면으로 전환하시겠습니까?')) {
      setTeacherLoggedIn(false);
      setIsTeacher(false);
      if (pathname !== '/') {
        window.location.href = '/';
      }
    }
  };

  // 학생이 접속했을 때는 교사 대시보드 / 출결 통계 / 명단·QR 관리를 완전히 숨김
  const navItems = isTeacher ? [
    { href: '/', label: '학생 모바일', icon: Smartphone, badge: null },
    { href: '/teacher', label: '교사 대시보드', icon: GraduationCap, badge: unreadCount > 0 ? unreadCount : null },
    { href: '/stats', label: '출결 통계', icon: BarChart3, badge: null },
    { href: '/manage', label: '명단·QR 관리', icon: Users, badge: null },
  ] : [];

  return (
    <>
      {/* Realtime Toast Banner - Storybook Spread Style */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 max-w-sm w-full bg-[#ffffff] text-[#343433] p-4 rounded-[10px] border shadow-lg animate-in fade-in slide-in-from-top-3 flex items-start space-x-3 ${
          toastMessage.type === 'SCHEDULED_REMIND' ? 'border-[#ff3e00]/50 ring-2 ring-[#ff3e00]/10' : 'border-[#e5d5c3]'
        }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            toastMessage.type === 'SCHEDULED_REMIND' 
              ? 'bg-[#fff0eb] text-[#ff3e00]' 
              : toastMessage.type === 'REMIND_ALERT'
              ? 'bg-[#fff8e8] text-[#d48f00]'
              : 'bg-[#e6fbf1] text-[#00ca48]'
          }`}>
            {toastMessage.type === 'SCHEDULED_REMIND' ? (
              <Clock className="w-5 h-5 animate-pulse" />
            ) : toastMessage.type === 'REMIND_ALERT' ? (
              <Bell className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`badge-pill text-[11px] font-semibold ${
                toastMessage.type === 'SCHEDULED_REMIND' 
                  ? 'badge-orange' 
                  : toastMessage.type === 'REMIND_ALERT'
                  ? 'badge-honey'
                  : 'badge-mint'
              }`}>
                {toastMessage.title}
              </span>
              <span className="text-[11px] text-[#7e7e7d]">방금 전</span>
            </div>
            <p className="text-xs text-[#343433] font-medium mt-1.5 leading-snug">{toastMessage.message}</p>
            {toastMessage.attachments && toastMessage.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {toastMessage.attachments.map((att, i) => (
                  <span key={i} className="text-[11px] bg-[#f2f0ed] text-[#474645] px-2 py-0.5 rounded-[6px] font-medium">
                    📎 {att}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-[#7e7e7d] hover:text-[#121212] text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[#fbfaf9] border-b border-[#f2f0ed]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            
            {/* Storybook Logo Mascot */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-[12px] bg-[#ffcd6c] text-[#121212] flex items-center justify-center text-lg font-bold shadow-xs group-hover:scale-105 transition-transform">
                  🌸
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-medium text-[#7e7e7d]">학급 출결 알리미</span>
                  </div>
                  <h1 className="text-base font-semibold text-[#121212] tracking-tight leading-tight">
                    스마트 출결 관리
                  </h1>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Only visible in teacher mode */}
            {isTeacher && navItems.length > 0 && (
              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-[32px] text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#f2f0ed] text-[#121212] font-semibold'
                          : 'text-[#7e7e7d] hover:text-[#121212] hover:bg-[#f6f4ef]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#ff3e00]' : 'text-[#7e7e7d]'}`} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-1 px-1.5 py-0.2 text-[10px] font-semibold bg-[#ff3e00] text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? '알림음 켜짐' : '알림음 음소거'}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  soundEnabled
                    ? 'border-[#e5d5c3] bg-[#ffffff] text-[#0086fc]'
                    : 'border-[#f2f0ed] bg-[#f2f0ed] text-[#7e7e7d]'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Notification Center */}
              <div className="relative">
                <button
                  onClick={handleOpenNotif}
                  className="p-2 rounded-full border border-[#e5d5c3] bg-[#ffffff] text-[#343433] hover:bg-[#f6f4ef] relative cursor-pointer"
                  title="알림 내역"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff3e00] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 sm:w-92 bg-[#ffffff] rounded-[10px] border border-[#e5d5c3] p-3 shadow-xl z-50 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-[#f2f0ed]">
                      <div className="flex items-center space-x-1.5">
                        <Bell className="w-3.5 h-3.5 text-[#ff3e00]" />
                        <span className="font-semibold text-xs text-[#121212]">실시간 알림</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-[#7e7e7d]">{visibleNotifications.length}건</span>
                        {visibleNotifications.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              clearAllNotifications();
                              setNotifications([]);
                            }}
                            className="text-[11px] text-[#e11d48] hover:text-[#be123c] hover:underline cursor-pointer flex items-center gap-0.5 ml-1 font-medium"
                            title="모든 알림 비우기"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>비우기</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-[#f2f0ed] mt-1">
                      {visibleNotifications.length === 0 ? (
                        <div className="py-6 text-center text-[#7e7e7d] text-xs">
                          {isStudentRoute ? '나에게 도착한 새로운 알림이 없습니다.' : '새로운 알림이 없습니다.'}
                        </div>
                      ) : (
                        visibleNotifications.map((n) => (
                          <div key={n.id} className="py-2.5 px-1 hover:bg-[#fbfaf9] transition-colors">
                            <p className="text-xs font-semibold text-[#121212]">{n.title}</p>
                            <p className="text-xs text-[#474645] mt-0.5 leading-snug">{n.message}</p>
                            <span className="text-[10px] text-[#7e7e7d] mt-1 block">
                              {new Date(n.timestamp).toLocaleTimeString('ko-KR')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Reset Button - Only visible in teacher mode */}
              {isTeacher && (
                <button
                  onClick={handleReset}
                  title="샘플 데이터 초기화"
                  className="btn-sand-pill text-xs py-1.5 px-3"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#7e7e7d]" />
                  <span className="hidden sm:inline text-xs">초기화</span>
                </button>
              )}

              {/* Teacher Mode Switch / Logout Button */}
              {isTeacher ? (
                <button
                  onClick={handleTeacherLogout}
                  title="교사 모드 종료 (학생 화면으로 전환)"
                  className="btn-sand-pill text-xs py-1.5 px-2.5 text-[#ff3e00] hover:bg-[#fff0eb] flex items-center gap-1 border border-[#ff3e00]/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">교사 종료</span>
                </button>
              ) : (
                <Link
                  href="/teacher"
                  title="교사 모드 전환 (비밀번호: 1234)"
                  className="btn-sand-pill text-xs py-1.5 px-2.5 text-[#7e7e7d] hover:text-[#121212] flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">교사 모드</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar - Only visible in teacher mode */}
        {isTeacher && navItems.length > 0 && (
          <div className="md:hidden flex items-center justify-around border-t border-[#f2f0ed] bg-[#fbfaf9] px-2 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center py-1 px-3 rounded-[32px] text-xs transition-colors ${
                    isActive
                      ? 'bg-[#f2f0ed] text-[#121212] font-semibold'
                      : 'text-[#7e7e7d]'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#ff3e00]' : 'text-[#7e7e7d]'}`} />
                  <span className="text-[10px]">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Data Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#121212]/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="family-card max-w-md w-full p-6 shadow-2xl animate-in fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#fff0eb] text-[#ff3e00] flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#121212]">데이터 초기화 (비우기)</h3>
                  <p className="text-[11px] text-[#7e7e7d]">원하시는 초기화 방식을 선택해주세요</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-[#7e7e7d] hover:text-[#121212] font-semibold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Option 1: Clean Absence Data Wipe (Recommended) */}
              <div className="p-4 rounded-[12px] border-2 border-[#121212] bg-[#ffffff] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="badge-pill badge-mint text-[10px] font-bold">
                    ✓ 추천 방식
                  </span>
                  <span className="text-[11px] text-[#7e7e7d]">깨끗한 0건 초기화</span>
                </div>
                <h4 className="text-sm font-bold text-[#121212]">
                  🧹 모든 결석 데이터 깨끗하게 비우기 (0건)
                </h4>
                <p className="text-[#474645] leading-relaxed">
                  등록된 모든 결석 내역, 등교 확인 상태, 알림을 <strong>완전히 삭제(0건)</strong>합니다.
                  <br />
                  <span className="text-[#0086fc] font-semibold">※ 학생 명렬표(20명)는 그대로 유지되어 바로 실제 출결을 등록할 수 있습니다.</span>
                </p>
                <button
                  type="button"
                  onClick={handleClearAbsenceOnly}
                  className="w-full mt-2 btn-dark-pill text-xs py-2.5 flex items-center justify-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>결석 데이터 0건으로 완전 비우기</span>
                </button>
              </div>

              {/* Option 2: Full Database Wipe */}
              <div className="p-3.5 rounded-[12px] border border-[#f2f0ed] bg-[#fcfbf9] space-y-1.5">
                <h4 className="font-bold text-[#121212]">
                  🗑️ 학생 명단까지 전체 초기화
                </h4>
                <p className="text-[11px] text-[#7e7e7d]">
                  결석 기록뿐 아니라 학생 명렬표까지 모두 깨끗하게 삭제합니다. (새로 엑셀 명단을 올릴 때 사용)
                </p>
                <button
                  type="button"
                  onClick={handleWipeAll}
                  className="w-full text-xs py-2 rounded-[8px] border border-[#ff3e00]/30 text-[#ff3e00] font-semibold hover:bg-[#fff0eb] transition-colors"
                >
                  학생 명단 포함 모든 데이터 완전 삭제
                </button>
              </div>

              {/* Option 3: Restore Demo Mock Data */}
              <div className="pt-2 flex items-center justify-between border-t border-[#f2f0ed] text-[11px]">
                <span className="text-[#7e7e7d]">기능 테스트를 다시 해보고 싶으신가요?</span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="font-semibold text-[#121212] underline hover:text-[#0086fc]"
                >
                  📦 시연용 샘플 데이터 채우기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
