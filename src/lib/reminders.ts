import { AbsenceRecord, SystemNotification } from '@/types';
import { 
  getAbsenceRecords, 
  saveAbsenceRecords, 
  addNotification 
} from '@/lib/storage';
import { playRemindSound } from '@/lib/sound';

export type ReminderSlotTime = '09:30' | '12:30' | '14:30';

export interface ReminderSlotInfo {
  time: ReminderSlotTime;
  title: string;
  periodName: string;
  timeDescription: string;
  targetAction: string;
}

export const REMINDER_SLOTS: ReminderSlotInfo[] = [
  {
    time: '09:30',
    title: '1차 아침 알림',
    periodName: '아침 09:30',
    timeDescription: '1교시 시작 전후 (아침 조회 후)',
    targetAction: '교실 서류함에서 양식 챙기기',
  },
  {
    time: '12:30',
    title: '2차 정오 알림',
    periodName: '정오 12:30',
    timeDescription: '점심시간 시작',
    targetAction: '서류 자필 작성 및 증빙서류 준비',
  },
  {
    time: '14:30',
    title: '3차 오후 알림',
    periodName: '오후 14:30',
    timeDescription: '종례 및 하교 전',
    targetAction: '교실 제출함 투입 및 [제출 완료] 전송',
  },
];

const REMINDER_LOG_KEY = 'hoengseong_daily_reminders_log_v1';

export interface DailyReminderLog {
  date: string; // YYYY-MM-DD
  slots: {
    [key in ReminderSlotTime]?: {
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
}

export function clearReminderLog() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REMINDER_LOG_KEY);
}

