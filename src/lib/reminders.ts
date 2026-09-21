import { AbsenceRecord, SystemNotification, ReminderSlotInfo, ReminderSettings, ReminderSlotTime } from '@/types';
import { 
  getAbsenceRecords, 
  saveAbsenceRecords, 
  saveRecordsAndNotifications,
  getNotifications,
  getStudents,
  addNotification,
  getStudentConsecutiveIllnessDays,
  postServerSync,
  isTeacherLoggedIn
} from '@/lib/storage';
import { playRemindSound } from '@/lib/sound';

export type { ReminderSlotInfo, ReminderSettings, ReminderSlotTime };

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  slots: [
    {
      id: 'slot-1',
      time: '09:30',
      title: '1차 아침 알림',
      periodName: '아침 09:30',
      timeDescription: '1교시 시작 전후 (아침 조회 후)',
      targetAction: '교실 서류함에서 양식 챙기기',
      enabled: true,
    },
    {
      id: 'slot-2',
      time: '12:30',
      title: '2차 정오 알림',
      periodName: '정오 12:30',
      timeDescription: '점심시간 시작',
      targetAction: '서류 자필 작성 및 증빙서류 준비',
      enabled: true,
    },
    {
      id: 'slot-3',
      time: '14:30',
      title: '3차 오후 알림',
      periodName: '오후 14:30',
      timeDescription: '종례 및 하교 전',
      targetAction: '교실 제출함 투입 및 [제출 완료] 전송',
      enabled: true,
    },
  ],
};

export const REMINDER_SLOTS: ReminderSlotInfo[] = DEFAULT_REMINDER_SETTINGS.slots;

const REMINDER_SETTINGS_KEY = 'hoengseong_reminder_settings_v1';
const REMINDER_LOG_KEY = 'hoengseong_daily_reminders_log_v1';

export interface DailyReminderLog {
  date: string; // YYYY-MM-DD
  slots: {
    [slotKey: string]: {
      dispatchedAt: string;
      studentCount: number;
      studentNames: string[];
      isManual?: boolean;
    };
  };
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 💡 교사 커스텀 알림 설정(시간 및 온/오프) 조회
export function getReminderSettings(): ReminderSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_REMINDER_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_REMINDER_SETTINGS;
    }
    const parsed: ReminderSettings = JSON.parse(raw);
    if (typeof parsed.enabled !== 'boolean' || !Array.isArray(parsed.slots)) {
      return DEFAULT_REMINDER_SETTINGS;
    }
    return parsed;
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

// 💡 교사 커스텀 알림 설정 저장 & 서버 동기화
export function saveReminderSettings(settings: ReminderSettings): void {
  if (typeof window === 'undefined') return;
  const settingsWithTimestamp: ReminderSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settingsWithTimestamp));
  window.dispatchEvent(new CustomEvent('hoengseong_reminder_settings_updated', { detail: settingsWithTimestamp }));
  postServerSync('SAVE_REMINDER_SETTINGS', { reminderSettings: settingsWithTimestamp });
}

export function getTodayReminderLog(): DailyReminderLog {
  if (typeof window === 'undefined') {
    return { date: getTodayDateString(), slots: {} };
  }
  try {
    const raw = localStorage.getItem(REMINDER_LOG_KEY);
    const today = getTodayDateString();
    if (!raw) {
      return { date: today, slots: {} };
    }
    const parsed: DailyReminderLog = JSON.parse(raw);
    if (parsed.date !== today) {
      // New day, reset slots
      const newLog = { date: today, slots: {} };
      localStorage.setItem(REMINDER_LOG_KEY, JSON.stringify(newLog));
      return newLog;
    }
    return parsed;
  } catch {
    return { date: getTodayDateString(), slots: {} };
  }
}

export function saveReminderLog(log: DailyReminderLog) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMINDER_LOG_KEY, JSON.stringify(log));
  window.dispatchEvent(new CustomEvent('hoengseong_reminder_log_updated', { detail: log }));
  postServerSync('SAVE_REMINDER_LOG', { reminderLog: log });
}

export function clearReminderLog() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REMINDER_LOG_KEY);
  const emptyLog = { date: getTodayDateString(), slots: {} };
  window.dispatchEvent(new CustomEvent('hoengseong_reminder_log_updated', { detail: emptyLog }));
  postServerSync('SAVE_REMINDER_LOG', { reminderLog: emptyLog });
}

