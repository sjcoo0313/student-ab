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
  Sparkles,
  FileSpreadsheet,
  Trash2,
  Edit2,
  RotateCcw,
  Undo2,
  MessageSquare
} from 'lucide-react';
import { 
  getStudents, 
  getAbsenceRecords, 
  saveAbsenceRecords,
  createAbsenceRecord, 
  updateAbsenceRecord,
  updateAbsenceRecordStatus,
  markAttended, 
  markApproved, 
  triggerRemind, 
  subscribeToSyncEvents,
  checkStudentMenstrualMonthlyLimit
} from '@/lib/storage';
import { exportAbsenceStatisticsToExcel } from '@/lib/exportExcel';
import { Student, AbsenceRecord, AbsenceStatus, AttendanceKind, AttendanceCategory, AbsenceType, VerificationMethod } from '@/types';
import TeacherAuthGuard from '@/components/TeacherAuthGuard';
import CalendarDatePicker, { getTodayString, formatKoreanDate } from '@/components/CalendarDatePicker';
import { 
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
  const [activeTab, setActiveTab] = useState<'DOCS' | 'REGISTER'>('DOCS');
  const [reminderLog, setReminderLog] = useState<DailyReminderLog>({ date: getTodayString(), slots: {} });

  // Dashboard Date Navigation & Filtering
  const [selectedDashboardDate, setSelectedDashboardDate] = useState(getTodayString());
  const [filterOnlySelectedDate, setFilterOnlySelectedDate] = useState(false);

  // Filters for Register Tab
  const [registerKindFilter, setRegisterKindFilter] = useState<string>('ALL');
  const [registerCategoryFilter, setRegisterCategoryFilter] = useState<string>('ALL');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedRecordToApprove, setSelectedRecordToApprove] = useState<AbsenceRecord | null>(null);

  // New Attendance Form State (NEIS 표준 출결마감구분)
  const [newStudentId, setNewStudentId] = useState('');
  const [newKind, setNewKind] = useState<AttendanceKind>('결석');
  const [newCategory, setNewCategory] = useState<AttendanceCategory>('질병');
  const [newReason, setNewReason] = useState('감기몸살 및 발열');
  const [newRequiresDocument, setNewRequiresDocument] = useState<boolean>(true);
  const [newStartDate, setNewStartDate] = useState(getTodayString());
  const [newEndDate, setNewEndDate] = useState(getTodayString());
  const [newDaysCount, setNewDaysCount] = useState(1);
  const [newPeriodText, setNewPeriodText] = useState('전일');
  const [newSpecialType, setNewSpecialType] = useState<AbsenceType>('ILLNESS_UNDER_3');
  const [newMemo, setNewMemo] = useState('');
  const [newStatus, setNewStatus] = useState<AbsenceStatus>('PENDING_ATTENDANCE');

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

  // 종류 변경 시 자동 추천 사유 및 서류 알림 설정
  const handleKindChange = (kind: AttendanceKind) => {
    setNewKind(kind);
    // 결석이면서 미인정이 아니면 서류 알림 기본 ON, 그 외(지각/조퇴/결과/미인정)는 기록 전용 기본 OFF
    if (kind === '결석') {
      setNewRequiresDocument(newCategory !== '미인정');
      if (newCategory === '질병') setNewReason('감기몸살 및 발열');
      else if (newCategory === '출석인정') setNewReason('생리통으로 인한 결석');
      else if (newCategory === '미인정') setNewReason('무단 결석');
      else setNewReason('가정 사정 (사전결재)');
      setNewPeriodText('전일');
    } else if (kind === '지각') {
      setNewRequiresDocument(false);
      setNewPeriodText('1교시');
      if (newCategory === '질병') setNewReason('병원 진료 후 등교');
      else if (newCategory === '미인정') setNewReason('늦잠으로 인한 무단 지각');
      else setNewReason('가정 사정 지각');
    } else if (kind === '조퇴') {
      setNewRequiresDocument(false);
      setNewPeriodText('5교시 이후');
      if (newCategory === '질병') setNewReason('두통 및 복통으로 조퇴');
      else if (newCategory === '미인정') setNewReason('무단 조퇴');
      else setNewReason('가정 사정 조퇴');
    } else if (kind === '결과') {
      setNewRequiresDocument(false);
      setNewPeriodText('6교시');
      if (newCategory === '질병') setNewReason('보건실 안정 치료');
      else if (newCategory === '미인정') setNewReason('수업 무단 불참');
      else setNewReason('상담 활동 참여');
    }
  };

  // 구분 변경 시 자동 추천 사유 및 서류 알림 설정
  const handleCategoryChange = (cat: AttendanceCategory) => {
    setNewCategory(cat);
    if (newKind === '결석') {
      if (cat === '출석인정') {
        setNewRequiresDocument(true);
        setNewSpecialType('MENSTRUAL');
        setNewReason('생리통으로 인한 출석인정 결석');
      } else if (cat === '질병') {
        setNewRequiresDocument(true);
        setNewSpecialType('ILLNESS_UNDER_3');
        setNewReason('감기몸살 및 발열');
      } else if (cat === '미인정') {
        setNewRequiresDocument(false); // 미인정은 결석계 서류 불필요
        setNewSpecialType('STANDARD_RECORD');
        setNewReason('무단 결석');
      } else {
        setNewRequiresDocument(true);
        setNewSpecialType('OTHER_PRE_APPROVAL');
        setNewReason('가정 사정 (사전결재)');
      }
    } else {
      setNewRequiresDocument(false);
      setNewSpecialType('STANDARD_RECORD');
      if (cat === '질병') setNewReason(`${newKind === '지각' ? '병원 진료 후 등교' : '질병 ' + newKind}`);
      else if (cat === '미인정') setNewReason(`무단 ${newKind}`);
      else if (cat === '출석인정') setNewReason(`공무 인정 ${newKind}`);
      else setNewReason(`기타 사유 ${newKind}`);
    }
  };

  const handleSubmitRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = students.find(s => s.id === newStudentId);
    if (!targetStudent) return;

    let derivedType: AbsenceType = newSpecialType;
    let derivedTypeName = `${newCategory} ${newKind}`;

    if (newKind === '결석') {
      if (newCategory === '출석인정') {
        if (newSpecialType === 'FIELD_EXPERIENCE') {
          derivedType = 'FIELD_EXPERIENCE';
          derivedTypeName = '현장체험학습 (보고서를 7일이내 NEIS로 제출)';
        } else if (newSpecialType === 'OFFICIAL_FAMILY') {
          derivedType = 'OFFICIAL_FAMILY';
          derivedTypeName = '경조사 인정결석';
        } else if (newSpecialType === 'OFFICIAL_INFECTIOUS') {
          derivedType = 'OFFICIAL_INFECTIOUS';
          derivedTypeName = '법정 전염병 격리';
        } else {
          derivedType = 'MENSTRUAL';
          derivedTypeName = '생리 인정결석';
        }
      } else if (newCategory === '질병') {
        derivedType = newDaysCount >= 3 ? 'ILLNESS_OVER_3' : 'ILLNESS_UNDER_3';
        derivedTypeName = newDaysCount >= 3 ? '질병결석 (3일 이상 진단서)' : '질병결석 (2일 이내)';
      } else if (newCategory === '미인정') {
        derivedType = 'STANDARD_RECORD';
        derivedTypeName = '미인정 결석';
      } else {
        derivedType = 'OTHER_PRE_APPROVAL';
        derivedTypeName = '기타(사전결재) 결석';
      }
    } else {
      derivedType = 'STANDARD_RECORD';
      derivedTypeName = `${newCategory} ${newKind}`;
    }

    // 💡 생리 인정결석 월 1회 초과 가드 (교사 대시보드 작성 차단)
    if (newKind === '결석' && derivedType === 'MENSTRUAL') {
      const menstrualCheck = checkStudentMenstrualMonthlyLimit(targetStudent.id, newStartDate, editingRecordId);
      if (menstrualCheck.exceeded) {
        alert(
          `[생리결석 등록 불가 (월 1회 한도 초과)]\n` +
          `${targetStudent.name} 학생은 이미 이번 달(${newStartDate.substring(0, 7)})에 생리 인정결석(${menstrualCheck.existingRecord?.startDate})이 등록되어 있습니다.\n` +
          `생리 인정결석은 교육과정 출결 규정상 월 1회를 초과하여 등록할 수 없습니다.`
        );
        return;
      }
    }

    if (editingRecordId) {
      const res = updateAbsenceRecord(editingRecordId, {
        student: targetStudent,
        kind: newKind,
        category: newCategory,
        type: derivedType,
        typeName: derivedTypeName,
        startDate: newStartDate,
        endDate: newEndDate,
        daysCount: Number(newDaysCount),
        periodText: newPeriodText,
        reason: newReason,
        requiresDocument: newRequiresDocument,
        status: newRequiresDocument ? newStatus : 'RECORDED',
        memo: newMemo,
      });
      if (!res) return;
      setEditingRecordId(null);
    } else {
      const res = createAbsenceRecord({
        student: targetStudent,
        kind: newKind,
        category: newCategory,
        type: derivedType,
        typeName: derivedTypeName,
        startDate: newStartDate,
        endDate: newEndDate,
        daysCount: Number(newDaysCount),
        periodText: newPeriodText,
        reason: newReason,
        requiresDocument: newRequiresDocument,
        memo: newMemo,
      });
      if (!res) return;
    }

    setIsNewModalOpen(false);
    loadData();
  };

  const handleRevertStatus = (recordId: string, targetStatus: AbsenceStatus, note?: string) => {
    updateAbsenceRecordStatus(recordId, targetStatus, note);
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

  const handleDeleteRecord = (id: string, name: string) => {
    if (confirm(`[${name}] 학생의 해당 출결 기록을 삭제하시겠습니까?`)) {
      const remaining = records.filter(r => r.id !== id);
      saveAbsenceRecords(remaining);
      loadData();
    }
  };

  const handleOpenNewModal = () => {
    setEditingRecordId(null);
    const today = getTodayString();
    setNewStartDate(today);
    setNewEndDate(today);
    setNewDaysCount(1);
    setNewKind('결석');
    setNewCategory('질병');
    setNewReason('감기몸살 및 발열');
    setNewRequiresDocument(true);
    setNewPeriodText('전일');
    setNewMemo('');
    setNewStatus('PENDING_ATTENDANCE');
    if (students.length > 0) setNewStudentId(students[0].id);
    setIsNewModalOpen(true);
  };

  const handleOpenEditModal = (rec: AbsenceRecord) => {
    setEditingRecordId(rec.id);
    setNewStudentId(rec.studentId);
    setNewKind(rec.kind || '결석');
    const normalizedCategory = (rec.category === '출석 인정' ? '출석인정' : rec.category) as AttendanceCategory;
    setNewCategory(normalizedCategory);
    setNewSpecialType(rec.type);
    setNewStartDate(rec.startDate);
    setNewEndDate(rec.endDate);
    setNewDaysCount(rec.daysCount);
    setNewPeriodText(rec.periodText || '전일');
    setNewReason(rec.reason);
    setNewRequiresDocument(rec.requiresDocument !== false);
    setNewStatus(rec.status);
    setNewMemo(rec.memo || '');
    setIsNewModalOpen(true);
  };

  const isDateInRange = (d: string, start: string, end: string) => {
    return d >= start && d <= end;
  };

  const shiftDashboardDate = (offsetDays: number) => {
    const [y, m, d] = selectedDashboardDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + offsetDays);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDateStr = `${curr.getFullYear()}-${pad(curr.getMonth() + 1)}-${pad(curr.getDate())}`;
    setSelectedDashboardDate(newDateStr);
  };

  // 1) 결석계 서류 회수 관리 탭 데이터 (requiresDocument !== false 대상)
  // 등교확인 대기, 서류 미수령, 서류 챙김, 제출함 투입은 날짜가 지나도 최종 승인(APPROVED)될 때까지 무조건 누적 유지!
  const docRecords = records.filter(r => r.requiresDocument !== false);
  const filteredDocRecords = docRecords.filter(r => {
    const matchesSearch = r.studentName.includes(searchQuery) ||
      `${r.studentNum}`.includes(searchQuery) ||
      r.reason.includes(searchQuery);
    // 날짜가 지나도 승인 전까지는 계속 누적되어 보여야 함
    return matchesSearch;
  });

  const pendingAttendanceRecords = filteredDocRecords.filter(r => r.status === 'PENDING_ATTENDANCE');
  const attendedNotifiedRecords = filteredDocRecords.filter(r => r.status === 'ATTENDED_NOTIFIED');
  const pickedUpRecords = filteredDocRecords.filter(r => r.status === 'FORM_PICKED_UP');
  const submittedRecords = filteredDocRecords.filter(r => r.status === 'SUBMITTED');
  const approvedRecords = filteredDocRecords.filter(r => r.status === 'APPROVED');
  const unfulfilledRecords = getUnfulfilledAbsenceRecords();

  // 2) 전체 출결 마감 기록부 탭 데이터 (모든 출결 건: 결석/지각/조퇴/결과)
  const filteredRegisterRecords = records.filter(r => {
    const matchesSearch = r.studentName.includes(searchQuery) ||
      `${r.studentNum}`.includes(searchQuery) ||
      r.reason.includes(searchQuery);
    const matchesKind = registerKindFilter === 'ALL' || (r.kind || '결석') === registerKindFilter;
    const matchesCat = registerCategoryFilter === 'ALL' || r.category === registerCategoryFilter || (registerCategoryFilter === '출석인정' && r.category === '출석 인정');
    const matchesDate = !filterOnlySelectedDate || isDateInRange(selectedDashboardDate, r.startDate, r.endDate);
    return matchesSearch && matchesKind && matchesCat && matchesDate;
  });

  // 전체 통계 카운트
  const totalAbsenceCount = records.filter(r => (r.kind || '결석') === '결석').length;
  const totalLateCount = records.filter(r => r.kind === '지각').length;
  const totalEarlyCount = records.filter(r => r.kind === '조퇴').length;
  const totalSkipCount = records.filter(r => r.kind === '결과').length;

  const todayCount = records.filter(r => isDateInRange(selectedDashboardDate, r.startDate, r.endDate)).length;

  // 3) 모달 내 생리 인정결석 월 1회 초과 실시간 검증
  const isMenstrualAttempt = newKind === '결석' && newCategory === '출석인정' && newSpecialType === 'MENSTRUAL';
  const menstrualCheckResult = (isMenstrualAttempt && newStudentId)
    ? checkStudentMenstrualMonthlyLimit(newStudentId, newStartDate, editingRecordId)
    : { exceeded: false };
  const isMenstrualExceeded = Boolean(menstrualCheckResult.exceeded);

  return (
    <TeacherAuthGuard>
      <main className="min-h-[calc(100vh-4.5rem)] bg-[#fbfaf9] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Top Header Card */}
          <div className="family-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="badge-pill badge-stone text-[11px]">
                  3학년 2반 교사용
                </span>
                <span className="badge-pill badge-mint text-[11px]">
                  ● 실시간 서버 동기화
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#121212] mt-1.5 tracking-tight">
                스마트 출결 관리
              </h2>
              <p className="text-xs text-[#7e7e7d] mt-0.5">
                나이스 출결마감구분 등록 및 결석계 서류 회수·제출 실시간 추적 시스템
              </p>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => exportAbsenceStatisticsToExcel(records, students)}
                className="btn-sand-pill text-xs py-2 px-3 shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                title="출결마감 통계 엑셀 다운로드"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#0086fc]" />
                <span>엑셀 다운로드</span>
              </button>
              <button
                onClick={handleOpenNewModal}
                className="btn-dark-pill shadow-xs text-xs py-2 px-3.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>출결 등록 (출결마감구분)</span>
              </button>
            </div>
          </div>

          {/* View Tab Switcher: [ 📑 결석계 회수 관리 ] vs [ 📋 전체 출결 마감 기록부 ] */}
          <div className="flex items-center border-b border-[#e5d5c3] space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('DOCS')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'DOCS'
                  ? 'border-[#ff3e00] text-[#121212]'
                  : 'border-transparent text-[#7e7e7d] hover:text-[#121212]'
              }`}
            >
              <span>📑 결석계 회수 관리</span>
              <span className="badge-pill badge-orange text-[10px] px-1.5 py-0.2">
                서류 추적 {docRecords.filter(r => r.status !== 'APPROVED').length}건
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REGISTER')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'REGISTER'
                  ? 'border-[#0086fc] text-[#121212]'
                  : 'border-transparent text-[#7e7e7d] hover:text-[#121212]'
              }`}
            >
              <span>📋 전체 출결 마감 기록부</span>
              <span className="badge-pill badge-stone text-[10px] px-1.5 py-0.2">
                총 {records.length}건
              </span>
            </button>
          </div>

          {/* Dynamic Attendance Date Bar (달력 기준일 탐색 바) */}
          <div className="family-card bg-[#ffffff] border-[#e5d5c3] p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#fff8e8] border border-[#ffcd6c] flex items-center justify-center text-base">
                📅
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#121212]">
                    {formatKoreanDate(selectedDashboardDate)}
                  </span>
                  {selectedDashboardDate === getTodayString() ? (
                    <span className="badge-pill badge-mint text-[10px]">
                      오늘
                    </span>
                  ) : (
                    <span className="badge-pill badge-stone text-[10px]">
                      날짜 탐색
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#7e7e7d]">
                  해당일 출결 건수: <strong className="text-[#121212] font-semibold">{todayCount}건</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => shiftDashboardDate(-1)}
                className="px-2.5 py-1.5 rounded-[6px] bg-[#fcfbf9] border border-[#f2f0ed] text-xs font-medium text-[#474645] hover:bg-[#f2f0ed] cursor-pointer"
              >
                ◀ 어제
              </button>
              <button
                type="button"
                onClick={() => setSelectedDashboardDate(getTodayString())}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-bold border transition-colors cursor-pointer ${
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
                className="px-2.5 py-1.5 rounded-[6px] bg-[#fcfbf9] border border-[#f2f0ed] text-xs font-medium text-[#474645] hover:bg-[#f2f0ed] cursor-pointer"
              >
                내일 ▶
              </button>

              <div className="h-4 w-px bg-[#f2f0ed] hidden sm:block mx-1"></div>

              <button
                type="button"
                onClick={() => setFilterOnlySelectedDate(!filterOnlySelectedDate)}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition-colors cursor-pointer ${
                  filterOnlySelectedDate
                    ? 'bg-[#0086fc] text-white border-[#0086fc]'
                    : 'bg-[#fcfbf9] text-[#474645] border-[#f2f0ed] hover:border-[#e5d5c3]'
                }`}
              >
                {filterOnlySelectedDate ? '✓ 선택일만 필터링됨' : '전체 일자 보기'}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: 결석계 회수 관리 (DOCS) */}
          {/* ========================================================================= */}
          {activeTab === 'DOCS' && (
            <div className="space-y-5 animate-in fade-in">
              {/* ⏰ 3차례 정기 자동 독려 알림 관리 바 */}
              <div className="family-card bg-[#ffffff] border-[#ffcd6c]/60 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-[#f2f0ed]">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-[8px] bg-[#fff8e8] text-[#d48f00] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-xs sm:text-sm text-[#121212]">
                          ⏰ 결석계 3차례 정기 자동 독려 현황
                        </h3>
                        <span className={`badge-pill text-[10px] font-semibold ${unfulfilledRecords.length > 0 ? 'badge-orange' : 'badge-mint'}`}>
                          미이행 {unfulfilledRecords.length}명
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7e7e7d]">
                        아침(09:30), 점심(12:30), 종례(14:30)에 미제출 학생에게 자동 핑을 전송합니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {(['09:30', '12:30', '14:30'] as ReminderSlotTime[]).map((time) => {
                      const isExecuted = Boolean(reminderLog.slots[time]?.dispatchedAt);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => handleTriggerSlotReminder(time)}
                          className={`text-[11px] px-2.5 py-1 rounded-[6px] font-semibold border transition-all flex items-center space-x-1 cursor-pointer ${
                            isExecuted
                              ? 'bg-[#e6fbf1] text-[#00ca48] border-[#a3f3ca]'
                              : 'bg-[#fcfbf9] text-[#474645] border-[#e5d5c3] hover:border-[#ffcd6c]'
                          }`}
                        >
                          <span>{time} {isExecuted ? '✓ 완료' : '전송'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 💡 누적 관리 안내 배너 */}
              <div className="bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] px-3.5 py-2.5 rounded-[6px] text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs">
                <div className="flex items-center space-x-2">
                  <span className="text-base">📌</span>
                  <div>
                    <span className="font-bold text-[#1e3a8a]">5단계 결석계 완결 누적 관리: </span>
                    <span>등교 확인부터 서류 제출 및 <strong>5단계 최종 승인까지 전 과정이 누적</strong>되어 한눈에 확인 가능합니다.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-pill bg-[#2563eb] text-white text-[11px] font-bold shrink-0 self-start sm:self-auto">
                    미완결 {pendingAttendanceRecords.length + attendedNotifiedRecords.length + pickedUpRecords.length + submittedRecords.length}명 누적
                  </span>
                  <span className="badge-pill bg-[#16a34a] text-white text-[11px] font-bold shrink-0 self-start sm:self-auto">
                    최종 승인 {approvedRecords.length}건
                  </span>
                </div>
              </div>

              {/* 5-Stage Kanban Workflow Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {/* Col 1: Pending Attendance */}
                <div className="family-card flex flex-col h-full">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#f2f0ed]">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#7e7e7d]" />
                      <h4 className="font-semibold text-xs text-[#121212]">1. 등교 확인 대기</h4>
                    </div>
                    <span className="badge-pill badge-stone text-[10px]" title="날짜 경과 포함 누적 건수">
                      누적 {pendingAttendanceRecords.length}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2 flex-1 overflow-y-auto max-h-[480px]">
                    {pendingAttendanceRecords.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#7e7e7d]">
                        대기 학생이 없습니다.
                      </div>
                    ) : (
                      pendingAttendanceRecords.map((rec) => (
                        <div key={rec.id} className="bg-[#fcfbf9] p-3 rounded-[6px] border border-[#f2f0ed] space-y-1.5 hover:border-[#cbd5e1] transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#121212]">{rec.studentNum}번 {rec.studentName}</span>
                            <div className="flex items-center space-x-1">
                              <span className="badge-pill badge-stone text-[9px]">{rec.typeName}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(rec)}
                                className="text-[#94a3b8] hover:text-[#0086fc] p-1 rounded hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                                title="출결 수정"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#474645] line-clamp-1">{rec.reason}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#7e7e7d]">
                            <span>기간: {rec.startDate} ({rec.daysCount}일)</span>
                            {rec.startDate < getTodayString() ? (
                              <span className="text-[#e11d48] font-bold bg-[#ffe4e6] px-1.5 py-0.5 rounded text-[9px]">
                                {rec.startDate} (경과)
                              </span>
                            ) : rec.startDate === getTodayString() ? (
                              <span className="text-[#059669] font-bold bg-[#d1fae5] px-1.5 py-0.5 rounded text-[9px]">
                                오늘
                              </span>
                            ) : (
                              <span className="text-[#2563eb] font-bold bg-[#dbeafe] px-1.5 py-0.5 rounded text-[9px]">
                                예정
                              </span>
                            )}
                          </div>
                          {(rec.studentMemo || rec.memo) && (
                            <div className="bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] px-2 py-1 rounded text-[10px] leading-tight flex items-start gap-1">
                              <MessageSquare className="w-3 h-3 text-[#d97706] shrink-0 mt-0.5" />
                              <div className="break-all">
                                <span className="font-bold text-[#b45309]">메모:</span> {rec.studentMemo || rec.memo}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => handleMarkAttended(rec)}
                            className="w-full mt-1 bg-[#121212] hover:bg-[#2c2c2b] text-white text-[11px] py-1.5 rounded-[4px] font-semibold transition-colors cursor-pointer"
                          >
                            {rec.type === 'FIELD_EXPERIENCE' ? '🏫 등교 확인 (7일내 NEIS 보고서 알림)' : '🏫 등교 확인 (알림 전송)'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Col 2: Attended Notified (미수령) */}
                <div className="family-card flex flex-col h-full border-t-2 border-t-[#ff3e00]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#f2f0ed]">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#ff3e00]"></span>
                      <h4 className="font-semibold text-xs text-[#121212]">2. 서류 미수령 (알림 중)</h4>
                    </div>
                    <span className="badge-pill badge-orange text-[10px]" title="날짜 경과 포함 누적 건수">
                      누적 {attendedNotifiedRecords.length}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2 flex-1 overflow-y-auto max-h-[480px]">
                    {attendedNotifiedRecords.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#7e7e7d]">
                        미수령 학생이 없습니다.
                      </div>
                    ) : (
                      attendedNotifiedRecords.map((rec) => (
                        <div key={rec.id} className="bg-[#fcfbf9] p-3 rounded-[6px] border border-[#f2f0ed] space-y-1.5 hover:border-[#cbd5e1] transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#121212]">{rec.studentNum}번 {rec.studentName}</span>
                            <div className="flex items-center space-x-1">
                              <span className="badge-pill badge-orange text-[9px]">알림 {rec.remindCount}회</span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(rec)}
                                className="text-[#94a3b8] hover:text-[#0086fc] p-1 rounded hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                                title="출결 수정"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#474645] line-clamp-1">{rec.reason}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#7e7e7d]">
                            <span>기간: {rec.startDate} ({rec.daysCount}일)</span>
                            {rec.startDate < getTodayString() && (
                              <span className="text-[#e11d48] font-bold bg-[#ffe4e6] px-1.5 py-0.5 rounded text-[9px]">
                                {rec.startDate} (경과)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#ff3e00] font-medium">
                              {rec.type === 'FIELD_EXPERIENCE' ? '⚠️ 보고서 7일이내 NEIS 제출' : '⚠️ 미수령'}
                            </span>
                          </div>
                          {(rec.studentMemo || rec.memo) && (
                            <div className="bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] px-2 py-1 rounded text-[10px] leading-tight flex items-start gap-1">
                              <MessageSquare className="w-3 h-3 text-[#d97706] shrink-0 mt-0.5" />
                              <div className="break-all">
                                <span className="font-bold text-[#b45309]">메모:</span> {rec.studentMemo || rec.memo}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-[#f2f0ed] gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRevertStatus(rec.id, 'PENDING_ATTENDANCE', '등교 확인 취소')}
                              className="text-[10px] text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] px-2 py-1 rounded border border-[#cbd5e1] transition-colors cursor-pointer flex items-center gap-1 font-medium bg-white"
                              title="등교 확인을 취소하고 1단계(등교 대기)로 되돌립니다."
                            >
                              <RotateCcw className="w-2.5 h-2.5 text-[#64748b]" />
                              <span>↩ 1단계로</span>
                            </button>
                            <button
                              onClick={() => handleRemind(rec)}
                              className="badge-pill badge-orange hover:bg-[#ff3e00] hover:text-white transition-colors cursor-pointer text-[10px]"
                            >
                              <Bell className="w-3 h-3 inline mr-0.5" />
                              <span>다시 알림</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Col 3: Picked Up (작성 중) */}
                <div className="family-card flex flex-col h-full border-t-2 border-t-[#0086fc]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#f2f0ed]">
                    <div className="flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0086fc]" />
                      <h4 className="font-semibold text-xs text-[#121212]">3. 서류 챙김 (작성 중)</h4>
                    </div>
                    <span className="badge-pill badge-sky text-[10px]" title="날짜 경과 포함 누적 건수">
                      누적 {pickedUpRecords.length}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2 flex-1 overflow-y-auto max-h-[480px]">
                    {pickedUpRecords.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#7e7e7d]">
                        작성 중인 학생이 없습니다.
                      </div>
                    ) : (
                      pickedUpRecords.map((rec) => (
                        <div key={rec.id} className="bg-[#fcfbf9] p-3 rounded-[6px] border border-[#f2f0ed] space-y-1.5 hover:border-[#cbd5e1] transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#121212]">{rec.studentNum}번 {rec.studentName}</span>
                            <div className="flex items-center space-x-1">
                              <span className="badge-pill badge-stone text-[9px]">{rec.typeName}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(rec)}
                                className="text-[#94a3b8] hover:text-[#0086fc] p-1 rounded hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                                title="출결 수정"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#474645] line-clamp-1">{rec.reason}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#7e7e7d]">
                            <span>기간: {rec.startDate} ({rec.daysCount}일)</span>
                            {rec.startDate < getTodayString() && (
                              <span className="text-[#e11d48] font-bold bg-[#ffe4e6] px-1.5 py-0.5 rounded text-[9px]">
                                {rec.startDate} (경과)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#0086fc] font-medium">
                            {rec.type === 'FIELD_EXPERIENCE' ? '💻 보고서를 7일이내 NEIS로 제출 작성 중' : '✍️ 자필 작성 및 증빙 동봉 중'}
                          </div>
                          {(rec.studentMemo || rec.memo) && (
                            <div className="bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] px-2 py-1 rounded text-[10px] leading-tight flex items-start gap-1">
                              <MessageSquare className="w-3 h-3 text-[#d97706] shrink-0 mt-0.5" />
                              <div className="break-all">
                                <span className="font-bold text-[#b45309]">메모:</span> {rec.studentMemo || rec.memo}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-[#f2f0ed] gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRevertStatus(rec.id, 'ATTENDED_NOTIFIED', '서류 미수령으로 되돌림')}
                              className="text-[10px] text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] px-2 py-1 rounded border border-[#cbd5e1] transition-colors cursor-pointer flex items-center gap-1 font-medium bg-white"
                              title="서류 챙김을 취소하고 2단계(서류 미수령)로 되돌립니다."
                            >
                              <RotateCcw className="w-2.5 h-2.5 text-[#64748b]" />
                              <span>↩ 2단계(미수령)로</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevertStatus(rec.id, 'PENDING_ATTENDANCE', '등교 대기로 되돌림')}
                              className="text-[10px] text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f1f5f9] px-1.5 py-1 rounded border border-dashed border-[#cbd5e1] transition-colors cursor-pointer"
                              title="1단계(등교 확인 대기)로 바로 되돌립니다."
                            >
                              <span>1단계로</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Col 4: Submitted (제출 완료) */}
                <div className="family-card flex flex-col h-full border-t-2 border-t-[#00ca48]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#f2f0ed]">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#00ca48]" />
                      <h4 className="font-semibold text-xs text-[#121212]">4. 제출함 투입 (승인 대기)</h4>
                    </div>
                    <span className="badge-pill badge-mint text-[10px]" title="날짜 경과 포함 누적 건수">
                      누적 {submittedRecords.length}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2 flex-1 overflow-y-auto max-h-[480px]">
                    {submittedRecords.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#7e7e7d]">
                        승인 대기 건이 없습니다.
                      </div>
                    ) : (
                      submittedRecords.map((rec) => (
                        <div key={rec.id} className="bg-[#f0fdf4] p-3 rounded-[6px] border border-[#a3f3ca] space-y-1.5 hover:border-[#86efac] transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#121212]">{rec.studentNum}번 {rec.studentName}</span>
                            <div className="flex items-center space-x-1">
                              <span className="badge-pill badge-mint text-[9px]">제출 완료</span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(rec)}
                                className="text-[#94a3b8] hover:text-[#0086fc] p-1 rounded hover:bg-white transition-colors cursor-pointer"
                                title="출결 수정"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#474645] line-clamp-1">{rec.reason}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#7e7e7d]">
                            <span>기간: {rec.startDate} ({rec.daysCount}일)</span>
                            {rec.startDate < getTodayString() && (
                              <span className="text-[#e11d48] font-bold bg-[#ffe4e6] px-1.5 py-0.5 rounded text-[9px]">
                                {rec.startDate} (경과)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#0086fc] truncate">
                            📎 {rec.attachments && rec.attachments.length > 0 ? rec.attachments.join(', ') : '증빙 없음'}
                          </div>
                          {(rec.studentMemo || rec.memo) && (
                            <div className="bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] px-2 py-1 rounded text-[10px] leading-tight flex items-start gap-1">
                              <MessageSquare className="w-3 h-3 text-[#d97706] shrink-0 mt-0.5" />
                              <div className="break-all">
                                <span className="font-bold text-[#b45309]">학생 메모:</span> {rec.studentMemo || rec.memo}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-[#d1fae5]">
                            <button
                              type="button"
                              onClick={() => handleRevertStatus(rec.id, 'FORM_PICKED_UP', '제출함 투입 취소 -> 3단계(작성중)로 되돌림')}
                              className="shrink-0 text-[10px] text-[#475569] hover:text-[#0f172a] hover:bg-white px-2 py-1.5 rounded border border-[#cbd5e1] transition-colors cursor-pointer flex items-center gap-1 font-medium bg-white"
                              title="제출함 투입을 취소하고 3단계(서류 챙김/작성 중)로 되돌립니다."
                            >
                              <RotateCcw className="w-2.5 h-2.5 text-[#64748b]" />
                              <span>↩ 3단계로</span>
                            </button>
                            <button
                              onClick={() => handleOpenApprove(rec)}
                              className="flex-1 bg-[#00ca48] hover:bg-[#00b03f] text-white text-[11px] py-1.5 px-2 rounded-[4px] font-semibold transition-colors cursor-pointer truncate text-center"
                            >
                              {rec.type === 'FIELD_EXPERIENCE' ? '✓ NEIS 승인' : '✓ 종이 서류 대조·승인'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Col 5: Approved (최종 승인 완료) */}
                <div className="family-card flex flex-col h-full border-t-2 border-t-[#16a34a]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#f2f0ed]">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" />
                      <h4 className="font-semibold text-xs text-[#121212]">5. 최종 승인 완료</h4>
                    </div>
                    <span className="badge-pill badge-mint text-[10px]" title="날짜 경과 포함 누적 승인 건수">
                      누적 {approvedRecords.length}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2 flex-1 overflow-y-auto max-h-[480px]">
                    {approvedRecords.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#7e7e7d]">
                        승인 완료 건이 없습니다.
                      </div>
                    ) : (
                      approvedRecords.map((rec) => (
                        <div key={rec.id} className="bg-[#f0fdf4] p-3 rounded-[6px] border border-[#86efac] space-y-1.5 hover:border-[#4ade80] transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#121212]">{rec.studentNum}번 {rec.studentName}</span>
                            <div className="flex items-center space-x-1">
                              <span className="badge-pill badge-mint text-[9px]">✓ 승인 완료</span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(rec)}
                                className="text-[#94a3b8] hover:text-[#0086fc] p-1 rounded hover:bg-white transition-colors cursor-pointer"
                                title="출결 수정"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#474645] line-clamp-1">{rec.reason}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#7e7e7d]">
                            <span>기간: {rec.startDate} ({rec.daysCount}일)</span>
                            <span className="text-[#16a34a] font-medium text-[9px]">
                              {rec.verificationMethod || '대면 확인'}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#0086fc] truncate">
                            📎 {rec.attachments && rec.attachments.length > 0 ? rec.attachments.join(', ') : '증빙 없음'}
                          </div>
                          {(rec.studentMemo || rec.memo) && (
                            <div className="bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] px-2 py-1 rounded text-[10px] leading-tight flex items-start gap-1">
                              <MessageSquare className="w-3 h-3 text-[#d97706] shrink-0 mt-0.5" />
                              <div className="break-all">
                                <span className="font-bold text-[#b45309]">학생 메모:</span> {rec.studentMemo || rec.memo}
                              </div>
                            </div>
                          )}
                          {rec.approvedAt && (
                            <div className="text-[9px] text-[#64748b]">
                              승인일: {new Date(rec.approvedAt).toLocaleDateString('ko-KR')}
                            </div>
                          )}
                          <div className="pt-1 border-t border-[#d1fae5] flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRevertStatus(rec.id, 'SUBMITTED', '최종 승인 취소 -> 4단계(승인 대기)로 되돌림')}
                              className="text-[10px] text-[#475569] hover:text-[#0f172a] hover:bg-white px-2 py-1 rounded border border-[#cbd5e1] transition-colors cursor-pointer flex items-center gap-1 font-medium bg-white"
                              title="최종 승인을 취소하고 4단계(제출함 투입/승인 대기)로 되돌립니다."
                            >
                              <RotateCcw className="w-2.5 h-2.5 text-[#64748b]" />
                              <span>↩ 4단계(승인 대기)로</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: 전체 출결 마감 기록부 (REGISTER - 나이스 표준 출결 일지) */}
          {/* ========================================================================= */}
          {activeTab === 'REGISTER' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Quick Summary Cards (종류별 집계) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-[8px] border border-[#e5d5c3] shadow-2xs">
                  <div className="text-[11px] text-[#7e7e7d] font-semibold">결석 합계</div>
                  <div className="text-xl font-bold text-[#e11d48] mt-1">{totalAbsenceCount}건</div>
                </div>
                <div className="bg-white p-3 rounded-[8px] border border-[#e5d5c3] shadow-2xs">
                  <div className="text-[11px] text-[#7e7e7d] font-semibold">지각 합계</div>
                  <div className="text-xl font-bold text-[#d97706] mt-1">{totalLateCount}건</div>
                </div>
                <div className="bg-white p-3 rounded-[8px] border border-[#e5d5c3] shadow-2xs">
                  <div className="text-[11px] text-[#7e7e7d] font-semibold">조퇴 합계</div>
                  <div className="text-xl font-bold text-[#0284c7] mt-1">{totalEarlyCount}건</div>
                </div>
                <div className="bg-white p-3 rounded-[8px] border border-[#e5d5c3] shadow-2xs">
                  <div className="text-[11px] text-[#7e7e7d] font-semibold">결과 합계</div>
                  <div className="text-xl font-bold text-[#7c3aed] mt-1">{totalSkipCount}건</div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="family-card p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#121212] flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5 text-[#7e7e7d]" />
                    <span>종류:</span>
                  </span>
                  {(['ALL', '결석', '지각', '조퇴', '결과'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setRegisterKindFilter(k)}
                      className={`text-xs px-2.5 py-1 rounded-[6px] font-medium border transition-colors cursor-pointer ${
                        registerKindFilter === k
                          ? 'bg-[#121212] text-white border-[#121212]'
                          : 'bg-[#fcfbf9] text-[#474645] border-[#f2f0ed] hover:border-[#e5d5c3]'
                      }`}
                    >
                      {k === 'ALL' ? '전체' : k}
                    </button>
                  ))}

                  <div className="h-4 w-px bg-[#f2f0ed] hidden sm:block mx-1"></div>

                  <span className="text-xs font-bold text-[#121212]">구분:</span>
                  {(['ALL', '질병', '미인정', '기타', '출석인정'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRegisterCategoryFilter(c)}
                      className={`text-xs px-2.5 py-1 rounded-[6px] font-medium border transition-colors cursor-pointer ${
                        registerCategoryFilter === c
                          ? 'bg-[#0086fc] text-white border-[#0086fc]'
                          : 'bg-[#fcfbf9] text-[#474645] border-[#f2f0ed] hover:border-[#e5d5c3]'
                      }`}
                    >
                      {c === 'ALL' ? '전체' : c}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-56">
                  <Search className="w-3.5 h-3.5 text-[#7e7e7d] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="학생명, 번호, 사유 검색..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#fbfaf9] border border-[#e5d5c3] rounded-[6px]"
                  />
                </div>
              </div>

              {/* NEIS-Style Complete Attendance Table */}
              <div className="family-card p-0 overflow-hidden shadow-xs border border-[#e5d5c3]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8fafc] border-b border-[#cbd5e1] text-[#334155] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">일자</th>
                        <th className="py-2.5 px-3">학번 / 성명</th>
                        <th className="py-2.5 px-3">종류</th>
                        <th className="py-2.5 px-3">구분</th>
                        <th className="py-2.5 px-3">교시/기간</th>
                        <th className="py-2.5 px-3">사유</th>
                        <th className="py-2.5 px-3">결석계 서류상태</th>
                        <th className="py-2.5 px-3 text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {filteredRegisterRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-xs text-[#7e7e7d]">
                            등록된 출결 내역이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredRegisterRecords.map((rec) => {
                          const kind = rec.kind || '결석';
                          return (
                            <tr key={rec.id} className="hover:bg-[#fcfbf9] transition-colors">
                              <td className="py-2.5 px-3 text-[#475569] font-medium whitespace-nowrap">
                                {rec.startDate} {rec.endDate !== rec.startDate ? `~ ${rec.endDate}` : ''}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-[#0f172a] whitespace-nowrap">
                                {rec.studentNum}번 {rec.studentName}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold ${
                                  kind === '결석' ? 'bg-[#ffe4e6] text-[#e11d48]' :
                                  kind === '지각' ? 'bg-[#fef3c7] text-[#b45309]' :
                                  kind === '조퇴' ? 'bg-[#e0f2fe] text-[#0284c7]' :
                                  'bg-[#f3e8ff] text-[#7c3aed]'
                                }`}>
                                  {kind}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold ${
                                  rec.category === '질병' ? 'bg-[#dbeafe] text-[#1e40af]' :
                                  rec.category === '미인정' ? 'bg-[#fee2e2] text-[#991b1b]' :
                                  rec.category === '출석인정' || rec.category === '출석 인정' ? 'bg-[#dcfce7] text-[#15803d]' :
                                  'bg-[#f1f5f9] text-[#475569]'
                                }`}>
                                  {rec.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[#64748b] whitespace-nowrap">
                                {rec.periodText || `${rec.daysCount}일간`}
                              </td>
                              <td className="py-2.5 px-3 text-[#1e293b] max-w-xs" title={rec.reason}>
                                <div className="truncate">{rec.reason}</div>
                                {(rec.studentMemo || rec.memo) && (
                                  <div className="text-[10px] text-[#b45309] bg-[#fffbeb] px-1.5 py-0.5 rounded border border-[#fef3c7] mt-0.5 inline-flex items-center gap-1 max-w-full truncate">
                                    <MessageSquare className="w-2.5 h-2.5 text-[#d97706] shrink-0" />
                                    <span className="truncate">메모: {rec.studentMemo || rec.memo}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {!rec.requiresDocument ? (
                                  <span className="text-[11px] text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded">
                                    📋 출결 기록완료
                                  </span>
                                ) : rec.status === 'APPROVED' ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded font-medium">
                                      ✓ 서류 승인완료
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRevertStatus(rec.id, 'SUBMITTED', '승인 취소 -> 제출함 대기로 되돌림')}
                                      className="text-[10px] text-[#b45309] hover:bg-[#fef3c7] px-1.5 py-0.5 rounded border border-[#fde68a] transition-colors cursor-pointer inline-flex items-center gap-0.5 font-medium bg-white"
                                      title="승인을 취소하고 4단계(제출함 투입/대기)로 되돌립니다."
                                    >
                                      <RotateCcw className="w-2.5 h-2.5 text-[#d97706]" />
                                      <span>↩ 승인취소</span>
                                    </button>
                                  </div>
                                ) : rec.status === 'SUBMITTED' ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-[#0284c7] bg-[#e0f2fe] px-2 py-0.5 rounded font-medium">
                                      📨 제출함 투입(대기)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRevertStatus(rec.id, 'FORM_PICKED_UP', '3단계 작성중으로 되돌림')}
                                      className="text-[10px] text-[#475569] hover:bg-[#f1f5f9] px-1.5 py-0.5 rounded border border-[#cbd5e1] transition-colors cursor-pointer inline-flex items-center gap-0.5 font-medium bg-white"
                                      title="제출함 투입을 취소하고 3단계(서류 작성 중)로 되돌립니다."
                                    >
                                      <RotateCcw className="w-2.5 h-2.5 text-[#64748b]" />
                                      <span>↩ 작성중으로</span>
                                    </button>
                                  </div>
                                ) : rec.status === 'FORM_PICKED_UP' ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-[#0284c7] bg-[#f0f9ff] px-2 py-0.5 rounded font-medium">
                                      ✍️ 서류 작성중
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRevertStatus(rec.id, 'ATTENDED_NOTIFIED', '2단계 미수령으로 되돌림')}
                                      className="text-[10px] text-[#475569] hover:bg-[#f1f5f9] px-1.5 py-0.5 rounded border border-[#cbd5e1] transition-colors cursor-pointer inline-flex items-center gap-0.5 font-medium bg-white"
                                      title="서류 챙김을 취소하고 2단계(서류 미수령)로 되돌립니다."
                                    >
                                      <RotateCcw className="w-2.5 h-2.5 text-[#64748b]" />
                                      <span>↩ 미수령으로</span>
                                    </button>
                                  </div>
                                ) : rec.status === 'ATTENDED_NOTIFIED' ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded font-medium">
                                      ⚠️ 서류 미수령
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRevertStatus(rec.id, 'PENDING_ATTENDANCE', '등교대기로 되돌림')}
                                      className="text-[10px] text-[#475569] hover:bg-[#f1f5f9] px-1.5 py-0.5 rounded border border-[#cbd5e1] transition-colors cursor-pointer inline-flex items-center gap-0.5 font-medium bg-white"
                                      title="등교 확인을 취소하고 1단계(등교 대기)로 되돌립니다."
                                    >
                                      <RotateCcw className="w-2.5 h-2.5 text-[#64748b]" />
                                      <span>↩ 등교대기로</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-[#64748b] bg-[#f8fafc] px-2 py-0.5 rounded font-medium border border-[#e2e8f0]">
                                    ⏳ 1단계(등교 대기)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(rec)}
                                    className="text-[#475569] hover:text-[#0086fc] hover:bg-[#f1f5f9] px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 border border-[#e2e8f0]"
                                    title="출결 기록 수정"
                                  >
                                    <Edit2 className="w-3 h-3 text-[#0086fc]" />
                                    <span>수정</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRecord(rec.id, rec.studentName)}
                                    className="text-[#94a3b8] hover:text-[#e11d48] hover:bg-[#fef2f2] px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 border border-[#f1f5f9]"
                                    title="기록 삭제"
                                  >
                                    <Trash2 className="w-3 h-3 text-[#e11d48]" />
                                    <span>삭제</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* Modal 1: 출결마감구분 (NEIS 표준 팝업 매핑 - media_1789514327311.png 100% 동일) */}
          {/* ========================================================================= */}
          {isNewModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white max-w-lg w-full rounded-[6px] shadow-2xl border border-[#b8c4d4] overflow-hidden animate-in fade-in">
                
                {/* Modal Title Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8fafc] border-b border-[#cbd5e1]">
                  <h3 className="font-bold text-sm text-[#1e293b] tracking-tight flex items-center gap-1.5">
                    {editingRecordId ? (
                      <>
                        <Edit2 className="w-4 h-4 text-[#0086fc]" />
                        <span>출결 기록 수정 (나이스 출결마감구분)</span>
                      </>
                    ) : (
                      <span>출결마감구분</span>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewModalOpen(false);
                      setEditingRecordId(null);
                    }}
                    className="text-[#64748b] hover:text-[#0f172a] font-bold text-base leading-none p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitRecord} className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* Target Student Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">
                      대상 학생 선택 (3학년 2반)
                    </label>
                    <select
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-[#0f172a] text-xs rounded-[4px] p-2 font-medium"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.grade}학년 {s.classNum}반 {s.studentNum}번 {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* NEIS Grid Form Table (사진과 동일한 레이아웃) */}
                  <div className="border border-[#cbd5e1] rounded-[4px] overflow-hidden text-xs">
                    {/* Row 1: 종류 */}
                    <div className="flex border-b border-[#cbd5e1]">
                      <div className="w-20 bg-[#f1f5f9] text-[#334155] font-bold flex items-center justify-center border-r border-[#cbd5e1] py-2.5 shrink-0">
                        종류
                      </div>
                      <div className="flex-1 flex flex-wrap items-center gap-4 px-3 py-2 bg-white">
                        {(['결석', '지각', '조퇴', '결과'] as AttendanceKind[]).map((k) => (
                          <label key={k} className="inline-flex items-center space-x-1.5 cursor-pointer font-medium text-[#1e293b]">
                            <input
                              type="radio"
                              name="attendanceKind"
                              checked={newKind === k}
                              onChange={() => handleKindChange(k)}
                              className="w-3.5 h-3.5 text-[#1e293b] accent-[#1e293b]"
                            />
                            <span>{k}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Row 2: 구분 */}
                    <div className="flex border-b border-[#cbd5e1]">
                      <div className="w-20 bg-[#f1f5f9] text-[#334155] font-bold flex items-center justify-center border-r border-[#cbd5e1] py-2.5 shrink-0">
                        구분
                      </div>
                      <div className="flex-1 flex flex-wrap items-center gap-3.5 px-3 py-2 bg-white">
                        {(['질병', '미인정', '기타', '출석인정'] as AttendanceCategory[]).map((c) => (
                          <label key={c} className="inline-flex items-center space-x-1.5 cursor-pointer font-medium text-[#1e293b]">
                            <input
                              type="radio"
                              name="attendanceCategory"
                              checked={newCategory === c}
                              onChange={() => handleCategoryChange(c)}
                              className="w-3.5 h-3.5 text-[#1e293b] accent-[#1e293b]"
                            />
                            <span>{c}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Row 3: 사유 */}
                    <div className="flex">
                      <div className="w-20 bg-[#f1f5f9] text-[#334155] font-bold flex items-center justify-center border-r border-[#cbd5e1] py-2.5 shrink-0">
                        사유
                      </div>
                      <div className="flex-1 p-2 bg-white">
                        <input
                          type="text"
                          value={newReason}
                          onChange={(e) => setNewReason(e.target.value)}
                          placeholder="사유를 입력하세요 (예: 감기몸살, 병원 진료, 생리통 등)"
                          className="w-full bg-white border border-[#cbd5e1] rounded-[2px] px-2.5 py-1.5 text-xs text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detail options for Period when Kind is 결과/지각/조퇴 */}
                  {(newKind === '결과' || newKind === '지각' || newKind === '조퇴') && (
                    <div className="bg-[#f8fafc] p-2.5 rounded-[4px] border border-[#cbd5e1] flex items-center justify-between">
                      <span className="font-bold text-[#334155] text-[11px]">
                        교시 / 시간 표기:
                      </span>
                      <div className="flex items-center gap-1">
                        {['1교시', '2교시', '3교시', '4교시', '5교시', '6교시', '7교시'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewPeriodText(p)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                              newPeriodText === p ? 'bg-[#1e293b] text-white border-[#1e293b]' : 'bg-white text-[#475569] border-[#cbd5e1]'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detail options when Category is 출석인정 and Kind is 결석 */}
                  {newKind === '결석' && newCategory === '출석인정' && (
                    <div className="bg-[#fff8e8] p-2.5 rounded-[4px] border border-[#ffcd6c] space-y-1.5">
                      <div className="font-bold text-[11px] text-[#b45309]">인정결석 세부 선택:</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setNewSpecialType('MENSTRUAL');
                            setNewReason('생리통으로 인한 출석인정 결석');
                          }}
                          className={`p-1.5 text-xs rounded border text-left font-medium cursor-pointer ${
                            newSpecialType === 'MENSTRUAL' ? 'bg-[#1e293b] text-white' : 'bg-white text-[#334155]'
                          }`}
                        >
                          🌸 생리인정 (월 1회)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewSpecialType('FIELD_EXPERIENCE');
                            setNewReason('가족동반 현장체험학습');
                          }}
                          className={`p-1.5 text-xs rounded border text-left font-medium cursor-pointer ${
                            newSpecialType === 'FIELD_EXPERIENCE' ? 'bg-[#1e293b] text-white' : 'bg-white text-[#334155]'
                          }`}
                        >
                          🎒 현장체험학습 (보고서를 7일이내 NEIS로 제출)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewSpecialType('OFFICIAL_FAMILY');
                            setNewReason('경조사 참석');
                          }}
                          className={`p-1.5 text-xs rounded border text-left font-medium cursor-pointer ${
                            newSpecialType === 'OFFICIAL_FAMILY' ? 'bg-[#1e293b] text-white' : 'bg-white text-[#334155]'
                          }`}
                        >
                          🕊️ 경조사 인정
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewSpecialType('OFFICIAL_INFECTIOUS');
                            setNewReason('법정 전염병 격리 치료');
                          }}
                          className={`p-1.5 text-xs rounded border text-left font-medium cursor-pointer ${
                            newSpecialType === 'OFFICIAL_INFECTIOUS' ? 'bg-[#1e293b] text-white' : 'bg-white text-[#334155]'
                          }`}
                        >
                          🏥 법정 전염병
                        </button>
                      </div>

                      {/* 생리결석 월 1회 초과 경고 배너 */}
                      {isMenstrualAttempt && isMenstrualExceeded && (
                        <div className="p-2.5 bg-[#fef2f2] border border-[#fca5a5] rounded text-xs text-[#991b1b] flex items-start gap-2 animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
                          <div className="leading-snug">
                            <span className="font-bold">⛔ 생리 인정결석 월 1회 초과 (작성 불가)</span>
                            <p className="mt-0.5 text-[11px] text-[#b91c1c]">
                              {students.find(s => s.id === newStudentId)?.name} 학생은 이미 이번 달({newStartDate.substring(0, 7)})에 생리 인정결석({menstrualCheckResult.existingRecord?.startDate})이 등록되어 있습니다. 교육청 출결 관리 규정상 월 1회를 초과하여 추가 등록할 수 없습니다.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dates Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">
                      출결 일자 및 기간
                    </label>
                    <CalendarDatePicker
                      startDate={newStartDate}
                      endDate={newEndDate}
                      onChange={(start, end, count) => {
                        setNewStartDate(start);
                        setNewEndDate(end);
                        setNewDaysCount(count);
                        if (newKind === '결석' && newCategory === '질병') {
                          if (count >= 3) {
                            setNewSpecialType('ILLNESS_OVER_3');
                            if (newReason === '감기몸살 및 발열') setNewReason('질병 치료 (3일 이상 진단서)');
                          } else {
                            setNewSpecialType('ILLNESS_UNDER_3');
                            if (newReason === '질병 치료 (3일 이상 진단서)') setNewReason('감기몸살 및 발열');
                          }
                        }
                      }}
                    />

                    {/* 질병결석 3일 이상 vs 2일 이내 학교 서식 기준 안내 배너 */}
                    {newKind === '결석' && newCategory === '질병' && (
                      newDaysCount >= 3 ? (
                        <div className="p-3 bg-[#fef2f2] border border-[#fca5a5] rounded-[6px] text-xs space-y-1 mt-2 animate-in fade-in">
                          <div className="font-bold text-[#b91c1c] flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0" />
                            <span>3일 이상 질병결석 서류 안내 (학교 결석신고서 기준)</span>
                          </div>
                          <p className="text-[11px] text-[#7f1d1d] leading-relaxed">
                            • 결석 기간이 <strong>{newDaysCount}일(3일 이상)</strong>이므로 결석신고서 규정에 따라 반드시 <strong>의사 진단서</strong> 또는 <strong>의사 소견서</strong> 중 1부를 제출해야 합니다.<br />
                            • 2일 이내에 사용되는 단순 진료확인서·처방전은 3일 이상 결석 시 증빙으로 인정되지 않으며, 학생 모바일 앱에도 <strong>진단서/소견서 지참 필수 안내</strong>가 자동으로 전달됩니다.
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-[#f0f9ff] border border-[#bae6fd] rounded-[6px] text-xs space-y-0.5 mt-2 animate-in fade-in">
                          <div className="font-bold text-[#0369a1] flex items-center gap-1">
                            <span>📋 2일 이내 질병결석 서류 안내</span>
                          </div>
                          <p className="text-[11px] text-[#0c4a6e]">
                            2일 이내 질병결석은 진료확인서, 학부모 의견서, 처방전/약봉투 등으로 제출 가능합니다.
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  {/* Requires Document Toggle */}
                  <div className="p-3 bg-[#f0fdf4] border border-[#86efac] rounded-[4px] space-y-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRequiresDocument}
                        onChange={(e) => setNewRequiresDocument(e.target.checked)}
                        className="w-4 h-4 text-[#16a34a] accent-[#16a34a] rounded"
                      />
                      <span className="font-bold text-xs text-[#166534]">
                        📢 학생에게 결석계·증빙서류 제출 알림 발송
                      </span>
                    </label>
                    <p className="text-[11px] text-[#15803d] pl-6">
                      {newRequiresDocument
                        ? '✓ 체크됨: 학생 스마트폰으로 양식 챙기기 알림이 발송되고, 제출함 투입을 추적합니다.'
                        : '✗ 미체크: 학생에게 서류 제출을 요구하지 않고, 출결 마감 기록부에만 기록합니다.'}
                    </p>
                  </div>

                  {/* Editing: Direct Stage Selector & Rollback */}
                  {editingRecordId && newRequiresDocument && (
                    <div className="bg-[#f8fafc] p-3 rounded-[4px] border border-[#cbd5e1] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-[#1e293b] flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-[#0086fc]" />
                          <span>진행 단계 직접 설정 (단계 되돌리기 / 즉시 이동)</span>
                        </span>
                        <span className="text-[10px] text-[#64748b]">원하는 단계를 클릭하면 즉시 적용됩니다</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { val: 'PENDING_ATTENDANCE' as AbsenceStatus, label: '1. 등교대기' },
                          { val: 'ATTENDED_NOTIFIED' as AbsenceStatus, label: '2. 서류미수령' },
                          { val: 'FORM_PICKED_UP' as AbsenceStatus, label: '3. 서류챙김' },
                          { val: 'SUBMITTED' as AbsenceStatus, label: '4. 제출함투입' },
                        ].map((step) => (
                          <button
                            key={step.val}
                            type="button"
                            onClick={() => setNewStatus(step.val)}
                            className={`py-1.5 px-2 text-[11px] rounded font-semibold border text-center transition-all cursor-pointer ${
                              newStatus === step.val
                                ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-xs'
                                : 'bg-white text-[#475569] border-[#cbd5e1] hover:border-[#94a3b8]'
                            }`}
                          >
                            {newStatus === step.val ? `✓ ${step.label}` : step.label}
                          </button>
                        ))}
                      </div>
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => setNewStatus('APPROVED')}
                          className={`w-full py-1.5 px-3 text-[11px] rounded font-semibold border text-center transition-all cursor-pointer ${
                            newStatus === 'APPROVED'
                              ? 'bg-[#15803d] text-white border-[#15803d]'
                              : 'bg-white text-[#15803d] border-[#86efac] hover:bg-[#dcfce7]'
                          }`}
                        >
                          {newStatus === 'APPROVED' ? '✓ 5. 최종 승인 완료 상태' : '✓ 5. 최종 승인 완료 상태로 지정'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Memo / Notes input */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">
                      비고 / 특이사항 (선택)
                    </label>
                    <input
                      type="text"
                      value={newMemo}
                      onChange={(e) => setNewMemo(e.target.value)}
                      placeholder="특이사항이나 전달 메모를 입력하세요 (예: 학부모 통화 완료, 보건실 기록 대조 등)"
                      className="w-full bg-white border border-[#cbd5e1] rounded-[2px] px-2.5 py-1.5 text-xs text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                    />
                  </div>

                  {/* Modal Action Buttons matching NEIS screenshot */}
                  <div className="pt-3 flex items-center justify-between border-t border-[#f1f5f9] mt-2">
                    {editingRecordId ? (
                      <button
                        type="button"
                        onClick={() => {
                          const currentRec = records.find(r => r.id === editingRecordId);
                          if (currentRec) {
                            handleDeleteRecord(currentRec.id, currentRec.studentName);
                            setIsNewModalOpen(false);
                            setEditingRecordId(null);
                          }
                        }}
                        className="bg-white hover:bg-[#fee2e2] text-[#e11d48] border border-[#fca5a5] px-3 py-1.5 rounded-[3px] text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>기록 삭제</span>
                      </button>
                    ) : (
                      <div></div>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        type="submit"
                        disabled={isMenstrualExceeded}
                        className={`px-5 py-1.5 rounded-[3px] text-xs font-bold shadow-xs cursor-pointer min-w-[70px] ${
                          isMenstrualExceeded
                            ? 'bg-[#94a3b8] text-white cursor-not-allowed opacity-70'
                            : 'bg-[#243757] hover:bg-[#1d2d47] text-white'
                        }`}
                        title={isMenstrualExceeded ? '생리 인정결석은 월 1회를 초과하여 등록할 수 없습니다.' : ''}
                      >
                        {isMenstrualExceeded ? '🚫 월 1회 한도 초과' : (editingRecordId ? '수정 완료' : '적용')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewModalOpen(false);
                          setEditingRecordId(null);
                        }}
                        className="bg-white hover:bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1] px-5 py-1.5 rounded-[3px] text-xs font-medium cursor-pointer min-w-[70px]"
                      >
                        닫기
                      </button>
                    </div>
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
                  <button onClick={() => setIsApproveModalOpen(false)} className="text-[#7e7e7d] hover:text-[#121212] font-semibold text-sm p-1 cursor-pointer">
                    ✕
                  </button>
                </div>

                <div className="mt-4 space-y-3.5 text-xs">
                  <div className="bg-[#fcfbf9] p-3.5 rounded-[8px] border border-[#f2f0ed] space-y-1">
                    <p className="text-sm font-bold text-[#121212]">
                      {selectedRecordToApprove.studentNum}번 {selectedRecordToApprove.studentName}
                    </p>
                    <p className="text-[#474645]">구분: <strong>{selectedRecordToApprove.category} ({selectedRecordToApprove.kind || '결석'})</strong></p>
                    <p className="text-[#474645]">일자: {selectedRecordToApprove.startDate} ({selectedRecordToApprove.daysCount}일간)</p>
                    <p className="text-[#474645]">사유: {selectedRecordToApprove.reason}</p>
                    <div className="pt-2 border-t border-[#f2f0ed] mt-2">
                      <span className="font-medium text-[#7e7e7d]">동봉된 증빙서류: </span>
                      <span className="text-[#0086fc] font-semibold">{selectedRecordToApprove.attachments && selectedRecordToApprove.attachments.length > 0 ? selectedRecordToApprove.attachments.join(', ') : '없음'}</span>
                    </div>
                    {(selectedRecordToApprove.studentMemo || selectedRecordToApprove.memo) && (
                      <div className="pt-2 border-t border-[#f2f0ed] mt-2 bg-[#fffbeb] p-2.5 rounded-[6px] border border-[#fef3c7]">
                        <span className="font-bold text-[#b45309] flex items-center gap-1 mb-1 text-xs">
                          <MessageSquare className="w-3.5 h-3.5" /> 💬 학생 전달 메모:
                        </span>
                        <p className="text-[#92400e] text-xs font-medium pl-4 break-all bg-white/80 p-1.5 rounded border border-[#fde68a]">
                          &ldquo;{selectedRecordToApprove.studentMemo || selectedRecordToApprove.memo}&rdquo;
                        </p>
                      </div>
                    )}

                    {(selectedRecordToApprove.category === '질병' && (selectedRecordToApprove.daysCount >= 3 || selectedRecordToApprove.type === 'ILLNESS_OVER_3')) && (
                      <div className="pt-2 border-t border-[#f2f0ed] mt-2 bg-[#fef2f2] p-2.5 rounded-[6px] border border-[#fca5a5]">
                        <span className="font-bold text-[#b91c1c] flex items-center gap-1 mb-0.5 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#dc2626]" /> 3일 이상 질병결석 증빙 대조 필수 (학교 규정)
                        </span>
                        <p className="text-[#7f1d1d] text-[11px] leading-tight">
                          결석신고서 서식 규정에 따라 실물 <strong>&lsquo;의사 진단서&rsquo;</strong> 또는 <strong>&lsquo;의사 소견서&rsquo;</strong> 원본이 동봉되어 있는지 반드시 확인하세요. (단순 진료확인서 불가)
                        </p>
                      </div>
                    )}
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
                          className={`p-2.5 rounded-[8px] border text-xs font-medium transition-all cursor-pointer ${
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

                  <div className="pt-2 flex items-center justify-between border-t border-[#f2f0ed]">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedRecordToApprove) {
                          handleRevertStatus(selectedRecordToApprove.id, 'FORM_PICKED_UP', '서류 미비/오류로 재작성 요청');
                          setIsApproveModalOpen(false);
                          setSelectedRecordToApprove(null);
                        }
                      }}
                      className="text-[11px] text-[#b45309] hover:bg-[#fef3c7] border border-[#fde68a] px-3 py-1.5 rounded-[6px] font-semibold transition-colors cursor-pointer flex items-center gap-1 bg-white"
                      title="제출된 서류를 반려하고 3단계(작성 중)로 되돌립니다."
                    >
                      <RotateCcw className="w-3 h-3 text-[#d97706]" />
                      <span>↩ 3단계(작성중)로 되돌리기</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsApproveModalOpen(false)}
                        className="btn-sand-pill text-xs py-2 px-3.5 cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmApprove}
                        className="btn-dark-pill text-xs py-2 px-4 cursor-pointer"
                      >
                        최종 승인 완료
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </TeacherAuthGuard>
  );
}
