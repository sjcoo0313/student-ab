import { Student, AbsenceRecord, SystemNotification, AttachmentProof, VerificationMethod } from '@/types';

const STORAGE_KEYS = {
  STUDENTS: 'hoengseong_students_v1',
  RECORDS: 'hoengseong_absence_records_v1',
  NOTIFICATIONS: 'hoengseong_notifications_v1',
  CURRENT_STUDENT: 'hoengseong_current_student_id',
  TEACHER_PIN: 'hoengseong_teacher_pin_v1',
};

export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-30201', grade: 3, classNum: 2, studentNum: 1, name: '강서윤', phone: '010-1111-0001', parentPhone: '010-2222-0001', pin: '1234' },
  { id: 'std-30202', grade: 3, classNum: 2, studentNum: 2, name: '김다은', phone: '010-1111-0002', parentPhone: '010-2222-0002', pin: '1234' },
  { id: 'std-30203', grade: 3, classNum: 2, studentNum: 3, name: '김민지', phone: '010-1111-0003', parentPhone: '010-2222-0003', pin: '1234' },
  { id: 'std-30204', grade: 3, classNum: 2, studentNum: 4, name: '김서현', phone: '010-1111-0004', parentPhone: '010-2222-0004', pin: '1234' },
  { id: 'std-30205', grade: 3, classNum: 2, studentNum: 5, name: '김하은', phone: '010-1111-0005', parentPhone: '010-2222-0005', pin: '1234' },
  { id: 'std-30206', grade: 3, classNum: 2, studentNum: 6, name: '박수빈', phone: '010-1111-0006', parentPhone: '010-2222-0006', pin: '1234' },
  { id: 'std-30207', grade: 3, classNum: 2, studentNum: 7, name: '박지우', phone: '010-1111-0007', parentPhone: '010-2222-0007', pin: '1234' },
  { id: 'std-30208', grade: 3, classNum: 2, studentNum: 8, name: '배서영', phone: '010-1111-0008', parentPhone: '010-2222-0008', pin: '1234' },
  { id: 'std-30209', grade: 3, classNum: 2, studentNum: 9, name: '신예은', phone: '010-1111-0009', parentPhone: '010-2222-0009', pin: '1234' },
  { id: 'std-30210', grade: 3, classNum: 2, studentNum: 10, name: '안유진', phone: '010-1111-0010', parentPhone: '010-2222-0010', pin: '1234' },
  { id: 'std-30211', grade: 3, classNum: 2, studentNum: 11, name: '오세린', phone: '010-1111-0011', parentPhone: '010-2222-0011', pin: '1234' },
  { id: 'std-30212', grade: 3, classNum: 2, studentNum: 12, name: '이소율', phone: '010-1111-0012', parentPhone: '010-2222-0012', pin: '1234' },
  { id: 'std-30213', grade: 3, classNum: 2, studentNum: 13, name: '이지원', phone: '010-1111-0013', parentPhone: '010-2222-0013', pin: '1234' },
  { id: 'std-30214', grade: 3, classNum: 2, studentNum: 14, name: '이채원', phone: '010-1111-0014', parentPhone: '010-2222-0014', pin: '1234' },
  { id: 'std-30215', grade: 3, classNum: 2, studentNum: 15, name: '장원영', phone: '010-1111-0015', parentPhone: '010-2222-0015', pin: '1234' },
  { id: 'std-30216', grade: 3, classNum: 2, studentNum: 16, name: '정예린', phone: '010-1111-0016', parentPhone: '010-2222-0016', pin: '1234' },
  { id: 'std-30217', grade: 3, classNum: 2, studentNum: 17, name: '조유리', phone: '010-1111-0017', parentPhone: '010-2222-0017', pin: '1234' },
  { id: 'std-30218', grade: 3, classNum: 2, studentNum: 18, name: '최예나', phone: '010-1111-0018', parentPhone: '010-2222-0018', pin: '1234' },
  { id: 'std-30219', grade: 3, classNum: 2, studentNum: 19, name: '한소희', phone: '010-1111-0019', parentPhone: '010-2222-0019', pin: '1234' },
  { id: 'std-30220', grade: 3, classNum: 2, studentNum: 20, name: '황민아', phone: '010-1111-0020', parentPhone: '010-2222-0020', pin: '1234' },
];

function getFormattedDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const INITIAL_RECORDS: AbsenceRecord[] = [
  {
    id: 'rec-0',
    studentId: 'std-30202',
    studentName: '김다은',
    grade: 3,
    classNum: 2,
    studentNum: 2,
    category: '출석 인정',
    type: 'FIELD_EXPERIENCE',
    typeName: '현장체험학습 (NEIS)',
    startDate: getFormattedDate(-2),
    endDate: getFormattedDate(-1),
    daysCount: 2,
    periodText: '전일',
    reason: '가족동반 역사문화탐방 (경주)',
    status: 'ATTENDED_NOTIFIED',
    attachments: ['체험학습 보고서(NEIS)', '일자별 배경 사진(날짜당 1장)', '보호자 동반 사진'],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    attendedAt: new Date().toISOString(),
    remindCount: 1,
    lastRemindedAt: new Date().toISOString(),
    memo: '다녀온 후 7일 이내 보고서 및 날짜마다 1장씩 사진+보호자 사진 제출 필수',
    fieldTripDeadline: getFormattedDate(6),
  },
  {
    id: 'rec-1',
    studentId: 'std-30203',
    studentName: '김민지',
    grade: 3,
    classNum: 2,
    studentNum: 3,
    category: '출석 인정',
    type: 'MENSTRUAL',
    typeName: '생리 인정결석',
    startDate: getFormattedDate(-1),
    endDate: getFormattedDate(-1),
    daysCount: 1,
    periodText: '전일',
    reason: '생리통으로 인한 출석인정 결석',
    status: 'ATTENDED_NOTIFIED', // 오늘 등교 확인됨, 결석계 챙겨야 함!
    attachments: ['학부모 의견서(생리)'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    attendedAt: new Date().toISOString(),
    remindCount: 1,
    lastRemindedAt: new Date().toISOString(),
    memo: '등교 확인 완료됨. 학부모 의견서 자필 작성 필수 확인 요망',
  },
  {
    id: 'rec-2',
    studentId: 'std-30206',
    studentName: '박수빈',
    grade: 3,
    classNum: 2,
    studentNum: 6,
    category: '질병',
    type: 'ILLNESS_UNDER_3',
    typeName: '질병결석 (2일 이내)',
    startDate: getFormattedDate(-1),
    endDate: getFormattedDate(-1),
    daysCount: 1,
    periodText: '전일',
    reason: '급성 위장염 및 발열',
    status: 'FORM_PICKED_UP', // 양식 챙김, 작성 중
    attachments: ['진료확인서', '학부모 의견서'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    attendedAt: new Date(Date.now() - 3600000).toISOString(),
    pickedUpAt: new Date(Date.now() - 1800000).toISOString(),
    remindCount: 0,
    memo: '병원 진료확인서 제출 예정',
  },
  {
    id: 'rec-3',
    studentId: 'std-30215',
    studentName: '장원영',
    grade: 3,
    classNum: 2,
    studentNum: 15,
    category: '질병',
    type: 'ILLNESS_UNDER_3',
    typeName: '질병결석 (2일 이내)',
    startDate: getFormattedDate(-2),
    endDate: getFormattedDate(-2),
    daysCount: 1,
    periodText: '전일',
    reason: '감기몸살',
    status: 'SUBMITTED', // 학생이 제출함에 넣음! (교사 확인 대기)
    attachments: ['진료확인서', '학부모 의견서'],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    attendedAt: new Date(Date.now() - 7200000).toISOString(),
    pickedUpAt: new Date(Date.now() - 5400000).toISOString(),
    submittedAt: new Date(Date.now() - 600000).toISOString(),
    remindCount: 0,
    memo: '제출함 확인 요망',
  },
  {
    id: 'rec-4',
    studentId: 'std-30201',
    studentName: '강서윤',
    grade: 3,
    classNum: 2,
    studentNum: 1,
    category: '출석 인정',
    type: 'MENSTRUAL',
    typeName: '생리 인정결석',
    startDate: getFormattedDate(-7),
    endDate: getFormattedDate(-7),
    daysCount: 1,
    periodText: '전일',
    reason: '생리통',
    status: 'APPROVED',
    attachments: ['학부모 의견서(생리)'],
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    attendedAt: new Date(Date.now() - 518400000).toISOString(),
    pickedUpAt: new Date(Date.now() - 514800000).toISOString(),
    submittedAt: new Date(Date.now() - 504000000).toISOString(),
    approvedAt: new Date(Date.now() - 500000000).toISOString(),
    verificationMethod: '학생 사전 대면 보고',
    remindCount: 0,
  },
  {
    id: 'rec-5',
    studentId: 'std-30210',
    studentName: '안유진',
    grade: 3,
    classNum: 2,
    studentNum: 10,
    category: '출석 인정',
    type: 'OFFICIAL_FAMILY',
    typeName: '경조사 인정결석',
    startDate: getFormattedDate(-10),
    endDate: getFormattedDate(-9),
    daysCount: 2,
    periodText: '전일',
    reason: '조부상',
    status: 'APPROVED',
    attachments: ['사망진단서'],
    createdAt: new Date(Date.now() - 864000000).toISOString(),
    attendedAt: new Date(Date.now() - 691200000).toISOString(),
    pickedUpAt: new Date(Date.now() - 687600000).toISOString(),
    submittedAt: new Date(Date.now() - 684000000).toISOString(),
    approvedAt: new Date(Date.now() - 680000000).toISOString(),
    verificationMethod: '학부모 연락',
    remindCount: 0,
  }
];

let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('hoengseong_absence_sync');
  } catch {
    syncChannel = null;
  }
}