// 미이행 학생 레코드 목록 (누적 관리)
export function getUnfulfilledAbsenceRecords(): AbsenceRecord[] {
  const records = getAbsenceRecords();

  return records.filter(r => {
    // 서류 제출이 불필요한 건은 제외
    if (r.requiresDocument === false) {
      return false;
    }
    // 이미 최종 승인(APPROVED)된 건 제외
    if (r.status === 'APPROVED') {
      return false;
    }
    // 등교 확인 대기, 서류 미수령, 서류 챙김은 날짜가 지났어도 완료될 때까지 누적
    if (r.status === 'PENDING_ATTENDANCE' || r.status === 'ATTENDED_NOTIFIED' || r.status === 'FORM_PICKED_UP') {
      return true;
    }
    return false;
  });
}

// 브라우저 웹 푸시 알림 요청 및 발송
export function requestBrowserNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

export function triggerBrowserPush(title: string, body: string) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch {
        // Ignore
      }
    }
  }
}

// 특정 시간대 슬롯 리마인드 발송 처리
export function dispatchScheduledReminder(
  slotOrTime: ReminderSlotInfo | string,
  isManual = false
): {
  dispatchedCount: number;
  studentNames: string[];
  slot: ReminderSlotInfo;
} {
  const settings = getReminderSettings();
  let slot: ReminderSlotInfo;

  if (typeof slotOrTime === 'object' && slotOrTime !== null) {
    slot = slotOrTime;
  } else {
    const found = settings.slots.find(s => s.id === slotOrTime || s.time === slotOrTime);
    if (found) {
      slot = found;
    } else {
      slot = {
        id: `slot-${slotOrTime}`,
        time: slotOrTime,
        title: `${slotOrTime} 알림`,
        targetAction: '결석계 서류 제출 절차 이행',
        enabled: true,
      };
    }
  }

  const unfulfilled = getUnfulfilledAbsenceRecords();
  const allRecords = getAbsenceRecords();

  if (unfulfilled.length === 0) {
    // 대상 학생이 없더라도 수동 테스트인 경우 로그 기록
    if (!isManual) {
      const currentLog = getTodayReminderLog();
      const logEntry = {
        dispatchedAt: new Date().toISOString(),
        studentCount: 0,
        studentNames: [],
        isManual,
      };
      currentLog.slots[slot.id] = logEntry;
      currentLog.slots[slot.time] = logEntry;
      saveReminderLog(currentLog);
    }
    return { dispatchedCount: 0, studentNames: [], slot };
  }

  const dispatchedNames: string[] = [];
  const nowIso = new Date().toISOString();
  const newNotifications: SystemNotification[] = [];

  const updatedRecords = allRecords.map(rec => {
    const isTarget = unfulfilled.some(u => u.id === rec.id);
    if (!isTarget) return rec;

    dispatchedNames.push(`${rec.studentNum}번 ${rec.studentName}`);

    // 단계별 맞춤 안내 문구 생성
    const consecutiveIllnessDays = rec.category === '질병' ? getStudentConsecutiveIllnessDays(rec.studentId, rec) : 1;
    const is3DaysIllness = rec.type === 'ILLNESS_OVER_3' || (rec.category === '질병' && ((rec.daysCount || 1) >= 3 || consecutiveIllnessDays >= 3));
    const docNotice = is3DaysIllness ? ' (※ 3일 이상 연속 질병결석: 의사 진단서 또는 의사 소견서 필수 지참)' : '';

    const slotLabel = slot.periodName || slot.title;
    let teacherTitle = '';
    let teacherMessage = '';
    let studentTitle = '';
    let studentMessage = '';

    if (rec.type === 'FIELD_EXPERIENCE') {
      teacherTitle = `⏰ [${slot.title} (${slot.time})] [${rec.studentNum}번 ${rec.studentName}] 체험학습 독려 발송`;
      teacherMessage = `${rec.studentNum}번 ${rec.studentName} 학생에게 7일 이내 NEIS 보고서 제출 독려 핑을 전송했습니다.`;
      studentTitle = `🎒 [${slotLabel} 알림] 현장체험학습 보고서를 NEIS로 제출해주세요!`;
      studentMessage = `${rec.studentName} 학생! 현장체험학습은 종이 결석계가 아니에요. 복귀 후 7일 이내에 NEIS로 보고서를 제출해야 출석 인정이 됩니다. (일자별 사진 + 동행 보호자 사진 필수!)`;
    } else if (rec.status === 'ATTENDED_NOTIFIED') {
      // 1단계 미이행: 서류 미수령
      teacherTitle = `⏰ [${slot.title} (${slot.time})] [${rec.studentNum}번 ${rec.studentName}] 서류 양식 수령 독려`;
      teacherMessage = `${rec.studentNum}번 ${rec.studentName} 학생에게 교실 서류함에서 [${rec.typeName}] 결석신고서를 챙기라는 ${slot.title} 안내 핑을 전송했습니다.`;
      if (slot.time <= '10:00') {
        studentTitle = `🌅 [${slotLabel} 알림] 교실 서류함에서 결석신고서를 챙겨주세요!`;
        studentMessage = `${rec.studentName} 학생, 아침 조회가 끝났어요! 교실 앞 서류함에서 [${rec.typeName}] 양식을 1장 챙겨서 가방에 넣어두세요. (집에서 부모님 서명 필요)${docNotice}`;
      } else if (slot.time <= '13:30') {
        studentTitle = `🍱 [${slotLabel} 알림] 점심시간에 결석신고서 양식을 챙겨가세요!`;
        studentMessage = `${rec.studentName} 학생, 맛있는 점심 먹고 교실 서류함에서 [${rec.typeName}] 양식을 꼭 챙겨두세요! (오늘 챙겨가야 집에서 작성할 수 있어요)${docNotice}`;
      } else {
        studentTitle = `🌇 [${slotLabel} 알림] 오늘 하교 전 결석신고서 양식을 꼭 챙겨가세요!`;
        studentMessage = `${rec.studentName} 학생, 곧 종례 및 하교 시간이에요! 교실 서류함에서 [${rec.typeName}] 양식을 챙겨서 가방에 넣었는지 확인해주세요.${docNotice}`;
      }
    } else if (rec.status === 'FORM_PICKED_UP') {
      // 2단계 미이행: 서류 작성 및 제출함 투입 대기
      teacherTitle = `⏰ [${slot.title} (${slot.time})] [${rec.studentNum}번 ${rec.studentName}] 제출함 투입 독려`;
      teacherMessage = `${rec.studentNum}번 ${rec.studentName} 학생에게 작성 중인 [${rec.typeName}] 결석계를 교실 제출함에 넣고 [제출 완료]를 누르라는 ${slot.title} 독려 핑을 전송했습니다.`;
      if (slot.time <= '10:00') {
        studentTitle = `🌅 [${slotLabel} 알림] 작성해 온 결석계를 교실 제출함에 넣어주세요!`;
        studentMessage = `${rec.studentName} 학생! 집에서 부모님 서명을 받아 온 [${rec.typeName}] 서류가 있다면 지금 교실 제출함에 넣고 아래 [제출 완료] 버튼을 눌러주세요!${docNotice}`;
      } else if (slot.time <= '13:30') {
        studentTitle = `🍱 [${slotLabel} 알림] 점심시간에 결석계를 제출함에 쏙 넣어주세요!`;
        studentMessage = `${rec.studentName} 학생! 작성을 마친 [${rec.typeName}] 서류를 점심시간을 이용해 교실 제출함에 넣고 아래 [제출 완료] 버튼을 꼭 눌러주세요!${docNotice}`;
      } else {
        studentTitle = `🌇 [${slotLabel} 알림] 오늘 하교 전 결석계를 제출함에 꼭 넣어주세요!`;
        studentMessage = `${rec.studentName} 학생! 오늘 하교하기 전에 작성한 [${rec.typeName}] 서류를 교실 제출함에 넣고 아래 [제출 완료] 버튼을 눌러주세요.${docNotice}`;
      }
    } else {
      // PENDING_ATTENDANCE
      teacherTitle = `⏰ [${slot.title} (${slot.time})] [${rec.studentNum}번 ${rec.studentName}] 등교 확인 대기 안내`;
      teacherMessage = `${rec.studentNum}번 ${rec.studentName} 학생에게 등교 확인 및 서류 수령 안내 ${slot.title} 핑을 전송했습니다.`;
      studentTitle = `🏫 [${slotLabel} 알림] 등교 후 담임선생님께 확인받아주세요!`;
      studentMessage = `${rec.studentName} 학생, 학교에 도착하면 담임선생님께 등교 확인을 받고 [${rec.typeName}] 서류 양식을 챙겨주세요.${docNotice}`;
    }

    newNotifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'SCHEDULED_REMIND',
      title: teacherTitle,
      message: teacherMessage,
      studentTitle,
      studentMessage,
      studentName: rec.studentName,
      grade: rec.grade,
      classNum: rec.classNum,
      studentNum: rec.studentNum,
      recordId: rec.id,
      attachments: rec.attachments,
      timestamp: nowIso,
      read: false,
    });

    triggerBrowserPush(
      studentTitle,
      studentMessage
    );

    return {
      ...rec,
      remindCount: isManual ? (rec.remindCount || 0) + 1 : (rec.remindCount || 0),
      lastRemindedAt: nowIso,
      updatedAt: nowIso,
    };
  });

  // 💡 경쟁 상태(Race Condition) 원천 차단: 레코드와 신규 알림을 단일 BATCH_SYNC 네트워크 요청으로 일괄 원자적 동기화
  const currentNotifs = getNotifications();
  const mergedNotifs = [...newNotifications, ...currentNotifs];
  saveRecordsAndNotifications(updatedRecords, mergedNotifs);

  // 사운드 알림 효과음
  playRemindSound();

  // 오늘 실행 로그 저장 (id와 time 둘 다 키로 기록하여 조회 일치 보장)
  const currentLog = getTodayReminderLog();
  const logData = {
    dispatchedAt: nowIso,
    studentCount: unfulfilled.length,
    studentNames: dispatchedNames,
    isManual,
  };
  currentLog.slots[slot.id] = logData;
  currentLog.slots[slot.time] = logData;
  saveReminderLog(currentLog);

  // 서버에 레코드, 알림, 그리고 리마인드 로그까지 일괄 원자적 동기화
  postServerSync('BATCH_SYNC', { 
    records: updatedRecords, 
    notifications: mergedNotifs, 
    reminderLog: currentLog 
  });

  // 📲 대상 학생들의 스마트폰으로 백그라운드 웹 푸시 일괄 발송 (앱이 꺼져있어도 잠금화면에 도착)
  const targetStudentIds = unfulfilled.map(r => r.studentId).filter(Boolean);
  if (targetStudentIds.length > 0 && typeof window !== 'undefined') {
    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: 'MULTIPLE_STUDENTS',
        studentIds: targetStudentIds,
        payload: {
          title: `⏰ [${slot.periodName || slot.title}] 결석신고서 챙기기 알림`,
          body: '담임선생님께서 서류 챙기기 및 제출 안내 알림을 보냈습니다. 확인해주세요!',
          url: '/',
        },
      }),
    }).catch(() => {});
  }

  return {
    dispatchedCount: unfulfilled.length,
    studentNames: dispatchedNames,
    slot,
  };
}

