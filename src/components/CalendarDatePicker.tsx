'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, Plus, Minus } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'start' | 'end'>('start');
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
    setActiveTab('start');
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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

  // 퀵 프리셋 버튼 핸들러
  const handleQuickPreset = (preset: 'today' | '2days' | '3days' | '4days' | '5days' | '7days') => {
    const baseDate = startDate ? new Date(startDate) : new Date();
    const sStr = toISO(baseDate);

    if (preset === 'today') {
      const dStr = getTodayString();
      onChange(dStr, dStr, 1);
      setActiveTab('start');
      return;
    }

    let daysToAdd = 1;
    if (preset === '2days') daysToAdd = 2;
    else if (preset === '3days') daysToAdd = 3;
    else if (preset === '4days') daysToAdd = 4;
    else if (preset === '5days') daysToAdd = 5;
    else if (preset === '7days') daysToAdd = 7;

    const endD = new Date(baseDate);
    endD.setDate(endD.getDate() + (daysToAdd - 1));
    const eStr = toISO(endD);
    onChange(sStr, eStr, daysToAdd);
    setActiveTab('start');
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

  const handleDateClick = (dateStr: string) => {
    if (singleDateOnly) {
      onChange(dateStr, dateStr, 1);
      return;
    }

    if (activeTab === 'start') {
      if (endDate && dateStr > endDate) {
        onChange(dateStr, dateStr, 1);
      } else {
        const count = calculateDaysCount(dateStr, endDate || dateStr);
        onChange(dateStr, endDate || dateStr, count);
      }
      setActiveTab('end');
    } else {
      // selecting end date
      if (dateStr < startDate) {
        // 클릭한 날짜가 시작일 이전이면 시작일로 재지정
        onChange(dateStr, dateStr, 1);
        setActiveTab('end');
      } else {
        const count = calculateDaysCount(startDate, dateStr);
        onChange(startDate, dateStr, count);
        setActiveTab('start');
      }
    }
  };

  const isSelectedStart = (dStr: string) => dStr === startDate;
  const isSelectedEnd = (dStr: string) => dStr === endDate;
  const isInRange = (dStr: string) => {
    if (!startDate || !endDate) return false;
    return dStr >= startDate && dStr <= endDate;
  };
  const isHoverInRange = (dStr: string) => {
    if (activeTab !== 'end' || !hoverDate || !startDate) return false;
    if (hoverDate > startDate) {
      return dStr >= startDate && dStr <= hoverDate;
    }
    return false;
  };
  const isToday = (dStr: string) => dStr === todayStr;

  const currentDaysCount = calculateDaysCount(startDate, endDate);

  return (
    <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] p-3 shadow-xs space-y-2.5 font-sans">
      {/* 1. Quick Presets Bar (연속 일수 빠른 선택) */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[#f1f5f9]">
        <span className="text-[11px] font-bold text-[#475569] mr-0.5 flex items-center">
          <Sparkles className="w-3 h-3 text-[#f59e0b] mr-1" />
          연속 일수:
        </span>
        <button
          type="button"
          onClick={() => handleQuickPreset('today')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
            startDate === todayStr && endDate === todayStr
              ? 'bg-[#1e293b] text-white border-[#1e293b]'
              : 'bg-white text-[#475569] border-[#cbd5e1] hover:border-[#94a3b8]'
          }`}
        >
          오늘 1일
        </button>
        {!singleDateOnly && (
          <>
            <button
              type="button"
              onClick={() => handleQuickPreset('2days')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                currentDaysCount === 2
                  ? 'bg-[#1e293b] text-white border-[#1e293b]'
                  : 'bg-white text-[#475569] border-[#cbd5e1] hover:border-[#94a3b8]'
              }`}
            >
              2일간
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('3days')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                currentDaysCount === 3
                  ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-xs'
                  : 'bg-[#fef2f2] text-[#dc2626] border-[#fca5a5] hover:bg-[#fee2e2]'
              }`}
              title="3일 이상 질병결석: 결석신고서 양식에 따라 의사 진단서/소견서 제출 필수"
            >
              <span>🏥 3일간 (진단서 필요)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('4days')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                currentDaysCount === 4
                  ? 'bg-[#1e293b] text-white border-[#1e293b]'
                  : 'bg-white text-[#475569] border-[#cbd5e1] hover:border-[#94a3b8]'
              }`}
            >
              4일간
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('5days')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                currentDaysCount === 5
                  ? 'bg-[#1e293b] text-white border-[#1e293b]'
                  : 'bg-white text-[#475569] border-[#cbd5e1] hover:border-[#94a3b8]'
              }`}
            >
              5일간(1주일)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('7days')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                currentDaysCount === 7
                  ? 'bg-[#1e293b] text-white border-[#1e293b]'
                  : 'bg-white text-[#475569] border-[#cbd5e1] hover:border-[#94a3b8]'
              }`}
            >
              7일간
            </button>
          </>
        )}
      </div>

      {/* 2. Direct Start/End Selection Tabs & Days Stepper */}
      {!singleDateOnly && (
        <div className="flex items-center justify-between gap-2 p-1.5 bg-[#f8fafc] rounded-[6px] border border-[#e2e8f0]">
          <div className="flex items-center gap-1.5 flex-1">
            <button
              type="button"
              onClick={() => setActiveTab('start')}
              className={`flex-1 py-1 px-2 rounded text-left border transition-all cursor-pointer ${
                activeTab === 'start'
                  ? 'bg-white border-[#2563eb] text-[#1e40af] shadow-xs ring-1 ring-[#2563eb]/20'
                  : 'bg-transparent border-transparent text-[#64748b] hover:bg-white'
              }`}
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">1. 시작일</div>
              <div className="text-xs font-bold text-[#0f172a] truncate">{startDate}</div>
            </button>

            <span className="text-[#94a3b8] font-bold text-xs">~</span>

            <button
              type="button"
              onClick={() => setActiveTab('end')}
              className={`flex-1 py-1 px-2 rounded text-left border transition-all cursor-pointer ${
                activeTab === 'end'
                  ? 'bg-white border-[#2563eb] text-[#1e40af] shadow-xs ring-1 ring-[#2563eb]/20'
                  : 'bg-transparent border-transparent text-[#64748b] hover:bg-white'
              }`}
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">2. 종료일</div>
              <div className="text-xs font-bold text-[#0f172a] truncate">{endDate}</div>
            </button>
          </div>

          {/* Stepper (+ / - 일수 조절) */}
          <div className="flex items-center bg-white border border-[#cbd5e1] rounded px-1.5 py-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleAdjustDays(-1)}
              disabled={currentDaysCount <= 1}
              className="p-1 text-[#475569] hover:text-[#0f172a] disabled:text-[#cbd5e1] cursor-pointer disabled:cursor-not-allowed"
              title="1일 줄이기"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className={`px-2 text-xs font-extrabold ${currentDaysCount >= 3 ? 'text-[#dc2626]' : 'text-[#0f172a]'}`}>
              {currentDaysCount}일간
            </span>
            <button
              type="button"
              onClick={() => handleAdjustDays(1)}
              className="p-1 text-[#475569] hover:text-[#0f172a] cursor-pointer"
              title="1일 늘리기 (연속 선택)"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Calendar Month Navigation Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center space-x-1.5">
          <CalendarIcon className="w-4 h-4 text-[#1e293b]" />
          <span className="text-xs sm:text-sm font-bold text-[#0f172a]">
            {currentYear}년 {currentMonth + 1}월
          </span>
          {currentDaysCount >= 3 && (
            <span className="text-[10px] bg-[#fee2e2] text-[#dc2626] font-bold px-1.5 py-0.5 rounded border border-[#fca5a5]">
              3일 이상 질병결석
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
          const isHoverRange = isHoverInRange(item.dateStr);
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
              {isMultiple && (inRange || isHoverRange) && (
                <div
                  className={`absolute inset-y-1 bg-[#fff8e8] border-y border-[#ffcd6c] z-0 ${
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
                    ? 'bg-[#1e293b] text-white shadow-xs font-bold'
                    : inRange
                    ? 'text-[#b45309] font-bold hover:bg-[#ffeec2]'
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
                  <span className={`w-1 h-1 rounded-full ${isStart || isEnd ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'}`}></span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 6. Selected Date Summary Footer */}
      <div className="p-2 bg-[#f8fafc] rounded-[6px] border border-[#e2e8f0] flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <div className="font-bold text-[#0f172a] flex items-center gap-1.5 text-xs">
            <span>{formatKoreanDate(startDate)}</span>
            {startDate !== endDate && (
              <>
                <span className="text-[#94a3b8]">~</span>
                <span>{formatKoreanDate(endDate)}</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-[#64748b]">
            {activeTab === 'end' ? '달력에서 종료일을 클릭하세요' : '달력에서 시작일을 클릭하거나 + 버튼으로 기간을 늘리세요'}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${
            currentDaysCount >= 3
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
