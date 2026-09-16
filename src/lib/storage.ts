import { Student, AbsenceRecord, AbsenceStatus, SystemNotification, AttachmentProof, VerificationMethod, AttendanceKind } from '@/types';

const STORAGE_KEYS = {
  STUDENTS: 'hoengseong_students_v1',
  RECORDS: 'hoengseong_absence_records_v1',
  NOTIFICATIONS: 'hoengseong_notifications_v1',
  CURRENT_STUDENT: 'hoengseong_current_student_id',
  TEACHER_PIN: 'hoengseong_teacher_pin_v1',
  REMINDER_SETTINGS: 'hoengseong_reminder_settings_v1',
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

export const INITIAL_RECORDS: AbsenceRecord[] = [];

export const SAMPLE_RECORDS: AbsenceRecord[] = [
  {
    id: 'rec-0',
    studentId: 'std-30202',
    studentName: '김다은',
    grade: 3,
    classNum: 2,
    studentNum: 2,
    kind: '결석',
    category: '출석인정',
    type: 'FIELD_EXPERIENCE',
    typeName: '현장체험학습 (보고서를 7일이내 NEIS로 제출)',
    startDate: getFormattedDate(-2),
    endDate: getFormattedDate(-1),
    daysCount: 2,
    periodText: '전일',
    reason: '가족동반 역사문화탐방 (경주)',
    status: 'ATTENDED_NOTIFIED',
    requiresDocument: true,
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
    kind: '결석',
    category: '출석인정',
    type: 'MENSTRUAL',
    typeName: '생리 인정결석',
    startDate: getFormattedDate(-1),
    endDate: getFormattedDate(-1),
    daysCount: 1,
    periodText: '전일',
    reason: '생리통으로 인한 출석인정 결석',
    status: 'ATTENDED_NOTIFIED',
    requiresDocument: true,
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
    kind: '결석',
    category: '질병',
    type: 'ILLNESS_UNDER_3',
    typeName: '질병결석 (2일 이내)',
    startDate: getFormattedDate(-1),
    endDate: getFormattedDate(-1),
    daysCount: 1,
    periodText: '전일',
    reason: '급성 위장염 및 발열',
    status: 'FORM_PICKED_UP',
    requiresDocument: true,
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
    kind: '결석',
    category: '질병',
    type: 'ILLNESS_UNDER_3',
    typeName: '질병결석 (2일 이내)',
    startDate: getFormattedDate(-2),
    endDate: getFormattedDate(-2),
    daysCount: 1,
    periodText: '전일',
    reason: '감기몸살',
    status: 'SUBMITTED',
    requiresDocument: true,
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
    kind: '결석',
    category: '출석인정',
    type: 'MENSTRUAL',
    typeName: '생리 인정결석',
    startDate: getFormattedDate(-7),
    endDate: getFormattedDate(-7),
    daysCount: 1,
    periodText: '전일',
    reason: '생리통',
    status: 'APPROVED',
    requiresDocument: true,
    attachments: ['학부모 의견서(생리)'],
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    attendedAt: new Date(Date.now() - 518400000).toISOString(),
    pickedUpAt: new Date(Date.now() - 432000000).toISOString(),
    submittedAt: new Date(Date.now() - 345600000).toISOString(),
    approvedAt: new Date(Date.now() - 259200000).toISOString(),
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
    kind: '결석',
    category: '출석인정',
    type: 'OFFICIAL_FAMILY',
    typeName: '경조사 인정결석',
    startDate: getFormattedDate(-10),
    endDate: getFormattedDate(-9),
    daysCount: 2,
    periodText: '전일',
    reason: '조부상',
    status: 'APPROVED',
    requiresDocument: true,
    attachments: ['사망진단서'],
    createdAt: new Date(Date.now() - 864000000).toISOString(),
    attendedAt: new Date(Date.now() - 777600000).toISOString(),
    pickedUpAt: new Date(Date.now() - 691200000).toISOString(),
    submittedAt: new Date(Date.now() - 604800000).toISOString(),
    approvedAt: new Date(Date.now() - 518400000).toISOString(),
    verificationMethod: '학부모 연락',
    remindCount: 0,
  },
  {
    id: 'rec-6',
    studentId: 'std-30205',
    studentName: '김하은',
    grade: 3,
    classNum: 2,
    studentNum: 5,
    kind: '지각',
    category: '질병',
    type: 'STANDARD_RECORD',
    typeName: '질병 지각',
    startDate: getFormattedDate(0),
    endDate: getFormattedDate(0),
    daysCount: 1,
    periodText: '1교시 지각',
    reason: '이비인후과 병원 진료 후 등교',
    status: 'RECORDED',
    requiresDocument: false,
    attachments: [],
    createdAt: new Date().toISOString(),
    remindCount: 0,
  },
  {
    id: 'rec-7',
    studentId: 'std-30207',
    studentName: '박지우',
    grade: 3,
    classNum: 2,
    studentNum: 7,
    kind: '조퇴',
    category: '기타',
    type: 'STANDARD_RECORD',
    typeName: '기타 조퇴',
    startDate: getFormattedDate(-1),
    endDate: getFormattedDate(-1),
    daysCount: 1,
    periodText: '5교시 이후 조퇴',
    reason: '가정 사정 (가족 행사)',
    status: 'RECORDED',
    requiresDocument: false,
    attachments: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    remindCount: 0,
  },
  {
    id: 'rec-8',
    studentId: 'std-30208',
    studentName: '배서영',
    grade: 3,
    classNum: 2,
    studentNum: 8,
    kind: '결과',
    category: '미인정',
    type: 'STANDARD_RECORD',
    typeName: '미인정 결과',
    startDate: getFormattedDate(-3),
    endDate: getFormattedDate(-3),
    daysCount: 1,
    periodText: '6교시 결과',
    reason: '무단 불참',
    status: 'RECORDED',
    requiresDocument: false,
    attachments: [],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    remindCount: 0,
  },
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
let currentServerStorageInfo: { type: string; isCloud: boolean; name: string } | null = null;

export function getServerStorageInfo() {
  return currentServerStorageInfo;
}

export async function fetchServerSync(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isSyncing) return false;
  isSyncing = true;
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.success) return false;

    if (data.storageInfo) {
      currentServerStorageInfo = data.storageInfo;
    }

    if (data.lastUpdated && data.lastUpdated <= lastServerTimestamp) {
      return false;
    }
    lastServerTimestamp = data.lastUpdated || Date.now();

    // Check old notifications for audio triggers
    const oldNotifsStr = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]';
    let oldNotifs: SystemNotification[] = [];
    try { oldNotifs = JSON.parse(oldNotifsStr); } catch {}
    const newNotifs: SystemNotification[] = Array.isArray(data.notifications) ? data.notifications : [];

    // Local records protection: if local has data but server is cold/empty, re-hydrate server!
    const localRecordsStr = localStorage.getItem(STORAGE_KEYS.RECORDS);
    let localRecords: AbsenceRecord[] = [];
    try { localRecords = JSON.parse(localRecordsStr || '[]'); } catch {}

    const serverRecords: AbsenceRecord[] = Array.isArray(data.records) ? data.records : [];

    if (localRecords.length > 0 && serverRecords.length === 0) {
      // Re-hydrate server records from client
      postServerSync('SYNC_PUSH', { records: localRecords });
    } else if (Array.isArray(data.records)) {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(data.records));
    }

    // Local students protection: if local has students but server is empty or cold, re-hydrate server!
    const localStudentsStr = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    let localStudents: Student[] = [];
    try { localStudents = JSON.parse(localStudentsStr || '[]'); } catch {}
    const serverStudents: Student[] = Array.isArray(data.students) ? data.students : [];

    if (localStudents.length > 0 && serverStudents.length === 0) {
      // Re-hydrate server students from client
      postServerSync('SYNC_PUSH', { students: localStudents });
    } else if (serverStudents.length > 0) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(serverStudents));
    } else if (localStudents.length === 0) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    }

    if (Array.isArray(data.notifications)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
    }
    if (data.teacherPin) {
      localStorage.setItem(STORAGE_KEYS.TEACHER_PIN, data.teacherPin);
    }
    if (data.reminderSettings) {
      localStorage.setItem(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify(data.reminderSettings));
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
      if (data.success) {
        if (data.storageInfo) {
          currentServerStorageInfo = data.storageInfo;
        }
        if (data.lastUpdated) {
          lastServerTimestamp = data.lastUpdated;
        }
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

  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      fetchServerSync();
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleChannelMsg);
  }
  window.addEventListener('hoengseong_absence_update', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  // Periodic server sync polling (2s) for real-time sync across different phones & PC
  activeListenerCount++;
  if (!activeSyncInterval) {
    fetchServerSync();
    activeSyncInterval = setInterval(() => {
      fetchServerSync();
    }, 2000);
  }

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleChannelMsg);
    }
    window.removeEventListener('hoengseong_absence_update', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);

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
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  }
  try {
    const list: Student[] = JSON.parse(stored);
    if (!Array.isArray(list) || list.length === 0) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
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
    return INITIAL_STUDENTS;
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
      if (!updated.kind) {
        changed = true;
        updated.kind = '결석';
      }
      if (updated.requiresDocument === undefined) {
        changed = true;
        updated.requiresDocument = updated.status !== 'RECORDED';
      }
      if (updated.category === '출석 인정') {
        changed = true;
        updated.category = '출석인정';
      }
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
    }
    return migrated;
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