function broadcastUpdate(type: string, payload?: unknown) {
  if (typeof window === 'undefined') return;
  if (syncChannel) {
    syncChannel.postMessage({ type, payload, time: Date.now() });
  }
  window.dispatchEvent(new CustomEvent('hoengseong_absence_update', { detail: { type, payload } }));
}

let lastServerTimestamp = 0;
let isSyncing = false;
let activeSyncInterval: NodeJS.Timeout | null = null;
let activeListenerCount = 0;

export async function fetchServerSync(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isSyncing) return false;
  isSyncing = true;
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.success) return false;

    if (data.lastUpdated && data.lastUpdated <= lastServerTimestamp) {
      return false;
    }
    lastServerTimestamp = data.lastUpdated || Date.now();

    // Check old notifications for audio triggers
    const oldNotifsStr = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]';
    let oldNotifs: SystemNotification[] = [];
    try { oldNotifs = JSON.parse(oldNotifsStr); } catch {}
    const newNotifs: SystemNotification[] = Array.isArray(data.notifications) ? data.notifications : [];

    // Save to localStorage
    if (Array.isArray(data.students)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    }
    if (Array.isArray(data.records)) {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(data.records));
    }
    if (Array.isArray(data.notifications)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
    }
    if (data.teacherPin) {
      localStorage.setItem(STORAGE_KEYS.TEACHER_PIN, data.teacherPin);
    }
    localStorage.setItem('hoengseong_app_has_run_v1', 'true');

    // Notify listeners
    if (newNotifs.length > 0 && (oldNotifs.length === 0 || newNotifs[0].id !== oldNotifs[0]?.id)) {
      broadcastUpdate('NOTIFICATIONS_UPDATED', newNotifs);
    }
    broadcastUpdate('SERVER_SYNC_COMPLETE', data);
    return true;
  } catch {
    return false;
  } finally {
    isSyncing = false;
  }
}

export async function postServerSync(action: string, payload: Record<string, unknown> = {}): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.lastUpdated) {
        lastServerTimestamp = data.lastUpdated;
      }
    }
  } catch (err) {
    console.error('postServerSync error:', err);
  }
}

