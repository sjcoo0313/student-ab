'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  Bell, 
  BellOff,
  AlertCircle
} from 'lucide-react';
import { 
  ReminderSettings, 
  ReminderSlotInfo, 
  DEFAULT_REMINDER_SETTINGS, 
  getReminderSettings, 
  saveReminderSettings 
} from '@/lib/reminders';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: ReminderSettings) => void;
}

export default function ReminderSettingsModal({
  isOpen,
  onClose,
  onSaved,
}: ReminderSettingsModalProps) {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [slots, setSlots] = useState<ReminderSlotInfo[]>([]);

  useEffect(() => {
    if (isOpen) {
      const current = getReminderSettings();
      setEnabled(current.enabled);
      setSlots(current.slots.map(s => ({ ...s })));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMaster = () => {
    setEnabled(prev => !prev);
  };

  const handleSlotTimeChange = (id: string, newTime: string) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, time: newTime } : s));
  };

  const handleSlotTitleChange = (id: string, newTitle: string) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const handleToggleSlotEnabled = (id: string) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleDeleteSlot = (id: string) => {
    if (slots.length <= 1) {
      alert('최소 1개 이상의 알림 시간 슬롯이 필요합니다.');
      return;
    }
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const handleAddSlot = () => {
    if (slots.length >= 6) {
      alert('알림 시간은 최대 6개까지 등록할 수 있습니다.');
      return;
    }
    const nextNum = slots.length + 1;
    const newId = `slot-${Date.now()}`;
    const newSlot: ReminderSlotInfo = {
      id: newId,
      time: '15:30',
      title: `${nextNum}차 방과후 알림`,
      periodName: `오후 15:30`,
      timeDescription: '방과후 하교 전',
      targetAction: '교실 제출함 투입 및 [제출 완료] 전송',
      enabled: true,
    };
    setSlots(prev => [...prev, newSlot]);
  };

  const handleResetDefaults = () => {
    if (confirm('알림 설정을 학교 기본 권장 시간(09:30, 12:30, 14:30)으로 초기화하시겠습니까?')) {
      setEnabled(DEFAULT_REMINDER_SETTINGS.enabled);
      setSlots(DEFAULT_REMINDER_SETTINGS.slots.map(s => ({ ...s })));
    }
  };

  const handleSave = () => {
    // 유효성 검사: 빈 시간 검사
    for (const slot of slots) {
      if (!slot.time || !slot.time.trim()) {
        alert('모든 슬롯의 시간을 올바르게 입력해주세요 (예: 09:30).');
        return;
      }
    }

    // 시간순 정렬
    const sortedSlots = [...slots].sort((a, b) => a.time.localeCompare(b.time));

    const newSettings: ReminderSettings = {
      enabled,
      slots: sortedSlots,
    };

    saveReminderSettings(newSettings);
    if (onSaved) {
      onSaved(newSettings);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#fbfaf9] border border-[#e5d5c3] rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#f2f0ed] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-lg ${
              enabled ? 'bg-[#fff8e8] text-[#d48f00]' : 'bg-[#f3f4f6] text-[#9ca3af]'
            }`}>
              ⏰
            </div>
            <div>
              <h2 className="text-base font-bold text-[#121212]">
                결석계 정기 자동 알림 설정
              </h2>
              <p className="text-xs text-[#7e7e7d]">
                알림 시간 지정 및 자동 발송 ON / OFF 토글
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7e7e7d] hover:bg-[#f6f4ef] hover:text-[#121212] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Master ON / OFF Switch Card */}
          <div className={`p-4 rounded-[16px] border transition-all ${
            enabled 
              ? 'bg-[#f0fdf4] border-[#bbf7d0]' 
              : 'bg-[#f9fafb] border-[#e5e7eb]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  enabled ? 'bg-[#22c55e] text-white shadow-xs' : 'bg-[#d1d5db] text-white'
                }`}>
                  {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-[#121212]">
                      정기 자동 알림 기능
                    </h3>
                    <span className={`badge-pill text-[10px] font-bold ${
                      enabled ? 'badge-mint' : 'badge-stone'
                    }`}>
                      {enabled ? '작동 중 (ON)' : '꺼짐 (OFF)'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    {enabled 
                      ? '설정한 시간이 되면 미제출 학생에게 자동으로 알림 핑과 소리를 보냅니다.'
                      : '자동 발송을 끕니다. 필요 시 교사가 수동으로 [전송] 버튼을 눌러 발송할 수 있습니다.'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleMaster}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  enabled ? 'bg-[#16a34a]' : 'bg-[#d1d5db]'
                }`}
                role="switch"
                aria-checked={enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Time Slots Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#121212] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#d48f00]" />
                  <span>알림 발송 시간 목록</span>
                </h4>
                <p className="text-[11px] text-[#7e7e7d]">
                  교사가 직접 원하는 교시나 조회·종례 시간에 맞춰 시간을 설정할 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSlot}
                disabled={slots.length >= 6}
                className="px-2.5 py-1 text-xs font-bold text-[#d48f00] bg-[#fff8e8] border border-[#ffcd6c] rounded-[8px] hover:bg-[#ffeec2] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>시간 추가</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {slots.map((slot, index) => (
                <div 
                  key={slot.id} 
                  className={`p-3 rounded-[12px] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    slot.enabled !== false 
                      ? 'bg-white border-[#e5d5c3]' 
                      : 'bg-[#fcfbf9] border-[#f2f0ed] opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 flex-1">
                    <span className="w-5 h-5 rounded-full bg-[#f6f4ef] text-[#7e7e7d] text-[11px] font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    
                    {/* Time Input */}
                    <div className="relative shrink-0">
                      <input
                        type="time"
                        value={slot.time}
                        onChange={(e) => handleSlotTimeChange(slot.id, e.target.value)}
                        className="bg-[#fcfbf9] border border-[#e5d5c3] text-xs font-bold text-[#121212] rounded-[8px] px-2.5 py-1.5 focus:border-[#121212] focus:outline-hidden"
                      />
                    </div>

                    {/* Title Input */}
                    <input
                      type="text"
                      value={slot.title}
                      onChange={(e) => handleSlotTitleChange(slot.id, e.target.value)}
                      placeholder="알림 명칭 (예: 아침 알림)"
                      className="bg-transparent border-b border-transparent hover:border-[#e5d5c3] focus:border-[#121212] text-xs font-medium text-[#121212] px-1 py-1 focus:outline-hidden flex-1 min-w-[100px]"
                    />
                  </div>

                  {/* Right Actions: Individual toggle & Delete */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleSlotEnabled(slot.id)}
                      className={`px-2 py-1 rounded-[6px] text-[11px] font-bold border transition-colors cursor-pointer ${
                        slot.enabled !== false
                          ? 'bg-[#e6fbf1] text-[#00ca48] border-[#a3f3ca]'
                          : 'bg-[#f3f4f6] text-[#9ca3af] border-[#e5e7eb]'
                      }`}
                    >
                      {slot.enabled !== false ? '사용' : '제외'}
                    </button>

                    {slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-1.5 text-[#ef4444] hover:bg-[#fee2e2] rounded-[6px] transition-colors cursor-pointer"
                        title="이 시간 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset to defaults button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-[#7e7e7d] hover:text-[#121212] flex items-center gap-1.5 underline decoration-[#cbd5e1] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>기본 권장 시간(09:30, 12:30, 14:30)으로 초기화</span>
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#f6f4ef] border-t border-[#f2f0ed] flex items-center justify-end space-x-2.5 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#7e7e7d] hover:text-[#121212] bg-white border border-[#e5d5c3] rounded-[10px] hover:bg-[#fcfbf9] transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-dark-pill text-xs py-2 px-5 flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>설정 저장 및 적용</span>
          </button>
        </div>
      </div>
    </div>
  );
}
