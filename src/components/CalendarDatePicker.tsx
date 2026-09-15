'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

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
  const [selectingStep, setSelectingStep] = useState<'start' | 'end'>('start');

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
    setSelectingStep('start');
  };

  const handleQuickPreset = (preset: 'today' | 'yesterday' | 'tomorrow' | '3days' | '5days') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const dStr = toISO(now);
      onChange(dStr, dStr, 1);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const dStr = toISO(y);
      onChange(dStr, dStr, 1);
    } else if (preset === 'tomorrow') {
      const t = new Date(now);
      t.setDate(t.getDate() + 1);
      const dStr = toISO(t);
      onChange(dStr, dStr, 1);
    } else if (preset === '3days') {
      const sStr = toISO(now);
      const e = new Date(now);
      e.setDate(e.getDate() + 2);
      const eStr = toISO(e);
      onChange(sStr, eStr, 3);
    } else if (preset === '5days') {
      const sStr = toISO(now);
      const e = new Date(now);
      e.setDate(e.getDate() + 4);
      const eStr = toISO(e);
      onChange(sStr, eStr, 5);
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

  // Next month leading days to complete 6 rows (42 days) or 5 rows (35 days)
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

    if (selectingStep === 'start' || !startDate) {
      onChange(dateStr, dateStr, 1);
      setSelectingStep('end');
    } else {
      // If clicked date is before start date, treat it as new start date
      if (dateStr < startDate) {
        onChange(dateStr, dateStr, 1);
        setSelectingStep('end');
      } else {
        const count = calculateDaysCount(startDate, dateStr);
        onChange(startDate, dateStr, count);
        setSelectingStep('start');
      }
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

  return (
    <div className="bg-[#ffffff] border border-[#e5d5c3] rounded-[14px] p-3.5 shadow-xs space-y-3 font-sans">
      {/* Quick Presets Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2.5 border-b border-[#f2f0ed]">
        <span className="text-[11px] font-semibold text-[#7e7e7d] mr-1 flex items-center">
          <Sparkles className="w-3 h-3 text-[#ffcd6c] mr-1" />
          빠른 선택:
        </span>
        <button
          type="button"
          onClick={() => handleQuickPreset('today')}
          className={`px-2 py-1 rounded-[6px] text-[11px] font-bold border transition-colors ${
            startDate === todayStr && endDate === todayStr
              ? 'bg-[#121212] text-white border-[#121212]'
              : 'bg-[#fff8e8] text-[#d48f00] border-[#ffcd6c] hover:bg-[#ffeec2]'
          }`}
        >
          📍 오늘 ({formatKoreanDate(todayStr, false).slice(6)})
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset('yesterday')}
          className="px-2 py-1 rounded-[6px] text-[11px] font-medium bg-[#fcfbf9] text-[#474645] border border-[#f2f0ed] hover:border-[#e5d5c3]"
        >
          어제
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset('tomorrow')}
          className="px-2 py-1 rounded-[6px] text-[11px] font-medium bg-[#fcfbf9] text-[#474645] border border-[#f2f0ed] hover:border-[#e5d5c3]"
        >
          내일
        </button>
        {!singleDateOnly && (
          <>
            <button
              type="button"
              onClick={() => handleQuickPreset('3days')}
              className="px-2 py-1 rounded-[6px] text-[11px] font-medium bg-[#e6fbf1] text-[#00ca48] border border-[#00ca48]/30 hover:bg-[#c9f6e0]"
            >
              오늘부터 3일간
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('5days')}
              className="px-2 py-1 rounded-[6px] text-[11px] font-medium bg-[#eef7ff] text-[#0086fc] border border-[#0086fc]/30 hover:bg-[#d8edff]"
            >
              5일간(1주일)
            </button>
          </>
        )}
      </div>

      {/* Calendar Month Navigation Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-1.5">
          <CalendarIcon className="w-4 h-4 text-[#121212]" />
          <span className="text-sm font-bold text-[#121212]">
            {currentYear}년 {currentMonth + 1}월
          </span>
          {isToday(startDate) && (
            <span className="badge-pill badge-mint text-[10px] py-0.5 px-1.5">
              오늘 자동적용
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={goToToday}
            className="text-[11px] font-semibold text-[#121212] px-2 py-1 bg-[#fcfbf9] rounded-[6px] border border-[#f2f0ed] hover:bg-[#f2f0ed]"
            title="오늘 날짜로 이동"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={goToPrevMonth}
            className="p-1 rounded-[6px] text-[#474645] hover:bg-[#f2f0ed]"
            title="이전 달"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1 rounded-[6px] text-[#474645] hover:bg-[#f2f0ed]"
            title="다음 달"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#7e7e7d] pt-1">
        <div className="text-[#ff3e00]">일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div className="text-[#0086fc]">토</div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysGrid.map((item, idx) => {
          const inRange = isInRange(item.dateStr);
          const isStart = isSelectedStart(item.dateStr);
          const isEnd = isSelectedEnd(item.dateStr);
          const today = isToday(item.dateStr);

          let bgClass = 'bg-transparent text-[#121212] hover:bg-[#f2f0ed]';
          if (!item.isCurrentMonth) {
            bgClass = 'text-[#b9b8b6] hover:bg-[#faf9f7]';
          }

          if (isStart || isEnd) {
            bgClass = 'bg-[#121212] text-[#ffffff] font-bold shadow-xs';
          } else if (inRange) {
            bgClass = 'bg-[#fff8e8] text-[#121212] font-semibold';
          }

          return (
            <button
              key={`${item.dateStr}-${idx}`}
              type="button"
              onClick={() => handleDateClick(item.dateStr)}
              className={`relative h-8 rounded-[8px] flex items-center justify-center text-xs transition-all ${bgClass} ${
                today && !isStart && !isEnd ? 'ring-2 ring-[#ffcd6c] ring-offset-1 font-bold' : ''
              }`}
            >
              <span>{item.day}</span>
              {today && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#ff3e00]"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Summary & Range Badge */}
      <div className="p-2.5 bg-[#fcfbf9] rounded-[10px] border border-[#f2f0ed] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        <div className="space-y-0.5">
          <div className="text-[11px] text-[#7e7e7d]">선택된 결석 기간:</div>
          <div className="font-bold text-[#121212] flex items-center space-x-1.5">
            <span>{formatKoreanDate(startDate)}</span>
            {startDate !== endDate && (
              <>
                <span className="text-[#7e7e7d]">~</span>
                <span>{formatKoreanDate(endDate)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <span className="badge-pill badge-honey text-xs font-bold px-2.5 py-1">
            총 {currentDaysCount}일간
          </span>
          <span className="text-[10px] text-[#7e7e7d]">
            ({selectingStep === 'end' ? '종료일 클릭' : '시작일 클릭'})
          </span>
        </div>
      </div>
    </div>
  );
}