// 미이행 학생 레코드 목록 (서류를 아직 최종 제출함에 넣지 않은 학생)
export function getUnfulfilledAbsenceRecords(): AbsenceRecord[] {
  const records = getAbsenceRecords();
  return records.filter(r => {
    // 이미 학생이 제출함에 넣었거나(SUBMITTED) 최종 승인(APPROVED)된 건 제외
    if (r.status === 'SUBMITTED' || r.status === 'APPROVED') {
      return false;
    }
    // 등교 확인 후 서류 미수령(ATTENDED_NOTIFIED) 또는 수령 후 미제출(FORM_PICKED_UP)
    if (r.status === 'ATTENDED_NOTIFIED' || r.status === 'FORM_PICKED_UP') {
      return true;
    }
    // 등교 확인 대기 중이나 오늘 등교일인 경우 (PENDING_ATTENDANCE)
    if (r.status === 'PENDING_ATTENDANCE') {
      const today = getTodayDateString();
      return r.startDate <= today;
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

// 특정 시간대(09:30, 12:30, 14:30) 리마인드 발송 처리
export function dispatchScheduledReminder(
  slotTime: ReminderSlotTime,
  isManual = false
): {
  dispatchedCount: number;
  studentNames: string[];
  slot: ReminderSlotInfo;
} {
  const slot = REMINDER_SLOTS.find(s => s.time === slotTime) || REMINDER_SLOTS[0];
  const unfulfilled = getUnfulfilledAbsenceRecords();
  const allRecords = getAbsenceRecords();

  if (unfulfilled.length === 0) {
    // 대상 학생이 없더라도 수동 테스트인 경우 로그 기록
    if (!isManual) {
      const currentLog = getTodayReminderLog();
      currentLog.slots[slotTime] = {
        dispatchedAt: new Date().toISOString(),
        studentCount: 0,
        studentNames: [],
        isManual,
      };
      saveReminderLog(currentLog);
    }
    return { dispatchedCount: 0, studentNames: [], slot };
  }

  const dispatchedNames: string[] = [];
  const nowIso = new Date().toISOString();

  // 모든 미이행 학생에게 맞춤형 리마인드 발송
  const updatedRecords = allRecords.map(rec => {
    const isTarget = unfulfilled.some(u => u.id === rec.id);
    if (!isTarget) return rec;

    dispatchedNames.push(`${rec.studentNum}번 ${rec.studentName}`);

    // 단계별 맞춤 안내 문구 생성
    let messageBody = '';
    if (rec.type === 'FIELD_EXPERIENCE') {
      if (slotTime === '09:30') {
        messageBody = `🎒 [1차 아침 09:30 알림] ${rec.studentName} 학생! 현장체험학습은 결석계가 아니며, '보고서를 7일이내 NEIS로 제출'해야 합니다!`;
      } else if (slotTime === '12:30') {
        messageBody = `🍱 [2차 정오 12:30 알림] ${rec.studentName} 학생! 점심시간에 현장체험학습 '보고서를 7일이내 NEIS로 제출' 및 동행 보호자 사진(일자당 1장)을 확인해주세요.`;
      } else {
        messageBody = `⚠️ [3차 오후 14:30 마감] ${rec.studentName} 학생! 현장체험학습 '보고서를 7일이내 NEIS로 제출' 마감 기한을 준수해주세요!`;
      }
    } else if (rec.status === 'ATTENDED_NOTIFIED') {
      // 1단계 미이행: 서류 미수령
      if (slotTime === '09:30') {
        messageBody = `🔔 [1차 아침 09:30 알림] ${rec.studentName} 학생! 교실 앞 서류함에서 [${rec.typeName}] 결석신고서를 아직 챙기지 않았습니다. 지금 서류를 챙겨주세요!`;
      } else if (slotTime === '12:30') {
        messageBody = `🍱 [2차 정오 12:30 알림] ${rec.studentName} 학생! 점심시간에 교실 앞 서류함에서 [${rec.typeName}] 결석신고서를 반드시 챙겨 자필로 작성해주세요!`;
      } else {
        messageBody = `⚠️ [3차 오후 14:30 긴급] ${rec.studentName} 학생! 오늘 하교 전까지 교실 서류함에서 [${rec.typeName}] 결석신고서를 챙기지 않으면 결석 처리가 지연됩니다.`;
      }
    } else if (rec.status === 'FORM_PICKED_UP') {
      // 2단계 미이행: 서류 작성 및 제출함 투입 대기
      if (slotTime === '09:30') {
        messageBody = `📝 [1차 아침 09:30 알림] ${rec.studentName} 학생! 챙겨간 [${rec.typeName}] 결석계 작성 및 증빙서류를 준비해주세요.`;
      } else if (slotTime === '12:30') {
        messageBody = `🍱 [2차 정오 12:30 알림] ${rec.studentName} 학생! 점심시간에 [${rec.typeName}] 결석계를 작성하여 교실 제출함에 넣고 앱에서 [제출 완료]를 꼭 눌러주세요!`;
      } else {
        messageBody = `⚠️ [3차 오후 14:30 마감] ${rec.studentName} 학생! 오늘 하교 전까지 결석계를 교실 제출함에 넣고 앱에서 [제출 완료] 핑을 전송해주세요!`;
      }
    } else {
      // PENDING_ATTENDANCE
      messageBody = `🏫 [${slot.title}] ${rec.studentName} 학생! 오늘 등교 후 담임선생님께 등교 확인을 받고 [${rec.typeName}] 결석계를 챙겨주세요.`;
    }

    const notifTitle = rec.type === 'FIELD_EXPERIENCE'
      ? `⏰ [${slot.title}] 현장체험학습: 보고서를 7일이내 NEIS로 제출 알림`
      : `⏰ [${slot.title}] 결석계 단계 미이행 알림`;

    addNotification({
      type: 'SCHEDULED_REMIND',
      title: notifTitle,
      message: messageBody,
      studentName: rec.studentName,
      grade: rec.grade,
      classNum: rec.classNum,
      studentNum: rec.studentNum,
      recordId: rec.id,
      attachments: rec.attachments,
    });

    triggerBrowserPush(
      rec.type === 'FIELD_EXPERIENCE' ? `⏰ [${slot.title}] 현장체험학습 NEIS 보고서 제출 알림` : `⏰ [${slot.title}] 결석신고서 제출 알림`,
      rec.type === 'FIELD_EXPERIENCE' ? `${rec.studentName} 학생! 보고서를 7일이내 NEIS로 제출해주세요.` : `${rec.studentName} 학생! ${slot.targetAction}을(를) 진행해주세요.`
    );

    return {
      ...rec,
      remindCount: (rec.remindCount || 0) + 1,
      lastRemindedAt: nowIso,
    };
  });

  saveAbsenceRecords(updatedRecords);

  // 사운드 알림 효과음
  playRemindSound();

  // 오늘 실행 로그 저장
  const currentLog = getTodayReminderLog();
  currentLog.slots[slotTime] = {
    dispatchedAt: nowIso,
    studentCount: unfulfilled.length,
    studentNames: dispatchedNames,
    isManual,
  };
  saveReminderLog(currentLog);

  return {
    dispatchedCount: unfulfilled.length,
    studentNames: dispatchedNames,
    slot,
  };
}

// 자동 타이머에 의해 30초마다 호출되어 09:30, 12:30, 14:30 도달 시 자동 발송
export function checkAndRunAutomatedReminders(): {
  triggered: boolean;
  slot?: ReminderSlotInfo;
  dispatchedCount?: number;
} {
  const currentTime = getCurrentTimeString();
  const log = getTodayReminderLog();

  // 1차: 09:30 도달 시 (09:30 ~ 12:29 사이)
  if (currentTime >= '09:30' && !log.slots['09:30']) {
    const result = dispatchScheduledReminder('09:30', false);
    return { triggered: true, slot: result.slot, dispatchedCount: result.dispatchedCount };
  }

  // 2차: 12:30 도달 시 (12:30 ~ 14:29 사이)
  if (currentTime >= '12:30' && !log.slots['12:30']) {
    const result = dispatchScheduledReminder('12:30', false);
    return { triggered: true, slot: result.slot, dispatchedCount: result.dispatchedCount };
  }

  // 3차: 14:30 도달 시 (14:30 ~ 23:59 사이)
  if (currentTime >= '14:30' && !log.slots['14:30']) {
    const result = dispatchScheduledReminder('14:30', false);
    return { triggered: true, slot: result.slot, dispatchedCount: result.dispatchedCount };
  }

  return { triggered: false };
}