export function subscribeToSyncEvents(callback: (type: string, payload?: unknown) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleChannelMsg = (event: MessageEvent) => {
    if (event.data?.type) {
      callback(event.data.type, event.data.payload);
    }
  };

  const handleCustomEvent = (event: Event) => {
    const custom = event as CustomEvent;
    if (custom.detail?.type) {
      callback(custom.detail.type, custom.detail.payload);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.RECORDS || event.key === STORAGE_KEYS.NOTIFICATIONS || event.key === STORAGE_KEYS.STUDENTS) {
      callback('STORAGE_CHANGED');
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleChannelMsg);
  }
  window.addEventListener('hoengseong_absence_update', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  // Periodic server sync polling (2.5s) for real-time sync across different phones & PC
  activeListenerCount++;
  if (!activeSyncInterval) {
    fetchServerSync();
    activeSyncInterval = setInterval(() => {
      fetchServerSync();
    }, 2500);
  }

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleChannelMsg);
    }
    window.removeEventListener('hoengseong_absence_update', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);

    activeListenerCount--;
    if (activeListenerCount <= 0 && activeSyncInterval) {
      clearInterval(activeSyncInterval);
      activeSyncInterval = null;
      activeListenerCount = 0;
    }
  };
}

export function getStudents(): Student[] {
  if (typeof window === 'undefined') return INITIAL_STUDENTS;
  const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (stored === null) {
    const hasRun = localStorage.getItem('hoengseong_app_has_run_v1');
    if (!hasRun) {
      localStorage.setItem('hoengseong_app_has_run_v1', 'true');
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return [];
  }
  try {
    const list: Student[] = JSON.parse(stored);
    if (!Array.isArray(list)) {
      return [];
    }
    if (list.length === 0) {
      return [];
    }
    // 자동 마이그레이션: 기존 2학년 3반 샘플 데이터가 있다면 3학년 2반으로 자동 전환
    let hasGrade2Class3 = false;
    const migrated = list.map(s => {
      if (s.grade === 2 && s.classNum === 3) {
        hasGrade2Class3 = true;
        return {
          ...s,
          id: s.id.replace('std-203', 'std-302'),
          grade: 3,
          classNum: 2,
          pin: s.pin || '1234'
        };
      }
      return { ...s, pin: s.pin || '1234' };
    });
    if (hasGrade2Class3) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(migrated));
      return migrated;
    }
    return list.map(s => ({ ...s, pin: s.pin || '1234' }));
  } catch {
    return [];
  }
}