// 💡 레코드와 알림을 단일 네트워크 요청으로 일괄 동기화 (경쟁 상태 방지)
export function saveRecordsAndNotifications(records: AbsenceRecord[], notifications: SystemNotification[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  broadcastUpdate('RECORDS_UPDATED', records);
  broadcastUpdate('NOTIFICATIONS_UPDATED', notifications);
  postServerSync('BATCH_SYNC', { records, notifications });
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
    }
    return migrated;
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
  // 💡 등록하려는 알림의 학생이 우리 반 학생 목록에 있는지 엄격 검증
  const currentStudents = getStudents();
  if (currentStudents.length > 0 && notification.studentName) {
    const exists = currentStudents.some(s => s.name === notification.studentName || s.studentNum === notification.studentNum);
    if (!exists) {
      return null;
    }
  }

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

export function clearAllNotifications() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  broadcastUpdate('NOTIFICATIONS_UPDATED', []);
  postServerSync('SAVE_NOTIFICATIONS', { notifications: [] });
}

export function markNotificationsAsRead() {
  const current = getNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
}

// 생리 인정결석 월 1회 초과 여부 확인
export function checkStudentMenstrualMonthlyLimit(
  studentId: string,
  targetDate: string,
  excludeRecordId?: string | null
): { exceeded: boolean; existingRecord?: AbsenceRecord } {
  if (!studentId || !targetDate) return { exceeded: false };
  const targetYM = targetDate.substring(0, 7); // 'YYYY-MM'
  const records = getAbsenceRecords();
  const existing = records.find(r => 
    r.studentId === studentId &&
    r.id !== excludeRecordId &&
    (r.kind || '결석') === '결석' &&
    r.type === 'MENSTRUAL' &&
    (r.startDate.substring(0, 7) === targetYM || r.endDate.substring(0, 7) === targetYM)
  );
  return {
    exceeded: Boolean(existing),
    existingRecord: existing,
  };
}

