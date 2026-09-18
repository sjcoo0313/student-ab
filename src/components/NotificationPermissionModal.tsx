'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  X, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { 
  isPushNotificationSupported, 
  getNotificationPermissionState, 
  subscribeToPush, 
  isCurrentDeviceSubscribed,
  unsubscribeFromPush
} from '@/lib/pushClient';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'STUDENT' | 'TEACHER';
  studentId?: string;
  studentName?: string;
}

export default function NotificationPermissionModal({
  isOpen,
  onClose,
  role,
  studentId,
  studentName,
}: NotificationPermissionModalProps) {
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // Detect standalone PWA mode
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
    setIsStandalone(isStandaloneMode);

    // Check notification permission
    const perm = getNotificationPermissionState();
    setPermissionState(perm);

    isCurrentDeviceSubscribed().then((subbed) => {
      setIsSubscribed(subbed);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const result = await subscribeToPush({
      role,
      studentId,
      studentName,
    });

    setIsLoading(false);

    if (result.success) {
      setIsSubscribed(true);
      setPermissionState('granted');
      setSuccessMsg('🎉 알림이 성공적으로 활성화되었습니다! 이제 어플이 꺼져 있어도 스마트폰으로 알림이 도착합니다.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2000);
    } else {
      setErrorMsg(result.error || '알림 권한 요청에 실패했습니다.');
    }
  };

  const handleDisablePush = async () => {
    setIsLoading(true);
    await unsubscribeFromPush();
    setIsSubscribed(false);
    setIsLoading(false);
    setSuccessMsg('알림 수신이 해제되었습니다.');
    setTimeout(() => setSuccessMsg(''), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121212]/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="family-card max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#fff8e8] text-[#d48f00] flex items-center justify-center border border-[#ffcd6c]">
              <BellRing className="w-4 h-4 text-[#d48f00]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#121212]">스마트폰 백그라운드 알림</h3>
              <p className="text-[11px] text-[#7e7e7d]">앱이 꺼져 있어도 잠금화면과 상단바로 전달</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7e7e7d] hover:text-[#121212] p-1 rounded-full hover:bg-[#f2f0ed] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="p-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between text-xs">
          <span className="font-semibold text-[#475569]">현재 알림 상태:</span>
          {isSubscribed ? (
            <span className="inline-flex items-center gap-1 text-[#16a34a] font-bold bg-[#dcfce7] px-2 py-0.5 rounded-full text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              알림 수신 활성화됨
            </span>
          ) : permissionState === 'denied' ? (
            <span className="inline-flex items-center gap-1 text-[#ef4444] font-bold bg-[#fee2e2] px-2 py-0.5 rounded-full text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" />
              알림 권한 차단됨
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#f59e0b] font-bold bg-[#fef3c7] px-2 py-0.5 rounded-full text-[11px]">
              <Bell className="w-3.5 h-3.5" />
              알림 미설정
            </span>
          )}
        </div>

        {/* Benefits List */}
        <div className="space-y-2 text-xs text-[#474645] bg-[#fbfaf9] p-3 rounded-[8px] border border-[#f0eee9]">
          <div className="font-bold text-[#121212] flex items-center gap-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#ff7900]" />
            <span>이런 알림을 놓치지 않고 받을 수 있어요:</span>
          </div>
          <ul className="space-y-1.5 pl-1 text-[11px] leading-relaxed text-[#555453]">
            {role === 'STUDENT' ? (
              <>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#059669] font-bold">✓</span>
                  <span><strong>3차례 정기 알림</strong>: 09:30 아침 조회 후, 12:30 점심, 14:30 종례 전 서류 챙기기 알림</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#059669] font-bold">✓</span>
                  <span><strong>담임선생님 1:1 핑</strong>: 선생님이 서류 챙김이나 제출을 독려할 때 즉각 수신</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#059669] font-bold">✓</span>
                  <span><strong>최종 승인 완료 알림</strong>: 결석계 처리가 완료되었을 때 축하 통보</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#059669] font-bold">✓</span>
                  <span><strong>실시간 제출 핑</strong>: 학생이 교실 제출함에 서류를 넣고 확인을 누르면 교사 스마트폰으로 즉시 알림</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#059669] font-bold">✓</span>
                  <span><strong>미이행 건 모니터링</strong>: 등교 확인 대기 및 장기 미제출 건 긴급 알림</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* iOS Safari Guide (if on iPhone and not installed to home screen) */}
        {isIos && !isStandalone && (
          <div className="p-3.5 rounded-[10px] bg-[#fffbeb] border border-[#fef3c7] text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#b45309]">
              <Smartphone className="w-4 h-4 text-[#d97706]" />
              <span>아이폰(iOS) 사용 필수 안내</span>
            </div>
            <p className="text-[11px] text-[#92400e] leading-relaxed">
              아이폰 사파리 보안 정책상, <strong>홈 화면에 앱을 추가</strong>해야만 화면이 꺼져도 알림을 받을 수 있습니다. (2스텝 완료)
            </p>
            <div className="bg-white/80 p-2.5 rounded-[6px] border border-[#fde68a] space-y-2 text-[11px] text-[#78350f]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#f59e0b] text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <span>사파리 화면 하단의 <strong>공유 버튼 <Share2 className="w-3 h-3 inline text-[#0086fc]" /></strong> 터치</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#f59e0b] text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <span>메뉴에서 <strong>[홈 화면에 추가 <PlusSquare className="w-3 h-3 inline text-[#16a34a]" />]</strong> 선택</span>
              </div>
              <p className="text-[10px] text-[#a16207] italic pl-7">
                ➔ 홈 화면에 생긴 아이콘으로 접속 후 아래 [알림 켜기]를 누르시면 완료됩니다!
              </p>
            </div>
          </div>
        )}

        {/* Success & Error Messages */}
        {successMsg && (
          <div className="p-2.5 bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-semibold rounded-[8px] flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-[#fff0eb] border border-[#ffcd6c] text-[#c2410c] text-xs font-semibold rounded-[8px] flex items-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#ea580c] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {!isSubscribed ? (
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={isLoading}
              className="btn-dark-pill w-full py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:bg-black transition-all"
            >
              <BellRing className="w-4 h-4 text-[#ffcd6c]" />
              <span>{isLoading ? '스마트폰 알림 설정 중...' : '스마트폰 잠금화면 알림 켜기 🔔'}</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="p-2.5 bg-[#f0fdf4] text-[#15803d] rounded-[8px] text-center font-bold text-xs flex items-center justify-center gap-1.5 border border-[#bbf7d0]">
                <Volume2 className="w-4 h-4" />
                <span>스마트폰 알림이 켜져 있습니다!</span>
              </div>
              <button
                type="button"
                onClick={handleDisablePush}
                disabled={isLoading}
                className="btn-sand-pill w-full py-2 text-[11px] text-[#7e7e7d] hover:text-[#ef4444] cursor-pointer"
              >
                <span>알림 끄기 (수신 해제)</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-[#7e7e7d] hover:text-[#121212] font-medium cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