export function saveStudents(students: Student[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  broadcastUpdate('STUDENTS_UPDATED', students);
  postServerSync('SAVE_STUDENTS', { students });
}

export function getAbsenceRecords(): AbsenceRecord[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.RECORDS);
  if (stored === null) {
    const hasInitialized = localStorage.getItem('hoengseong_app_has_run_v1');
    if (!hasInitialized) {
      localStorage.setItem('hoengseong_app_has_run_v1', 'true');
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    return [];
  }
  try {
    const list: AbsenceRecord[] = JSON.parse(stored);
    let changed = false;
    const migrated = list.map(r => {
      let updated = { ...r };
      if (updated.grade === 2 && updated.classNum === 3) {
        changed = true;
        updated.studentId = updated.studentId.replace('std-203', 'std-302');
        updated.grade = 3;
        updated.classNum = 2;
      }
      if (updated.memo && (updated.memo.includes('일자별 사진(2장)') || updated.memo.includes('사진(2장)'))) {
        changed = true;
        updated.memo = updated.memo.replace('일자별 사진(2장)', '날짜마다 1장씩 사진').replace('사진(2장)', '날짜마다 1장씩 사진');
      }
      return updated;
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(migrated));
      return migrated;
    }
    return list;
  } catch {
    return [];
  }
}

export function saveAbsenceRecords(records: AbsenceRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  broadcastUpdate('RECORDS_UPDATED', records);
  postServerSync('SAVE_RECORDS', { records });
}

export function getNotifications(): SystemNotification[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (!stored) return [];
  try {
    const list: SystemNotification[] = JSON.parse(stored);
    let changed = false;
    const migrated = list.map(n => {
      let msg = n.message || '';
      let msgChanged = false;
      if (msg.includes('날짜별 사진(') || msg.includes('사진(2장)')) {
        msgChanged = true;
        msg = msg.replace(/날짜별 사진\(\d+장\)/g, '날짜마다 1장씩 사진').replace(/사진\(2장\)/g, '날짜마다 1장씩 사진');
      }
      if (msg.includes('서식 1호') || msg.includes('서식1호')) {
        msgChanged = true;
        msg = msg.replace(/<서식\s*1호>\s*/g, '').replace(/서식\s*1호\s*/g, '');
      }
      if (msgChanged) {
        changed = true;
        return { ...n, message: msg };
      }
      return n;
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(migrated));
      return migrated;
    }
    return list;
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: SystemNotification[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  broadcastUpdate('NOTIFICATIONS_UPDATED', notifications);
  postServerSync('SAVE_NOTIFICATIONS', { notifications });
}

export function addNotification(notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) {
  const current = getNotifications();
  const newNotif: SystemNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  saveNotifications([newNotif, ...current]);
  return newNotif;
}

export function markNotificationsAsRead() {
  const current = getNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
}

// 1. 교사가 결석 등록
export function createAbsenceRecord(data: {
  student: Student;
  category: AbsenceRecord['category'];
  type: AbsenceRecord['type'];
  typeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  periodText?: string;
  reason: string;
  memo?: string;
}): AbsenceRecord {
  const records = getAbsenceRecords();
  const newRecord: AbsenceRecord = {
    id: `rec-${Date.now()}`,
    studentId: data.student.id,
    studentName: data.student.name,
    grade: data.student.grade,
    classNum: data.student.classNum,
    studentNum: data.student.studentNum,
    category: data.category,
    type: data.type,
    typeName: data.typeName,
    startDate: data.startDate,
    endDate: data.endDate,
    daysCount: data.daysCount,
    periodText: data.periodText || '전일',
    reason: data.reason,
    status: 'PENDING_ATTENDANCE', // 등교 전 대기 상태
    attachments: data.type === 'MENSTRUAL' 
      ? ['학부모 의견서(생리)'] 
      : data.type === 'FIELD_EXPERIENCE'
      ? ['체험학습 보고서(NEIS)', '일자별 배경 사진(날짜당 1장)', '보호자 동반 사진']
      : [],
    createdAt: new Date().toISOString(),
    remindCount: 0,
    memo: data.memo,
    fieldTripDeadline: data.type === 'FIELD_EXPERIENCE' ? (() => {
      const end = new Date(data.endDate);
      end.setDate(end.getDate() + 7);
      return end.toISOString().split('T')[0];
    })() : undefined,
  };

  const updated = [newRecord, ...records];
  saveAbsenceRecords(updated);
  return newRecord;
}

// 2. 교사가 [등교 확인 🏫] 클릭 -> 학생에게 알림 발송 및 미수령 상태로 변경
export function markAttended(recordId: string): AbsenceRecord | null {
  const records = getAbsenceRecords();
  let updatedRecord: AbsenceRecord | null = null;

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        status: 'ATTENDED_NOTIFIED',
        attendedAt: new Date().toISOString(),
        remindCount: r.remindCount + 1,
        lastRemindedAt: new Date().toISOString(),
      };
      return updatedRecord;
    }
    return r;
  });

  if (updatedRecord) {
    saveAbsenceRecords(updated);
    addNotification({
      type: 'ATTENDANCE_CHECKED',
      title: '등교 확인 및 결석계 작성 알림 발송',
      message: `${(updatedRecord as AbsenceRecord).grade}학년 ${(updatedRecord as AbsenceRecord).classNum}반 ${(updatedRecord as AbsenceRecord).studentNum}번 ${(updatedRecord as AbsenceRecord).studentName} 학생의 등교가 확인되어 결석계 챙기기 알림이 발송되었습니다.`,
      studentName: (updatedRecord as AbsenceRecord).studentName,
      grade: (updatedRecord as AbsenceRecord).grade,
      classNum: (updatedRecord as AbsenceRecord).classNum,
      studentNum: (updatedRecord as AbsenceRecord).studentNum,
      recordId: recordId,
    });
  }
  return updatedRecord;
}

