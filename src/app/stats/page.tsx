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
  UserCheck
} from 'lucide-react';
import { getStudents, getAbsenceRecords, subscribeToSyncEvents } from '@/lib/storage';
import { exportAbsenceStatisticsToExcel } from '@/lib/exportExcel';
import { Student, AbsenceRecord, AttendanceKind, AttendanceCategory } from '@/types';
import TeacherAuthGuard from '@/components/TeacherAuthGuard';

export default function StatisticsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const getMatrixCount = (k: AttendanceKind, c: AttendanceCategory) => {
    return records.filter(r => {
      const matchKind = (r.kind || '결석') === k;
      const matchCat = r.category === c || (c === '출석인정' && r.category === '출석 인정');
      return matchKind && matchCat;
    }).length;
  };

  const getTotalByCat = (c: AttendanceCategory) => {
    return records.filter(r => r.category === c || (c === '출석인정' && r.category === '출석 인정')).length;
  };

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

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.startDate === todayStr || r.attendedAt?.startsWith(todayStr));

  const dailyTotal = todayRecords.length;
  const dailyMenstrual = todayRecords.filter(r => r.type === 'MENSTRUAL').length;
  const dailyIllness = todayRecords.filter(r => r.category === '질병').length;
  const dailyCompleted = todayRecords.filter(r => r.status === 'APPROVED').length;
  const dailySubmitted = todayRecords.filter(r => r.status === 'SUBMITTED').length;
  const dailyCompletionRate = dailyTotal > 0 ? Math.round(((dailyCompleted + dailySubmitted) / dailyTotal) * 100) : 0;

  const weekDays = ['월', '화', '수', '목', '금'];
  const dayCounts = [0, 0, 0, 0, 0];
  const dayMenstrualCounts = [0, 0, 0, 0, 0];
  const dayIllnessCounts = [0, 0, 0, 0, 0];

  records.forEach(r => {
    const d = new Date(r.startDate);
    const dayIndex = d.getDay();
    if (dayIndex >= 1 && dayIndex <= 5) {
      dayCounts[dayIndex - 1] += 1;
      if (r.type === 'MENSTRUAL') dayMenstrualCounts[dayIndex - 1] += 1;
      if (r.category === '질병') dayIllnessCounts[dayIndex - 1] += 1;
    }
  });

  const weeklyTotal = dayCounts.reduce((a, b) => a + b, 0);

  const currentMonthRecords = records.filter(r => {
    const m = new Date(r.startDate).getMonth() + 1;
    return m === selectedMonth;
  });

  const monthlyStudentMap = students.map(s => {
    const sRecords = currentMonthRecords.filter(r => r.studentId === s.id);
    const menstrualCount = sRecords.filter(r => r.type === 'MENSTRUAL').length;
    const illnessRecords = sRecords.filter(r => r.category === '질병');
    const illnessDays = illnessRecords.reduce((acc, cur) => acc + cur.daysCount, 0);
    const fieldTripRecords = sRecords.filter(r => r.type === 'FIELD_EXPERIENCE');
    const fieldTripDays = fieldTripRecords.reduce((acc, cur) => acc + cur.daysCount, 0);
    const pendingCount = sRecords.filter(r => r.status !== 'APPROVED').length;

    return {
      student: s,
      records: sRecords,
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
      <main className="min-h-[calc(100vh-4.5rem)] bg-[#fbfaf9] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="family-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="badge-pill badge-stone text-[11px]">
                출결 통계 & NEIS 마감
              </span>
              <span className="badge-pill badge-sky text-[11px]">
                3학년 2반
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#121212] mt-2 tracking-tight">
              일일 / 주간 / 월말 출결 통계
            </h2>
            <p className="text-xs text-[#7e7e7d] mt-1">
              생리인정결석(월 1회 인정) 기준 초과 감지 및 질병결석 누적 통계를 자동으로 집계합니다.
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
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="family-card">
                <span className="badge-pill badge-stone text-[11px]">오늘 결석 학생</span>
                <h3 className="text-2xl font-bold text-[#121212] mt-2">{dailyTotal}명</h3>
                <p className="text-xs text-[#7e7e7d] mt-1">생리 {dailyMenstrual}명 · 질병 {dailyIllness}명</p>
              </div>

              <div className="family-card">
                <span className={`badge-pill text-[11px] ${dailyTotal > 0 && dailyCompletionRate === 100 ? 'badge-mint' : 'badge-stone'}`}>
                  결석신고서 회수율
                </span>
                <h3 className={`text-2xl font-bold mt-2 ${dailyTotal > 0 && dailyCompletionRate === 100 ? 'text-[#00ca48]' : 'text-[#121212]'}`}>
                  {dailyTotal > 0 ? `${dailyCompletionRate}%` : '0%'}
                </h3>
                <div className="w-full bg-[#f2f0ed] h-2 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${dailyTotal > 0 && dailyCompletionRate === 100 ? 'bg-[#00ca48]' : 'bg-[#0086fc]'}`} 
                    style={{ width: `${dailyTotal > 0 ? dailyCompletionRate : 0}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-[#7e7e7d] mt-1.5">
                  {dailyTotal > 0 
                    ? `제출·승인 ${dailyCompleted + dailySubmitted}건 / 총 ${dailyTotal}건` 
                    : '오늘 등록된 결석 없음 (0건)'}
                </p>
              </div>

              <div className="family-card">
                <span className="badge-pill badge-sky text-[11px]">제출 완료 (확인 대기)</span>
                <h3 className="text-2xl font-bold text-[#0086fc] mt-2">{dailySubmitted}건</h3>
                <p className="text-xs text-[#7e7e7d] mt-1">실물 서류 대조 대기</p>
              </div>

              <div className="family-card">
                <span className="badge-pill badge-stone text-[11px]">승인 완료</span>
                <h3 className="text-2xl font-bold text-[#121212] mt-2">{dailyCompleted}건</h3>
                <p className="text-xs text-[#7e7e7d] mt-1">출결 마감 완료</p>
              </div>
            </div>

            <div className="family-card">
              <h3 className="text-base font-bold text-[#121212] mb-4">
                오늘의 결석생 및 결석신고서 처리 상태
              </h3>

              {todayRecords.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7e7e7d]">
                  오늘 등록된 결석 이력이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#f2f0ed] text-[#7e7e7d] font-medium">
                        <th className="py-3 px-3">학번/이름</th>
                        <th className="py-3 px-3">결석 구분</th>
                        <th className="py-3 px-3">사유</th>
                        <th className="py-3 px-3">동봉 증빙서류</th>
                        <th className="py-3 px-3">진행 단계</th>
                        <th className="py-3 px-3">리마인드</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2f0ed]">
                      {todayRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-[#fcfbf9]">
                          <td className="py-3 px-3 font-semibold text-[#121212]">
                            {r.studentNum}번 {r.studentName}
                          </td>
                          <td className="py-3 px-3">
                            <span className="badge-pill badge-stone text-[10px]">
                              {r.typeName}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#474645]">{r.reason}</td>
                          <td className="py-3 px-3 text-[#0086fc] font-medium">
                            {r.attachments.join(', ') || '-'}
                          </td>
                          <td className="py-3 px-3">
                            {r.status === 'APPROVED' ? (
                              <span className="badge-pill badge-mint text-[10px]">승인 완료</span>
                            ) : r.status === 'SUBMITTED' ? (
                              <span className="badge-pill badge-sky text-[10px]">제출됨</span>
                            ) : r.status === 'FORM_PICKED_UP' ? (
                              <span className="badge-pill badge-honey text-[10px]">작성 중</span>
                            ) : (
                              <span className="badge-pill badge-orange text-[10px]">미수령</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#7e7e7d]">
                            {r.remindCount > 0 ? `${r.remindCount}회` : '-'}
                          </td>
                        </tr>
                      ))}
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
            <div className="family-card">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#f2f0ed]">
                <div>
                  <h3 className="text-base font-bold text-[#121212]">
                    이번 주 요일별 결석 추이 (월 ~ 금)
                  </h3>
                  <p className="text-xs text-[#7e7e7d] mt-0.5">
                    주간 총 {weeklyTotal}건의 결석이 발생했습니다.
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center space-x-1.5 text-[#343433]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffcd6c] inline-block"></span>
                    <span>생리인정결석</span>
                  </span>
                  <span className="flex items-center space-x-1.5 text-[#343433]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#64c6ff] inline-block"></span>
                    <span>질병결석</span>
                  </span>
                </div>
              </div>

              {/* Storybook Bars */}
              <div className="grid grid-cols-5 gap-4 h-52 items-end pt-6 pb-2 border-b border-[#f2f0ed]">
                {weekDays.map((day, idx) => {
                  const total = dayCounts[idx];
                  const mCount = dayMenstrualCounts[idx];
                  const iCount = dayIllnessCounts[idx];
                  const heightPercent = total > 0 ? Math.min(100, Math.max(20, total * 25)) : 0;

                  return (
                    <div key={day} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-xs font-semibold text-[#121212] mb-2">
                        {total > 0 ? `${total}건` : '-'}
                      </span>
                      <div className="w-full max-w-[48px] bg-[#f2f0ed] rounded-[8px] overflow-hidden flex flex-col justify-end transition-all group-hover:opacity-90" style={{ height: total > 0 ? `${heightPercent}%` : '4px' }}>
                        {mCount > 0 && (
                          <div
                            className="bg-[#ffcd6c] w-full"
                            style={{ height: `${(mCount / Math.max(1, total)) * 100}%` }}
                          ></div>
                        )}
                        {iCount > 0 && (
                          <div
                            className="bg-[#64c6ff] w-full"
                            style={{ height: `${(iCount / Math.max(1, total)) * 100}%` }}
                          ></div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-[#7e7e7d] mt-3">{day}요일</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MONTHLY & NEIS */}
        {activeTab === 'MONTHLY' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="family-card flex items-center justify-between">
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
                  <span>해당 월 등록된 결석 없음 (0건)</span>
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

            {/* NEIS 표준 4x4 매트릭스 표 */}
            <div className="family-card p-4 shadow-xs">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-[#121212] flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#0086fc]" />
                  <span>나이스(NEIS) 출결마감구분 4×4 집계 매트릭스</span>
                </h3>
                <p className="text-[11px] text-[#7e7e7d] mt-0.5">
                  나이스 출결 마감 입력 시 필요한 종류(결석/지각/조퇴/결과) × 구분(질병/미인정/기타/출석인정) 누적 마감 건수입니다.
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
                          <td className="py-2 px-3 border-r border-[#cbd5e1] font-semibold text-gray-700">
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
                        {records.length}건
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="family-card">
              <h3 className="text-base font-bold text-[#121212] mb-1">
                {selectedMonth}월 나이스(NEIS) 출결 마감용 집계표
              </h3>
              <p className="text-xs text-[#7e7e7d] mb-4">
                생리인정결석 횟수, 질병결석 누적 일수 및 서류 제출 여부를 한눈에 확인합니다.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#f2f0ed] text-[#7e7e7d] font-semibold bg-[#fcfbf9]">
                      <th className="py-3 px-3">번호</th>
                      <th className="py-3 px-3">이름</th>
                      <th className="py-3 px-3">당월 생리결석</th>
                      <th className="py-3 px-3">월 1회 준수</th>
                      <th className="py-3 px-3">당월 질병결석</th>
                      <th className="py-3 px-3">체험학습 (9.5일 한도)</th>
                      <th className="py-3 px-3">총 결석 건수</th>
                      <th className="py-3 px-3">미제출 건수</th>
                      <th className="py-3 px-3">연락처</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f0ed]">
                    {monthlyStudentMap.map((item) => (
                      <tr key={item.student.id} className="hover:bg-[#fcfbf9]">
                        <td className="py-3 px-3 font-semibold text-[#7e7e7d]">{item.student.studentNum}번</td>
                        <td className="py-3 px-3 font-bold text-[#121212]">{item.student.name}</td>
                        <td className="py-3 px-3">
                          <span className="badge-pill badge-honey text-[10px]">
                            {item.menstrualCount}회
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {item.menstrualExceeded ? (
                            <span className="badge-pill badge-orange text-[10px]">
                              ⚠️ 초과
                            </span>
                          ) : (
                            <span className="badge-pill badge-stone text-[10px]">
                              정상 (1회)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-[#0086fc]">{item.illnessDays > 0 ? `${item.illnessDays}일` : '-'}</td>
                        <td className="py-3 px-3">
                          {item.fieldTripDays > 0 ? (
                            <span className={`badge-pill text-[10px] ${item.fieldTripExceeded ? 'badge-orange' : 'badge-mint'}`}>
                              {item.fieldTripDays}일 {item.fieldTripExceeded ? '(⚠️한도초과)' : ''}
                            </span>
                          ) : (
                            <span className="text-[#7e7e7d]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#474645]">{item.records.length}건</td>
                        <td className="py-3 px-3">
                          {item.pendingCount > 0 ? (
                            <span className="text-[#ff3e00] font-semibold">⚠️ {item.pendingCount}건 진행중</span>
                          ) : (
                            <span className="text-[#00ca48] font-medium">✓ 마감 완료</span>
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
