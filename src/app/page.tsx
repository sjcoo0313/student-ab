'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Bell, 
  CheckCircle2, 
  FileText, 
  Send, 
  AlertCircle, 
  AlertTriangle,
  Clock, 
  Smartphone, 
  Sparkles,
  ArrowRight,
  GraduationCap,
  RotateCcw,
  Edit3
} from 'lucide-react';
import { 
  getStudents, 
  getAbsenceRecords, 
  markAttended,
  markFormPickedUp, 
  markSubmitted,
  updateAbsenceRecordStatus,
  subscribeToSyncEvents,
  getMyStudent,
  setMyStudentId,
  saveMyStudentProfile,
  updateStudentPin,
  getStudentConsecutiveIllnessDays,
  recordStudentLogin
} from '@/lib/storage';
import { Student, AbsenceRecord, AttachmentProof } from '@/types';
import { Lock, LogOut, UserCheck, ShieldCheck, KeyRound } from 'lucide-react';
import { getCurrentTimeString, requestBrowserNotificationPermission } from '@/lib/reminders';
import Link from 'next/link';

export default function StudentMobilePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [myStudent, setMyStudent] = useState<Student | null>(null);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeString());

  // Student Self-Identification Form State (Default: 3학년 2반)
  const [authGrade, setAuthGrade] = useState(3);
  const [authClassNum, setAuthClassNum] = useState(2);
  const [authStudentNum, setAuthStudentNum] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPin, setAuthPin] = useState('1234');
  const [authError, setAuthError] = useState<string | null>(null);

  // Password Change Modal State
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changePinError, setChangePinError] = useState<string | null>(null);
  const [changePinSuccess, setChangePinSuccess] = useState(false);

  const [isAppInstallGuideOpen, setIsAppInstallGuideOpen] = useState(false);

  const loadData = () => {
    try {
      const stds = getStudents();
      setStudents(stds);
      setRecords(getAbsenceRecords());
      const curr = getMyStudent();
      setMyStudent(curr);
      if (curr) {
        recordStudentLogin(curr.id);
      }
      if (stds.length > 0 && !curr) {
        setAuthGrade(stds[0].grade);
        setAuthClassNum(stds[0].classNum);
      }
    } catch (e) {
      console.error('loadData error:', e);
    }
  };

  useEffect(() => {
    loadData();
    requestBrowserNotificationPermission();

    const clockTimer = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
    }, 15000);

    const unsubscribe = subscribeToSyncEvents(() => {
      loadData();
    });

    return () => {
      clearInterval(clockTimer);
      unsubscribe();
    };
  }, []);

  const handleStudentAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authStudentNum || !authName.trim()) {
      setAuthError('번호와 이름을 모두 입력해주세요.');
      return;
    }

    const num = Number(authStudentNum);
    const targetName = authName.trim().toLowerCase();

    const found = students.find(s => 
      s.grade === Number(authGrade) &&
      s.classNum === Number(authClassNum) &&
      s.studentNum === num &&
      s.name.trim().toLowerCase() === targetName
    );

    if (!found) {
      if (students.length === 0) {
        setAuthError('현재 등록된 학급 학생 명단이 없습니다. 담임선생님께서 명단을 등록한 후 로그인해주세요.');
        return;
      }
      setAuthError(`입력하신 정보(${authGrade}학년 ${authClassNum}반 ${num}번 ${authName})와 일치하는 학생이 없습니다. 번호와 성명을 다시 확인해주세요.`);
      return;
    }

    const correctPin = found.pin || '1234';
    if (authPin !== correctPin) {
      setAuthError('비밀번호가 일치하지 않습니다. (초기 비밀번호: 1234, 분실 시 담임선생님께 문의해주세요)');
      return;
    }

    // Success! Lock device to this student (Persistent single login with cookie & storage)
    saveMyStudentProfile(found);
    setMyStudent(found);
    setAuthError(null);
    recordStudentLogin(found.id);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00ca48', '#ffcd6c', '#0086fc']
    });
  };

  const handleLogout = () => {
    if (confirm('로그아웃하시겠습니까? 다시 로그인하려면 학생 정보와 비밀번호를 입력해야 합니다.')) {
      setMyStudentId(null);
      setMyStudent(null);
      setAuthStudentNum('');
      setAuthName('');
      setAuthPin('1234');
      setAuthError(null);
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError(null);

    if (!myStudent) return;

    const currentCorrect = myStudent.pin || '1234';
    if (oldPin !== currentCorrect) {
      setChangePinError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setChangePinError('새 비밀번호는 숫자 4자리로 입력해주세요.');
      return;
    }

    if (newPin !== confirmPin) {
      setChangePinError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    updateStudentPin(myStudent.id, newPin);
    setMyStudent({ ...myStudent, pin: newPin });
    setChangePinSuccess(true);

    setTimeout(() => {
      setIsChangePinOpen(false);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setChangePinSuccess(false);
    }, 1200);
  };

  // Only the current authenticated student's records are accessible (with fallback matching)
  const studentRecords = myStudent ? records.filter(r => 
    r.studentId === myStudent.id ||
    (Number(r.grade) === Number(myStudent.grade) && 
     Number(r.classNum) === Number(myStudent.classNum) && 
     (Number(r.studentNum) === Number(myStudent.studentNum) || r.studentName?.trim().toLowerCase() === myStudent.name?.trim().toLowerCase()))
  ) : [];

  // Only records that actually require paper document submission and are not yet approved
  const pendingDocRecords = studentRecords
    .filter(r => r.requiresDocument !== false && r.status !== 'APPROVED')
    .sort((a, b) => {
      // 1) Action required (non-submitted) before submitted
      const isSubA = a.status === 'SUBMITTED' ? 1 : 0;
      const isSubB = b.status === 'SUBMITTED' ? 1 : 0;
      if (isSubA !== isSubB) return isSubA - isSubB;
      // 2) Earlier dates first so older absences are handled first
      return a.startDate.localeCompare(b.startDate);
    });
  const myApprovedRecords = studentRecords.filter(r => r.status === 'APPROVED');

  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-[#fbfaf9] py-5 sm:py-8 px-3 sm:px-6">
      <div className="max-w-md mx-auto w-full space-y-4">

        {/* Storybook Hero Intro */}
        <div className="text-center pt-2 pb-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[16px] bg-[#ffcd6c] text-[#121212] text-xl mb-3 shadow-xs">
            🌸
          </div>
          <h2 className="text-2xl font-bold text-[#121212] tracking-tight">
            스마트 출결 관리
          </h2>
          <p className="text-xs text-[#7e7e7d] mt-1">
            출결 및 결석계·체험학습 온라인 알리미
          </p>
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setIsAppInstallGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f6f4ef] hover:bg-[#eae6dd] text-[#474645] text-xs font-semibold border border-[#e5d5c3] transition-colors cursor-pointer"
            >
              <span>📲</span>
              <span>스마트폰 홈 화면에 앱으로 추가하기</span>
            </button>
          </div>
        </div>

        {/* If Not Authenticated: Student Identification Required */}
        {!myStudent ? (
          <div className="family-card p-4 sm:p-6 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-[#f2f0ed]">
              <div className="w-9 h-9 rounded-full bg-[#fff0eb] text-[#ff3e00] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#121212]">학생 본인 확인</h3>
                <p className="text-[11px] text-[#7e7e7d]">개인정보 보호를 위해 본인의 정보를 입력해주세요</p>
              </div>
            </div>

            <form onSubmit={handleStudentAuth} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#474645] mb-1">학년</label>
                  <input
                    type="number"
                    value={authGrade}
                    onChange={(e) => setAuthGrade(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] font-bold text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#474645] mb-1">반</label>
                  <input
                    type="number"
                    value={authClassNum}
                    onChange={(e) => setAuthClassNum(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] font-bold text-center"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#474645] mb-1">출석 번호</label>
                <input
                  type="number"
                  value={authStudentNum}
                  onChange={(e) => setAuthStudentNum(e.target.value)}
                  placeholder="본인의 번호 입력 (예: 3)"
                  className="w-full text-xs p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#474645] mb-1">학생 성명</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="본인의 이름 입력 (예: 김민지)"
                  className="w-full text-xs p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] font-semibold"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-[#474645]">비밀번호 (4자리)</label>
                  <span className="text-[10px] text-[#7e7e7d]">초기 비밀번호: 1234</span>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  value={authPin}
                  onChange={(e) => setAuthPin(e.target.value)}
                  placeholder="비밀번호 4자리 (기본: 1234)"
                  className="w-full text-xs p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] font-semibold"
                  required
                />
              </div>

              {authError && (
                <div className="p-3 bg-[#fff0eb] text-[#ff3e00] text-xs rounded-[8px] border border-[#ff3e00]/20 font-medium">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full btn-dark-pill text-xs py-3 flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-[#ffcd6c]" />
                <span>로그인 및 내 결석계 열기</span>
              </button>

              <div className="p-3 bg-[#fcfbf9] rounded-[8px] border border-[#f2f0ed] text-[11px] text-[#7e7e7d] leading-relaxed">
                🔒 <strong>1회 로그인 후 계속 사용 안내:</strong>
                <br />
                스마트폰/태블릿에서 1회만 로그인하면 매번 다시 로그인할 필요 없이 앱을 즉시 사용하실 수 있습니다. 초기 비밀번호는 <strong>1234</strong>이며 로그인 후 변경 가능합니다.
              </div>
            </form>
          </div>
        ) : (
          /* Authenticated: Strictly Single Student Private Banner */
          <>
            <div className="family-card p-4 sm:p-4.5 shadow-xs transition-all">
              {/* Top Profile Header */}
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-[12px] bg-[#121212] text-white flex flex-col items-center justify-center shrink-0 shadow-xs border border-[#121212]">
                    <span className="text-[9px] tracking-wider text-[#e5d5c3] font-bold leading-none">NO.</span>
                    <span className="text-sm font-extrabold leading-none mt-0.5">{myStudent.studentNum}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-base text-[#121212] tracking-tight truncate">
                        {myStudent.grade}학년 {myStudent.classNum}반 {myStudent.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6fbf1] text-[#008730] border border-[#00ca48]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00ca48] animate-pulse" />
                        로그인됨
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7e7e7d] mt-0.5 truncate">
                      {myStudent.name} 학생 전용 결석계 및 알림함
                    </p>
                  </div>
                </div>
              </div>

              {/* Responsive Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-[#f2f0ed]">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePinOpen(true);
                    setOldPin('');
                    setNewPin('');
                    setConfirmPin('');
                    setChangePinError(null);
                    setChangePinSuccess(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[8px] border border-[#e5d5c3] bg-[#fcfbf9] hover:bg-[#f2f0ed] text-[#474645] hover:text-[#121212] text-xs font-semibold transition-all active:scale-[0.98]"
                  title="내 비밀번호 변경"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#d48f00] shrink-0" />
                  <span className="truncate">비밀번호 변경</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[8px] border border-[#fed7d7] bg-[#fff5f5] hover:bg-[#ffe3e3] text-[#c53030] text-xs font-semibold transition-all active:scale-[0.98]"
                  title="로그아웃하고 다른 학생으로 변경"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#e53e3e] shrink-0" />
                  <span className="truncate">로그아웃</span>
                </button>
              </div>
            </div>

            {/* Dynamic Action Area for Authenticated Student */}
            {/* Dynamic Action Area for Authenticated Student */}
            {pendingDocRecords.length === 0 ? (
              <div className="family-card text-center py-10">
                <div className="w-12 h-12 rounded-full bg-[#e6fbf1] text-[#00ca48] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#121212]">제출할 결석신고서가 없습니다</h3>
                <p className="text-xs text-[#7e7e7d] mt-1">
                  현재 {myStudent.name} 학생은 미제출된 결석계가 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Multiple Unfulfilled Items Alert Summary Banner */}
                {pendingDocRecords.length > 1 && (
                  <div className="bg-[#fff0eb] border-2 border-[#ff3e00]/50 rounded-[12px] p-4 space-y-3 shadow-xs animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-[#ff3e00]" />
                        <span className="font-bold text-sm text-[#ff3e00]">
                          미이행 결석계가 총 {pendingDocRecords.length}건 있습니다!
                        </span>
                      </div>
                      <span className="badge-pill badge-orange text-[10px] font-bold">
                        모두 제출 필요
                      </span>
                    </div>
                    <p className="text-xs text-[#474645] leading-relaxed">
                      아래 <strong>{pendingDocRecords.length}건의 출결</strong> 모두 각각 서류를 챙겨 담임선생님께 제출해야 합니다. 각 카드의 단계를 확인하고 서류 챙김 및 제출을 진행해주세요.
                    </p>

                    <div className="space-y-1.5 pt-0.5">
                      {pendingDocRecords.map((r, idx) => (
                        <a
                          key={r.id}
                          href={`#action-card-${r.id}`}
                          className="p-2.5 rounded-[8px] bg-white border border-[#fecaca] hover:border-[#ff3e00] flex items-center justify-between text-xs transition-colors block cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-[#ff3e00] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-[#121212] shrink-0">{r.startDate}</span>
                            <span className="text-[#474645] truncate font-medium">({r.daysCount}일) {r.typeName}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ml-2 ${
                            r.status === 'ATTENDED_NOTIFIED' ? 'bg-[#fef3c7] text-[#b45309]' :
                            r.status === 'FORM_PICKED_UP' ? 'bg-[#e0f2fe] text-[#0284c7]' :
                            r.status === 'SUBMITTED' ? 'bg-[#dcfce7] text-[#15803d]' :
                            'bg-[#f1f5f9] text-[#64748b]'
                          }`}>
                            {r.status === 'ATTENDED_NOTIFIED' ? '2단계 서류 미수령' :
                             r.status === 'FORM_PICKED_UP' ? '3단계 작성 중' :
                             r.status === 'SUBMITTED' ? '4단계 제출 완료' :
                             '1단계 등교 대기'}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render each unfulfilled card */}
                {pendingDocRecords.map((rec, idx) => (
                  <StudentActionCard
                    key={rec.id}
                    record={rec}
                    student={myStudent}
                    currentTime={currentTime}
                    allStudentRecords={studentRecords}
                    index={idx}
                    totalPendingCount={pendingDocRecords.length}
                    onRefresh={loadData}
                  />
                ))}
              </div>
            )}

        {/* Previous History Card */}
        {studentRecords.length > 0 && (
          <div className="family-card">
            <h4 className="text-xs font-semibold text-[#7e7e7d] uppercase tracking-wider mb-3">
              나의 전체 출결 내역 (총 {studentRecords.length}건)
            </h4>
            <div className="space-y-2">
              {studentRecords.map((rec) => {
                const kind = rec.kind || '결석';
                return (
                  <div key={rec.id} className="p-3 bg-[#fcfbf9] rounded-[8px] border border-[#f2f0ed] text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          kind === '결석' ? 'bg-[#ffe4e6] text-[#e11d48]' :
                          kind === '지각' ? 'bg-[#fef3c7] text-[#b45309]' :
                          kind === '조퇴' ? 'bg-[#e0f2fe] text-[#0284c7]' :
                          'bg-[#f3e8ff] text-[#7c3aed]'
                        }`}>
                          {kind}
                        </span>
                        <span className="font-semibold text-[#121212]">{rec.typeName}</span>
                        <span className="text-[11px] text-[#7e7e7d]">{rec.startDate}</span>
                      </div>
                      <p className="text-[#7e7e7d] mt-0.5">{rec.reason}</p>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {!rec.requiresDocument ? (
                        <span className="badge-pill badge-stone text-[10px]">출결 기록</span>
                      ) : rec.status === 'APPROVED' ? (
                        <span className="badge-pill badge-mint text-[10px]">승인 완료</span>
                      ) : rec.status === 'SUBMITTED' ? (
                        <div className="flex items-center space-x-1">
                          <span className="badge-pill badge-sky text-[10px]">확인 대기</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`[${rec.typeName}] 제출을 취소하고 다시 작성하시겠습니까?`)) {
                                updateAbsenceRecordStatus(rec.id, 'FORM_PICKED_UP', '학생이 제출 취소 후 재작성');
                                loadData();
                              }
                            }}
                            className="text-[10px] text-[#ff3e00] hover:bg-[#fff0eb] border border-[#ffcd6c] px-1.5 py-0.5 rounded font-medium cursor-pointer inline-flex items-center gap-0.5 bg-white shadow-2xs"
                            title="제출 취소 및 내용 수정"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>수정/취소</span>
                          </button>
                        </div>
                      ) : rec.status === 'FORM_PICKED_UP' ? (
                        <div className="flex items-center space-x-1">
                          <span className="badge-pill badge-honey text-[10px]">작성 중</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`[${rec.typeName}] 서류 챙김을 취소하고 이전 안내로 되돌리시겠습니까?`)) {
                                updateAbsenceRecordStatus(rec.id, 'ATTENDED_NOTIFIED', '학생이 서류 챙김 취소');
                                loadData();
                              }
                            }}
                            className="text-[10px] text-[#7e7e7d] hover:bg-[#f2f0ed] border border-[#e5d5c3] px-1.5 py-0.5 rounded font-medium cursor-pointer inline-flex items-center gap-0.5 bg-white shadow-2xs"
                            title="서류 챙김 취소"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>취소</span>
                          </button>
                        </div>
                      ) : (
                        <span className="badge-pill badge-orange text-[10px]">미수령</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </>
      )}

      {/* Student Password Change Modal */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 bg-[#121212]/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="family-card max-w-xs w-full p-5 shadow-2xl animate-in fade-in space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-[#fff8e8] text-[#d48f00] flex items-center justify-center">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-[#121212]">비밀번호 변경</h3>
              </div>
              <button
                onClick={() => setIsChangePinOpen(false)}
                className="text-[#7e7e7d] hover:text-[#121212] font-bold text-xs p-1"
              >
                ✕
              </button>
            </div>

            {changePinSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#e6fbf1] text-[#00ca48] flex items-center justify-center mx-auto text-base font-bold">
                  ✓
                </div>
                <p className="text-xs font-bold text-[#121212]">비밀번호가 성공적으로 변경되었습니다!</p>
              </div>
            ) : (
              <form onSubmit={handleChangePinSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#474645] mb-1">현재 비밀번호</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value)}
                    placeholder="현재 비밀번호 (기본: 1234)"
                    className="w-full p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#474645] mb-1">새 비밀번호 (숫자 4자리)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="새 비밀번호 4자리"
                    className="w-full p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#474645] mb-1">새 비밀번호 확인</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="새 비밀번호 다시 입력"
                    className="w-full p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px]"
                    required
                  />
                </div>

                {changePinError && (
                  <div className="p-2 bg-[#fff0eb] text-[#ff3e00] text-[11px] rounded-[6px] font-medium">
                    {changePinError}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePinOpen(false)}
                    className="btn-sand-pill text-xs py-1.5 px-3"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="btn-dark-pill text-xs py-1.5 px-3.5"
                  >
                    변경하기
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* App Install Guide Modal */}
      {isAppInstallGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#ffffff] rounded-[16px] border border-[#e5d5c3] max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📲</span>
                <div>
                  <h3 className="font-bold text-sm text-[#121212]">스마트폰에 앱으로 설치하기</h3>
                  <p className="text-[11px] text-[#7e7e7d]">홈 화면에 깔아두고 실시간 알림 받기</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAppInstallGuideOpen(false)}
                className="text-[#7e7e7d] hover:text-[#121212] font-semibold text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#474645]">
              {/* iPhone Guide */}
              <div className="p-3 bg-[#fbfaf9] rounded-[10px] border border-[#f2f0ed] space-y-1.5">
                <div className="font-bold text-[#121212] flex items-center gap-1.5">
                  <span>🍎</span>
                  <span>아이폰 (iPhone / Safari)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#474645] pl-1">
                  <li><strong>Safari(사파리)</strong> 브라우저로 접속합니다.</li>
                  <li>화면 하단 가운데 <strong>공유 버튼</strong>(네모에 위 화살표 모양 ⎋)을 누릅니다.</li>
                  <li>메뉴를 조금 내려 <strong>[홈 화면에 추가]</strong>를 누릅니다.</li>
                  <li>우측 상단 <strong>[추가]</strong>를 누르면 바탕화면에 앱 아이콘이 생성됩니다!</li>
                </ol>
              </div>

              {/* Android Guide */}
              <div className="p-3 bg-[#fbfaf9] rounded-[10px] border border-[#f2f0ed] space-y-2">
                <div className="font-bold text-[#121212] flex items-center gap-1.5">
                  <span>🤖</span>
                  <span>갤럭시 / 안드로이드 (삼성 인터넷 & 크롬)</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-[#474645] pl-1">
                  <div className="p-2 bg-white rounded border border-[#e5d5c3]/80">
                    <p className="font-bold text-[#121212] mb-1">🔹 삼성 인터넷 (사진의 브라우저)</p>
                    <p>메뉴에서 <strong>[현재 페이지 추가 (+ 모양)]</strong> 클릭 ➔ <strong>[홈 화면]</strong>을 선택하시면 바탕화면에 설치됩니다!</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-[#e5d5c3]/80">
                    <p className="font-bold text-[#121212] mb-1">🔹 크롬(Chrome) 브라우저</p>
                    <p>우측 상단 <strong>점 3개(⋮)</strong> ➔ <strong>[홈 화면에 추가]</strong> 또는 <strong>[앱 설치]</strong>를 누르면 설치됩니다.</p>
                  </div>
                  <p className="text-[10px] text-[#7e7e7d] pt-0.5">
                    💡 주소창 옆에 마스크/안경 모양(비밀 모드)이 켜져 있다면, 비밀 모드를 끄고 일반 탭에서 여셔야 로그인 정보가 유지됩니다.
                  </p>
                </div>
              </div>

              {/* Notification Permission Notice */}
              <div className="p-2.5 bg-[#eff6ff] rounded-[8px] border border-[#bfdbfe] text-[#1e40af] text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span>🔔</span>
                  <span>알림 수신 팁</span>
                </div>
                <p>
                  앱 최초 접속 시 상단에 뜨는 <strong>&apos;알림 권한 요청&apos;</strong>에서 <strong>[허용]</strong>을 눌러주셔야 선생님의 9:30, 12:30 실시간 서류 알림이 팝업과 소리로 울립니다.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAppInstallGuideOpen(false)}
              className="w-full btn-dark-pill text-xs py-2.5 font-semibold cursor-pointer"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}

        {/* Discreet Teacher Entry Link */}
        <div className="pt-8 pb-4 text-center">
          <Link
            href="/teacher"
            className="text-[11px] text-[#a8a29e] hover:text-[#78716c] inline-flex items-center gap-1.5 transition-colors py-1 px-3 rounded-full hover:bg-[#f2f0ed]"
          >
            <Lock className="w-3 h-3 text-[#a8a29e]" />
            <span>교직원 전용 로그인</span>
          </Link>
        </div>

      </div>
    </main>
  );
}

function StudentActionCard({
  record,
  student,
  currentTime,
  allStudentRecords,
  index,
  totalPendingCount,
  onRefresh,
}: {
  record: AbsenceRecord;
  student: Student | null;
  currentTime: string;
  allStudentRecords: AbsenceRecord[];
  index: number;
  totalPendingCount: number;
  onRefresh: () => void;
}) {
  const consecutiveIllnessDays = getStudentConsecutiveIllnessDays(record.studentId, record);
  const isIllnessOver3 = record.type === 'ILLNESS_OVER_3' || 
    (record.category === '질병' && ((record.daysCount || 1) >= 3 || consecutiveIllnessDays >= 3));

  const [checkedAttachments, setCheckedAttachments] = useState<AttachmentProof[]>(() => {
    if (record.attachments && record.attachments.length > 0) {
      return record.attachments;
    }
    if (record.type === 'FIELD_EXPERIENCE') {
      return ['체험학습 보고서(NEIS)', '일자별 배경 사진(날짜당 1장)', '보호자 동반 사진'];
    }
    if (record.type === 'MENSTRUAL') {
      return ['학부모 의견서(생리)'];
    }
    if (isIllnessOver3) {
      return ['의사 진단서'];
    }
    if (record.category === '질병') {
      return ['진료확인서', '학부모 의견서'];
    }
    return [];
  });
  const [otherAttachmentText, setOtherAttachmentText] = useState(record.otherAttachmentText || '');
  const [studentMemo, setStudentMemo] = useState(record.studentMemo || record.memo || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record.attachments && record.attachments.length > 0) {
      setCheckedAttachments(record.attachments);
    }
    if (record.otherAttachmentText !== undefined) {
      setOtherAttachmentText(record.otherAttachmentText || '');
    }
    if (record.studentMemo !== undefined || record.memo !== undefined) {
      setStudentMemo(record.studentMemo || record.memo || '');
    }
  }, [record.id, record.attachments, record.otherAttachmentText, record.studentMemo, record.memo]);

  const toggleAttachment = (item: AttachmentProof) => {
    if (checkedAttachments.includes(item)) {
      setCheckedAttachments(checkedAttachments.filter(a => a !== item));
    } else {
      setCheckedAttachments([...checkedAttachments, item]);
    }
  };

  const availableAttachments: AttachmentProof[] = record.type === 'FIELD_EXPERIENCE'
    ? ['체험학습 보고서(NEIS)', '일자별 배경 사진(날짜당 1장)', '보호자 동반 사진', '인솔자 위임장', '담임교사 확인서', '기타']
    : record.type === 'MENSTRUAL'
    ? ['학부모 의견서(생리)', '담임교사 확인서', '기타']
    : isIllnessOver3
    ? ['의사 진단서', '의사 소견서', '학부모 의견서', '담임교사 확인서', '기타']
    : record.category === '질병'
    ? ['진료확인서', '학부모 의견서', '약봉투/처방전', '의사 소견서', '의사 진단서', '담임교사 확인서', '기타']
    : ['청첩장', '사망진단서', '학부모 의견서', '담임교사 확인서', '기타'];

  const handlePickUp = () => {
    markFormPickedUp(record.id);
    onRefresh();
  };

  const handleSubmitForm = () => {
    setIsSubmitting(true);
    markSubmitted(record.id, checkedAttachments, otherAttachmentText, studentMemo);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#ffcd6c', '#00c978', '#64c6ff', '#ff3e00', '#ff58ae'],
    });
    setTimeout(() => {
      setIsSubmitting(false);
      onRefresh();
    }, 500);
  };

  const handleRevertSubmission = () => {
    if (confirm(`[${record.typeName}] 제출을 취소하고 다시 작성하시겠습니까?\n동봉할 증빙서류 목록과 메모를 다시 수정하여 제출할 수 있습니다.`)) {
      updateAbsenceRecordStatus(record.id, 'FORM_PICKED_UP', '학생이 제출 취소 후 다시 작성');
      onRefresh();
    }
  };

  const handleRevertToNotified = () => {
    if (confirm(`[${record.typeName}] 서류 챙김을 취소하고 이전 안내 상태로 되돌리시겠습니까?`)) {
      updateAbsenceRecordStatus(record.id, 'ATTENDED_NOTIFIED', '학생이 서류 챙김 취소');
      onRefresh();
    }
  };

  const handleMarkAttended = () => {
    markAttended(record.id);
    onRefresh();
  };

  const badgeOrder = totalPendingCount > 1 ? (
    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#f2f0ed]">
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded-full bg-[#ff3e00] text-white text-[11px] font-bold flex items-center justify-center shadow-2xs">
          {index + 1}
        </span>
        <span className="text-xs font-bold text-[#121212]">
          미이행 건 ({index + 1} / 총 {totalPendingCount}건)
        </span>
      </div>
      <span className="badge-pill badge-stone text-[10px] font-bold">
        {record.startDate} ({record.daysCount}일간)
      </span>
    </div>
  ) : null;

  return (
    <div id={`action-card-${record.id}`} className="scroll-mt-6">
      {record.status === 'PENDING_ATTENDANCE' ? (
        /* State 1: Registered, Waiting for Teacher Attendance Check */
        <div className="family-card">
          {badgeOrder}
          <div className="flex items-center space-x-2 text-[#7e7e7d] mb-3">
            <Clock className="w-4 h-4 text-[#d48f00]" />
            <span className="text-xs font-semibold text-[#121212]">등교 확인 대기 중</span>
          </div>
          <div className="bg-[#fcfbf9] rounded-[10px] p-4 border border-[#f2f0ed] mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="badge-pill badge-sky">
                {record.typeName}
              </span>
              <span className="text-xs text-[#7e7e7d]">{record.startDate}</span>
            </div>
            <h4 className="text-sm font-semibold text-[#121212] mt-1.5">{record.reason}</h4>
          </div>
          <div className="p-3.5 bg-[#fff8e8] rounded-[10px] border border-[#e5d5c3] text-[#343433] text-xs leading-relaxed">
            <p className="font-semibold text-[#d48f00] flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-4 h-4" />
              등교 시 결석계 알림이 울립니다
            </p>
            다음 날 등교하여 선생님이 <strong>[등교 확인]</strong>을 누르시면, 교실 서류함에서 양식을 챙기라는 안내 카드가 활성화됩니다.
          </div>

          {/* 학생 직접 등교 확인 & 서류 챙기기 시작 버튼 */}
          <button
            type="button"
            onClick={handleMarkAttended}
            className="btn-dark-pill w-full mt-3 py-2.5 text-xs flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#ffcd6c]" />
            <span>선생님, 오늘 등교했어요! (서류 챙기기 시작) 🏫</span>
          </button>
        </div>
      ) : record.status === 'ATTENDED_NOTIFIED' ? (
        /* State 2: Attended! Storybook Ember Orange Alert Card */
        <div className="family-card border-2 border-[#ff3e00]/40 bg-[#ffffff]">
          {badgeOrder}
          <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-[#ff3e00] animate-bounce" />
              <span className="badge-pill badge-orange font-semibold">
                등교 확인 완료 · 서류 챙기기
              </span>
            </div>
            <span className="text-[11px] text-[#7e7e7d]">
              {record.remindCount > 1 ? `${record.remindCount}회 리마인드` : '방금 전 알림'}
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-bold text-[#121212] leading-snug">
              {record.type === 'FIELD_EXPERIENCE' ? (
                <>
                  현장체험학습은 결석계가 아니며<br />
                  <span className="text-[#d48f00] underline underline-offset-4 decoration-[#d48f00]/30">
                    [보고서를 7일이내 NEIS로 제출]
                  </span> 해야 합니다!
                </>
              ) : (
                <>
                  교실 서류함에서<br />
                  <span className="text-[#ff3e00] underline underline-offset-4 decoration-[#ff3e00]/30">
                    [{record.typeName}]
                  </span> 서류를 챙기세요!
                </>
              )}
            </h3>
            <p className="text-xs text-[#474645] mt-2 leading-relaxed">
              {record.type === 'FIELD_EXPERIENCE' ? (
                <>
                  {student?.name} 학생! 현장체험학습은 결석계가 아니며, <strong>보고서를 7일이내 NEIS로 제출</strong>해야 합니다.
                </>
              ) : (
                <>
                  {student?.name} 학생! 교실 앞 서류함에서 <strong>결석신고서</strong>를 1장 챙겨서 자필로 작성해주세요.
                </>
              )}
            </p>
          </div>

          <div className="mt-3.5 bg-[#fbfaf9] rounded-[10px] p-3.5 border border-[#f2f0ed] text-xs text-[#474645] space-y-1">
            <div className="flex justify-between">
              <span>결석 일자:</span>
              <span className="font-medium text-[#121212]">{record.startDate} ({record.daysCount}일간)</span>
            </div>
            <div className="flex justify-between">
              <span>결석 사유:</span>
              <span className="font-medium text-[#121212]">{record.reason}</span>
            </div>
            {record.type === 'MENSTRUAL' && (
              <div className="mt-2 pt-2 border-t border-[#f2f0ed] text-[#ff3e00] text-[11px] font-semibold">
                ⚠️ 생리인정결석: 학부모 의견서 자필 작성이 필수입니다.
              </div>
            )}
            {record.type === 'FIELD_EXPERIENCE' && (
              <div className="mt-2 pt-2 border-t border-[#f2f0ed] space-y-1 text-[11px]">
                <p className="font-bold text-[#d48f00] flex items-center gap-1">
                  <span>🎒</span>
                  <span>[안내] 현장체험학습: 보고서를 7일이내 NEIS로 제출</span>
                </p>
                <ul className="list-disc list-inside text-[#474645] space-y-0.5 pl-0.5">
                  <li><strong>보고서 마감:</strong> 결석계가 아니며 복귀 후 <strong>7일 이내 NEIS 보고서 제출</strong> {record.fieldTripDeadline ? `(${record.fieldTripDeadline}까지)` : ''}</li>
                  <li><strong>첨부 사진:</strong> 다녀온 날짜마다 1장 ({record.daysCount}일간 ➔ <strong>총 {record.daysCount}장</strong>)</li>
                  <li><strong>필수 사항:</strong> 체험학습 배경 + <strong>동행 보호자 사진 필수!</strong></li>
                  <li><strong>인솔자 위임장:</strong> 보호자 외 인솔 시 위임장 제출 필요</li>
                </ul>
              </div>
            )}
          </div>

          {/* ⏰ 3차례 정기 독려 알림 작동 안내 (아침 09:30, 정오 12:30, 오후 14:30) */}
          <div className="mt-3.5 p-3 bg-[#fff8e8] rounded-[10px] border border-[#ffcd6c]/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#d48f00] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>3차례 정기 알림 작동 중</span>
              </span>
              <span className="badge-pill badge-orange text-[9px] font-semibold">
                미이행 알림
              </span>
            </div>
            <p className="text-[11px] text-[#474645] leading-snug">
              {record.type === 'FIELD_EXPERIENCE'
                ? '보고서를 7일이내 NEIS로 제출할 때까지 아침 09:30 · 정오 12:30 · 오후 14:30에 독려 핑이 울립니다.'
                : '서류를 챙겨 제출할 때까지 아침 09:30 · 정오 12:30 · 오후 14:30에 3차례 독려 핑이 울립니다.'}
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold pt-0.5">
              <div className={`p-1.5 rounded-[6px] border ${currentTime >= '09:30' ? 'bg-[#ffcd6c]/30 text-[#d48f00] border-[#ffcd6c]' : 'bg-[#ffffff] text-[#7e7e7d] border-[#f2f0ed]'}`}>
                🌅 1차 09:30
              </div>
              <div className={`p-1.5 rounded-[6px] border ${currentTime >= '12:30' ? 'bg-[#ffcd6c]/30 text-[#d48f00] border-[#ffcd6c]' : 'bg-[#ffffff] text-[#7e7e7d] border-[#f2f0ed]'}`}>
                🍱 2차 12:30
              </div>
              <div className={`p-1.5 rounded-[6px] border ${currentTime >= '14:30' ? 'bg-[#ffcd6c]/30 text-[#d48f00] border-[#ffcd6c]' : 'bg-[#ffffff] text-[#7e7e7d] border-[#f2f0ed]'}`}>
                🌇 3차 14:30
              </div>
            </div>
          </div>

          {/* Primary Action Dark Pill */}
          <button
            type="button"
            onClick={handlePickUp}
            className="btn-dark-pill w-full mt-4 py-3 text-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>
              {record.type === 'FIELD_EXPERIENCE' 
                ? '1단계: 보고서를 7일이내 NEIS로 제출 확인 🎒' 
                : '1단계: 결석신고서 챙겼어요 📄'}
            </span>
          </button>
        </div>
      ) : record.status === 'FORM_PICKED_UP' ? (
        /* State 3: Form Picked Up -> Writing & Checklist & Submit Ping */
        <div className="family-card">
          {badgeOrder}
          <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#0086fc]" />
              <span className="badge-pill badge-sky">
                {record.type === 'FIELD_EXPERIENCE' ? '2단계: 보고서를 7일이내 NEIS로 제출' : '2단계: 서류 작성 및 제출'}
              </span>
            </div>
            <span className="text-[11px] text-[#7e7e7d]">작성 중</span>
          </div>

          <div className="mt-4">
            <h3 className="text-base font-bold text-[#121212]">
              {record.type === 'FIELD_EXPERIENCE' 
                ? '보고서를 7일이내 NEIS로 제출 & 사진 첨부' 
                : '종이 서류 작성 후 제출함에 넣기'}
            </h3>
            <p className="text-xs text-[#474645] mt-1 leading-relaxed">
              {record.type === 'FIELD_EXPERIENCE' 
                ? '보고서를 7일이내 NEIS로 제출하고, 동행 보호자 사진(일자당 1장)을 점검한 뒤 제출 완료 핑을 보내세요.' 
                : '작성 후 동봉할 증빙서류를 아래에서 체크하고 교실 제출함에 넣은 뒤 버튼을 누르세요.'}
            </p>
          </div>

          {record.type === 'FIELD_EXPERIENCE' && (
            <div className="mt-3 p-3 bg-[#fff8e8] rounded-[8px] border border-[#e5d5c3] text-xs text-[#343433] space-y-1">
              <p className="font-bold text-[#d48f00]">📸 사진 첨부 점검 (다녀온 일수: {record.daysCount}일)</p>
              <p className="text-[11px] text-[#474645]">
                • 날짜마다 1장씩 사진 (총 <strong>{record.daysCount}장</strong>, 배경 포함)<br />
                • 동행한 <strong>보호자 얼굴이 나온 사진</strong> 포함 필수<br />
                • 보고서 마감: <strong>복귀 후 7일 이내</strong> {record.fieldTripDeadline ? `(${record.fieldTripDeadline}까지)` : ''}
              </p>
            </div>
          )}

          {/* Attachment Checklist */}
          <div className="mt-4 bg-[#fcfbf9] rounded-[10px] p-3.5 border border-[#f2f0ed]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#121212]">
                📎 동봉한 증빙서류 체크
              </span>
              <span className="text-[11px] text-[#7e7e7d]">다중 선택 가능</span>
            </div>

            {/* 3일 이상 질병결석 시 서식 1호 경고 안내 */}
            {isIllnessOver3 && (
              <div className="mb-3 p-3 bg-[#fff0eb] rounded-[8px] border border-[#ff3e00]/30 text-xs text-[#121212] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#ff3e00]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>연속 {Math.max(record.daysCount || 1, consecutiveIllnessDays)}일 질병결석 서류 규정 안내 (&lt;서식 1호&gt; 결석신고서, 주말 제외)</span>
                </div>
                <p className="text-[11px] text-[#474645] leading-relaxed">
                  • 토·일 주말을 제외한 <strong>연속 3일 이상 질병결석</strong>(또는 지필평가 기간)은 학교 규정에 따라 반드시 <strong>[의사 진단서]</strong> 또는 <strong>[의사 소견서]</strong> 중 1부를 첨부해야 합니다.<br />
                  • <span className="text-[#ff3e00] font-semibold">단순 진료확인서나 처방전(약봉투)은 3일 이상 결석 증빙서류로 인정되지 않습니다.</span>
                </p>
              </div>
            )}

            {/* 2일 이내 질병결석 안내 */}
            {!isIllnessOver3 && record.category === '질병' && (
              <div className="mb-3 p-2.5 bg-[#f0f9ff] rounded-[8px] border border-[#0086fc]/20 text-xs text-[#121212] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#0086fc]">
                  <span>💡 2일 이내 질병결석 증빙 안내 (&lt;서식 1호&gt;)</span>
                </div>
                <p className="text-[11px] text-[#474645] leading-relaxed">
                  • 진료확인서, 처방전(약봉투), 학부모 의견서, 의사 소견서/진단서 중 1부 이상 제출
                </p>
              </div>
            )}

            <div className="space-y-1.5 mt-2">
              {availableAttachments.map((att) => {
                const isChecked = checkedAttachments.includes(att);
                const isCrucial = (record.type === 'MENSTRUAL' && att === '학부모 의견서(생리)') ||
                                  (isIllnessOver3 && (att === '의사 진단서' || att === '의사 소견서')) ||
                                  (!isIllnessOver3 && record.category === '질병' && (att === '진료확인서' || att === '학부모 의견서'));
                const badgeText = isIllnessOver3 && (att === '의사 진단서' || att === '의사 소견서')
                  ? '3일이상 필수(택1)'
                  : '필수/권장';

                return (
                  <label
                    key={att}
                    onClick={() => toggleAttachment(att)}
                    className={`flex items-center justify-between p-2.5 rounded-[8px] border text-xs font-medium cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-[#ffffff] border-[#121212] text-[#121212] shadow-xs'
                        : 'bg-[#ffffff] border-[#f2f0ed] text-[#474645] hover:border-[#e5d5c3]'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#121212] rounded-[4px] border-[#e5d5c3] focus:ring-0 cursor-pointer accent-[#121212]"
                      />
                      <span>{att}</span>
                    </div>
                    {isCrucial && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-semibold ${
                        isIllnessOver3 && (att === '의사 진단서' || att === '의사 소견서')
                          ? 'bg-[#ff3e00] text-white'
                          : 'bg-[#fff0eb] text-[#ff3e00]'
                      }`}>
                        {badgeText}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {checkedAttachments.includes('기타') && (
              <div className="mt-2">
                <input
                  type="text"
                  value={otherAttachmentText}
                  onChange={(e) => setOtherAttachmentText(e.target.value)}
                  placeholder="기타 증빙서류 명칭을 입력하세요"
                  className="w-full text-xs p-2.5 bg-white border border-[#e5d5c3] rounded-[8px] focus:outline-hidden focus:border-[#121212]"
                />
              </div>
            )}
          </div>

          {/* ⏰ 3차례 정기 독려 알림 작동 안내 */}
          <div className="mt-3.5 p-3 bg-[#fff8e8] rounded-[10px] border border-[#ffcd6c]/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#d48f00] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>2단계 미제출 알림 작동 중</span>
              </span>
              <span className="badge-pill badge-orange text-[9px] font-semibold">
                미제출 시 알림
              </span>
            </div>
            <p className="text-[11px] text-[#474645] leading-snug">
              서류 작성 후 제출함에 넣기 전까지 <strong>아침 09:30 · 정오 12:30 · 오후 14:30</strong>에 독려 핑이 울립니다.
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold pt-0.5">
              <div className={`p-1.5 rounded-[6px] border ${currentTime >= '09:30' ? 'bg-[#ffcd6c]/30 text-[#d48f00] border-[#ffcd6c]' : 'bg-[#ffffff] text-[#7e7e7d] border-[#f2f0ed]'}`}>
                🌅 1차 09:30
              </div>
              <div className={`p-1.5 rounded-[6px] border ${currentTime >= '12:30' ? 'bg-[#ffcd6c]/30 text-[#d48f00] border-[#ffcd6c]' : 'bg-[#ffffff] text-[#7e7e7d] border-[#f2f0ed]'}`}>
                🍱 2차 12:30
              </div>
              <div className={`p-1.5 rounded-[6px] border ${currentTime >= '14:30' ? 'bg-[#ffcd6c]/30 text-[#d48f00] border-[#ffcd6c]' : 'bg-[#ffffff] text-[#7e7e7d] border-[#f2f0ed]'}`}>
                🌇 3차 14:30
              </div>
            </div>
          </div>

          {/* Student optional message/memo to teacher */}
          <div className="mt-3.5 bg-[#fcfbf9] rounded-[10px] p-3 border border-[#f2f0ed] text-xs">
            <label className="block font-semibold text-[#121212] mb-1">
              💬 선생님께 전달할 메모 (선택)
            </label>
            <input
              type="text"
              value={studentMemo}
              onChange={(e) => setStudentMemo(e.target.value)}
              placeholder="예: 진료확인서는 내일 가져갈게요, 서류 작성 완료 등"
              className="w-full text-xs p-2.5 bg-white border border-[#e5d5c3] rounded-[6px] focus:outline-hidden focus:border-[#121212]"
            />
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleSubmitForm}
            disabled={isSubmitting}
            className="btn-dark-pill w-full mt-4 py-3 text-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting
                ? '전송 중...'
                : record.type === 'FIELD_EXPERIENCE'
                ? '보고서를 7일이내 NEIS로 제출 완료했어요! 📨'
                : '제출함에 넣었어요! (선생님께 핑) 📨'}
            </span>
          </button>
          <p className="text-center text-[11px] text-[#7e7e7d] mt-2">
            버튼을 누르면 선생님 대시보드에 즉시 실시간 알림음이 울립니다.
          </p>

          {/* ↩ 전단계로 되돌리기 버튼 */}
          <div className="mt-3 pt-3 border-t border-[#f2f0ed] flex justify-center">
            <button
              type="button"
              onClick={handleRevertToNotified}
              className="text-xs text-[#7e7e7d] hover:text-[#121212] hover:bg-[#f2f0ed] px-3.5 py-1.5 rounded-[6px] border border-[#e5d5c3] transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium bg-white"
              title="서류 챙기기를 취소하고 이전 안내 화면으로 되돌아갑니다."
            >
              <RotateCcw className="w-3 h-3 text-[#64748b]" />
              <span>↩ 전단계로 (서류 챙기기 전으로 되돌리기)</span>
            </button>
          </div>
        </div>
      ) : record.status === 'SUBMITTED' ? (
        /* State 4: Submitted -> Waiting for Teacher Inspection */
        <div className="family-card text-center animate-in fade-in">
          {badgeOrder}
          <div className="w-12 h-12 bg-[#e6fbf1] text-[#00ca48] rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>

          <span className="badge-pill badge-mint mb-2">
            선생님께 제출 알림 완료 (정기 리마인드 해제)
          </span>
          <h3 className="text-base font-bold text-[#121212] mt-1">
            {record.type === 'FIELD_EXPERIENCE'
              ? '선생님이 NEIS 보고서 및 사진을 확인 중입니다'
              : '선생님이 실물 서류를 확인 중입니다'}
          </h3>
          <p className="text-xs text-[#474645] mt-1.5 leading-relaxed">
            {record.type === 'FIELD_EXPERIENCE'
              ? '현장체험학습 보고서를 7일이내 NEIS로 제출 완료했습니다. 담임선생님이 NEIS 대조 후 최종 승인 처리하실 예정입니다.'
              : '종이 결석신고서를 교실 제출함에 넣었습니다. 담임선생님이 서류를 확인하신 후 최종 승인 처리하실 예정입니다.'}
          </p>

          <div className="mt-4 bg-[#fbfaf9] rounded-[10px] p-3 border border-[#f2f0ed] text-xs space-y-1.5 text-left">
            <div className="flex justify-between text-[#7e7e7d]">
              <span>제출 일시:</span>
              <span className="font-medium text-[#121212]">{record.submittedAt ? new Date(record.submittedAt).toLocaleTimeString('ko-KR') : '방금 전'}</span>
            </div>
            <div className="flex justify-between text-[#7e7e7d]">
              <span>동봉한 증빙:</span>
              <span className="font-semibold text-[#0086fc]">{record.attachments?.join(', ') || '없음'}</span>
            </div>
            {(record.studentMemo || record.memo) && (
              <div className="flex justify-between text-[#7e7e7d] pt-1.5 border-t border-[#f2f0ed]">
                <span>전달한 메모:</span>
                <span className="text-[#121212] font-medium">{record.studentMemo || record.memo}</span>
              </div>
            )}
          </div>

          {/* ↩️ 전단계로 되돌리기 & 제출 내용 수정 버튼 */}
          <div className="mt-4 pt-3.5 border-t border-[#f2f0ed] space-y-2">
            <button
              type="button"
              onClick={handleRevertSubmission}
              className="w-full py-2.5 px-3 bg-white hover:bg-[#fff0eb] text-[#ff3e00] border-2 border-[#ffcd6c] hover:border-[#ff3e00] rounded-[8px] text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#ff3e00]" />
              <span>↩ 제출 취소 및 내용 수정하기</span>
            </button>
            <p className="text-[11px] text-[#7e7e7d] text-center">
              실수로 잘못 제출했거나 증빙서류를 다시 체크하려면 위 버튼을 눌러 수정하세요.
            </p>
          </div>
        </div>
      ) : (
        /* State 5: Approved */
        <div className="family-card text-center py-8">
          {badgeOrder}
          <div className="w-12 h-12 bg-[#e6fbf1] text-[#00ca48] rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#121212]">결석신고서 승인 완료!</h3>
          <p className="text-xs text-[#7e7e7d] mt-1">
            {record.startDate} ({record.typeName}) 결석신고서가 정상 처리되었습니다.
          </p>
        </div>
      )}
    </div>
  );
}