// 3. 학생이 본인 기기에서 [📄 결석신고서 챙겼어요] 터치
export function markFormPickedUp(recordId: string): AbsenceRecord | null {
  const records = getAbsenceRecords();
  let updatedRecord: AbsenceRecord | null = null;

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        status: 'FORM_PICKED_UP',
        pickedUpAt: new Date().toISOString(),
      };
      return updatedRecord;
    }
    return r;
  });

  if (updatedRecord) {
    saveAbsenceRecords(updated);
  }
  return updatedRecord;
}

// 4. 학생이 첨부서류 체크 후 [📨 제출함에 넣었어요!] 터치 -> 교사에게 실시간 핑!
export function markSubmitted(
  recordId: string,
  attachments: AttachmentProof[],
  otherText?: string
): AbsenceRecord | null {
  const records = getAbsenceRecords();
  let updatedRecord: AbsenceRecord | null = null;

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        status: 'SUBMITTED',
        attachments,
        otherAttachmentText: otherText,
        submittedAt: new Date().toISOString(),
      };
      return updatedRecord;
    }
    return r;
  });

  if (updatedRecord) {
    saveAbsenceRecords(updated);
    const rec = updatedRecord as AbsenceRecord;
    const attachSummary = attachments.length > 0 ? ` (첨부: ${attachments.join(', ')})` : '';

    addNotification({
      type: 'SUBMIT_PING',
      title: '📢 결석신고서 제출 알림 (핑)',
      message: `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생이 [${rec.typeName}] 결석신고서를 제출함에 넣었습니다!${attachSummary}`,
      studentName: rec.studentName,
      grade: rec.grade,
      classNum: rec.classNum,
      studentNum: rec.studentNum,
      recordId: recordId,
      attachments: attachments,
    });
  }
  return updatedRecord;
}

// 5. 교사가 실물 종이 서류 확인 후 [최종 확인 완료] 클릭
export function markApproved(
  recordId: string,
  method: VerificationMethod = '학생 사전 대면 보고',
  note?: string
): AbsenceRecord | null {
  const records = getAbsenceRecords();
  let updatedRecord: AbsenceRecord | null = null;

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        verificationMethod: method,
        verificationNote: note,
      };
      return updatedRecord;
    }
    return r;
  });

  if (updatedRecord) {
    saveAbsenceRecords(updated);
  }
  return updatedRecord;
}

// 6. 교사가 [다시 알림 보내기 🔔] 클릭
export function triggerRemind(recordId: string): AbsenceRecord | null {
  const records = getAbsenceRecords();
  let updatedRecord: AbsenceRecord | null = null;

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        remindCount: r.remindCount + 1,
        lastRemindedAt: new Date().toISOString(),
      };
      return updatedRecord;
    }
    return r;
  });

  if (updatedRecord) {
    saveAbsenceRecords(updated);
    const rec = updatedRecord as AbsenceRecord;
    addNotification({
      type: 'REMIND_ALERT',
      title: '🔔 결석신고서 수령/제출 리마인드 발송',
      message: `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생에게 결석신고서 수령 및 제출 리마인드를 전송했습니다.`,
      studentName: rec.studentName,
      grade: rec.grade,
      classNum: rec.classNum,
      studentNum: rec.studentNum,
      recordId: recordId,
    });
  }
  return updatedRecord;
}

