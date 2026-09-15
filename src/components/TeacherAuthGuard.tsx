'use client';

import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, LogOut } from 'lucide-react';
import { getTeacherPin, setTeacherPin, isTeacherLoggedIn, setTeacherLoggedIn } from '@/lib/storage';

interface TeacherAuthGuardProps {
  children: React.ReactNode;
}

export default function TeacherAuthGuard({ children }: TeacherAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Change PIN state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  useEffect(() => {
    setIsAuthenticated(isTeacherLoggedIn());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getTeacherPin();
    if (pinInput.trim() === correctPin) {
      setTeacherLoggedIn(true);
      setIsAuthenticated(true);
      setErrorMsg('');
      setPinInput('');
    } else {
      setErrorMsg('비밀번호가 올바르지 않습니다. 다시 확인해주세요. (기본: 1234)');
      setPinInput('');
    }
  };

  const handleLogout = () => {
    setTeacherLoggedIn(false);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentCorrect = getTeacherPin();
    if (currentPinInput !== currentCorrect) {
      setChangeError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPinInput.length < 4) {
      setChangeError('새 비밀번호는 4자리 이상이어야 합니다.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setChangeError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setTeacherPin(newPinInput);
    setChangeSuccess(true);
    setChangeError('');
    setTimeout(() => {
      setIsChangePinOpen(false);
      setChangeSuccess(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    }, 1500);
  };

  // Not Authenticated -> Show PIN Input Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-[#fbfaf9] py-16 px-4 flex items-center justify-center">
        <div className="family-card max-w-sm w-full p-8 text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-[#fff8e8] text-[#d48f00] flex items-center justify-center mx-auto border border-[#ffcd6c]">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#121212] tracking-tight">
              교사 전용 모드
            </h2>
            <p className="text-xs text-[#7e7e7d] mt-1.5 leading-relaxed">
              교사 출결 관리 및 대시보드 접근을 위해 비밀번호(PIN)를 입력해주세요.
            </p>
            <span className="badge-pill badge-stone text-[10px] mt-2 font-mono">
              기본 비밀번호: 1234
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="비밀번호 입력 (4자리)"
                maxLength={20}
                autoFocus
                className="w-full text-center text-lg tracking-widest font-bold p-3 bg-[#ffffff] border border-[#e5d5c3] rounded-[10px] focus:outline-hidden focus:border-[#121212]"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e7e7d] hover:text-[#121212] p-1"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-[#fff0eb] text-[#ff3e00] text-xs font-semibold rounded-[8px] flex items-center justify-center space-x-1 animate-shake">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-dark-pill w-full py-3 text-sm"
            >
              <span>교사 모드 입장하기</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated -> Render Content with Header Security Controls
  return (
    <>
      {/* Top Security Bar */}
      <div className="bg-[#f2f0ed] border-b border-[#e5d5c3] px-4 py-1.5 text-xs text-[#474645]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00ca48]" />
            <span className="font-medium text-[11px]">교사 인증됨 (보안 세션 활성)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsChangePinOpen(true);
                setChangeError('');
                setChangeSuccess(false);
              }}
              className="btn-sand-pill text-[11px] py-1 px-2.5 border-none hover:bg-white"
            >
              <KeyRound className="w-3 h-3 text-[#7e7e7d]" />
              <span>비밀번호 변경</span>
            </button>
            <button
              onClick={handleLogout}
              className="btn-sand-pill text-[11px] py-1 px-2.5 border-none hover:bg-white text-[#ff3e00]"
            >
              <LogOut className="w-3 h-3" />
              <span>잠금 (로그아웃)</span>
            </button>
          </div>
        </div>
      </div>

      {children}

      {/* Change Password Modal */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 bg-[#121212]/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="family-card max-w-sm w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-[#d48f00]" />
                <h3 className="font-bold text-sm text-[#121212]">교사 비밀번호 변경</h3>
              </div>
              <button
                onClick={() => setIsChangePinOpen(false)}
                className="text-[#7e7e7d] hover:text-[#121212] text-sm p-1"
              >
                ✕
              </button>
            </div>

            {changeSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#e6fbf1] text-[#00ca48] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-[#121212]">비밀번호가 변경되었습니다!</h4>
                <p className="text-xs text-[#7e7e7d]">다음 로그인 시 새 비밀번호를 사용하세요.</p>
              </div>
            ) : (
              <form onSubmit={handleChangePin} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#474645] mb-1">현재 비밀번호</label>
                  <input
                    type="password"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    placeholder="현재 비밀번호 입력"
                    className="w-full p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] focus:outline-hidden focus:border-[#121212]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#474645] mb-1">새 비밀번호 (4자리 이상)</label>
                  <input
                    type="password"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="새 비밀번호 입력"
                    className="w-full p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] focus:outline-hidden focus:border-[#121212]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#474645] mb-1">새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="새 비밀번호 다시 입력"
                    className="w-full p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] focus:outline-hidden focus:border-[#121212]"
                    required
                  />
                </div>

                {changeError && (
                  <div className="p-2 bg-[#fff0eb] text-[#ff3e00] text-xs font-semibold rounded-[6px] flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{changeError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePinOpen(false)}
                    className="btn-sand-pill text-xs py-2 px-3"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="btn-dark-pill text-xs py-2 px-4"
                  >
                    비밀번호 저장
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
