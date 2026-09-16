'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  RotateCcw, 
  Plus, 
  Minus, 
  AlertCircle,
  CalendarCheck,
  ArrowRight
} from 'lucide-react';

interface CalendarDatePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string, daysCount: number) => void;
  singleDateOnly?: boolean;
}

export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatKoreanDate = (dateStr: string, includeDayOfWeek: boolean = true): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return dateStr;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = days[date.getDay()];
  if (includeDayOfWeek) {
    return `${y}년 ${m}월 ${d}일 (${dayOfWeek})`;
  }
  return `${y}년 ${m}월 ${d}일`;
};

// 💡 학교 출결 규정: 토요일(6)과 일요일(0)은 수업일이 아니므로 결석 일수에서 제외
export const calculateDaysCount = (start: string, end: string): number => {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;

  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dayOfWeek = cur.getDay();
    // 토요일(6) 및 일요일(0) 제외
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count > 0 ? count : 1;
};

// 선택된 범위 내 주말(토/일) 일수 계산
export const calculateWeekendDaysCount = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;

  let weekendCount = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendCount++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return weekendCount;
};

export default function CalendarDatePicker({
  startDate,
  endDate,
  onChange,
  singleDateOnly = false
}: CalendarDatePickerProps) {
  const todayStr = getTodayString();
  const initialDate = startDate ? new Date(startDate) : new Date();

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // 'START': 다음 클릭이 시작일 지정, 'END': 다음 클릭이 종료일 지정
  const [selectPhase, setSelectPhase] = useState<'START' | 'END'>('START');

  // Keep month view in sync if external startDate changes
  useEffect(() => {
    if (startDate) {
      const parts = startDate.split('-').map(Number);
      if (parts.length >= 2 && !isNaN(parts[0])) {
        setCurrentYear(parts[0]);
        setCurrentMonth(parts[1] - 1);
      }
    }
  }, [startDate]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const goToToday = () => {
    const tStr = getTodayString();
    const parts = tStr.split('-').map(Number);
    setCurrentYear(parts[0]);
    setCurrentMonth(parts[1] - 1);
    setSelectPhase('START');
    onChange(tStr, tStr, 1);
  };

  // 1. 직접 날짜 선택 입력 핸들러 (어느 날짜든 자유롭게 지정 가능)
  const handleDirectStartChange = (newStartStr: string) => {
    if (!newStartStr) return;
    const parts = newStartStr.split('-').map(Number);
    if (!isNaN(parts[0])) {
      setCurrentYear(parts[0]);
      setCurrentMonth(parts[1] - 1);
    }
    const currentEnd = endDate || newStartStr;
    const finalEnd = newStartStr > currentEnd ? newStartStr : currentEnd;
    const newCount = calculateDaysCount(newStartStr, finalEnd);
    setSelectPhase('START');
    onChange(newStartStr, finalEnd, newCount);
  };

  const handleDirectEndChange = (newEndStr: string) => {
    if (!newEndStr) return;
    const parts = newEndStr.split('-').map(Number);
    if (!isNaN(parts[0])) {
      setCurrentYear(parts[0]);
      setCurrentMonth(parts[1] - 1);
    }
    const currentStart = startDate || newEndStr;
    const finalStart = newEndStr < currentStart ? newEndStr : currentStart;
    const newCount = calculateDaysCount(finalStart, newEndStr);
    setSelectPhase('START');
    onChange(finalStart, newEndStr, newCount);
  };

  // 2. 빠른 날짜 점프 (오늘, 어제, 내일, 다음 주 월요일, 1일 리셋)
  const handleQuickJump = (type: 'today' | 'yesterday' | 'tomorrow' | 'nextWeek' | 'resetToOneDay') => {
    const base = new Date();
    setSelectPhase('START');

    if (type === 'today') {
      const dStr = toISO(base);
      setCurrentYear(base.getFullYear());
      setCurrentMonth(base.getMonth());
      onChange(dStr, dStr, 1);
    } else if (type === 'yesterday') {
      base.setDate(base.getDate() - 1);
      const dStr = toISO(base);
      setCurrentYear(base.getFullYear());
      setCurrentMonth(base.getMonth());
      onChange(dStr, dStr, 1);
    } else if (type === 'tomorrow') {
      base.setDate(base.getDate() + 1);
      const dStr = toISO(base);
      setCurrentYear(base.getFullYear());
      setCurrentMonth(base.getMonth());
      onChange(dStr, dStr, 1);
    } else if (type === 'nextWeek') {
      // 다음 주 월요일로 점프
      const day = base.getDay();
      const daysUntilNextMon = ((1 - day + 7) % 7) || 7;
      base.setDate(base.getDate() + daysUntilNextMon);
      const dStr = toISO(base);
      setCurrentYear(base.getFullYear());
      setCurrentMonth(base.getMonth());
      onChange(dStr, dStr, 1);
    } else if (type === 'resetToOneDay') {
      const curStart = startDate || todayStr;
      onChange(curStart, curStart, 1);
    }
  };

  // 3. 일수 증감 스태퍼 (+1일 / -1일, 토·일 주말 건너뜀)
  const handleAdjustDays = (delta: number) => {
    const s = startDate ? new Date(startDate) : new Date();
    const e = endDate ? new Date(endDate) : new Date(s);

    if (delta > 0) {
      const nextDate = new Date(e);
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);

      const newEndStr = toISO(nextDate);
      const newCount = calculateDaysCount(startDate || todayStr, newEndStr);
      onChange(startDate || todayStr, newEndStr, newCount);
    } else if (delta < 0) {
      const prevDate = new Date(e);
      let foundDate: Date | null = null;
      while (prevDate > s) {
        prevDate.setDate(prevDate.getDate() - 1);
        if (prevDate.getDay() !== 0 && prevDate.getDay() !== 6) {
          foundDate = new Date(prevDate);
          break;
        }
      }
      if (foundDate && foundDate >= s) {
        const newEndStr = toISO(foundDate);
        const newCount = calculateDaysCount(startDate || todayStr, newEndStr);
        onChange(startDate || todayStr, newEndStr, newCount);
      } else {
        onChange(startDate || todayStr, startDate || todayStr, 1);
      }
    }
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const daysGrid: { day: number; dateStr: string; isCurrentMonth: boolean; isWeekend: number }[] = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dObj = new Date(y, m - 1, day);
    daysGrid.push({ day, dateStr, isCurrentMonth: false, isWeekend: dObj.getDay() });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const m = currentMonth + 1;
    const dateStr = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dObj = new Date(currentYear, currentMonth, d);
    daysGrid.push({ day: d, dateStr, isCurrentMonth: true, isWeekend: dObj.getDay() });
  }

  // Next month leading days
  const remaining = (7 - (daysGrid.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = currentMonth === 11 ? 1 : currentMonth + 2;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dObj = new Date(y, m - 1, d);
    daysGrid.push({ day: d, dateStr, isCurrentMonth: false, isWeekend: dObj.getDay() });
  }

  // 💡 스마트 클릭 핸들러: 미래/과거 어느 날이든 자유롭게 시작일과 종료일로 지정 가능!
  const handleDateClick = (dateStr: string) => {
    if (singleDateOnly) {
      onChange(dateStr, dateStr, 1);
      return;
    }

    // 1) 시작일 선택 단계이거나, 이미 2일 이상 범위가 완성된 상태에서 새로운 날짜를 클릭한 경우
    //    -> 클릭한 날짜를 새로운 시작일로 즉시 설정하고 1일로 초기화!
    if (selectPhase === 'START' || (startDate !== endDate && startDate && endDate)) {
      onChange(dateStr, dateStr, 1);
      setSelectPhase('END');
      return;
    }

    // 2) 종료일 선택 단계 (현재 1일만 선택되어 있는 상태)
    const s = startDate || todayStr;

    // 시작일과 동일한 날을 다시 클릭한 경우 -> 1일 선택 완료로 종결
    if (dateStr === s) {
      onChange(s, s, 1);
      setSelectPhase('START');
      return;
    }

    // 시작일 이후의 날짜를 클릭한 경우 -> 종료일로 지정하여 범위 완성!
    if (dateStr > s) {
      const newCount = calculateDaysCount(s, dateStr);
      onChange(s, dateStr, newCount);
      setSelectPhase('START');
      return;
    }

    // 시작일 이전의 날짜를 클릭한 경우 -> 클릭한 날짜가 새로운 시작일이 됨
    if (dateStr < s) {
      onChange(dateStr, dateStr, 1);
      setSelectPhase('END');
      return;
    }
  };

  const isSelectedStart = (dStr: string) => dStr === startDate;
  const isSelectedEnd = (dStr: string) => dStr === endDate;
  const isInRange = (dStr: string) => {
    if (!startDate || !endDate) return false;
    return dStr >= startDate && dStr <= endDate;
  };
  const isToday = (dStr: string) => dStr === todayStr;

  const currentDaysCount = calculateDaysCount(startDate, endDate);
  const weekendDaysCount = calculateWeekendDaysCount(startDate, endDate);
  const is3DaysOrMore = currentDaysCount >= 3;

  return (
    <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] p-2.5 sm:p-3 shadow-2xs space-y-2 font-sans">
      
      {/* 1. 시작일 ~ 종료일 직접 선택 인풋 바 (어느 날짜든 자유롭게 지정) */}
      <div className="bg-[#f8fafc] p-2 rounded-[8px] border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
          {/* 시작일 인풋 */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-[10px] font-bold text-[#475569] flex items-center gap-1">
                <span>📍 시작일</span>
                {selectPhase === 'START' && (
                  <span className="text-[9px] text-[#2563eb] font-extrabold animate-pulse">
                    ● 클릭 대기
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setSelectPhase('START')}
                className={`text-[9px] px-1 rounded font-semibold transition-colors cursor-pointer ${
                  selectPhase === 'START'
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-[#e2e8f0] text-[#64748b] hover:bg-[#cbd5e1]'
                }`}
                title="달력 클릭 시 시작일로 지정"
              >
                선택
              </button>
            </div>
            <input
              type="date"
              value={startDate || todayStr}
              onChange={(e) => handleDirectStartChange(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-[#cbd5e1] rounded px-2 py-1 focus:border-[#1e293b] focus:outline-hidden cursor-pointer"
            />
          </div>

          <span className="text-[#94a3b8] font-bold self-end mb-1.5">~</span>

          {/* 종료일 인풋 */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-[10px] font-bold text-[#475569] flex items-center gap-1">
                <span>🏁 종료일</span>
                {selectPhase === 'END' && (
                  <span className="text-[9px] text-[#d97706] font-extrabold animate-pulse">
                    ● 클릭 대기
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setSelectPhase('END')}
                className={`text-[9px] px-1 rounded font-semibold transition-colors cursor-pointer ${
                  selectPhase === 'END'
                    ? 'bg-[#d97706] text-white'
                    : 'bg-[#e2e8f0] text-[#64748b] hover:bg-[#cbd5e1]'
                }`}
                title="달력 클릭 시 종료일로 지정"
              >
                선택
              </button>
            </div>
            <input
              type="date"
              value={endDate || startDate || todayStr}
              onChange={(e) => handleDirectEndChange(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-[#cbd5e1] rounded px-2 py-1 focus:border-[#1e293b] focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>

        {/* 일수 배지 & 빠른 초기화 */}
        <div className="flex items-center gap-1 self-end mb-0.5">
          <span className={`px-2 py-1 rounded text-xs font-extrabold border shrink-0 ${
            is3DaysOrMore 
              ? 'bg-[#fee2e2] text-[#dc2626] border-[#fca5a5]' 
              : 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
          }`}>
            총 {currentDaysCount}일간
          </span>

          {!singleDateOnly && (
            <button
              type="button"
              onClick={() => handleQuickJump('resetToOneDay')}
              className="p-1 rounded bg-white text-[#64748b] border border-[#cbd5e1] hover:text-[#dc2626] hover:bg-[#fee2e2] transition-colors cursor-pointer"
              title="시작일 하루(1일)로 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. 빠른 날짜 선택 바로가기 바 */}
      <div className="flex flex-wrap items-center justify-between gap-1 pb-1 border-b border-[#f1f5f9]">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => handleQuickJump('today')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
              startDate === todayStr && endDate === todayStr
                ? 'bg-[#1e293b] text-white border-[#1e293b]'
                : 'bg-white text-[#475569] border-[#cbd5e1] hover:border-[#94a3b8]'
            }`}
          >
            📍 오늘 ({formatKoreanDate(todayStr, false).slice(5)})
          </button>
          <button
            type="button"
            onClick={() => handleQuickJump('yesterday')}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-[#475569] border border-[#cbd5e1] hover:border-[#94a3b8] cursor-pointer"
          >
            어제
          </button>
          <button
            type="button"
            onClick={() => handleQuickJump('tomorrow')}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-[#475569] border border-[#cbd5e1] hover:border-[#94a3b8] cursor-pointer"
          >
            내일
          </button>
          <button
            type="button"
            onClick={() => handleQuickJump('nextWeek')}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-[#2563eb] border border-[#bfdbfe] hover:bg-[#eff6ff] cursor-pointer"
          >
            다음 주(월)
          </button>
        </div>

        <div className="text-[10px] text-[#64748b]">
          {selectPhase === 'END' ? (
            <span className="text-[#d97706] font-bold">
              👉 달력에서 종료일을 클릭하세요
            </span>
          ) : (
            <span className="text-[#64748b]">
              💡 날짜를 자유롭게 클릭하여 시작·종료일 지정
            </span>
          )}
        </div>
      </div>

      {/* 3. Calendar Month Navigation Header */}
      <div className="flex items-center justify-between px-0.5 pt-0.5">
        <div className="flex items-center space-x-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-[#1e293b]" />
          
          {/* Year & Month Picker */}
          <div className="flex items-center space-x-1">
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="text-xs font-bold text-[#0f172a] bg-transparent border-0 cursor-pointer focus:outline-hidden"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="text-xs font-bold text-[#0f172a] bg-transparent border-0 cursor-pointer focus:outline-hidden"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => (
                <option key={m} value={m}>{m + 1}월</option>
              ))}
            </select>
          </div>

          {is3DaysOrMore && (
            <span className="text-[9px] bg-[#fee2e2] text-[#dc2626] font-extrabold px-1.5 py-0.2 rounded border border-[#fca5a5] flex items-center gap-0.5">
              <AlertCircle className="w-2.5 h-2.5" />
              <span>연속 {currentDaysCount}일 (진단서 필수)</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={goToToday}
            className="text-[10px] font-semibold text-[#334155] px-1.5 py-0.5 bg-white rounded border border-[#cbd5e1] hover:bg-[#f1f5f9] cursor-pointer"
            title="오늘 날짜로 이동"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={goToPrevMonth}
            className="p-0.5 rounded text-[#475569] hover:bg-[#f1f5f9] cursor-pointer"
            title="이전 달"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-0.5 rounded text-[#475569] hover:bg-[#f1f5f9] cursor-pointer"
            title="다음 달"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Day of week headers */}
      <div className="grid grid-cols-7 gap-0 text-center text-[10px] font-bold text-[#64748b] pt-0.5">
        <div className="text-[#ef4444]">일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div className="text-[#2563eb]">토</div>
      </div>

      {/* 5. Continuous Days Grid */}
      <div className="grid grid-cols-7 gap-y-0.5 gap-x-0">
        {daysGrid.map((item, idx) => {
          const inRange = isInRange(item.dateStr);
          const isStart = isSelectedStart(item.dateStr);
          const isEnd = isSelectedEnd(item.dateStr);
          const today = isToday(item.dateStr);
          const isMultiple = startDate !== endDate && !singleDateOnly;
          const isWeekend = item.isWeekend === 0 || item.isWeekend === 6;

          return (
            <div
              key={`${item.dateStr}-${idx}`}
              className="relative py-0.5 flex items-center justify-center"
              onMouseEnter={() => setHoverDate(item.dateStr)}
            >
              {/* Continuous Connected Ribbon Background */}
              {isMultiple && inRange && (
                <div
                  className={`absolute inset-y-1 ${
                    isWeekend
                      ? 'bg-[#f1f5f9] border-y border-dashed border-[#cbd5e1]'
                      : is3DaysOrMore 
                      ? 'bg-[#fee2e2] border-y border-[#fca5a5]' 
                      : 'bg-[#fff8e8] border-y border-[#ffcd6c]'
                  } z-0 ${
                    isStart
                      ? 'left-1/2 right-0 rounded-l-none'
                      : isEnd
                      ? 'left-0 right-1/2 rounded-r-none'
                      : 'left-0 right-0'
                  }`}
                />
              )}

              {/* Day Button */}
              <button
                type="button"
                onClick={() => handleDateClick(item.dateStr)}
                className={`relative z-10 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-[4px] flex flex-col items-center justify-center text-[11px] font-semibold transition-all cursor-pointer ${
                  isStart || isEnd
                    ? isWeekend
                      ? 'bg-[#64748b] text-white shadow-2xs font-bold'
                      : is3DaysOrMore
                      ? 'bg-[#dc2626] text-white shadow-2xs font-bold'
                      : 'bg-[#1e293b] text-white shadow-2xs font-bold'
                    : inRange
                    ? isWeekend
                      ? 'text-[#94a3b8] font-medium'
                      : is3DaysOrMore
                      ? 'text-[#991b1b] font-bold hover:bg-[#fecaca]'
                      : 'text-[#b45309] font-bold hover:bg-[#ffeec2]'
                    : !item.isCurrentMonth
                    ? 'text-[#cbd5e1] hover:bg-[#f8fafc]'
                    : item.isWeekend === 0
                    ? 'text-[#ef4444] hover:bg-[#f1f5f9]'
                    : item.isWeekend === 6
                    ? 'text-[#2563eb] hover:bg-[#f1f5f9]'
                    : 'text-[#1e293b] hover:bg-[#f1f5f9]'
                } ${
                  today && !isStart && !isEnd ? 'ring-2 ring-[#f59e0b] ring-offset-1 font-bold' : ''
                }`}
              >
                <span>{item.day}</span>
                {today && (
                  <span className={`w-1 h-1 rounded-full ${isStart || isEnd ? 'bg-white' : 'bg-[#ef4444]'}`}></span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 6. Selected Date Summary Footer & Stepper */}
      <div className="p-2 bg-[#f8fafc] rounded-[6px] border border-[#e2e8f0] flex items-center justify-between text-[11px]">
        <div className="space-y-0.5">
          <div className="font-bold text-[#0f172a] flex items-center gap-1.5 text-[11px]">
            <span>{formatKoreanDate(startDate)}</span>
            {startDate !== endDate && (
              <>
                <ArrowRight className="w-3 h-3 text-[#94a3b8]" />
                <span>{formatKoreanDate(endDate)}</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-[#64748b]">
            {is3DaysOrMore
              ? '🏥 연속 3일 이상: 학교 규정상 의사 진단서/소견서 필수 지참'
              : '달력 클릭 또는 상단 날짜 입력창으로 기간을 설정하세요.'}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Stepper (+ / -) */}
          {!singleDateOnly && (
            <div className="flex items-center bg-white border border-[#cbd5e1] rounded px-1 py-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleAdjustDays(-1)}
                disabled={currentDaysCount <= 1}
                className="p-0.5 text-[#475569] hover:text-[#0f172a] disabled:text-[#cbd5e1] cursor-pointer disabled:cursor-not-allowed"
                title="1일 줄이기 (평일 기준)"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjustDays(1)}
                className="p-0.5 text-[#475569] hover:text-[#0f172a] cursor-pointer"
                title="1일 늘리기 (평일 기준)"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col items-end">
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold border ${
              is3DaysOrMore
                ? 'bg-[#fee2e2] text-[#dc2626] border-[#fca5a5]'
                : 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
            }`}>
              총 {currentDaysCount}일간
            </span>
            {weekendDaysCount > 0 && (
              <span className="text-[9px] text-[#64748b] font-medium">
                (주말 {weekendDaysCount}일 제외)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