// 7. 학생 본인 인증 및 기기 영구 바인딩 관리 (10년 영구 쿠키 + localStorage + sessionStorage 3중 보관)
function setPersistentCookie(name: string, value: string, days: number = 3650) {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getPersistentCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match && match[2]) {
    try {
      return decodeURIComponent(match[2]);
    } catch {
      return match[2];
    }
  }
  return null;
}

function deletePersistentCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

export function saveMyStudentProfile(student: Student | null) {
  if (typeof window === 'undefined') return;
  if (student) {
    const studentJson = JSON.stringify(student);
    localStorage.setItem('hoengseong_my_student_id', student.id);
    localStorage.setItem('hoengseong_my_student_profile', studentJson);
    localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, student.id);
    try {
      sessionStorage.setItem('hoengseong_my_student_id', student.id);
      sessionStorage.setItem('hoengseong_my_student_profile', studentJson);
    } catch {}
    setPersistentCookie('hoengseong_student_id', student.id);
    setPersistentCookie('hoengseong_student_profile', studentJson);
  } else {
    localStorage.removeItem('hoengseong_my_student_id');
    localStorage.removeItem('hoengseong_my_student_profile');
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    try {
      sessionStorage.removeItem('hoengseong_my_student_id');
      sessionStorage.removeItem('hoengseong_my_student_profile');
    } catch {}
    deletePersistentCookie('hoengseong_student_id');
    deletePersistentCookie('hoengseong_student_profile');
  }
  broadcastUpdate('STUDENT_SELECTED', student?.id || null);
}

export function getMyStudentId(): string | null {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('hoengseong_my_student_id');
  if (!id) {
    try {
      id = sessionStorage.getItem('hoengseong_my_student_id');
    } catch {}
  }
  if (!id) {
    id = getPersistentCookie('hoengseong_student_id');
  }
  if (id && !localStorage.getItem('hoengseong_my_student_id')) {
    localStorage.setItem('hoengseong_my_student_id', id);
  }
  return id;
}

export function setMyStudentId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) {
    const students = getStudents();
    const found = students.find(s => s.id === id);
    if (found) {
      saveMyStudentProfile(found);
      return;
    }
    localStorage.setItem('hoengseong_my_student_id', id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, id);
    setPersistentCookie('hoengseong_student_id', id);
  } else {
    saveMyStudentProfile(null);
  }
  broadcastUpdate('STUDENT_SELECTED', id);
}

export function getMyStudent(): Student | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. 저장된 학생 프로필 복원 시도 (localStorage -> sessionStorage -> Cookie 순)
    let savedProfile: Student | null = null;
    const profileRaw = localStorage.getItem('hoengseong_my_student_profile') ||
                       (() => { try { return sessionStorage.getItem('hoengseong_my_student_profile'); } catch { return null; } })() ||
                       getPersistentCookie('hoengseong_student_profile');
    if (profileRaw) {
      try {
        savedProfile = JSON.parse(profileRaw);
        // 기존 2학년 3반 프로필이 있다면 3학년 2반으로 자동 전환하여 로그인 유지
        if (savedProfile && savedProfile.grade === 2 && savedProfile.classNum === 3) {
          savedProfile.grade = 3;
          savedProfile.classNum = 2;
          savedProfile.id = savedProfile.id.replace('std-203', 'std-302');
          localStorage.setItem('hoengseong_my_student_profile', JSON.stringify(savedProfile));
          localStorage.setItem('hoengseong_my_student_id', savedProfile.id);
        }
      } catch {}
    }

    const myId = getMyStudentId() || savedProfile?.id;
    if (!myId && !savedProfile) return null;

    const targetId = myId || savedProfile?.id;
    const students = getStudents();
    const found = students.find(s => s.id === targetId);
    if (found) {
      // Keep cached profile updated
      try {
        localStorage.setItem('hoengseong_my_student_profile', JSON.stringify(found));
      } catch {}
      return found;
    }

    // 학생 명단이 0명으로 초기화된 상태라면 이전 로그인 세션도 해제
    if (students.length === 0) {
      return null;
    }

    // 한번 로그인한 학생은 기기에 프로필이 저장되어 명단 일시 수정이나 오프라인 상태에서도 로그인 유지
    if (savedProfile) {
      return savedProfile;
    }
    return null;
  } catch {
    return null;
  }
}

