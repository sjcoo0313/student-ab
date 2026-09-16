'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Bell, 
  CheckCircle2, 
  FileText, 
  Send, 
  AlertCircle, 
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
  markFormPickedUp, 
  markSubmitted,
  updateAbsenceRecordStatus,
  subscribeToSyncEvents,
  getMyStudent,
  setMyStudentId,
  saveMyStudentProfile,
  updateStudentPin
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

  const [checkedAttachments, setCheckedAttachments] = useState<AttachmentProof[]>([]);
  const [otherAttachmentText, setOtherAttachmentText] = useState('');
  const [studentMemo, setStudentMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    try {
      const stds = getStudents();
      setStudents(stds);
      setRecords(getAbsenceRecords());
      const curr = getMyStudent();
      setMyStudent(curr);
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
      setCheckedAttachments([]);
      setOtherAttachmentText('');
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

  // Only the current authenticated student's records are accessible
  const studentRecords = myStudent ? records.filter(r => r.studentId === myStudent.id) : [];
  // Only records that actually require paper document submission and are not yet approved
  const pendingDocRecords = studentRecords.filter(r => r.requiresDocument !== false && r.status !== 'APPROVED');
  const activeRecord = pendingDocRecords[0];
  const myApprovedRecords = studentRecords.filter(r => r.status === 'APPROVED');

  useEffect(() => {
    if (activeRecord) {
      if (activeRecord.attachments && activeRecord.attachments.length > 0) {
        setCheckedAttachments(activeRecord.attachments);
      } else if (activeRecord.type === 'FIELD_EXPERIENCE') {
        setCheckedAttachments(['체험학습 보고서(NEIS)', '일자별 배경 사진(날짜당 1장)', '보호자 동반 사진']);
      } else if (activeRecord.type === 'MENSTRUAL') {
        setCheckedAttachments(['학부모 의견서(생리)']);
      } else if (activeRecord.category === '질병') {
        setCheckedAttachments(['진료확인서', '학부모 의견서']);
      } else {
        setCheckedAttachments([]);
      }
      setOtherAttachmentText(activeRecord.otherAttachmentText || '');
      setStudentMemo(activeRecord.studentMemo || activeRecord.memo || '');
    }
  }, [activeRecord?.id]);

  const handlePickUp = () => {
    if (!activeRecord) return;
    markFormPickedUp(activeRecord.id);
  };

  const handleSubmitForm = () => {
    if (!activeRecord) return;
    setIsSubmitting(true);

    markSubmitted(activeRecord.id, checkedAttachments, otherAttachmentText, studentMemo);

    // Warm confetti sprinkle
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#ffcd6c', '#00c978', '#64c6ff', '#ff3e00', '#ff58ae'],
    });

    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  const handleRevertSubmission = () => {
    if (!activeRecord) return;
    if (confirm('제출을 취소하고 다시 작성하시겠습니까?\n동봉할 증빙서류 목록과 메모를 다시 수정하여 제출할 수 있습니다.')) {
      updateAbsenceRecordStatus(activeRecord.id, 'FORM_PICKED_UP', '학생이 제출 취소 후 다시 작성');
      loadData();
    }
  };

  const handleRevertToNotified = () => {
    if (!activeRecord) return;
    if (confirm('서류 챙김을 취소하고 이전 안내 상태로 되돌리시겠습니까?')) {
      updateAbsenceRecordStatus(activeRecord.id, 'ATTENDED_NOTIFIED', '학생이 서류 챙김 취소');
      loadData();
    }
  };

  const toggleAttachment = (item: AttachmentProof) => {
    if (checkedAttachments.includes(item)) {
      setCheckedAttachments(checkedAttachments.filter(a => a !== item));
    } else {
      setCheckedAttachments([...checkedAttachments, item]);
    }
  };

  const availableAttachments: AttachmentProof[] = activeRecord?.type === 'FIELD_EXPERIENCE'
    ? ['체험학습 보고서(NEIS)', '일자별 배경 사진(날짜당 1장)', '보호자 동반 사진', '인솔자 위임장', '담임교사 확인서', '기타']
    : activeRecord?.type === 'MENSTRUAL'
    ? ['학부모 의견서(생리)', '담임교사 확인서', '기타']
    : activeRecord?.category === '질병'
    ? ['진료확인서', '학부모 의견서', '의사 소견서', '의사 진단서', '약봉투/처방전', '담임교사 확인서', '기타']
    : ['청첩장', '사망진단서', '학부모 의견서', '담임교사 확인서', '기타'];

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
            3학년 2반 출결 및 결석계·체험학습 알리미
          </p>
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
            {!activeRecord ? (
              <div className="family-card text-center py-10">
                <div className="w-12 h-12 rounded-full bg-[#e6fbf1] text-[#00ca48] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#121212]">제출할 결석신고서가 없습니다</h3>
                <p className="text-xs text-[#7e7e7d] mt-1">
                  현재 {myStudent.name} 학생은 미제출된 결석계가 없습니다.
                </p>
              </div>
        ) : activeRecord.status === 'PENDING_ATTENDANCE' ? (
          /* State 1: Registered, Waiting for Teacher Attendance Check */
          <div className="family-card">
            <div className="flex items-center space-x-2 text-[#7e7e7d] mb-3">
              <Clock className="w-4 h-4 text-[#d48f00]" />
              <span className="text-xs font-semibold text-[#121212]">등교 확인 대기 중</span>
            </div>
            <div className="bg-[#fcfbf9] rounded-[10px] p-4 border border-[#f2f0ed] mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="badge-pill badge-sky">
                  {activeRecord.typeName}
                </span>
                <span className="text-xs text-[#7e7e7d]">{activeRecord.startDate}</span>
              </div>
              <h4 className="text-sm font-semibold text-[#121212] mt-1.5">{activeRecord.reason}</h4>
            </div>
            <div className="p-3.5 bg-[#fff8e8] rounded-[10px] border border-[#e5d5c3] text-[#343433] text-xs leading-relaxed">
              <p className="font-semibold text-[#d48f00] flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4" />
                등교 시 결석계 알림이 울립니다
              </p>
              다음 날 등교하여 선생님이 <strong>[등교 확인]</strong>을 누르시면, 교실 서류함에서 양식을 챙기라는 안내 카드가 활성화됩니다.
            </div>
          </div>
        ) : activeRecord.status === 'ATTENDED_NOTIFIED' ? (
          /* State 2: Attended! Storybook Ember Orange Alert Card */
          <div className="family-card border-2 border-[#ff3e00]/40 bg-[#ffffff]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-[#ff3e00] animate-bounce" />
                <span className="badge-pill badge-orange font-semibold">
                  등교 확인 완료 · 서류 챙기기
                </span>
              </div>
              <span className="text-[11px] text-[#7e7e7d]">
                {activeRecord.remindCount > 1 ? `${activeRecord.remindCount}회 리마인드` : '방금 전 알림'}
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-bold text-[#121212] leading-snug">
                {activeRecord.type === 'FIELD_EXPERIENCE' ? (
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
                      [{activeRecord.typeName}]
                    </span> 서류를 챙기세요!
                  </>
                )}
              </h3>
              <p className="text-xs text-[#474645] mt-2 leading-relaxed">
                {activeRecord.type === 'FIELD_EXPERIENCE' ? (
                  <>
                    {myStudent?.name} 학생! 현장체험학습은 결석계가 아니며, <strong>보고서를 7일이내 NEIS로 제출</strong>해야 합니다.
                  </>
                ) : (
                  <>
                    {myStudent?.name} 학생! 교실 앞 서류함에서 <strong>결석신고서</strong>를 1장 챙겨서 자필로 작성해주세요.
                  </>
                )}
              </p>
            </div>

            <div className="mt-3.5 bg-[#fbfaf9] rounded-[10px] p-3.5 border border-[#f2f0ed] text-xs text-[#474645] space-y-1">
              <div className="flex justify-between">
                <span>결석 일자:</span>
                <span className="font-medium text-[#121212]">{activeRecord.startDate} ({activeRecord.daysCount}일간)</span>
              </div>
              <div className="flex justify-between">
                <span>결석 사유:</span>
                <span className="font-medium text-[#121212]">{activeRecord.reason}</span>
              </div>
              {activeRecord.type === 'MENSTRUAL' && (
                <div className="mt-2 pt-2 border-t border-[#f2f0ed] text-[#ff3e00] text-[11px] font-semibold">
                  ⚠️ 생리인정결석: 학부모 의견서 자필 작성이 필수입니다.
                </div>
              )}
              {activeRecord.type === 'FIELD_EXPERIENCE' && (
                <div className="mt-2 pt-2 border-t border-[#f2f0ed] space-y-1 text-[11px]">
                  <p className="font-bold text-[#d48f00] flex items-center gap-1">
                    <span>🎒</span>
                    <span>[안내] 현장체험학습: 보고서를 7일이내 NEIS로 제출</span>
                  </p>
                  <ul className="list-disc list-inside text-[#474645] space-y-0.5 pl-0.5">
                    <li><strong>보고서 마감:</strong> 결석계가 아니며 복귀 후 <strong>7일 이내 NEIS 보고서 제출</strong> {activeRecord.fieldTripDeadline ? `(${activeRecord.fieldTripDeadline}까지)` : ''}</li>
                    <li><strong>첨부 사진:</strong> 다녀온 날짜마다 1장 ({activeRecord.daysCount}일간 ➔ <strong>총 {activeRecord.daysCount}장</strong>)</li>
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
                {activeRecord.type === 'FIELD_EXPERIENCE'
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
              onClick={handlePickUp}
              className="btn-dark-pill w-full mt-4 py-3 text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>
                {activeRecord.type === 'FIELD_EXPERIENCE' 
                  ? '1단계: 보고서를 7일이내 NEIS로 제출 확인 🎒' 
                  : '1단계: 결석신고서 챙겼어요 📄'}
              </span>
            </button>
          </div>
        ) : activeRecord.status === 'FORM_PICKED_UP' ? (
          /* State 3: Form Picked Up -> Writing & Checklist & Submit Ping */
          <div className="family-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#0086fc]" />
                <span className="badge-pill badge-sky">
                  {activeRecord.type === 'FIELD_EXPERIENCE' ? '2단계: 보고서를 7일이내 NEIS로 제출' : '2단계: 서류 작성 및 제출'}
                </span>
              </div>
              <span className="text-[11px] text-[#7e7e7d]">작성 중</span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-bold text-[#121212]">
                {activeRecord.type === 'FIELD_EXPERIENCE' 
                  ? '보고서를 7일이내 NEIS로 제출 & 사진 첨부' 
                  : '종이 서류 작성 후 제출함에 넣기'}
              </h3>
              <p className="text-xs text-[#474645] mt-1 leading-relaxed">
                {activeRecord.type === 'FIELD_EXPERIENCE' 
                  ? '보고서를 7일이내 NEIS로 제출하고, 동행 보호자 사진(일자당 1장)을 점검한 뒤 제출 완료 핑을 보내세요.' 
                  : '작성 후 동봉할 증빙서류를 아래에서 체크하고 교실 제출함에 넣은 뒤 버튼을 누르세요.'}
              </p>
            </div>

            {activeRecord.type === 'FIELD_EXPERIENCE' && (
              <div className="mt-3 p-3 bg-[#fff8e8] rounded-[8px] border border-[#e5d5c3] text-xs text-[#343433] space-y-1">
                <p className="font-bold text-[#d48f00]">📸 사진 첨부 점검 (다녀온 일수: {activeRecord.daysCount}일)</p>
                <p className="text-[11px] text-[#474645]">
                  • 날짜마다 1장씩 사진 (총 <strong>{activeRecord.daysCount}장</strong>, 배경 포함)<br />
                  • 동행한 <strong>보호자 얼굴이 나온 사진</strong> 포함 필수<br />
                  • 보고서 마감: <strong>복귀 후 7일 이내</strong> {activeRecord.fieldTripDeadline ? `(${activeRecord.fieldTripDeadline}까지)` : ''}
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

              <div className="space-y-1.5 mt-2">
                {availableAttachments.map((att) => {
                  const isChecked = checkedAttachments.includes(att);
                  const isCrucial = (activeRecord.type === 'MENSTRUAL' && att === '학부모 의견서(생리)') ||
                                    (activeRecord.category === '질병' && (att === '진료확인서' || att === '학부모 의견서'));
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
                        <span className="text-[10px] bg-[#fff0eb] text-[#ff3e00] px-1.5 py-0.2 rounded-[4px] font-semibold">
                          필수/권장
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
              onClick={handleSubmitForm}
              disabled={isSubmitting}
              className="btn-dark-pill w-full mt-4 py-3 text-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? '전송 중...'
                  : activeRecord.type === 'FIELD_EXPERIENCE'
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
        ) : activeRecord.status === 'SUBMITTED' ? (
          /* State 4: Submitted -> Waiting for Teacher Inspection */
          <div className="family-card text-center animate-in fade-in">
            <div className="w-12 h-12 bg-[#e6fbf1] text-[#00ca48] rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>

            <span className="badge-pill badge-mint mb-2">
              선생님께 제출 알림 완료 (정기 리마인드 해제)
            </span>
            <h3 className="text-base font-bold text-[#121212] mt-1">
              {activeRecord.type === 'FIELD_EXPERIENCE'
                ? '선생님이 NEIS 보고서 및 사진을 확인 중입니다'
                : '선생님이 실물 서류를 확인 중입니다'}
            </h3>
            <p className="text-xs text-[#474645] mt-1.5 leading-relaxed">
              {activeRecord.type === 'FIELD_EXPERIENCE'
                ? '현장체험학습 보고서를 7일이내 NEIS로 제출 완료했습니다. 담임선생님이 NEIS 대조 후 최종 승인 처리하실 예정입니다.'
                : '종이 결석신고서를 교실 제출함에 넣었습니다. 담임선생님이 서류를 확인하신 후 최종 승인 처리하실 예정입니다.'}
            </p>

            <div className="mt-4 bg-[#fbfaf9] rounded-[10px] p-3 border border-[#f2f0ed] text-xs space-y-1.5 text-left">
              <div className="flex justify-between text-[#7e7e7d]">
                <span>제출 일시:</span>
                <span className="font-medium text-[#121212]">{activeRecord.submittedAt ? new Date(activeRecord.submittedAt).toLocaleTimeString('ko-KR') : '방금 전'}</span>
              </div>
              <div className="flex justify-between text-[#7e7e7d]">
                <span>동봉한 증빙:</span>
                <span className="font-semibold text-[#0086fc]">{activeRecord.attachments.join(', ') || '없음'}</span>
              </div>
              {(activeRecord.studentMemo || activeRecord.memo) && (
                <div className="flex justify-between text-[#7e7e7d] pt-1.5 border-t border-[#f2f0ed]">
                  <span>전달한 메모:</span>
                  <span className="text-[#121212] font-medium">{activeRecord.studentMemo || activeRecord.memo}</span>
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
            <div className="w-12 h-12 bg-[#e6fbf1] text-[#00ca48] rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#121212]">결석신고서 승인 완료!</h3>
            <p className="text-xs text-[#7e7e7d] mt-1">
              {activeRecord.startDate} ({activeRecord.typeName}) 결석신고서가 정상 처리되었습니다.
            </p>
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

      {/* Teacher Mode Jump Card */}
        <div className="family-card-stone flex items-center justify-between p-4">
          <div>
            <p className="text-[10px] font-semibold text-[#7e7e7d] uppercase">교사용 모드</p>
            <p className="text-xs font-medium text-[#121212]">선생님 화면에서 출결 및 알림 확인하기</p>
          </div>
          <Link
            href="/teacher"
            className="btn-dark-pill text-xs py-2 px-3.5"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>교사 모드</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

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

      </div>
    </main>
  );
}
