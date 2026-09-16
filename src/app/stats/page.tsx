'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  Filter, 
  TrendingUp,
  HeartPulse,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  UserX,
  Clock3,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { getStudents, getAbsenceRecords, subscribeToSyncEvents } from '@/lib/storage';
import { exportAbsenceStatisticsToExcel } from '@/lib/exportExcel';
import { Student, AbsenceRecord, AttendanceKind, AttendanceCategory } from '@/types';
import TeacherAuthGuard from '@/components/TeacherAuthGuard';
import { getTodayString, formatKoreanDate } from '@/components/CalendarDatePicker';

export default function StatisticsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const parts = getTodayString().split('-').map(Number);
    return parts[1] || (new Date().getMonth() + 1);
  });
  const [dailyFilterKind, setDailyFilterKind] = useState<'ALL' | AttendanceKind | 'PENDING_DOC'>('ALL');

  const loadData = () => {
    setStudents(getStudents());
    setRecords(getAbsenceRecords());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToSyncEvents(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleExportExcel = () => {
    exportAbsenceStatisticsToExcel(records, students);
  };

  // 날짜 범위 확인 헬퍼
  const isDateInRange = (targetDate: string, start: string, end?: string) => {
    if (!start) return false;
    const e = end || start;
    return targetDate >= start && targetDate <= e;
  };

  // 날짜 이동 헬퍼
  const shiftSelectedDate = (offsetDays: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + offsetDays);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newStr = `${curr.getFullYear()}-${pad(curr.getMonth() + 1)}-${pad(curr.getDate())}`;
    setSelectedDate(newStr);
  };

  // 1. 일일 통계 데이터 (선택된 날짜 기준 전체 출결 변동: 결석, 지각, 조퇴, 결과)
  const dailyRecords = records.filter(r => isDateInRange(selectedDate, r.startDate, r.endDate));
  
  const dailyTotal = dailyRecords.length;
  const dailyAbsence = dailyRecords.filter(r => (r.kind || '결석') === '결석').length;
  const dailyLate = dailyRecords.filter(r => r.kind === '지각').length;
  const dailyEarly = dailyRecords.filter(r => r.kind === '조퇴').length;
  const dailySkip = dailyRecords.filter(r => r.kind === '결과').length;

  const dailyIllness = dailyRecords.filter(r => r.category === '질병').length;
  const dailyUnexcused = dailyRecords.filter(r => r.category === '미인정').length;
  const dailyOther = dailyRecords.filter(r => r.category === '기타').length;
  const dailyApprovedCat = dailyRecords.filter(r => r.category === '출석인정' || r.category === '출석 인정').length;
  const dailyMenstrual = dailyRecords.filter(r => r.type === 'MENSTRUAL').length;

  // 서류 제출 대상 건 (주로 결석)
  const dailyDocRequired = dailyRecords.filter(r => r.requiresDocument !== false);
  const dailyDocCompleted = dailyDocRequired.filter(r => r.status === 'APPROVED').length;
  const dailyDocSubmitted = dailyDocRequired.filter(r => r.status === 'SUBMITTED').length;
  const dailyDocPending = dailyDocRequired.filter(r => r.status !== 'APPROVED').length;
  
  // 단순 기록 완료 건 (지각, 조퇴, 결과 등 서류 불필요)
  const dailySimpleRecorded = dailyRecords.filter(r => r.requiresDocument === false || r.status === 'RECORDED').length;

  const dailyCompletionRate = dailyDocRequired.length > 0 
    ? Math.round(((dailyDocCompleted + dailyDocSubmitted) / dailyDocRequired.length) * 100) 
    : (dailyTotal > 0 ? 100 : 0);

  // 일일 테이블 필터링
  const filteredDailyRecords = dailyRecords.filter(r => {
    if (dailyFilterKind === 'ALL') return true;
    if (dailyFilterKind === 'PENDING_DOC') return r.requiresDocument !== false && r.status !== 'APPROVED';
    return (r.kind || '결석') === dailyFilterKind;
  });

  // 2. 주간 통계 데이터 (선택된 날짜가 속한 주의 월~금)
  const getWeekDates = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    const day = curr.getDay(); // 0: 일, 1: 월, ... 6: 토
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diffToMonday);

    const pad = (n: number) => String(n).padStart(2, '0');
    const week = [];
    for (let i = 0; i < 5; i++) {
      const wDate = new Date(monday);
      wDate.setDate(monday.getDate() + i);
      week.push(`${wDate.getFullYear()}-${pad(wDate.getMonth() + 1)}-${pad(wDate.getDate())}`);
    }
    return week;
  };

  const weekDays = ['월', '화', '수', '목', '금'];
  const currentWeekDates = getWeekDates(selectedDate);

  const weeklyDayStats = currentWeekDates.map((dateStr, idx) => {
    const dayRecords = records.filter(r => isDateInRange(dateStr, r.startDate, r.endDate));
    const absence = dayRecords.filter(r => (r.kind || '결석') === '결석').length;
    const late = dayRecords.filter(r => r.kind === '지각').length;
    const early = dayRecords.filter(r => r.kind === '조퇴').length;
    const skip = dayRecords.filter(r => r.kind === '결과').length;
    const menstrual = dayRecords.filter(r => r.type === 'MENSTRUAL').length;
    const illness = dayRecords.filter(r => r.category === '질병').length;
    return {
      dayName: weekDays[idx],
      dateStr,
      total: dayRecords.length,
      absence,
      late,
      early,
      skip,
      menstrual,
      illness,
      records: dayRecords,
    };
  });

  const weeklyTotalCount = weeklyDayStats.reduce((sum, d) => sum + d.total, 0);
  const weeklyAbsenceCount = weeklyDayStats.reduce((sum, d) => sum + d.absence, 0);
  const weeklyLateCount = weeklyDayStats.reduce((sum, d) => sum + d.late, 0);
  const weeklyEarlyCount = weeklyDayStats.reduce((sum, d) => sum + d.early, 0);
  const weeklySkipCount = weeklyDayStats.reduce((sum, d) => sum + d.skip, 0);

  // 3. 월간 통계 데이터 (선택된 월 기준)
  const currentMonthRecords = records.filter(r => {
    if (!r.startDate) return false;
    const parts = r.startDate.split('-').map(Number);
    return parts[1] === selectedMonth;
  });

  const getMatrixCount = (k: AttendanceKind, c: AttendanceCategory) => {
    return currentMonthRecords.filter(r => {
      const matchKind = (r.kind || '결석') === k;
      const matchCat = r.category === c || (c === '출석인정' && r.category === '출석 인정');
      return matchKind && matchCat;
    }).length;
  };

  const getTotalByCat = (c: AttendanceCategory) => {
    return currentMonthRecords.filter(r => r.category === c || (c === '출석인정' && r.category === '출석 인정')).length;
  };

  const monthlyStudentMap = students.map(s => {
    const sRecords = currentMonthRecords.filter(r => r.studentId === s.id);
    const absenceCount = sRecords.filter(r => (r.kind || '결석') === '결석').length;
    const lateCount = sRecords.filter(r => r.kind === '지각').length;
    const earlyCount = sRecords.filter(r => r.kind === '조퇴').length;
    const skipCount = sRecords.filter(r => r.kind === '결과').length;
    const menstrualCount = sRecords.filter(r => r.type === 'MENSTRUAL').length;
    const illnessRecords = sRecords.filter(r => r.category === '질병');
    const illnessDays = illnessRecords.reduce((acc, cur) => acc + (cur.daysCount || 1), 0);
    const fieldTripRecords = sRecords.filter(r => r.type === 'FIELD_EXPERIENCE');
    const fieldTripDays = fieldTripRecords.reduce((acc, cur) => acc + (cur.daysCount || 1), 0);
    const pendingCount = sRecords.filter(r => r.requiresDocument !== false && r.status !== 'APPROVED').length;

    return {
      student: s,
      records: sRecords,
      totalCount: sRecords.length,
      absenceCount,
      lateCount,
      earlyCount,
      skipCount,
      menstrualCount,
      menstrualExceeded: menstrualCount > 1,
      illnessDays,
      fieldTripDays,
      fieldTripExceeded: fieldTripDays > 9.5,
      pendingCount,
    };
  });

  const monthlyMenstrualExceededCount = monthlyStudentMap.filter(m => m.menstrualExceeded).length;

  return (
    <TeacherAuthGuard>
      <main className="min-h-[calc(100vh-4.5rem)] bg-[#fbfaf9] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Top Header Card */}
          <div className="family-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="badge-pill badge-stone text-[11px]">
                  출결 통계 & NEIS 마감
                </span>
                <span className="badge-pill badge-sky text-[11px]">
                  학급 출결 현황
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#121212] mt-2 tracking-tight">
                일일 / 주간 / 월말 출결 통계
              </h2>
              <p className="text-xs text-[#7e7e7d] mt-1">
                결석·지각·조퇴·결과 전체 출결 변동 집계, 생리인정결석(월 1회) 준수 여부 및 나이스(NEIS) 마감 통계를 자동으로 집계합니다.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportExcel}
                className="btn-dark-pill text-xs py-2.5 px-4"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>통계 엑셀 다운로드 (XLSX)</span>
              </button>
            </div>
          </div>

          {/* Tab Switcher Pills */}
          <div className="family-card p-2 flex space-x-2">
            <button
              onClick={() => setActiveTab('DAILY')}
              className={`flex-1 py-2.5 px-4 rounded-[32px] text-xs font-semibold transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'DAILY'
                  ? 'bg-[#121212] text-white'
                  : 'text-[#7e7e7d] hover:bg-[#f6f4ef] hover:text-[#121212]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>일일 통계 (Daily)</span>
            </button>
            <button
              onClick={() => setActiveTab('WEEKLY')}
              className={`flex-1 py-2.5 px-4 rounded-[32px] text-xs font-semibold transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'WEEKLY'
                  ? 'bg-[#121212] text-white'
                  : 'text-[#7e7e7d] hover:bg-[#f6f4ef] hover:text-[#121212]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>주간 통계 (Weekly)</span>
            </button>
            <button
              onClick={() => setActiveTab('MONTHLY')}
              className={`flex-1 py-2.5 px-4 rounded-[32px] text-xs font-semibold transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'MONTHLY'
                  ? 'bg-[#121212] text-white'
                  : 'text-[#7e7e7d] hover:bg-[#f6f4ef] hover:text-[#121212]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>월말 결산 & NEIS 마감 (Monthly)</span>
            </button>
          </div>

          {/* TAB 1: DAILY */}
          {activeTab === 'DAILY' && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Daily Date Navigation Banner */}
              <div className="family-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-[#e5d5c3]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-[12px] bg-[#fff8e8] border border-[#ffcd6c] flex items-center justify-center text-lg">
                    📅
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-[#121212]">
                        {formatKoreanDate(selectedDate)}
                      </span>
                      {selectedDate === getTodayString() ? (
                        <span className="badge-pill badge-mint text-[10px]">
                          오늘
                        </span>
                      ) : (
                        <span className="badge-pill badge-stone text-[10px]">
                          날짜 탐색
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#7e7e7d] mt-0.5">
                      해당 일자 전체 출결 변동: <strong className="text-[#121212] font-semibold">{dailyTotal}건</strong>
                      {dailyTotal > 0 && ` (결석 ${dailyAbsence}, 지각 ${dailyLate}, 조퇴 ${dailyEarly}, 결과 ${dailySkip})`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => shiftSelectedDate(-1)}
                    className="px-3 py-1.5 rounded-[8px] bg-[#fcfbf9] border border-[#f2f0ed] text-xs font-semibold text-[#474645] hover:bg-[#f2f0ed] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>어제</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getTodayString())}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-bold border transition-colors cursor-pointer ${
                      selectedDate === getTodayString()
                        ? 'bg-[#121212] text-white border-[#121212]'
                        : 'bg-[#fff8e8] text-[#d48f00] border-[#ffcd6c] hover:bg-[#ffeec2]'
                    }`}
                  >
                    오늘로 이동
                  </button>
                  <button
                    type="button"
                    onClick={() => shiftSelectedDate(1)}
                    className="px-3 py-1.5 rounded-[8px] bg-[#fcfbf9] border border-[#f2f0ed] text-xs font-semibold text-[#474645] hover:bg-[#f2f0ed] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>내일</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-[8px] bg-[#fcfbf9] border border-[#e5d5c3] text-xs font-medium text-[#474645] cursor-pointer"
                      title="조회 날짜 직접 선택"
                    />
                  </div>
                </div>
              </div>

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: Daily Total & Kinds */}
                <div className="family-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="badge-pill badge-stone text-[11px]">해당일 출결 변동</span>
                    <span className="text-[11px] text-[#7e7e7d]">총 {dailyTotal}건</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#121212] mt-2 tracking-tight">
                    {dailyTotal}건
                  </h3>
                  
                  {/* Kinds breakdown pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className={`badge-pill text-[10px] ${dailyAbsence > 0 ? 'badge-orange font-bold' : 'badge-stone text-[#a8a8a7]'}`}>
                      결석 {dailyAbsence}
                    </span>
                    <span className={`badge-pill text-[10px] ${dailyLate > 0 ? 'badge-honey font-bold' : 'badge-stone text-[#a8a8a7]'}`}>
                      지각 {dailyLate}
                    </span>
                    <span className={`badge-pill text-[10px] ${dailyEarly > 0 ? 'badge-sky font-bold' : 'badge-stone text-[#a8a8a7]'}`}>
                      조퇴 {dailyEarly}
                    </span>
                    <span className={`badge-pill text-[10px] ${dailySkip > 0 ? 'badge-stone font-bold' : 'badge-stone text-[#a8a8a7]'}`}>
                      결과 {dailySkip}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#7e7e7d] mt-2 pt-2 border-t border-[#f2f0ed]">
                    질병 {dailyIllness} · 인정 {dailyApprovedCat} {dailyMenstrual > 0 && `(생리 ${dailyMenstrual})`} · 미인정 {dailyUnexcused} · 기타 {dailyOther}
                  </p>
                </div>

                {/* Card 2: Document Recovery Rate */}
                <div className="family-card p-4">
                  <div className="flex items-center justify-between">
                    <span className={`badge-pill text-[11px] ${dailyDocRequired.length > 0 && dailyCompletionRate === 100 ? 'badge-mint' : 'badge-stone'}`}>
                      결석계 서류 회수율
                    </span>
                    <span className="text-[11px] text-[#7e7e7d]">
                      {dailyDocRequired.length > 0 ? `${dailyDocCompleted + dailyDocSubmitted}/${dailyDocRequired.length}건` : '서류대상 없음'}
                    </span>
                  </div>
                  <h3 className={`text-2xl font-black mt-2 ${dailyDocRequired.length > 0 && dailyCompletionRate === 100 ? 'text-[#00ca48]' : 'text-[#121212]'}`}>
                    {dailyDocRequired.length > 0 ? `${dailyCompletionRate}%` : (dailyTotal > 0 ? '100%' : '0%')}
                  </h3>
                  <div className="w-full bg-[#f2f0ed] h-2 rounded-full mt-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${dailyDocRequired.length > 0 && dailyCompletionRate === 100 ? 'bg-[#00ca48]' : 'bg-[#0086fc]'}`} 
                      style={{ width: `${dailyDocRequired.length > 0 ? dailyCompletionRate : (dailyTotal > 0 ? 100 : 0)}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-[#7e7e7d] mt-2 pt-2 border-t border-[#f2f0ed]">
                    {dailyDocRequired.length > 0 
                      ? `제출·승인 ${dailyDocCompleted + dailyDocSubmitted}건 / 서류대상 ${dailyDocRequired.length}건`
                      : dailyTotal > 0
                      ? `지각·조퇴·결과 등 단순 기록 ${dailySimpleRecorded}건 (서류 불필요)`
                      : '해당 일자 등록된 출결 변동 없음'}
                  </p>
                </div>

                {/* Card 3: Pending Check */}
                <div className="family-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="badge-pill badge-sky text-[11px]">확인 대기 서류</span>
                    <span className="text-[11px] text-[#0086fc] font-semibold">대조 대기</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#0086fc] mt-2">
                    {dailyDocSubmitted}건
                  </h3>
                  <p className="text-xs text-[#7e7e7d] mt-2.5">
                    학생이 제출함 투입 후 교사 실물 대조 대기
                  </p>
                  <p className="text-[11px] text-[#7e7e7d] mt-2 pt-2 border-t border-[#f2f0ed]">
                    서류 미수령/작성중: {dailyDocPending - dailyDocSubmitted}건
                  </p>
                </div>

                {/* Card 4: Fully Approved & Completed */}
                <div className="family-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="badge-pill badge-mint text-[11px]">출결 마감 완료</span>
                    <span className="text-[11px] text-[#00ca48] font-semibold">마감 완료</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#121212] mt-2">
                    {dailyDocCompleted + dailySimpleRecorded}건
                  </h3>
                  <p className="text-xs text-[#7e7e7d] mt-2.5">
                    서류 승인 완료 {dailyDocCompleted}건 + 단순 기록 {dailySimpleRecorded}건
                  </p>
                  <p className="text-[11px] text-[#7e7e7d] mt-2 pt-2 border-t border-[#f2f0ed]">
                    NEIS 출결 마감 기록 준비 완료
                  </p>
                </div>
              </div>

              {/* Daily Attendance Records Table Card */}
              <div className="family-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-[#f2f0ed]">
                  <div>
                    <h3 className="text-base font-bold text-[#121212] flex items-center gap-2">
                      <span>해당 일자 전체 출결 변동 및 서류 처리 상태</span>
                      <span className="badge-pill badge-stone text-xs font-semibold">
                        {dailyTotal}건
                      </span>
                    </h3>
                    <p className="text-xs text-[#7e7e7d] mt-0.5">
                      {formatKoreanDate(selectedDate)}의 결석, 지각, 조퇴, 결과 기록부입니다.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDailyFilterKind('ALL')}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                        dailyFilterKind === 'ALL'
                          ? 'bg-[#121212] text-white'
                          : 'bg-[#f6f4ef] text-[#7e7e7d] hover:text-[#121212]'
                      }`}
                    >
                      전체 ({dailyTotal})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDailyFilterKind('결석')}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                        dailyFilterKind === '결석'
                          ? 'bg-[#ff3e00] text-white'
                          : 'bg-[#f6f4ef] text-[#7e7e7d] hover:text-[#121212]'
                      }`}
                    >
                      결석 ({dailyAbsence})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDailyFilterKind('지각')}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                        dailyFilterKind === '지각'
                          ? 'bg-[#d48f00] text-white'
                          : 'bg-[#f6f4ef] text-[#7e7e7d] hover:text-[#121212]'
                      }`}
                    >
                      지각 ({dailyLate})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDailyFilterKind('조퇴')}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                        dailyFilterKind === '조퇴'
                          ? 'bg-[#0086fc] text-white'
                          : 'bg-[#f6f4ef] text-[#7e7e7d] hover:text-[#121212]'
                      }`}
                    >
                      조퇴 ({dailyEarly})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDailyFilterKind('결과')}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                        dailyFilterKind === '결과'
                          ? 'bg-[#64748b] text-white'
                          : 'bg-[#f6f4ef] text-[#7e7e7d] hover:text-[#121212]'
                      }`}
                    >
                      결과 ({dailySkip})
                    </button>
                    {dailyDocPending > 0 && (
                      <button
                        type="button"
                        onClick={() => setDailyFilterKind('PENDING_DOC')}
                        className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                          dailyFilterKind === 'PENDING_DOC'
                            ? 'bg-[#b91c1c] text-white'
                            : 'bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fca5a5]'
                        }`}
                      >
                        ⚠️ 서류미완료 ({dailyDocPending})
                      </button>
                    )}
                  </div>
                </div>

                {filteredDailyRecords.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#7e7e7d]">
                    {dailyTotal === 0 
                      ? `${formatKoreanDate(selectedDate)}에 등록된 출결 변동 내역이 없습니다.`
                      : '선택하신 필터 조건에 해당하는 출결 내역이 없습니다.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#f2f0ed] text-[#7e7e7d] font-semibold bg-[#fcfbf9]">
                          <th className="py-3 px-3">학번/이름</th>
                          <th className="py-3 px-3">종류</th>
                          <th className="py-3 px-3">구분 / 세부유형</th>
                          <th className="py-3 px-3">교시 / 기간</th>
                          <th className="py-3 px-3">사유</th>
                          <th className="py-3 px-3">동봉 증빙서류</th>
                          <th className="py-3 px-3">진행 단계</th>
                          <th className="py-3 px-3 text-center">리마인드</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2f0ed]">
                        {filteredDailyRecords.map((r) => {
                          const kind = r.kind || '결석';
                          return (
                            <tr key={r.id} className="hover:bg-[#fcfbf9] transition-colors">
                              <td className="py-3 px-3 font-bold text-[#121212] whitespace-nowrap">
                                {r.studentNum}번 {r.studentName}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`badge-pill text-[10px] font-bold ${
                                  kind === '결석' ? 'badge-orange' :
                                  kind === '지각' ? 'badge-honey' :
                                  kind === '조퇴' ? 'badge-sky' :
                                  'badge-stone'
                                }`}>
                                  {kind}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex items-center space-x-1.5">
                                  <span className={`badge-pill text-[10px] ${
                                    r.category === '질병' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    r.category === '미인정' ? 'bg-red-50 text-red-700 border border-red-200' :
                                    (r.category === '출석인정' || r.category === '출석 인정') ? 'bg-green-50 text-green-700 border border-green-200' :
                                    'badge-stone'
                                  }`}>
                                    {r.category}
                                  </span>
                                  <span className="text-[11px] text-[#474645] font-medium">
                                    {r.typeName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-[#474645] whitespace-nowrap">
                                {r.periodText || (r.daysCount > 1 ? `${r.daysCount}일간` : '전일')}
                              </td>
                              <td className="py-3 px-3 text-[#474645]">
                                <div>{r.reason}</div>
                                {r.memo && (
                                  <div className="text-[10px] text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded mt-1 inline-block">
                                    💬 {r.memo}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                {r.requiresDocument === false || r.status === 'RECORDED' ? (
                                  <span className="text-[#a8a8a7] text-[11px]">
                                    서류 불필요 (기록완료)
                                  </span>
                                ) : (
                                  <span className="text-[#0086fc] font-medium text-[11px]">
                                    {r.attachments && r.attachments.length > 0 ? r.attachments.join(', ') : '제출 대기'}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                {r.status === 'RECORDED' ? (
                                  <span className="badge-pill badge-stone text-[10px] font-semibold">
                                    📋 출결 기록완료
                                  </span>
                                ) : r.status === 'APPROVED' ? (
                                  <span className="badge-pill badge-mint text-[10px] font-bold">
                                    ✓ 서류 승인완료
                                  </span>
                                ) : r.status === 'SUBMITTED' ? (
                                  <span className="badge-pill badge-sky text-[10px] font-bold">
                                    📄 제출됨 (확인 대기)
                                  </span>
                                ) : r.status === 'FORM_PICKED_UP' ? (
                                  <span className="badge-pill badge-honey text-[10px] font-semibold">
                                    ✏️ 작성 중
                                  </span>
                                ) : r.status === 'ATTENDED_NOTIFIED' ? (
                                  <span className="badge-pill badge-orange text-[10px] font-semibold">
                                    ⏳ 등교확인 (미수령)
                                  </span>
                                ) : (
                                  <span className="badge-pill badge-stone text-[10px]">
                                    등교 전 (대기)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap text-[#7e7e7d]">
                                {r.requiresDocument !== false && r.remindCount > 0 ? (
                                  <span className="text-[#d48f00] font-semibold">{r.remindCount}회</span>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WEEKLY */}
          {activeTab === 'WEEKLY' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="family-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-3 border-b border-[#f2f0ed]">
                  <div>
                    <h3 className="text-base font-bold text-[#121212] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#0086fc]" />
                      <span>이번 주 요일별 출결 변동 추이 (월 ~ 금)</span>
                    </h3>
                    <p className="text-xs text-[#7e7e7d] mt-0.5">
                      기준 주간 ({currentWeekDates[0]} ~ {currentWeekDates[4]}): 총 <strong className="text-[#121212] font-semibold">{weeklyTotalCount}건</strong>의 출결 변동이 발생했습니다.
                    </p>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center space-x-1.5 text-[#343433]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff7875] inline-block"></span>
                      <span>결석 ({weeklyAbsenceCount})</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-[#343433]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffa940] inline-block"></span>
                      <span>지각 ({weeklyLateCount})</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-[#343433]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4096ff] inline-block"></span>
                      <span>조퇴 ({weeklyEarlyCount})</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-[#343433]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#9254de] inline-block"></span>
                      <span>결과 ({weeklySkipCount})</span>
                    </span>
                  </div>
                </div>

                {/* Stacked Bars for 5 days */}
                <div className="grid grid-cols-5 gap-4 h-56 items-end pt-6 pb-3 border-b border-[#f2f0ed]">
                  {weeklyDayStats.map((day) => {
                    const total = day.total;
                    const maxCount = Math.max(1, ...weeklyDayStats.map(d => d.total));
                    const heightPercent = total > 0 ? Math.min(100, Math.max(25, (total / maxCount) * 100)) : 0;

                    return (
                      <div key={day.dateStr} className="flex flex-col items-center h-full justify-end group">
                        <span className="text-xs font-bold text-[#121212] mb-2">
                          {total > 0 ? `${total}건` : '-'}
                        </span>
                        
                        <div 
                          className="w-full max-w-[52px] bg-[#f2f0ed] rounded-[8px] overflow-hidden flex flex-col justify-end transition-all group-hover:opacity-90" 
                          style={{ height: total > 0 ? `${heightPercent}%` : '6px' }}
                        >
                          {day.skip > 0 && (
                            <div
                              className="bg-[#9254de] w-full"
                              style={{ height: `${(day.skip / Math.max(1, total)) * 100}%` }}
                              title={`결과 ${day.skip}건`}
                            ></div>
                          )}
                          {day.early > 0 && (
                            <div
                              className="bg-[#4096ff] w-full"
                              style={{ height: `${(day.early / Math.max(1, total)) * 100}%` }}
                              title={`조퇴 ${day.early}건`}
                            ></div>
                          )}
                          {day.late > 0 && (
                            <div
                              className="bg-[#ffa940] w-full"
                              style={{ height: `${(day.late / Math.max(1, total)) * 100}%` }}
                              title={`지각 ${day.late}건`}
                            ></div>
                          )}
                          {day.absence > 0 && (
                            <div
                              className="bg-[#ff7875] w-full"
                              style={{ height: `${(day.absence / Math.max(1, total)) * 100}%` }}
                              title={`결석 ${day.absence}건`}
                            ></div>
                          )}
                        </div>

                        <div className="mt-3 text-center">
                          <span className="text-xs font-bold text-[#121212] block">
                            {day.dayName}요일
                          </span>
                          <span className="text-[10px] text-[#7e7e7d] block">
                            {day.dateStr.substring(5)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Weekly Details Table */}
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-[#474645] mb-3">
                    주간 요일별 출결 변동 내역
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {weeklyDayStats.map((day) => (
                      <div 
                        key={day.dateStr} 
                        className={`p-3 rounded-[12px] border ${
                          day.total > 0 ? 'bg-[#fcfbf9] border-[#e5d5c3]' : 'bg-[#fafafa] border-[#f2f0ed]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-[#121212]">
                            {day.dayName}요일 ({day.dateStr.substring(5)})
                          </span>
                          <span className="badge-pill badge-stone text-[10px]">
                            {day.total}건
                          </span>
                        </div>
                        {day.records.length === 0 ? (
                          <p className="text-[11px] text-[#a8a8a7]">출결 변동 없음</p>
                        ) : (
                          <div className="space-y-1 mt-2">
                            {day.records.map((r) => (
                              <div key={r.id} className="text-[11px] flex items-center justify-between">
                                <span className="text-[#121212] font-medium truncate max-w-[90px]">
                                  {r.studentNum}번 {r.studentName}
                                </span>
                                <span className={`badge-pill text-[9px] ${
                                  (r.kind || '결석') === '결석' ? 'badge-orange' :
                                  r.kind === '지각' ? 'badge-honey' :
                                  r.kind === '조퇴' ? 'badge-sky' : 'badge-stone'
                                }`}>
                                  {r.kind || '결석'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MONTHLY & NEIS */}
          {activeTab === 'MONTHLY' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="family-card flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <label className="text-xs font-medium text-[#474645]">조회 월 선택:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-[#fbfaf9] border border-[#e5d5c3] text-xs font-semibold rounded-[8px] p-2"
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>{m}월 출결 현황</option>
                    ))}
                  </select>
                </div>

                {currentMonthRecords.length === 0 ? (
                  <div className="badge-pill badge-stone font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                    <span>해당 월 등록된 출결 변동 없음 (0건)</span>
                  </div>
                ) : monthlyMenstrualExceededCount > 0 ? (
                  <div className="badge-pill badge-orange font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                    <span>생리결석 월 1회 초과: {monthlyMenstrualExceededCount}명 (확인 필요)</span>
                  </div>
                ) : (
                  <div className="badge-pill badge-mint font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                    <span>생리결석 월 1회 이내 정상 준수 중</span>
                  </div>
                )}
              </div>

              {/* NEIS 표준 4x4 매트릭스 표 (선택된 월 기준) */}
              <div className="family-card p-4 shadow-xs">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-[#121212] flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-[#0086fc]" />
                    <span>{selectedMonth}월 나이스(NEIS) 출결마감구분 4×4 집계 매트릭스</span>
                  </h3>
                  <p className="text-[11px] text-[#7e7e7d] mt-0.5">
                    {selectedMonth}월 출결 마감 입력 시 필요한 종류(결석/지각/조퇴/결과) × 구분(질병/미인정/기타/출석인정) 월간 누적 건수입니다.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs border border-[#cbd5e1] rounded-[4px] overflow-hidden">
                    <thead className="bg-[#f8fafc] text-[#334155] font-bold border-b border-[#cbd5e1]">
                      <tr>
                        <th className="py-2 px-3 border-r border-[#cbd5e1] text-left">종류 \ 구분</th>
                        <th className="py-2 px-3 border-r border-[#cbd5e1] text-blue-700">질병</th>
                        <th className="py-2 px-3 border-r border-[#cbd5e1] text-red-700">미인정</th>
                        <th className="py-2 px-3 border-r border-[#cbd5e1] text-gray-700">기타</th>
                        <th className="py-2 px-3 border-r border-[#cbd5e1] text-green-700">출석인정</th>
                        <th className="py-2 px-3 bg-[#f1f5f9] font-black">계 (합계)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#cbd5e1]">
                      {(['결석', '지각', '조퇴', '결과'] as AttendanceKind[]).map((k) => {
                        const ill = getMatrixCount(k, '질병');
                        const unex = getMatrixCount(k, '미인정');
                        const oth = getMatrixCount(k, '기타');
                        const app = getMatrixCount(k, '출석인정');
                        const rowTotal = ill + unex + oth + app;
                        return (
                          <tr key={k} className="hover:bg-[#fcfbf9]">
                            <td className="py-2 px-3 font-bold text-left border-r border-[#cbd5e1] bg-[#f8fafc]">
                              {k}
                            </td>
                            <td className="py-2 px-3 border-r border-[#cbd5e1] font-semibold text-blue-700">
                              {ill > 0 ? `${ill}건` : '-'}
                            </td>
                            <td className="py-2 px-3 border-r border-[#cbd5e1] font-semibold text-red-700">
                              {unex > 0 ? `${unex}건` : '-'}
                            </td>
                            <td className="py-2 px-3 border-r border-[#cbd5e1] font-semibold text-red-700">
                              {oth > 0 ? `${oth}건` : '-'}
                            </td>
                            <td className="py-2 px-3 border-r border-[#cbd5e1] font-semibold text-green-700">
                              {app > 0 ? `${app}건` : '-'}
                            </td>
                            <td className="py-2 px-3 font-bold bg-[#f1f5f9]">
                              {rowTotal > 0 ? `${rowTotal}건` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Grand Total Row */}
                      <tr className="bg-[#f1f5f9] font-black border-t-2 border-[#cbd5e1]">
                        <td className="py-2 px-3 text-left border-r border-[#cbd5e1]">
                          합계 (총계)
                        </td>
                        <td className="py-2 px-3 border-r border-[#cbd5e1] text-blue-700">
                          {getTotalByCat('질병')}건
                        </td>
                        <td className="py-2 px-3 border-r border-[#cbd5e1] text-red-700">
                          {getTotalByCat('미인정')}건
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#cbd5e1] text-gray-700">
                          {getTotalByCat('기타')}건
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#cbd5e1] text-green-700">
                          {getTotalByCat('출석인정')}건
                        </td>
                        <td className="py-2.5 px-3 text-[#121212] bg-[#e2e8f0]">
                          {currentMonthRecords.length}건
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 월말 학생별 출결 마감 집계표 */}
              <div className="family-card p-5">
                <h3 className="text-base font-bold text-[#121212] mb-1">
                  {selectedMonth}월 학생별 출결 마감 집계표
                </h3>
                <p className="text-xs text-[#7e7e7d] mb-4">
                  학생별 결석/지각/조퇴/결과 건수, 생리결석 월 1회 준수 여부 및 질병결석 누적 일수를 종합 확인합니다.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#f2f0ed] text-[#7e7e7d] font-semibold bg-[#fcfbf9]">
                        <th className="py-3 px-3">번호</th>
                        <th className="py-3 px-3">이름</th>
                        <th className="py-3 px-3 text-center">결석</th>
                        <th className="py-3 px-3 text-center">지각</th>
                        <th className="py-3 px-3 text-center">조퇴</th>
                        <th className="py-3 px-3 text-center">결과</th>
                        <th className="py-3 px-3">당월 생리결석</th>
                        <th className="py-3 px-3">생리 1회준수</th>
                        <th className="py-3 px-3">질병결석 일수</th>
                        <th className="py-3 px-3">체험학습 (9.5일한도)</th>
                        <th className="py-3 px-3">서류 미제출</th>
                        <th className="py-3 px-3">연락처</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2f0ed]">
                      {monthlyStudentMap.map((item) => (
                        <tr key={item.student.id} className="hover:bg-[#fcfbf9] transition-colors">
                          <td className="py-3 px-3 font-semibold text-[#7e7e7d]">{item.student.studentNum}번</td>
                          <td className="py-3 px-3 font-bold text-[#121212]">{item.student.name}</td>
                          <td className="py-3 px-3 text-center">
                            {item.absenceCount > 0 ? (
                              <span className="badge-pill badge-orange text-[10px] font-bold">{item.absenceCount}건</span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {item.lateCount > 0 ? (
                              <span className="badge-pill badge-honey text-[10px] font-bold">{item.lateCount}건</span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {item.earlyCount > 0 ? (
                              <span className="badge-pill badge-sky text-[10px] font-bold">{item.earlyCount}건</span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {item.skipCount > 0 ? (
                              <span className="badge-pill badge-stone text-[10px] font-bold">{item.skipCount}건</span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="badge-pill badge-honey text-[10px]">
                              {item.menstrualCount}회
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {item.menstrualExceeded ? (
                              <span className="badge-pill badge-orange text-[10px] font-bold">
                                ⚠️ 초과
                              </span>
                            ) : (
                              <span className="badge-pill badge-stone text-[10px]">
                                정상 (1회)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-medium text-[#0086fc]">
                            {item.illnessDays > 0 ? `${item.illnessDays}일` : '-'}
                          </td>
                          <td className="py-3 px-3">
                            {item.fieldTripDays > 0 ? (
                              <span className={`badge-pill text-[10px] ${item.fieldTripExceeded ? 'badge-orange' : 'badge-mint'}`}>
                                {item.fieldTripDays}일 {item.fieldTripExceeded ? '(⚠️한도초과)' : ''}
                              </span>
                            ) : (
                              <span className="text-[#7e7e7d]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {item.pendingCount > 0 ? (
                              <span className="text-[#ff3e00] font-bold text-[11px]">⚠️ {item.pendingCount}건 진행중</span>
                            ) : (
                              <span className="text-[#00ca48] font-medium text-[11px]">✓ 마감 완료</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#7e7e7d]">{item.student.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </TeacherAuthGuard>
  );
}
