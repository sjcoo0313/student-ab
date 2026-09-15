'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Send, 
  RefreshCw, 
  Search, 
  Filter, 
  PhoneCall, 
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { 
  getStudents, 
  getAbsenceRecords, 
  createAbsenceRecord, 
  markAttended, 
  markApproved, 
  triggerRemind, 
  subscribeToSyncEvents 
} from '@/lib/storage';
import { Student, AbsenceRecord, AbsenceCategory, AbsenceType, VerificationMethod, AttachmentProof } from '@/types';
import TeacherAuthGuard from '@/components/TeacherAuthGuard';
import CalendarDatePicker, { getTodayString, formatKoreanDate, calculateDaysCount } from '@/components/CalendarDatePicker';
import { 
  REMINDER_SLOTS, 
  getTodayReminderLog, 
  dispatchScheduledReminder, 
  getUnfulfilledAbsenceRecords,
  DailyReminderLog,
  ReminderSlotTime 
} from '@/lib/reminders';

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [reminderLog, setReminderLog] = useState<DailyReminderLog>({ date: getTodayString(), slots: {} });

  // Dashboard Date Navigation & Filtering
  const [selectedDashboardDate, setSelectedDashboardDate] = useState(getTodayString());
  const [filterOnlySelectedDate, setFilterOnlySelectedDate] = useState(false);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedRecordToApprove, setSelectedRecordToApprove] = useState<AbsenceRecord | null>(null);

  // New Absence Form State (Defaulting automatically to current today date)
  const [newStudentId, setNewStudentId] = useState('');
  const [newCategory, setNewCategory] = useState<AbsenceCategory>('출석 인정');
  const [newType, setNewType] = useState<AbsenceType>('MENSTRUAL');
  const [newTypeName, setNewTypeName] = useState('생리 인정결석');
  const [newStartDate, setNewStartDate] = useState(getTodayString());
  const [newEndDate, setNewEndDate] = useState(getTodayString());
  const [newDaysCount, setNewDaysCount] = useState(1);
  const [newPeriodText, setNewPeriodText] = useState('전일');
  const [newReason, setNewReason] = useState('생리통으로 인한 출석인정 결석');
  const [newMemo, setNewMemo] = useState('');

  // Approval Form State
  const [approveMethod, setApproveMethod] = useState<VerificationMethod>('학생 사전 대면 보고');
  const [approveNote, setApproveNote] = useState('');

  const loadData = () => {
    const stds = getStudents();
    setStudents(stds);
    if (stds.length > 0 && !newStudentId) {
      setNewStudentId(stds[0].id);
    }
    setRecords(getAbsenceRecords());
    setReminderLog(getTodayReminderLog());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToSyncEvents(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleTriggerSlotReminder = (slotTime: ReminderSlotTime) => {
    const result = dispatchScheduledReminder(slotTime, true);
    loadData();
    if (result.dispatchedCount > 0) {
      alert(`[${result.slot.title}] ${result.dispatchedCount}명의 미이행 학생에게 리마인드 핑을 전송했습니다.\n대상: ${result.studentNames.join(', ')}`);
    } else {
      alert(`[${result.slot.title}] 현재 단계가 미이행된 결석 학생이 없습니다. (모두 제출 완료 또는 결석 없음)`);
    }
  };

  const handleCategoryChange = (cat: AbsenceCategory) => {
    setNewCategory(cat);
    if (cat === '출석 인정') {
      setNewType('MENSTRUAL');
      setNewTypeName('생리 인정결석');
      setNewReason('생리통으로 인한 출석인정 결석');
    } else if (cat === '질병') {
      setNewType('ILLNESS_UNDER_3');
      setNewTypeName('질병결석 (2일 이내)');
      setNewReason('감기몸살 및 발열');
    } else {
      setNewType('OTHER_PRE_APPROVAL');
      setNewTypeName('기타(사전결재)');
      setNewReason('개인 사정');
    }
  };

  const handleTypeChange = (type: AbsenceType) => {
    setNewType(type);
    if (type === 'FIELD_EXPERIENCE') {
      setNewTypeName('현장체험학습 (NEIS)');
      setNewReason('가족동반 현장체험학습');
    } else if (type === 'MENSTRUAL') {
      setNewTypeName('생리 인정결석');
      setNewReason('생리통으로 인한 출석인정 결석');
    } else if (type === 'ILLNESS_UNDER_3') {
      setNewTypeName('질병결석 (2일 이내)');
      setNewReason('질병 (병원 진료확인서 제출)');
    } else if (type === 'ILLNESS_OVER_3') {
      setNewTypeName('질병결석 (3일 이상)');
      setNewReason('질병 치료 (의사 진단서 제출)');
    } else if (type === 'OFFICIAL_FAMILY') {
      setNewTypeName('경조사 인정결석');
      setNewReason('경조사 참석');
    } else if (type === 'OFFICIAL_INFECTIOUS') {
      setNewTypeName('법정 전염병 격리');
      setNewReason('법정 전염병 격리 치료');
    } else {
      setNewTypeName('기타 인정결석');
    }
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = students.find(s => s.id === newStudentId);
    if (!targetStudent) return;

    createAbsenceRecord({
      student: targetStudent,
      category: newCategory,
      type: newType,
      typeName: newTypeName,
      startDate: newStartDate,
      endDate: newEndDate,
      daysCount: Number(newDaysCount),
      periodText: newPeriodText,
      reason: newReason,
      memo: newMemo,
    });

    setIsNewModalOpen(false);
    loadData();
  };

  const handleMarkAttended = (rec: AbsenceRecord) => {
    markAttended(rec.id);
    loadData();
  };

  const handleRemind = (rec: AbsenceRecord) => {
    triggerRemind(rec.id);
    loadData();
  };

  const handleOpenApprove = (rec: AbsenceRecord) => {
    setSelectedRecordToApprove(rec);
    setApproveMethod('학생 사전 대면 보고');
    setApproveNote('');
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedRecordToApprove) return;
    markApproved(selectedRecordToApprove.id, approveMethod, approveNote);
    setIsApproveModalOpen(false);
    setSelectedRecordToApprove(null);
    loadData();
  };

  const handleOpenNewModal = () => {
    const today = getTodayString();
    setNewStartDate(today);
    setNewEndDate(today);
    setNewDaysCount(1);
    setIsNewModalOpen(true);
  };

  const isDateInRange = (d: string, start: string, end: string) => {
    return d >= start && d <= end;
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.studentName.includes(searchQuery) ||
      `${r.studentNum}`.includes(searchQuery) ||
      r.reason.includes(searchQuery);
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchesDate = !filterOnlySelectedDate || isDateInRange(selectedDashboardDate, r.startDate, r.endDate);
    return matchesSearch && matchesCategory && matchesDate;
  });

  const shiftDashboardDate = (offsetDays: number) => {
    const [y, m, d] = selectedDashboardDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + offsetDays);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDateStr = `${curr.getFullYear()}-${pad(curr.getMonth() + 1)}-${pad(curr.getDate())}`;
    setSelectedDashboardDate(newDateStr);
  };

  const pendingAttendanceRecords = filteredRecords.filter(r => r.status === 'PENDING_ATTENDANCE');
  const attendedNotifiedRecords = filteredRecords.filter(r => r.status === 'ATTENDED_NOTIFIED');
  const pickedUpRecords = filteredRecords.filter(r => r.status === 'FORM_PICKED_UP');
  const submittedRecords = filteredRecords.filter(r => r.status === 'SUBMITTED');
  const approvedRecords = filteredRecords.filter(r => r.status === 'APPROVED');
  const unfulfilledRecords = getUnfulfilledAbsenceRecords();

  const todayCount = records.filter(r => isDateInRange(selectedDashboardDate, r.startDate, r.endDate)).length;

  return (
    <TeacherAuthGuard>
      <main className="min-h-[calc(100vh-4.5rem)] bg-[#fbfaf9] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="family-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="badge-pill badge-stone text-[11px]">
                3학년 2반 교사용
              </span>
              <span className="badge-pill badge-mint text-[11px]">
                ● 실시간 동기화
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#121212] mt-2 tracking-tight">
              결석신고서 출결 대시보드
            </h2>
            <p className="text-xs text-[#7e7e7d] mt-1">
              [등교 확인]을 누르면 학생 스마트폰으로 서류 챙기기 알림이 가며, 제출 시 실시간 핑이 울립니다.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleOpenNewModal}
              className="btn-dark-pill shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>신규 결석 등록</span>
            </button>
          </div>
        </div>

        {/* Dynamic Attendance Date Bar (달력 기준일) */}
        <div className="family-card bg-[#ffffff] border-[#e5d5c3] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#fff8e8] border border-[#ffcd6c] flex items-center justify-center text-lg">
              📅
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#121212]">
                  {formatKoreanDate(selectedDashboardDate)}
                </span>
                {selectedDashboardDate === getTodayString() ? (
                  <span className="badge-pill badge-mint text-[10px]">
                    오늘 (현재 기준)
                  </span>
                ) : (
                  <span className="badge-pill badge-stone text-[10px]">
                    날짜 탐색 모드
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7e7e7d] mt-0.5">
                해당일 결석/체험학습 학생: <strong className="text-[#121212] font-semibold">{todayCount}명</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => shiftDashboardDate(-1)}
              className="px-2.5 py-1.5 rounded-[8px] bg-[#fcfbf9] border border-[#f2f0ed] text-xs font-medium text-[#474645] hover:bg-[#f2f0ed]"
            >
              ◀ 어제
            </button>
            <button
              type="button"
              onClick={() => setSelectedDashboardDate(getTodayString())}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold border transition-colors ${
                selectedDashboardDate === getTodayString()
                  ? 'bg-[#121212] text-white border-[#121212]'
                  : 'bg-[#fff8e8] text-[#d48f00] border-[#ffcd6c] hover:bg-[#ffeec2]'
              }`}
            >
              오늘로 이동
            </button>
            <button
              type="button"
              onClick={() => shiftDashboardDate(1)}
              className="px-2.5 py-1.5 rounded-[8px] bg-[#fcfbf9] border border-[#f2f0ed] text-xs font-medium text-[#474645] hover:bg-[#f2f0ed]"
            >
              내일 ▶
            </button>

            <div className="h-4 w-px bg-[#f2f0ed] hidden sm:block mx-1"></div>

            <button
              type="button"
              onClick={() => setFilterOnlySelectedDate(!filterOnlySelectedDate)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition-colors ${
                filterOnlySelectedDate
                  ? 'bg-[#0086fc] text-white border-[#0086fc]'
                  : 'bg-[#fcfbf9] text-[#474645] border-[#f2f0ed] hover:border-[#e5d5c3]'
              }`}
            >
              {filterOnlySelectedDate ? '✓ 선택일 결석생만 필터링됨' : '모든 결석 현황 보기'}
            </button>
          </div>
        </div>

        {/* ⏰ 3차례 정기 자동 독려 알림 관리 바 (아침 09:30 / 정오 12:30 / 오후 14:30) */}
        <div className="family-card bg-[#ffffff] border-[#ffcd6c]/60 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#f2f0ed]">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-[#fff8e8] text-[#d48f00] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm sm:text-base text-[#121212]">
                    ⏰ 3차례 정기 자동 독려 알림 현황
                  </h3>
                  <span className={`badge-pill text-[10px] font-semibold ${unfulfilledRecords.length > 0 ? 'badge-orange' : 'badge-mint'}`}>
                    단계 미이행 {unfulfilledRecords.length}명
                  </span>
                </div>
                <p className="text-[11px] text-[#7e7e7d] mt-0.5">
                  단계가 이행되지 않은 학생(서류 미수령/미제출)에게 <strong>아침 09:30, 정오 12:30, 오후 14:30</strong> 3차례 자동 핑이 울립니다.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleTriggerSlotReminder('09:30')}
                className="btn-dark-pill text-xs py-2 px-3 shadow-xs flex items-center space-x-1.5"
                title="지금 즉시 미이행 학생 전체에게 독려 핑 발송"
              >
                <Bell className="w-3.5 h-3.5 text-[#ffcd6c]" />
                <span>미이행 학생 전체 즉시 리마인드 핑</span>
              </button>
            </div>
          </div>

          {/* 3 Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {REMINDER_SLOTS.map((slot) => {
              const slotLog = reminderLog.slots[slot.time];
              const isDispatched = !!slotLog;

              return (
                <div
                  key={slot.time}
                  className={`p-3.5 rounded-[12px] border transition-all flex flex-col justify-between space-y-2.5 ${
                    isDispatched
                      ? 'bg-[#fff8e8]/60 border-[#ffcd6c]/80 shadow-2xs'
                      : 'bg-[#fcfbf9] border-[#f2f0ed]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#121212] flex items-center gap-1.5">
                        <span className="text-base">{slot.time === '09:30' ? '🌅' : slot.time === '12:30' ? '🍱' : '🌇'}</span>
                        <span>{slot.periodName}</span>
                      </span>
                      {isDispatched ? (
                        <span className="badge-pill badge-mint text-[10px] font-bold">
                          ✓ 오늘 발송 완료
                        </span>
                      ) : (
                        <span className="badge-pill badge-stone text-[10px]">
                          대기 중 (자동)
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-semibold text-[#474645] mt-1.5">
                      {slot.title} · {slot.targetAction}
                    </p>
                    <p className="text-[10px] text-[#7e7e7d] mt-0.5">
                      {slot.timeDescription}
                    </p>

                    {isDispatched && slotLog && (
                      <div className="mt-2 text-[10px] text-[#d48f00] bg-[#ffffff] p-1.5 rounded-[6px] border border-[#ffcd6c]/40 font-medium">
                        발송 대상: {slotLog.studentCount}명 {slotLog.studentNames.length > 0 && `(${slotLog.studentNames.slice(0, 2).join(', ')}${slotLog.studentNames.length > 2 ? ' 외' : ''})`}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTriggerSlotReminder(slot.time)}
                    className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-[8px] border border-[#e5d5c3] bg-[#ffffff] hover:bg-[#fff0eb] text-[#474645] hover:text-[#ff3e00] transition-colors flex items-center justify-center gap-1 active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-[#d48f00]" />
                    <span>⚡ 지금 테스트 발송</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stat KPI Cards (Warm Storybook Colors) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="family-card">
            <span className="badge-pill badge-honey text-[11px]">등교 확인 대기</span>
            <h3 className="text-2xl font-bold text-[#121212] mt-2">{pendingAttendanceRecords.length}명</h3>
            <p className="text-[11px] text-[#7e7e7d] mt-0.5">등교 확인 시 알림 발송</p>
          </div>

          <div className="family-card">
            <span className="badge-pill badge-orange text-[11px]">서류 미수령 (알림 중)</span>
            <h3 className="text-2xl font-bold text-[#ff3e00] mt-2">{attendedNotifiedRecords.length}명</h3>
            <p className="text-[11px] text-[#7e7e7d] mt-0.5">지속 리마인드 중</p>
          </div>

          <div className="family-card border-l-4 border-l-[#0086fc]">
            <span className="badge-pill badge-sky text-[11px]">제출 완료 (확인 대기)</span>
            <h3 className="text-2xl font-bold text-[#0086fc] mt-2">{submittedRecords.length}건</h3>
            <p className="text-[11px] text-[#7e7e7d] mt-0.5">실물 서류 대조 필요</p>
          </div>

          <div className="family-card">
            <span className="badge-pill badge-mint text-[11px]">최종 승인 완료</span>
            <h3 className="text-2xl font-bold text-[#121212] mt-2">{approvedRecords.length}건</h3>
            <p className="text-[11px] text-[#7e7e7d] mt-0.5">서류 확인 완료</p>
          </div>
        </div>

        {/* Priority Morning Attendance Section */}
        {pendingAttendanceRecords.length > 0 && (
          <div className="family-card bg-[#fffcf5] border-[#ffcd6c]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#e5d5c3]">
              <div className="flex items-center space-x-2">
                <span className="text-base">🏫</span>
                <h3 className="font-semibold text-sm text-[#121212]">
                  아침 등교 출결 확인 ➔ 학생이 등교했나요? [등교 확인]을 누르면 결석계 알림이 즉시 전송됩니다.
                </h3>
              </div>
              <span className="badge-pill badge-honey">{pendingAttendanceRecords.length}명 대기</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingAttendanceRecords.map((rec) => (
                <div key={rec.id} className="bg-white p-3.5 rounded-[8px] border border-[#e5d5c3] flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#121212]">{rec.studentNum}번 {rec.studentName}</span>
                      <span className="badge-pill badge-stone text-[10px]">
                        {rec.typeName}
                      </span>
                    </div>
                    <p className="text-xs text-[#7e7e7d] mt-1">{rec.startDate} · {rec.reason}</p>
                  </div>
                  <button
                    onClick={() => handleMarkAttended(rec)}
                    className="btn-dark-pill text-xs py-1.5 px-3 shrink-0"
                  >
                    <span>등교 확인</span>
                    <span>🏫</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4-Stage Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Col 1: Notified / Uncollected */}
          <div className="family-card flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#ff3e00]"></span>
                <h4 className="font-semibold text-xs text-[#121212]">1. 서류 미수령 (알림 중)</h4>
              </div>
              <span className="badge-pill badge-orange text-[10px]">
                {attendedNotifiedRecords.length}
              </span>
            </div>

            <div className="mt-3 space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
              {attendedNotifiedRecords.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#7e7e7d]">
                  미수령 학생이 없습니다.
                </div>
              ) : (
                attendedNotifiedRecords.map((rec) => (
                  <div key={rec.id} className="bg-[#fcfbf9] p-3.5 rounded-[8px] border border-[#f2f0ed] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#121212]">{rec.studentNum}번 {rec.studentName}</span>
                      <span className="badge-pill badge-stone text-[10px]">
                        {rec.typeName}
                      </span>
                    </div>
                    <p className="text-xs text-[#474645]">{rec.reason}</p>
                    <div className="text-[10px] text-[#7e7e7d]">
                      결석일: {rec.startDate} · 알림 {rec.remindCount}회 전송
                    </div>

                    <div className="pt-2 border-t border-[#f2f0ed] flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[#ff3e00]">⚠️ 미수령</span>
                      <button
                        onClick={() => handleRemind(rec)}
                        className="badge-pill badge-orange hover:bg-[#ff3e00] hover:text-white transition-colors cursor-pointer text-[10px]"
                        title="리마인드 알림 재전송"
                      >
                        <Bell className="w-3 h-3 inline mr-1" />
                        <span>다시 알림</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 2: Picked Up / Writing */}
          <div className="family-card flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-[#0086fc]" />
                <h4 className="font-semibold text-xs text-[#121212]">2. 서류 챙김 (작성 중)</h4>
              </div>
              <span className="badge-pill badge-sky text-[10px]">
                {pickedUpRecords.length}
              </span>
            </div>

            <div className="mt-3 space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
              {pickedUpRecords.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#7e7e7d]">
                  작성 중인 학생이 없습니다.
                </div>
              ) : (
                pickedUpRecords.map((rec) => (
                  <div key={rec.id} className="bg-[#fcfbf9] p-3.5 rounded-[8px] border border-[#f2f0ed] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#121212]">{rec.studentNum}번 {rec.studentName}</span>
                      <span className="badge-pill badge-stone text-[10px]">
                        {rec.typeName}
                      </span>
                    </div>
                    <p className="text-xs text-[#474645]">{rec.reason}</p>
                    <div className="text-[10px] text-[#7e7e7d]">
                      수령 시간: {rec.pickedUpAt ? new Date(rec.pickedUpAt).toLocaleTimeString('ko-KR') : '-'}
                    </div>
                    <div className="pt-2 border-t border-[#f2f0ed] text-[11px] font-medium text-[#0086fc]">
                      ✍️ 자필 작성 및 증빙 동봉 중
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 3: Submitted / Waiting Inspection */}
          <div className="family-card flex flex-col h-full border-t-2 border-t-[#0086fc]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-[#0086fc]" />
                <h4 className="font-semibold text-xs text-[#121212]">3. 제출 완료 (확인 대기)</h4>
              </div>
              <span className="badge-pill badge-sky text-[10px]">
                {submittedRecords.length}
              </span>
            </div>

            <div className="mt-3 space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
              {submittedRecords.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#7e7e7d]">
                  확인 대기 중인 서류가 없습니다.
                </div>
              ) : (
                submittedRecords.map((rec) => (
                  <div key={rec.id} className="bg-[#ffffff] p-3.5 rounded-[8px] border border-[#e5d5c3] shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#121212]">{rec.studentNum}번 {rec.studentName}</span>
                      <span className="badge-pill badge-sky text-[10px]">
                        {rec.typeName}
                      </span>
                    </div>

                    <div className="p-2 bg-[#fcfbf9] rounded-[6px] border border-[#f2f0ed] text-xs">
                      <p className="text-[10px] font-medium text-[#7e7e7d] mb-1">📎 동봉한 증빙서류:</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.attachments.map((att, idx) => (
                          <span key={idx} className="text-[10px] font-medium bg-[#ffffff] text-[#121212] px-1.5 py-0.2 rounded-[4px] border border-[#f2f0ed]">
                            {att}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#474645]">{rec.reason}</p>
                    <div className="text-[10px] text-[#7e7e7d]">
                      제출 시간: {rec.submittedAt ? new Date(rec.submittedAt).toLocaleTimeString('ko-KR') : '방금'}
                    </div>

                    <button
                      onClick={() => handleOpenApprove(rec)}
                      className="btn-dark-pill w-full text-xs py-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>서류 확인 및 최종 승인</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 4: Approved */}
          <div className="family-card flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00ca48]" />
                <h4 className="font-semibold text-xs text-[#121212]">4. 승인 완료 (보관)</h4>
              </div>
              <span className="badge-pill badge-mint text-[10px]">
                {approvedRecords.length}
              </span>
            </div>

            <div className="mt-3 space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
              {approvedRecords.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#7e7e7d]">
                  완료된 내역이 없습니다.
                </div>
              ) : (
                approvedRecords.map((rec) => (
                  <div key={rec.id} className="bg-[#fcfbf9] p-3 rounded-[8px] border border-[#f2f0ed] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#121212]">{rec.studentNum}번 {rec.studentName}</span>
                      <span className="badge-pill badge-stone text-[9px]">
                        {rec.typeName}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7e7e7d]">{rec.startDate} · {rec.reason}</p>
                    <div className="text-[10px] text-[#7e7e7d] flex items-center justify-between pt-1 border-t border-[#f2f0ed]">
                      <span>확인: {rec.verificationMethod || '대면 확인'}</span>
                      <span>{rec.approvedAt ? new Date(rec.approvedAt).toLocaleDateString('ko-KR') : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal 1: New Absence Record */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#121212]/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="family-card max-w-lg w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📄</span>
                <div>
                  <h3 className="font-bold text-base text-[#121212]">결석 학생 등록</h3>
                  <p className="text-[11px] text-[#7e7e7d]">횡성여자고등학교 결석신고서 기준</p>
                </div>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="text-[#7e7e7d] hover:text-[#121212] font-semibold text-sm p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#474645] mb-1">대상 학생 선택</label>
                <select
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full bg-[#fbfaf9] border border-[#e5d5c3] text-[#121212] text-xs rounded-[8px] p-2.5 font-medium"
                >
                  {students.length === 0 ? (
                    <option value="">등록된 학생이 없습니다 (명단 관리에서 등록 필요)</option>
                  ) : (
                    students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.grade}학년 {s.classNum}반 {s.studentNum}번 {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#474645] mb-1">결석 구분</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['출석 인정', '질병', '기타(사전결재)'] as AbsenceCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`py-2 text-xs font-medium rounded-[8px] border transition-all ${
                        newCategory === cat
                          ? 'bg-[#121212] text-white border-[#121212]'
                          : 'bg-[#ffffff] text-[#474645] border-[#f2f0ed] hover:border-[#e5d5c3]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#474645] mb-1">세부 종류</label>
                <div className="grid grid-cols-2 gap-2">
                  {newCategory === '출석 인정' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTypeChange('FIELD_EXPERIENCE')}
                        className={`p-2.5 text-xs font-medium rounded-[8px] border text-left flex items-center justify-between col-span-2 ${
                          newType === 'FIELD_EXPERIENCE' ? 'bg-[#fff8e8] border-[#ffcd6c] text-[#121212]' : 'bg-[#ffffff] border-[#f2f0ed] text-[#474645]'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>🎒</span>
                          <span className="font-bold">현장체험학습 (NEIS 보고서 연동)</span>
                        </div>
                        <span className="badge-pill badge-honey text-[9px]">1학기 9.5일 한도</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTypeChange('MENSTRUAL')}
                        className={`p-2.5 text-xs font-medium rounded-[8px] border text-left flex items-center justify-between ${
                          newType === 'MENSTRUAL' ? 'bg-[#fff8e8] border-[#ffcd6c] text-[#121212]' : 'bg-[#ffffff] border-[#f2f0ed] text-[#474645]'
                        }`}
                      >
                        <span>🌸 생리인정결석</span>
                        <span className="badge-pill badge-honey text-[9px]">월 1회</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTypeChange('OFFICIAL_FAMILY')}
                        className={`p-2.5 text-xs font-medium rounded-[8px] border text-left ${
                          newType === 'OFFICIAL_FAMILY' ? 'bg-[#fcfbf9] border-[#121212] text-[#121212]' : 'bg-[#ffffff] border-[#f2f0ed] text-[#474645]'
                        }`}
                      >
                        <span>🕊️ 경조사</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTypeChange('OFFICIAL_INFECTIOUS')}
                        className={`p-2.5 text-xs font-medium rounded-[8px] border text-left ${
                          newType === 'OFFICIAL_INFECTIOUS' ? 'bg-[#fcfbf9] border-[#121212] text-[#121212]' : 'bg-[#ffffff] border-[#f2f0ed] text-[#474645]'
                        }`}
                      >
                        <span>🏥 법정 전염병</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTypeChange('OFFICIAL_OTHER')}
                        className={`p-2.5 text-xs font-medium rounded-[8px] border text-left ${
                          newType === 'OFFICIAL_OTHER' ? 'bg-[#fcfbf9] border-[#121212] text-[#121212]' : 'bg-[#ffffff] border-[#f2f0ed] text-[#474645]'
                        }`}
                      >
                        <span>기타 인정</span>
                      </button>
                    </>
                  )}

                  {newCategory === '질병' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTypeChange('ILLNESS_UNDER_3')}
                        className={`p-2.5 text-xs font-medium rounded-[8px] border text-left ${
                          newType === 'ILLNESS_UNDER_3' ? 'bg-[#fcfbf9] border-[#121212] text-[#121212]' : 'bg-[#ffffff] border-[#f2f0ed] text-[#474645]'
                        }`}
                      >
                        <span>2일 이내 질병결석</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTypeChange('ILLNESS_OVER_3')}
                        className={`p-2.5 text-xs font-medium rounded-[8px] border text-left ${
                          newType === 'ILLNESS_OVER_3' ? 'bg-[#fcfbf9] border-[#121212] text-[#121212]' : 'bg-[#ffffff] border-[#f2f0ed] text-[#474645]'
                        }`}
                      >
                        <span>3일 이상 질병 (진단서)</span>
                      </button>
                    </>
                  )}

                  {newCategory === '기타(사전결재)' && (
                    <button
                      type="button"
                      onClick={() => handleTypeChange('OTHER_PRE_APPROVAL')}
                      className="p-2.5 text-xs font-medium rounded-[8px] border text-left bg-[#fcfbf9] border-[#121212] text-[#121212] col-span-2"
                    >
                      기타 사전결재 결석
                    </button>
                  )}
                </div>
                {newType === 'FIELD_EXPERIENCE' && (
                  <div className="mt-2.5 p-3 bg-[#fff8e8] rounded-[8px] border border-[#e5d5c3] text-[11px] text-[#343433] space-y-1">
                    <p className="font-bold text-[#d48f00]">🎒 현장체험학습 필수 규정 안내</p>
                    <ul className="list-disc list-inside text-[#474645] space-y-0.5 pl-0.5">
                      <li><strong>신청 기한:</strong> 3일 전 신청 필수 (1학기당 9.5일 한도)</li>
                      <li><strong>보고서 기한:</strong> 복귀 후 <strong>1주일 이내</strong> NEIS 제출 필수 (미제출 시 수기 작성)</li>
                      <li><strong>첨부 사진:</strong> 다녀온 일자마다 1장 (체험 배경 + 동행 보호자 사진 필수)</li>
                      <li><strong>인솔자 위임장:</strong> 보호자 외 다른 인솔자 동행 시 위임장 첨부</li>
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#121212] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-[#121212]" />
                    <span>결석 일자 및 기간 선택 (달력)</span>
                  </span>
                  <span className="badge-pill badge-mint text-[10px]">
                    해당일 자동 반영
                  </span>
                </label>
                <CalendarDatePicker
                  startDate={newStartDate}
                  endDate={newEndDate}
                  onChange={(start, end, count) => {
                    setNewStartDate(start);
                    setNewEndDate(end);
                    setNewDaysCount(count);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#474645] mb-1">결석 사유</label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="btn-sand-pill text-xs py-2 px-3.5"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-dark-pill text-xs py-2 px-4"
                >
                  결석 등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Final Verification and Approval */}
      {isApproveModalOpen && selectedRecordToApprove && (
        <div className="fixed inset-0 z-50 bg-[#121212]/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="family-card max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#e6fbf1] text-[#00ca48] flex items-center justify-center text-xs font-bold">✓</span>
                <div>
                  <h3 className="font-bold text-base text-[#121212]">담임교사 확인 및 최종 승인</h3>
                  <p className="text-[11px] text-[#7e7e7d]">종이 결석신고서 실물 대조</p>
                </div>
              </div>
              <button onClick={() => setIsApproveModalOpen(false)} className="text-[#7e7e7d] hover:text-[#121212] font-semibold text-sm p-1">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="bg-[#fcfbf9] p-3.5 rounded-[8px] border border-[#f2f0ed] space-y-1">
                <p className="text-sm font-bold text-[#121212]">
                  {selectedRecordToApprove.studentNum}번 {selectedRecordToApprove.studentName}
                </p>
                <p className="text-[#474645]">종류: <strong>{selectedRecordToApprove.typeName}</strong></p>
                <p className="text-[#474645]">일자: {selectedRecordToApprove.startDate} ({selectedRecordToApprove.daysCount}일간)</p>
                <p className="text-[#474645]">사유: {selectedRecordToApprove.reason}</p>
                <div className="pt-2 border-t border-[#f2f0ed] mt-2">
                  <span className="font-medium text-[#7e7e7d]">동봉된 증빙서류: </span>
                  <span className="text-[#0086fc] font-semibold">{selectedRecordToApprove.attachments.join(', ') || '없음'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#474645] mb-1.5">
                  확인 방법 (담임교사 확인서)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['학부모 연락', '학생 연락', '학생 사전 대면 보고', '기타'] as VerificationMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setApproveMethod(m)}
                      className={`p-2.5 rounded-[8px] border text-xs font-medium transition-all ${
                        approveMethod === m
                          ? 'bg-[#121212] text-white border-[#121212]'
                          : 'bg-[#ffffff] text-[#474645] border-[#f2f0ed] hover:border-[#e5d5c3]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#474645] mb-1">
                  확인 메모 (선택)
                </label>
                <input
                  type="text"
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="예: 학부모 유선 통화 확인 완료"
                  className="w-full text-xs p-2.5 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px]"
                />
              </div>

              <div className="p-3 bg-[#e6fbf1] text-[#00ca48] rounded-[8px] text-[11px] font-medium">
                "위 신고 내용이 사실과 틀림없음을 확인하고 최종 승인 처리합니다."
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="btn-sand-pill text-xs py-2 px-3.5"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  className="btn-dark-pill text-xs py-2 px-4"
                >
                  최종 승인 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </main>
    </TeacherAuthGuard>
  );
}