// 💡 학교 수업일(평일, 월~금) 일수 계산 (토·일 주말 제외)
export function calculateSchoolDays(start?: string, end?: string): number {
  if (!start) return 1;
  const s = new Date(start);
  const e = new Date(end || start);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count > 0 ? count : 1;
}

// 💡 학생의 질병 결석 연속 일수 계산 (단일 레코드 일수 + 연속된 날짜에 등록된 분할 레코드 누적, 토·일 주말 제외)
export function getStudentConsecutiveIllnessDays(
  studentId: string,
  targetRecord?: Partial<AbsenceRecord> | null
): number {
  if (!studentId) return targetRecord?.daysCount || 1;
  const records = getAbsenceRecords().filter(
    r => r.studentId === studentId && (r.kind || '결석') === '결석' && r.category === '질병'
  );

  const dateSet = new Set<string>();
  const addRange = (start?: string, end?: string) => {
    if (!start) return;
    const cur = new Date(start);
    const last = new Date(end || start);
    if (isNaN(cur.getTime()) || isNaN(last.getTime())) return;
    while (cur <= last) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dStr = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
      const dayOfWeek = cur.getDay();
      // 💡 토요일(6)과 일요일(0)은 수업일이 아니므로 결석 일수 계산에서 제외!
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dateSet.add(dStr);
      }
      cur.setDate(cur.getDate() + 1);
    }
  };

  records.forEach(r => addRange(r.startDate, r.endDate));
  if (targetRecord?.startDate) {
    addRange(targetRecord.startDate, targetRecord.endDate);
  }

  const sortedDates = Array.from(dateSet).sort();
  if (sortedDates.length === 0) return targetRecord?.daysCount || 1;

  let maxChain = 1;
  let currentChain = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));

    // 연속 판정: 달력상 1일 차이(연속 요일)이거나, 금요일(5)에서 월요일(1)로 주말(3일 차이)을 건너뛴 경우
    const isConsecutive = diffDays === 1 || (diffDays === 3 && prev.getDay() === 5 && curr.getDay() === 1);

    if (isConsecutive) {
      currentChain += 1;
      if (currentChain > maxChain) maxChain = currentChain;
    } else {
      currentChain = 1;
    }
  }

  const baseCount = targetRecord?.startDate
    ? calculateSchoolDays(targetRecord.startDate, targetRecord.endDate || targetRecord.startDate)
    : (targetRecord?.daysCount || 1);

  return Math.max(baseCount, maxChain);
}