export function getCurrentStudentId(): string {
  if (typeof window === 'undefined') return '';
  return getMyStudentId() || localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT) || '';
}

export function setCurrentStudentId(id: string) {
  setMyStudentId(id);
}

// 학생 4자리 비밀번호(PIN) 관리
export function getStudentPin(studentId: string): string {
  const students = getStudents();
  const s = students.find(item => item.id === studentId);
  return s?.pin || '1234';
}

export function updateStudentPin(studentId: string, newPin: string): boolean {
  if (typeof window === 'undefined') return false;
  const students = getStudents();
  let updated = false;
  const newStudents = students.map(s => {
    if (s.id === studentId) {
      updated = true;
      return { ...s, pin: newPin };
    }
    return s;
  });
  if (updated) {
    saveStudents(newStudents);
    broadcastUpdate('STUDENT_PIN_UPDATED', { studentId, newPin });
    postServerSync('UPDATE_STUDENT_PIN', { studentId, pin: newPin });
  }
  return updated;
}

export function resetStudentPinToDefault(studentId: string): boolean {
  return updateStudentPin(studentId, '1234');
}

// 8. 데이터 초기화 및 완전 삭제
export function clearAllAbsenceData() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('hoengseong_app_has_run_v1', 'true');
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.removeItem('hoengseong_daily_reminders_log_v1');
  broadcastUpdate('RESET_ALL');
  broadcastUpdate('RECORDS_UPDATED', []);
  broadcastUpdate('NOTIFICATIONS_UPDATED', []);
  postServerSync('CLEAR_ABSENCE_DATA');
}

export function wipeEntireDatabase() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('hoengseong_app_has_run_v1', 'true');
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  saveMyStudentProfile(null);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
  localStorage.removeItem('hoengseong_daily_reminders_log_v1');
  broadcastUpdate('RESET_ALL');
  broadcastUpdate('STUDENTS_UPDATED', []);
  broadcastUpdate('RECORDS_UPDATED', []);
  broadcastUpdate('NOTIFICATIONS_UPDATED', []);
  broadcastUpdate('STUDENT_SELECTED', null);
  postServerSync('WIPE_DATABASE');
}

export function loadSampleMockData() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('hoengseong_app_has_run_v1', 'true');
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(INITIAL_RECORDS));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, 'std-30203');
  localStorage.removeItem('hoengseong_daily_reminders_log_v1');
  broadcastUpdate('RESET_ALL');
  postServerSync('LOAD_SAMPLE_DATA');
}

// 기존 호환용: 초기화 시 결석 데이터 0건으로 완전 삭제
export function resetMockData() {
  clearAllAbsenceData();
}

// 9. 교사 비밀번호(PIN) 및 인증 관리
export function getTeacherPin(): string {
  if (typeof window === 'undefined') return '1234';
  return localStorage.getItem(STORAGE_KEYS.TEACHER_PIN) || '1234';
}

export function setTeacherPin(newPin: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TEACHER_PIN, newPin);
  broadcastUpdate('TEACHER_PIN_CHANGED');
  postServerSync('SET_TEACHER_PIN', { pin: newPin });
}

export function isTeacherLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('hoengseong_teacher_auth') === 'true' || 
         sessionStorage.getItem('hoengseong_teacher_auth') === 'true';
}

export function setTeacherLoggedIn(loggedIn: boolean) {
  if (typeof window === 'undefined') return;
  if (loggedIn) {
    localStorage.setItem('hoengseong_teacher_auth', 'true');
    try {
      sessionStorage.setItem('hoengseong_teacher_auth', 'true');
    } catch {}
  } else {
    localStorage.removeItem('hoengseong_teacher_auth');
    try {
      sessionStorage.removeItem('hoengseong_teacher_auth');
    } catch {}
  }
  broadcastUpdate('TEACHER_AUTH_CHANGED', loggedIn);
}