// 자동 타이머에 의해 주기적으로 호출되어, 교사가 설정한 시간에 도달 시 자동 발송
export function checkAndRunAutomatedReminders(): {
  triggered: boolean;
  slot?: ReminderSlotInfo;
  dispatchedCount?: number;
} {
  if (typeof window === 'undefined') {
    return { triggered: false };
  }

  // 🔒 보안 및 혼선 방지: 교사가 로그인한 화면에서만 자동 스케줄러를 가동
  // 학생들의 스마트폰 접속 시에는 절대 자동 발송 스케줄러가 동작하지 않도록 차단
  if (!isTeacherLoggedIn()) {
    return { triggered: false };
  }

  const settings = getReminderSettings();

  // 💡 교사가 자동 알림 기능을 끈 경우 (OFF) 자동 발송 즉시 중단
  if (!settings.enabled) {
    return { triggered: false };
  }

  const currentTime = getCurrentTimeString();
  const log = getTodayReminderLog();

  // 교사가 등록하고 활성화(enabled !== false)한 슬롯들을 시간순으로 확인
  const activeSlots = settings.slots.filter(s => s.enabled !== false);

  for (const slot of activeSlots) {
    // 슬롯 시간에 도달했거나 지났는지 확인
    if (currentTime >= slot.time) {
      // 오늘 아직 발송된 적이 없는 슬롯인지 검사
      const alreadyDispatched = Boolean(log.slots[slot.id] || log.slots[slot.time]);
      if (!alreadyDispatched) {
        const result = dispatchScheduledReminder(slot, false);
        return { triggered: true, slot: result.slot, dispatchedCount: result.dispatchedCount };
      }
    }
  }

  return { triggered: false };
}