// 1. 교사가 출결/결석 등록
export function createAbsenceRecord(data: {
  student: Student;
  kind?: AttendanceKind;
  category: AbsenceRecord['category'];
  type: AbsenceRecord['type'];
  typeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  periodText?: string;
  reason: string;
  requiresDocument?: boolean;
  memo?: string;
}): AbsenceRecord | null {
  // 💡 생리인정 결석 월 1회 초과 방지 가드
  if ((data.kind || '결석') === '결석' && data.type === 'MENSTRUAL') {
    const check = checkStudentMenstrualMonthlyLimit(data.student.id, data.startDate);
    if (check.exceeded) {
      if (typeof window !== 'undefined') {
        alert(`[생리결석 월 1회 제한] ${data.student.name} 학생은 이미 이번 달(${data.startDate.substring(0, 7)})에 생리 인정결석(${check.existingRecord?.startDate})이 등록되어 있어 월 1회를 초과하여 작성할 수 없습니다.`);
      }
      return null;
    }
  }

  // 💡 연속 3일 이상 질병결석 여부 자동 판별 (지정 일수 3일 이상 or 연속된 질병결석 레코드 합산 3일 이상)
  const consecutiveDays = (data.kind || '결석') === '결석' && data.category === '질병'
    ? getStudentConsecutiveIllnessDays(data.student.id, { startDate: data.startDate, endDate: data.endDate, daysCount: data.daysCount })
    : data.daysCount;

  const isIllnessOver3 = (data.kind || '결석') === '결석' && data.category === '질병' && (data.daysCount >= 3 || consecutiveDays >= 3);
  const derivedType = isIllnessOver3 ? 'ILLNESS_OVER_3' : data.type;
  const derivedTypeName = isIllnessOver3 ? '질병결석 (3일 이상 진단서)' : data.typeName;

  const records = getAbsenceRecords();
  const requiresDoc = data.requiresDocument !== undefined 
    ? data.requiresDocument 
    : (data.kind === '결석' && data.category !== '미인정');

  const newRecord: AbsenceRecord = {
    id: `rec-${Date.now()}`,
    studentId: data.student.id,
    studentName: data.student.name,
    grade: data.student.grade,
    classNum: data.student.classNum,
    studentNum: data.student.studentNum,
    kind: data.kind || '결석',
    category: data.category,
    type: derivedType,
    typeName: derivedTypeName,
    startDate: data.startDate,
    endDate: data.endDate,
    daysCount: data.daysCount,
    periodText: data.periodText || '전일',
    reason: data.reason,
    requiresDocument: requiresDoc,
    status: requiresDoc ? 'PENDING_ATTENDANCE' : 'RECORDED',
    attachments: data.type === 'MENSTRUAL' 
      ? ['학부모 의견서(생리)'] 
      : data.type === 'FIELD_EXPERIENCE'
      ? ['체험학습 보고서(NEIS)', '일자별 배경 사진(날짜당 1장)', '보호자 동반 사진']
      : isIllnessOver3
      ? ['의사 진단서']
      : data.category === '질병'
      ? ['진료확인서', '학부모 의견서']
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

// 1-1. 교사가 출결/결석 기록 직접 수정
export function updateAbsenceRecord(recordId: string, updates: {
  student?: Student;
  kind?: AttendanceKind;
  category?: AbsenceRecord['category'];
  type?: AbsenceRecord['type'];
  typeName?: string;
  startDate?: string;
  endDate?: string;
  daysCount?: number;
  periodText?: string;
  reason?: string;
  requiresDocument?: boolean;
  status?: AbsenceStatus;
  memo?: string;
}): AbsenceRecord | null {
  const records = getAbsenceRecords();
  let updatedRecord: AbsenceRecord | null = null;

  const updated = records.map(r => {
    if (r.id === recordId) {
      const targetStudent = updates.student || {
        id: r.studentId,
        name: r.studentName,
        grade: r.grade,
        classNum: r.classNum,
        studentNum: r.studentNum,
      };

      const newKind = updates.kind !== undefined ? updates.kind : r.kind;
      const newType = updates.type !== undefined ? updates.type : r.type;
      const newCategory = updates.category !== undefined ? updates.category : r.category;
      const newStartDate = updates.startDate !== undefined ? updates.startDate : r.startDate;
      const newRequiresDoc = updates.requiresDocument !== undefined
        ? updates.requiresDocument
        : r.requiresDocument;

      // 💡 생리인정 결석 월 1회 초과 방지 가드 (수정 시)
      if ((newKind || '결석') === '결석' && newType === 'MENSTRUAL') {
        const check = checkStudentMenstrualMonthlyLimit(targetStudent.id, newStartDate, recordId);
        if (check.exceeded) {
          if (typeof window !== 'undefined') {
            alert(`[생리결석 월 1회 제한] ${targetStudent.name} 학생은 이미 이번 달(${newStartDate.substring(0, 7)})에 생리 인정결석(${check.existingRecord?.startDate})이 등록되어 있어 월 1회를 초과하여 수정할 수 없습니다.`);
          }
          return r;
        }
      }

      let newStatus = updates.status !== undefined ? updates.status : r.status;
      if (newRequiresDoc === false) {
        newStatus = 'RECORDED';
      } else if (r.status === 'RECORDED' && newRequiresDoc === true && updates.status === undefined) {
        newStatus = 'PENDING_ATTENDANCE';
      }

      const newEndDate = updates.endDate !== undefined ? updates.endDate : r.endDate;
      const newDaysCount = updates.daysCount !== undefined ? updates.daysCount : r.daysCount;

      let finalType = updates.type !== undefined ? updates.type : r.type;
      let finalTypeName = updates.typeName !== undefined ? updates.typeName : r.typeName;

      // 💡 질병결석 시 연속 결석 일수 3일 이상 자동 감지
      let finalAttachments = r.attachments || [];
      if ((newKind || '결석') === '결석' && newCategory === '질병') {
        const consecutiveDays = getStudentConsecutiveIllnessDays(targetStudent.id, {
          id: r.id,
          startDate: newStartDate,
          endDate: newEndDate,
          daysCount: newDaysCount,
        });
        if (newDaysCount >= 3 || consecutiveDays >= 3) {
          finalType = 'ILLNESS_OVER_3';
          finalTypeName = '질병결석 (3일 이상 진단서)';
          if (!finalAttachments.includes('의사 진단서') && !finalAttachments.includes('의사 소견서')) {
            finalAttachments = ['의사 진단서', ...finalAttachments.filter(a => a !== '진료확인서')];
          }
        }
      }

      updatedRecord = {
        ...r,
        studentId: targetStudent.id,
        studentName: targetStudent.name,
        grade: targetStudent.grade,
        classNum: targetStudent.classNum,
        studentNum: targetStudent.studentNum,
        kind: newKind,
        category: newCategory,
        type: finalType,
        typeName: finalTypeName,
        startDate: newStartDate,
        endDate: newEndDate,
        daysCount: newDaysCount,
        periodText: updates.periodText !== undefined ? updates.periodText : r.periodText,
        reason: updates.reason !== undefined ? updates.reason : r.reason,
        requiresDocument: newRequiresDoc,
        status: newStatus,
        attachments: finalAttachments,
        memo: updates.memo !== undefined ? updates.memo : r.memo,
      };

      // 만약 이전 단계로 되돌린 경우 타임스탬프 정리
      if (newStatus === 'PENDING_ATTENDANCE') {
        updatedRecord.attendedAt = undefined;
        updatedRecord.pickedUpAt = undefined;
        updatedRecord.submittedAt = undefined;
        updatedRecord.approvedAt = undefined;
      } else if (newStatus === 'ATTENDED_NOTIFIED') {
        updatedRecord.pickedUpAt = undefined;
        updatedRecord.submittedAt = undefined;
        updatedRecord.approvedAt = undefined;
      } else if (newStatus === 'FORM_PICKED_UP') {
        updatedRecord.submittedAt = undefined;
        updatedRecord.approvedAt = undefined;
      } else if (newStatus === 'SUBMITTED') {
        updatedRecord.approvedAt = undefined;
      }

      return updatedRecord;
    }
    return r;
  });

  if (updatedRecord) {
    saveAbsenceRecords(updated);
  }
  return updatedRecord;
}

// 1-2. 교사가 이전 단계로 되돌리기 (상태 롤백 / 워크플로우 단계 변경)
export function updateAbsenceRecordStatus(
  recordId: string,
  targetStatus: AbsenceStatus,
  note?: string
): AbsenceRecord | null {
  const records = getAbsenceRecords();
  let updatedRecord: AbsenceRecord | null = null;

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        status: targetStatus,
      };

      // 되돌리는 단계에 맞추어 타임스탬프 정리 및 보정
      if (targetStatus === 'PENDING_ATTENDANCE') {
        updatedRecord.attendedAt = undefined;
        updatedRecord.pickedUpAt = undefined;
        updatedRecord.submittedAt = undefined;
        updatedRecord.approvedAt = undefined;
      } else if (targetStatus === 'ATTENDED_NOTIFIED') {
        updatedRecord.pickedUpAt = undefined;
        updatedRecord.submittedAt = undefined;
        updatedRecord.approvedAt = undefined;
      } else if (targetStatus === 'FORM_PICKED_UP') {
        updatedRecord.submittedAt = undefined;
        updatedRecord.approvedAt = undefined;
      } else if (targetStatus === 'SUBMITTED') {
        updatedRecord.approvedAt = undefined;
        updatedRecord.verificationMethod = undefined;
        updatedRecord.verificationNote = undefined;
      }

      return updatedRecord;
    }
    return r;
  });

  if (updatedRecord) {
    saveAbsenceRecords(updated);

    const rec = updatedRecord as AbsenceRecord;
    const stageNames: Record<AbsenceStatus, string> = {
      PENDING_ATTENDANCE: '1단계(등교 확인 대기)',
      ATTENDED_NOTIFIED: '2단계(서류 미수령)',
      FORM_PICKED_UP: '3단계(서류 챙김/작성 중)',
      SUBMITTED: '4단계(제출함 투입/승인 대기)',
      APPROVED: '최종 승인 완료',
      RECORDED: '일반 출결 기록',
    };

    addNotification({
      type: 'STATUS_REVERTED',
      title: '↩ 출결 진행 단계 되돌림',
      message: `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생의 출결 상태가 [${stageNames[targetStatus] || targetStatus}] 단계로 되돌려졌습니다.${note ? ` (${note})` : ''}`,
      studentName: rec.studentName,
      grade: rec.grade,
      classNum: rec.classNum,
      studentNum: rec.studentNum,
      recordId: recordId,
    });
  }
  return updatedRecord;
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
    const rec = updatedRecord as AbsenceRecord;
    const isFieldTrip = rec.type === 'FIELD_EXPERIENCE';
    addNotification({
      type: 'ATTENDANCE_CHECKED',
      title: isFieldTrip ? '등교 확인 및 NEIS 보고서 제출 알림' : '등교 확인 및 결석계 작성 알림 발송',
      message: isFieldTrip
        ? `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생의 등교가 확인되어 '보고서를 7일이내 NEIS로 제출' 알림이 발송되었습니다.`
        : `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생의 등교가 확인되어 결석계 챙기기 알림이 발송되었습니다.`,
      studentName: rec.studentName,
      grade: rec.grade,
      classNum: rec.classNum,
      studentNum: rec.studentNum,
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
  otherText?: string,
  studentMemo?: string
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
        studentMemo: studentMemo?.trim() ? studentMemo.trim() : r.studentMemo,
      };
      return updatedRecord;
    }
    return r;
  });

  if (updatedRecord) {
    saveAbsenceRecords(updated);
    const rec = updatedRecord as AbsenceRecord;
    const attachSummary = attachments.length > 0 ? ` (첨부: ${attachments.join(', ')})` : '';
    const memoSnippet = rec.studentMemo ? ` [학생 메모: "${rec.studentMemo}"]` : '';

    const isFieldTrip = rec.type === 'FIELD_EXPERIENCE';
    addNotification({
      type: 'SUBMIT_PING',
      title: isFieldTrip ? '📢 현장체험학습 보고서(NEIS) 제출 확인' : '📢 결석신고서 제출 알림 (핑)',
      message: isFieldTrip
        ? `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생이 '보고서를 7일이내 NEIS로 제출' 및 증빙 사진 준비를 완료했습니다!${attachSummary}${memoSnippet}`
        : `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생이 [${rec.typeName}] 결석신고서를 제출함에 넣었습니다!${attachSummary}${memoSnippet}`,
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
    const isFieldTrip = rec.type === 'FIELD_EXPERIENCE';
    addNotification({
      type: 'REMIND_ALERT',
      title: isFieldTrip ? '🔔 현장체험학습 NEIS 보고서 제출 리마인드' : '🔔 결석신고서 수령/제출 리마인드 발송',
      message: isFieldTrip
        ? `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생에게 '보고서를 7일이내 NEIS로 제출' 리마인드를 전송했습니다.`
        : `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생에게 결석신고서 수령 및 제출 리마인드를 전송했습니다.`,
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
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(SAMPLE_RECORDS));
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
