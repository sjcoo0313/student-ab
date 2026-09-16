'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw, Plus, Minus, AlertCircle } from 'lucide-react';

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

export const calculateDaysCount = (start: string, end: string): number => {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
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
    const today = new Date();
    const tStr = getTodayString();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    onChange(tStr, tStr, 1);
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // 빠른 날짜 이동 버튼 (오늘, 어제, 내일, 1일로 리셋)
  const handleQuickJump = (type: 'today' | 'yesterday' | 'tomorrow' | 'resetToOneDay') => {
    const base = new Date();
    if (type === 'today') {
      const dStr = toISO(base);
      onChange(dStr, dStr, 1);
    } else if (type === 'yesterday') {
      base.setDate(base.getDate() - 1);
      const dStr = toISO(base);
      onChange(dStr, dStr, 1);
    } else if (type === 'tomorrow') {
      base.setDate(base.getDate() + 1);
      const dStr = toISO(base);
      onChange(dStr, dStr, 1);
    } else if (type === 'resetToOneDay') {
      const curStart = startDate || todayStr;
      onChange(curStart, curStart, 1);
    }
  };

  // 일수 증감 스태퍼 (+1일 / -1일)
  const handleAdjustDays = (delta: number) => {
    const currentCount = calculateDaysCount(startDate, endDate);
    const newCount = Math.max(1, currentCount + delta);
    const baseDate = startDate ? new Date(startDate) : new Date();
    const newEnd = new Date(baseDate);
    newEnd.setDate(newEnd.getDate() + (newCount - 1));
    const newEndStr = toISO(newEnd);
    onChange(startDate || todayStr, newEndStr, newCount);
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

  // 💡 핵심: 날짜를 연속적으로 클릭하여 결석 일수를 자연스럽게 늘리거나 줄이는 핸들러
  const handleDateClick = (dateStr: string) => {
    if (singleDateOnly) {
      onChange(dateStr, dateStr, 1);
      return;
    }

    if (!startDate) {
      onChange(dateStr, dateStr, 1);
      return;
    }

    const s = startDate;
    const e = endDate || startDate;

    // 1) 시작일을 다시 클릭한 경우: 여러 날 선택 중이었다면 시작일 1일만 선택으로 초기화
    if (dateStr === s) {
      onChange(s, s, 1);
      return;
    }

    // 2) 현재 종료일을 다시 클릭한 경우: 결석 일수를 1일 줄임 (예: 16~18 선택 중 18 클릭 -> 16~17로 축소)
    if (dateStr === e && e > s) {
      const eDate = new Date(e);
      eDate.setDate(eDate.getDate() - 1);
      const newEndStr = toISO(eDate);
      const newCount = calculateDaysCount(s, newEndStr);
      onChange(s, newEndStr, newCount);
      return;
    }

    // 3) 선택 범위 내부의 날짜를 클릭한 경우 (s < dateStr < e): 클릭한 날짜까지로 종료일 축소 (예: 16~20 중 18 클릭 -> 16~18)
    if (dateStr > s && dateStr < e) {
      const newCount = calculateDaysCount(s, dateStr);
      onChange(s, dateStr, newCount);
      return;
    }

    // 4) 현재 종료일 이후의 날짜를 클릭한 경우 (dateStr > e): 연속적으로 범위를 확장!
    //    예: 16일(1일) -> 17일 클릭(2일) -> 18일 클릭(3일: 진단서 안내 자동 발동) -> 19일 클릭(4일)
    if (dateStr > e) {
      const newCount = calculateDaysCount(s, dateStr);
      onChange(s, dateStr, newCount);
      return;
    }

    // 5) 시작일보다 이전의 날짜를 클릭한 경우 (dateStr < s)
    if (dateStr < s) {
      // 바로 하루 전날이면 시작일을 앞쪽으로 하루 확장
      const prevDay = new Date(s);
      prevDay.setDate(prevDay.getDate() - 1);
      if (dateStr === toISO(prevDay)) {
        const newCount = calculateDaysCount(dateStr, e);
        onChange(dateStr, e, newCount);
        return;
      }

      // 하루 이상 떨어진 이전 날짜면 해당 날짜 1일 선택으로 새롭게 시작
      onChange(dateStr, dateStr, 1);
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
  const is3DaysOrMore = currentDaysCount >= 3;

  return (
    <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] p-3 shadow-xs space-y-2.5 font-sans">
      {/* 1. 빠른 날짜 선택 & 초기화 바 */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-[#f1f5f9]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleQuickJump('today')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
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
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-[#475569] border border-[#cbd5e1] hover:border-[#94a3b8] cursor-pointer"
          >
            어제
          </button>
          <button
            type="button"
            onClick={() => handleQuickJump('tomorrow')}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-[#475569] border border-[#cbd5e1] hover:border-[#94a3b8] cursor-pointer"
          >
            내일
          </button>
        </div>

        {!singleDateOnly && currentDaysCount > 1 && (
          <button
            type="button"
            onClick={() => handleQuickJump('resetToOneDay')}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f8fafc] text-[#64748b] border border-[#cbd5e1] hover:bg-[#fee2e2] hover:text-[#dc2626] hover:border-[#fca5a5] transition-colors cursor-pointer flex items-center gap-1"
            title="현재 시작일 기준 1일로 재설정"
          >
            <RotateCcw className="w-3 h-3" />
            <span>1일로 초기화</span>
          </button>
        )}
      </div>

      {/* 2. 연속 클릭 안내 팁 */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#f8fafc] rounded-[6px] border border-[#e2e8f0] text-[11px] text-[#475569]">
        <span className="text-sm">👆</span>
        <span>
          달력에서 날짜를 <strong>연속 클릭</strong>하면 결석 기간이 늘어납니다.{' '}
          <span className="text-[#dc2626] font-semibold">(연속 3일 이상 시 의사 진단서 필수 자동 전환)</span>
        </span>
      </div>

      {/* 3. Calendar Month Navigation Header */}
      <div className="flex items-center justify-between px-1 pt-0.5">
        <div className="flex items-center space-x-1.5">
          <CalendarIcon className="w-4 h-4 text-[#1e293b]" />
          <span className="text-xs sm:text-sm font-bold text-[#0f172a]">
            {currentYear}년 {currentMonth + 1}월
          </span>
          {is3DaysOrMore && (
            <span className="text-[10px] bg-[#fee2e2] text-[#dc2626] font-extrabold px-1.5 py-0.5 rounded border border-[#fca5a5] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>연속 {currentDaysCount}일 (진단서 필수)</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={goToToday}
            className="text-[11px] font-semibold text-[#334155] px-2 py-0.5 bg-white rounded border border-[#cbd5e1] hover:bg-[#f1f5f9] cursor-pointer"
            title="오늘 날짜로 이동"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={goToPrevMonth}
            className="p-1 rounded text-[#475569] hover:bg-[#f1f5f9] cursor-pointer"
            title="이전 달"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1 rounded text-[#475569] hover:bg-[#f1f5f9] cursor-pointer"
            title="다음 달"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Day of week headers */}
      <div className="grid grid-cols-7 gap-0 text-center text-[11px] font-bold text-[#64748b] pt-0.5">
        <div className="text-[#ef4444]">일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div className="text-[#2563eb]">토</div>
      </div>

      {/* 5. Continuous Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 gap-x-0">
        {daysGrid.map((item, idx) => {
          const inRange = isInRange(item.dateStr);
          const isStart = isSelectedStart(item.dateStr);
          const isEnd = isSelectedEnd(item.dateStr);
          const today = isToday(item.dateStr);
          const isMultiple = startDate !== endDate && !singleDateOnly;

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
                    is3DaysOrMore 
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
                className={`relative z-10 w-8 h-8 rounded-[6px] flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
                  isStart || isEnd
                    ? is3DaysOrMore
                      ? 'bg-[#dc2626] text-white shadow-xs font-bold'
                      : 'bg-[#1e293b] text-white shadow-xs font-bold'
                    : inRange
                    ? is3DaysOrMore
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
      <div className="p-2 bg-[#f8fafc] rounded-[6px] border border-[#e2e8f0] flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <div className="font-bold text-[#0f172a] flex items-center gap-1 text-xs">
            <span>{formatKoreanDate(startDate)}</span>
            {startDate !== endDate && (
              <>
                <span className="text-[#94a3b8]">~</span>
                <span>{formatKoreanDate(endDate)}</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-[#64748b]">
            {is3DaysOrMore
              ? '🏥 3일 이상 질병결석: 의사 진단서 또는 소견서 필수'
              : '달력 날짜를 클릭하여 결석 기간을 지정하세요'}
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
                className="p-1 text-[#475569] hover:text-[#0f172a] disabled:text-[#cbd5e1] cursor-pointer disabled:cursor-not-allowed"
                title="1일 줄이기"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjustDays(1)}
                className="p-1 text-[#475569] hover:text-[#0f172a] cursor-pointer"
                title="1일 늘리기"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}

          <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${
            is3DaysOrMore
              ? 'bg-[#fee2e2] text-[#dc2626] border-[#fca5a5]'
              : 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
          }`}>
            총 {currentDaysCount}일간
          </span>
        </div>
      </div>
    </div>
  );
}
