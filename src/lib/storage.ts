import { Student, AbsenceRecord, AbsenceStatus, SystemNotification, AttachmentProof, VerificationMethod, AttendanceKind } from '@/types';

const STORAGE_KEYS = {
  STUDENTS: 'hoengseong_students_v1',
  RECORDS: 'hoengseong_absence_records_v1',
  DELETED_RECORD_IDS: 'hoengseong_deleted_record_ids_v1',
  DAILY_SNAPSHOTS: 'hoengseong_daily_snapshots_v1',
  NOTIFICATIONS: 'hoengseong_notifications_v1',
  CURRENT_STUDENT: 'hoengseong_current_student_id',
  TEACHER_PIN: 'hoengseong_teacher_pin_v1',
  REMINDER_SETTINGS: 'hoengseong_reminder_settings_v1',
  REMINDER_LOG: 'hoengseong_daily_reminders_log_v1',
};

export function getDeletedRecordIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_RECORD_IDS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function addDeletedRecordId(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  const set = getDeletedRecordIds();
  set.add(id);
  localStorage.setItem(STORAGE_KEYS.DELETED_RECORD_IDS, JSON.stringify(Array.from(set)));
}

export function clearDeletedRecordIds(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.DELETED_RECORD_IDS);
}

export function saveDailySnapshot(records: AbsenceRecord[]): void {
  if (typeof window === 'undefined' || !Array.isArray(records) || records.length === 0) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_SNAPSHOTS);
    const snapshots: Record<string, AbsenceRecord[]> = raw ? JSON.parse(raw) : {};
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    snapshots[today] = records;
    const keys = Object.keys(snapshots);
    if (keys.length > 30) {
      keys.sort().slice(0, keys.length - 30).forEach(k => delete snapshots[k]);
    }
    localStorage.setItem(STORAGE_KEYS.DAILY_SNAPSHOTS, JSON.stringify(snapshots));
  } catch (err) {
    console.warn('saveDailySnapshot error:', err);
  }
}

export function getDailySnapshots(): Record<string, AbsenceRecord[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_SNAPSHOTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const SAMPLE_STUDENTS: Student[] = [
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

export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-30201-0', grade: 3, classNum: 2, studentNum: 1, name: '김동희', phone: '01033948815', parentPhone: '01067988815', pin: '1234' },
  { id: 'std-30202-1', grade: 3, classNum: 2, studentNum: 2, name: '김지후', phone: '01037450978', parentPhone: '01035170988', pin: '1234' },
  { id: 'std-30203-2', grade: 3, classNum: 2, studentNum: 3, name: '김혜련', phone: '01055853911', parentPhone: '01044333911', pin: '1234' },
  { id: 'std-30204-3', grade: 3, classNum: 2, studentNum: 4, name: '박서은', phone: '01065613341', parentPhone: '01031053341', pin: '1234' },
  { id: 'std-30205-4', grade: 3, classNum: 2, studentNum: 5, name: '박소연', phone: '01081611815', parentPhone: '01020561815', pin: '1234' },
  { id: 'std-30206-5', grade: 3, classNum: 2, studentNum: 6, name: '변가담', phone: '01091164763', parentPhone: '01088791999', pin: '1234' },
  { id: 'std-30207-6', grade: 3, classNum: 2, studentNum: 7, name: '이가연', phone: '01033157380', parentPhone: '01047067380', pin: '1234' },
  { id: 'std-30208-7', grade: 3, classNum: 2, studentNum: 8, name: '이소민', phone: '01039525549', parentPhone: '01046965547', pin: '1234' },
  { id: 'std-30209-8', grade: 3, classNum: 2, studentNum: 9, name: '이윤서', phone: '01086674126', parentPhone: '01050884126', pin: '1234' },
  { id: 'std-30210-9', grade: 3, classNum: 2, studentNum: 10, name: '이지민', phone: '01099677807', parentPhone: '01033657807', pin: '1234' },
  { id: 'std-30211-10', grade: 3, classNum: 2, studentNum: 11, name: '이현빈', phone: '01091033021', parentPhone: '01090330913', pin: '1234' },
  { id: 'std-30212-11', grade: 3, classNum: 2, studentNum: 12, name: '임하연', phone: '01027646350', parentPhone: '01043306350', pin: '1234' },
  { id: 'std-30213-12', grade: 3, classNum: 2, studentNum: 13, name: '임혜주', phone: '01041467875', parentPhone: '01049288002', pin: '1234' },
  { id: 'std-30214-13', grade: 3, classNum: 2, studentNum: 14, name: '정다혜', phone: '01036994412', parentPhone: '01026062485', pin: '1234' },
  { id: 'std-30215-14', grade: 3, classNum: 2, studentNum: 15, name: '조민채', phone: '01071210784', parentPhone: '01077410784', pin: '1234' },
  { id: 'std-30217-15', grade: 3, classNum: 2, studentNum: 17, name: '최가인', phone: '01091524470', parentPhone: '01031183690', pin: '1234' },
  { id: 'std-30218-16', grade: 3, classNum: 2, studentNum: 18, name: '허지안', phone: '01082093372', parentPhone: '01031363372', pin: '1234' },
  { id: 'std-30219-17', grade: 3, classNum: 2, studentNum: 19, name: '홍예진', phone: '01023623036', parentPhone: '01053793036', pin: '1234' },
  { id: 'std-30220-18', grade: 3, classNum: 2, studentNum: 20, name: '김남경', phone: '01087293117', parentPhone: '01063796667', pin: '1234' },
];

export function isSampleStudentRoster(students: Student[]): boolean {
  if (!students || students.length === 0) return false;
  const sampleNames = new Set([
    '강서윤', '김다은', '김민지', '김서현', '김하은',
    '박수빈', '박지우', '배서영', '신예은', '안유진',
    '오세린', '이소율', '이지원', '이채원', '장원영',
    '정예린', '조유리', '최예나', '한소희', '황민아'
  ]);
  const matchCount = students.filter(s => sampleNames.has(s.name)).length;
  return matchCount >= 5;
}

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
    id: 'rec-20260917-std-30204',
    studentId: 'std-30204-3',
    studentName: '박서은',
    grade: 3,
    classNum: 2,
    studentNum: 4,
    kind: '결석',
    category: '출석인정',
    type: 'FIELD_EXPERIENCE',
    typeName: '현장체험학습 (보고서를 7일이내 NEIS로 제출)',
    startDate: '2026-09-17',
    endDate: '2026-09-18',
    daysCount: 2,
    periodText: '전일',
    reason: '가족동반 현장체험학습',
    status: 'PENDING_ATTENDANCE',
    requiresDocument: true,
    attachments: ['체험학습 보고서(NEIS)', '일자별 배경 사진(날짜당 1장)', '보호자 동반 사진'],
    remindCount: 0,
    createdAt: '2026-09-17T08:00:00.000Z',
  },
  {
    id: 'rec-20260917-std-30206',
    studentId: 'std-30206-5',
    studentName: '변가담',
    grade: 3,
    classNum: 2,
    studentNum: 6,
    kind: '조퇴',
    category: '미인정',
    type: 'STANDARD_RECORD',
    typeName: '조퇴(미인정)',
    startDate: '2026-09-17',
    endDate: '2026-09-17',
    daysCount: 1,
    periodText: '2교시',
    reason: '학원(2교시-)',
    status: 'RECORDED',
    requiresDocument: false,
    attachments: [],
    remindCount: 0,
    createdAt: '2026-09-17T09:00:00.000Z',
  },
  {
    id: 'rec-20260917-std-30211',
    studentId: 'std-30211-10',
    studentName: '이현빈',
    grade: 3,
    classNum: 2,
    studentNum: 11,
    kind: '조퇴',
    category: '미인정',
    type: 'STANDARD_RECORD',
    typeName: '조퇴(미인정)',
    startDate: '2026-09-17',
    endDate: '2026-09-17',
    daysCount: 1,
    periodText: '5교시 이후',
    reason: '학원',
    status: 'RECORDED',
    requiresDocument: false,
    attachments: [],
    remindCount: 0,
    createdAt: '2026-09-17T13:00:00.000Z',
  },
  {
    id: 'rec-20260916-std-30206',
    studentId: 'std-30206-5',
    studentName: '변가담',
    grade: 3,
    classNum: 2,
    studentNum: 6,
    kind: '결석',
    category: '질병',
    type: 'ILLNESS_UNDER_3',
    typeName: '질병결석 (2일 이내)',
    startDate: '2026-09-16',
    endDate: '2026-09-16',
    daysCount: 1,
    periodText: '전일',
    reason: '감기몸살 및 발열',
    status: 'APPROVED',
    requiresDocument: true,
    attachments: ['진료확인서', '학부모 의견서'],
    remindCount: 1,
    createdAt: '2026-09-16T08:00:00.000Z',
    attendedAt: '2026-09-17T08:30:00.000Z',
    pickedUpAt: '2026-09-17T09:00:00.000Z',
    submittedAt: '2026-09-17T14:30:00.000Z',
    approvedAt: '2026-09-18T09:00:00.000Z',
    updatedAt: '2026-09-18T09:00:00.000Z',
    verificationMethod: '학생 사전 대면 보고',
  },
  {
    id: 'rec-20260916-std-30209',
    studentId: 'std-30209-8',
    studentName: '이윤서',
    grade: 3,
    classNum: 2,
    studentNum: 9,
    kind: '결석',
    category: '질병',
    type: 'ILLNESS_UNDER_3',
    typeName: '질병결석 (2일 이내)',
    startDate: '2026-09-16',
    endDate: '2026-09-16',
    daysCount: 1,
    periodText: '전일',
    reason: '감기몸살 및 발열',
    status: 'APPROVED',
    requiresDocument: true,
    attachments: ['진료확인서', '학부모 의견서'],
    remindCount: 1,
    createdAt: '2026-09-16T08:00:00.000Z',
    attendedAt: '2026-09-17T08:30:00.000Z',
    pickedUpAt: '2026-09-17T09:00:00.000Z',
    submittedAt: '2026-09-17T14:30:00.000Z',
    approvedAt: '2026-09-18T09:00:00.000Z',
    updatedAt: '2026-09-18T09:00:00.000Z',
    verificationMethod: '학생 사전 대면 보고',
  },
];

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

export const STAGE_PRIORITY: Record<AbsenceStatus, number> = {
  PENDING_ATTENDANCE: 1,
  ATTENDED_NOTIFIED: 2,
  FORM_PICKED_UP: 3,
  SUBMITTED: 4,
  APPROVED: 5,
  RECORDED: 6,
};

export function getRecordLatestTimestamp(r: Partial<AbsenceRecord>): number {
  if (!r) return 0;
  return Math.max(
    r.updatedAt ? new Date(r.updatedAt).getTime() : 0,
    r.approvedAt ? new Date(r.approvedAt).getTime() : 0,
    r.submittedAt ? new Date(r.submittedAt).getTime() : 0,
    r.pickedUpAt ? new Date(r.pickedUpAt).getTime() : 0,
    r.attendedAt ? new Date(r.attendedAt).getTime() : 0,
    r.archivedAt ? new Date(r.archivedAt).getTime() : 0,
    r.createdAt ? new Date(r.createdAt).getTime() : 0
  );
}

export function getServerStorageInfo() {
  return currentServerStorageInfo;
}

export async function fetchServerSync(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isSyncing) return false;
  isSyncing = true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch('/api/sync', { 
      cache: 'no-store',
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
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

    // Records Smart Bidirectional Merge (Cold-Start & Overwrite Shield):
    const localRecordsStr = localStorage.getItem(STORAGE_KEYS.RECORDS);
    let localRecords: AbsenceRecord[] = [];
    if (localRecordsStr !== null) {
      try { localRecords = JSON.parse(localRecordsStr || '[]'); } catch {}
    }
    const serverRecords: AbsenceRecord[] = Array.isArray(data.records) ? data.records : [];
    const isExplicitClear = localStorage.getItem('hoengseong_explicit_clear_action') === 'true';

    if (!isExplicitClear) {
      const deletedIds = getDeletedRecordIds();
      const recordMap = new Map<string, AbsenceRecord>();

      // 1. Put server records into map (excluding intentionally deleted ones)
      for (const r of serverRecords) {
        if (r && r.id && !deletedIds.has(r.id)) {
          recordMap.set(r.id, r);
        }
      }

      // 2. Put local records into map (NEVER delete local records created by user!)
      let hasLocalExclusiveOrNewer = false;
      for (const r of localRecords) {
        if (r && r.id && !deletedIds.has(r.id)) {
          const existing = recordMap.get(r.id);
          if (!existing) {
            recordMap.set(r.id, r);
            hasLocalExclusiveOrNewer = true;
          } else {
            const localTime = getRecordLatestTimestamp(r);
            const serverTime = getRecordLatestTimestamp(existing);
            const localStage = STAGE_PRIORITY[r.status] || 0;
            const serverStage = STAGE_PRIORITY[existing.status] || 0;

            if (localTime > serverTime) {
              recordMap.set(r.id, r);
              hasLocalExclusiveOrNewer = true;
            } else if (localTime === serverTime && localStage > serverStage) {
              // 타임스탬프가 같더라도 더 상위 단계(3/4/5단계)로 진행된 상태를 절대 강등시키지 않음
              recordMap.set(r.id, r);
              hasLocalExclusiveOrNewer = true;
            }
          }
        }
      }

      // 3. Inspect emergency vault
      const vaultStr = localStorage.getItem('hoengseong_records_vault_v1');
      if (vaultStr) {
        try {
          const vaultRecords: AbsenceRecord[] = JSON.parse(vaultStr);
          if (Array.isArray(vaultRecords)) {
            for (const r of vaultRecords) {
              if (r && r.id && !deletedIds.has(r.id)) {
                const existing = recordMap.get(r.id);
                if (!existing) {
                  recordMap.set(r.id, r);
                  hasLocalExclusiveOrNewer = true;
                } else {
                  const vTime = getRecordLatestTimestamp(r);
                  const sTime = getRecordLatestTimestamp(existing);
                  const vStage = STAGE_PRIORITY[r.status] || 0;
                  const sStage = STAGE_PRIORITY[existing.status] || 0;
                  if (vTime > sTime || (vTime === sTime && vStage > sStage)) {
                    recordMap.set(r.id, r);
                    hasLocalExclusiveOrNewer = true;
                  }
                }
              }
            }
          }
        } catch {}
      }

      // 4. Inspect daily snapshots
      const snapshots = getDailySnapshots();
      for (const snapList of Object.values(snapshots)) {
        if (Array.isArray(snapList)) {
          for (const r of snapList) {
            if (r && r.id && !deletedIds.has(r.id)) {
              const existing = recordMap.get(r.id);
              if (!existing) {
                recordMap.set(r.id, r);
                hasLocalExclusiveOrNewer = true;
              } else {
                const snapTime = getRecordLatestTimestamp(r);
                const sTime = getRecordLatestTimestamp(existing);
                const snapStage = STAGE_PRIORITY[r.status] || 0;
                const sStage = STAGE_PRIORITY[existing.status] || 0;
                if (snapTime > sTime || (snapTime === sTime && snapStage > sStage)) {
                  recordMap.set(r.id, r);
                  hasLocalExclusiveOrNewer = true;
                }
              }
            }
          }
        }
      }

      // 5. If completely empty, seed from INITIAL_RECORDS
      if (recordMap.size === 0 && INITIAL_RECORDS.length > 0) {
        for (const r of INITIAL_RECORDS) {
          if (r && r.id && !deletedIds.has(r.id)) {
            recordMap.set(r.id, r);
          }
        }
        hasLocalExclusiveOrNewer = true;
      }

      const mergedRecords = Array.from(recordMap.values());
      mergedRecords.sort((a, b) => {
        const dateA = a.startDate || '';
        const dateB = b.startDate || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });

      // Save merged truth locally, into emergency vault, and into daily snapshot
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(mergedRecords));
      localStorage.setItem('hoengseong_records_vault_v1', JSON.stringify(mergedRecords));
      saveDailySnapshot(mergedRecords);

      // If local had records the server didn't have (or was newer), heal the server immediately!
      if (hasLocalExclusiveOrNewer || mergedRecords.length > serverRecords.length) {
        postServerSync('SAVE_RECORDS', { records: mergedRecords });
      }
    }

    // Students sync:
    const localStudentsStr = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    let localStudents: Student[] = [];
    if (localStudentsStr !== null) {
      try { localStudents = JSON.parse(localStudentsStr || '[]'); } catch {}
    }
    const serverStudents: Student[] = Array.isArray(data.students) ? data.students : [];

    const isLocalCustom = !isSampleStudentRoster(localStudents) && localStudents.length > 0;
    const isServerSample = isSampleStudentRoster(serverStudents);

    if (isLocalCustom && isServerSample) {
      // Local client has a real custom roster, but server returned default sample data (e.g. from cold start).
      // DO NOT overwrite custom roster! Protect it and heal the server with the real roster!
      postServerSync('SAVE_STUDENTS', { students: localStudents });
    } else if (Array.isArray(data.students) && data.students.length > 0) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    } else if (localStudents.length === 0 && Array.isArray(data.students)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    }

    if (Array.isArray(data.notifications)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
    }
    if (data.teacherPin) {
      localStorage.setItem(STORAGE_KEYS.TEACHER_PIN, data.teacherPin);
    }
    if (data.reminderSettings) {
      localStorage.setItem(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify(data.reminderSettings));
      broadcastUpdate('REMINDER_SETTINGS_UPDATED', data.reminderSettings);
    }
    if (data.reminderLog && typeof data.reminderLog === 'object') {
      const today = new Date().toISOString().split('T')[0];
      if (data.reminderLog.date === today) {
        const localLogStr = localStorage.getItem(STORAGE_KEYS.REMINDER_LOG);
        let localLog = { date: today, slots: {} as Record<string, unknown> };
        try { if (localLogStr) localLog = JSON.parse(localLogStr); } catch {}
        const mergedSlots = { ...(localLog.slots || {}), ...(data.reminderLog.slots || {}) };
        const mergedLog = { date: today, slots: mergedSlots };
        localStorage.setItem(STORAGE_KEYS.REMINDER_LOG, JSON.stringify(mergedLog));
        broadcastUpdate('REMINDER_LOG_UPDATED', mergedLog);
      }
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      cache: 'no-store',
      keepalive: true,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
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
    clearTimeout(timeoutId);
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

  const startPolling = () => {
    if (!activeSyncInterval && activeListenerCount > 0) {
      activeSyncInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchServerSync();
        }
      }, 5000);
    }
  };

  const stopPolling = () => {
    if (activeSyncInterval) {
      clearInterval(activeSyncInterval);
      activeSyncInterval = null;
    }
  };

  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      fetchServerSync();
      startPolling();
    } else {
      // 모바일 화면 꺼짐 또는 백그라운드 전환 시 폴링 즉시 중단 (배터리 및 CPU 절약)
      stopPolling();
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleChannelMsg);
  }
  window.addEventListener('hoengseong_absence_update', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  // 모바일 배터리 및 부하 최적화: 5초 주기 실시간 동기화
  activeListenerCount++;
  if (!activeSyncInterval && document.visibilityState === 'visible') {
    fetchServerSync();
    startPolling();
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
    if (activeListenerCount <= 0) {
      stopPolling();
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
  if (typeof window === 'undefined') return INITIAL_RECORDS;
  const stored = localStorage.getItem(STORAGE_KEYS.RECORDS);
  const isExplicitClear = localStorage.getItem('hoengseong_explicit_clear_action') === 'true';

  if (stored === null) {
    if (!isExplicitClear) {
      localStorage.setItem('hoengseong_app_has_run_v1', 'true');
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(INITIAL_RECORDS));
      localStorage.setItem('hoengseong_records_vault_v1', JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    return [];
  }
  try {
    const list: AbsenceRecord[] = JSON.parse(stored);
    if ((!Array.isArray(list) || list.length === 0) && !isExplicitClear) {
      const vaultStr = localStorage.getItem('hoengseong_records_vault_v1');
      if (vaultStr) {
        try {
          const vault = JSON.parse(vaultStr);
          if (Array.isArray(vault) && vault.length > 0) {
            localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(vault));
            return vault;
          }
        } catch {}
      }
      if (INITIAL_RECORDS.length > 0) {
        localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(INITIAL_RECORDS));
        localStorage.setItem('hoengseong_records_vault_v1', JSON.stringify(INITIAL_RECORDS));
        return INITIAL_RECORDS;
      }
    }
    let changed = false;
    const migrated = (list || []).map(r => {
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
    return INITIAL_RECORDS;
  }
}

export function saveAbsenceRecords(records: AbsenceRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  if (records.length > 0) {
    localStorage.setItem('hoengseong_records_vault_v1', JSON.stringify(records));
    saveDailySnapshot(records);
    localStorage.removeItem('hoengseong_explicit_clear_action');
  }
  broadcastUpdate('RECORDS_UPDATED', records);
  postServerSync('SAVE_RECORDS', { records });
}

export function deleteAbsenceRecord(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  addDeletedRecordId(id);
  const current = getAbsenceRecords();
  const remaining = current.filter(r => r.id !== id);
  saveAbsenceRecords(remaining);
}

// 💡 레코드와 알림을 단일 네트워크 요청으로 일괄 동기화 (경쟁 상태 방지)
export function saveRecordsAndNotifications(records: AbsenceRecord[], notifications: SystemNotification[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  if (records.length > 0) {
    localStorage.setItem('hoengseong_records_vault_v1', JSON.stringify(records));
    saveDailySnapshot(records);
    localStorage.removeItem('hoengseong_explicit_clear_action');
  }
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
    updatedAt: new Date().toISOString(),
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
  const nowIso = new Date().toISOString();

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
        updatedAt: nowIso,
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
  const nowIso = new Date().toISOString();

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        status: targetStatus,
        updatedAt: nowIso,
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
      studentTitle: '⚠️ [서류 재확인] 결석계 서류 보완 안내',
      studentMessage: `${rec.studentName} 학생, 제출한 출결 서류에 확인 또는 보완이 필요해요: ${note || '담임선생님께 확인 후 다시 제출해주세요.'}`,
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
  const nowIso = new Date().toISOString();

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        status: 'ATTENDED_NOTIFIED',
        attendedAt: nowIso,
        remindCount: r.remindCount + 1,
        lastRemindedAt: nowIso,
        updatedAt: nowIso,
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
      studentTitle: isFieldTrip 
        ? '🎒 [등교 확인] 현장체험학습 보고서를 NEIS로 제출해주세요!' 
        : '🏫 [등교 확인] 교실 서류함에서 결석신고서를 챙겨주세요!',
      studentMessage: isFieldTrip
        ? `${rec.studentName} 학생, 등교를 환영해요! 현장체험학습은 종이 결석계가 아니에요. 7일 이내에 NEIS로 보고서를 제출해주세요. (일자별 사진 + 동행 보호자 사진 필수!)`
        : `${rec.studentName} 학생, 등교를 환영해요! 교실 앞 서류함에서 [${rec.typeName}] 결석신고서를 1장 챙겨서 가방에 넣어두세요. (집에서 부모님 서명 필요)`,
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
  const nowIso = new Date().toISOString();

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        status: 'FORM_PICKED_UP',
        pickedUpAt: nowIso,
        updatedAt: nowIso,
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
  const nowIso = new Date().toISOString();

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        status: 'SUBMITTED',
        attachments,
        otherAttachmentText: otherText,
        submittedAt: nowIso,
        studentMemo: studentMemo?.trim() ? studentMemo.trim() : r.studentMemo,
        updatedAt: nowIso,
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
  const nowIso = new Date().toISOString();

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        status: 'APPROVED',
        approvedAt: nowIso,
        updatedAt: nowIso,
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

// 5-1. 최종 승인 완료 건을 칸반 보드에서 정리/숨김 (통계에는 영구 보존)
export function archiveRecordFromBoard(recordId: string): boolean {
  const records = getAbsenceRecords();
  let found = false;
  const nowIso = new Date().toISOString();
  const updated = records.map(r => {
    if (r.id === recordId) {
      found = true;
      return {
        ...r,
        archivedFromBoard: true,
        archivedAt: nowIso,
        updatedAt: nowIso,
      };
    }
    return r;
  });
  if (found) {
    saveAbsenceRecords(updated);
  }
  return found;
}

// 5-2. 보관된 승인 건을 다시 칸반 보드로 복원
export function unarchiveRecordToBoard(recordId: string): boolean {
  const records = getAbsenceRecords();
  let found = false;
  const nowIso = new Date().toISOString();
  const updated = records.map(r => {
    if (r.id === recordId) {
      found = true;
      return {
        ...r,
        archivedFromBoard: false,
        archivedAt: undefined,
        updatedAt: nowIso,
      };
    }
    return r;
  });
  if (found) {
    saveAbsenceRecords(updated);
  }
  return found;
}

// 5-3. 모든 최종 승인 완료 건 일괄 정리 (보드에서 숨김, 통계에는 100% 보존)
export function archiveAllApprovedRecords(): number {
  const records = getAbsenceRecords();
  let count = 0;
  const now = new Date().toISOString();
  const updated = records.map(r => {
    if (r.status === 'APPROVED' && !r.archivedFromBoard) {
      count++;
      return {
        ...r,
        archivedFromBoard: true,
        archivedAt: now,
        updatedAt: now,
      };
    }
    return r;
  });
  if (count > 0) {
    saveAbsenceRecords(updated);
  }
  return count;
}

// 6. 교사가 [다시 알림 보내기 🔔] 클릭
export function triggerRemind(recordId: string): AbsenceRecord | null {
  const records = getAbsenceRecords();
  let updatedRecord: AbsenceRecord | null = null;
  const nowIso = new Date().toISOString();

  const updated = records.map(r => {
    if (r.id === recordId) {
      updatedRecord = {
        ...r,
        remindCount: r.remindCount + 1,
        lastRemindedAt: nowIso,
        updatedAt: nowIso,
      };
      return updatedRecord;
    }
    return r;
  });

  if (updatedRecord) {
    saveAbsenceRecords(updated);
    const rec = updatedRecord as AbsenceRecord;
    const isFieldTrip = rec.type === 'FIELD_EXPERIENCE';
    const isPickedUp = rec.status === 'FORM_PICKED_UP';
    const isAttendedNotified = rec.status === 'ATTENDED_NOTIFIED';
    addNotification({
      type: 'REMIND_ALERT',
      title: isFieldTrip 
        ? `🔔 [${rec.studentNum}번 ${rec.studentName}] 체험학습 리마인드 전송 완료` 
        : isPickedUp
        ? `🔔 [${rec.studentNum}번 ${rec.studentName}] 제출함 투입 독려 전송 완료`
        : `🔔 [${rec.studentNum}번 ${rec.studentName}] 서류 양식 수령 안내 전송 완료`,
      message: isFieldTrip
        ? `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생에게 '보고서를 7일이내 NEIS로 제출' 리마인드를 전송했습니다.`
        : isPickedUp
        ? `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생에게 작성 중인 [${rec.typeName}] 서류를 완성하여 교실 제출함에 넣어달라는 제출 독려 알림을 전송했습니다.`
        : `${rec.grade}학년 ${rec.classNum}반 ${rec.studentNum}번 ${rec.studentName} 학생에게 교실 서류함에서 [${rec.typeName}] 양식을 챙기라는 안내 알림을 전송했습니다.`,
      studentTitle: isFieldTrip
        ? '🎒 [담임선생님 알림] 현장체험학습 보고서를 NEIS로 제출해주세요!'
        : isPickedUp
        ? '✍️ [담임선생님 알림] 작성한 결석계를 교실 제출함에 넣어주세요!'
        : '📄 [담임선생님 알림] 결석신고서 서류 양식을 챙겨주세요!',
      studentMessage: isFieldTrip
        ? `${rec.studentName} 학생! 현장체험학습은 종이 결석계가 아니에요. 복귀 후 7일 이내에 NEIS로 보고서를 제출해야 출석 인정이 됩니다. (일자별 사진 + 보호자 동반 사진 필수!)`
        : isPickedUp
        ? `${rec.studentName} 학생! 결석신고서에 부모님 서명과 증빙서류를 챙기셨나요? 작성을 마쳤다면 교실 제출함에 넣고, 화면 아래 [제출 완료] 버튼을 눌러주세요!`
        : `${rec.studentName} 학생! 아직 교실 앞 서류함에서 [${rec.typeName}] 서류 양식을 챙기지 않았어요. 쉬는 시간이나 점심시간에 서류함에서 양식을 1장 챙겨 가방에 넣어두세요! (집에서 부모님 서명 필요)`,
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

// 학생 로그인 접속 이력 기록 (10분 스로틀링 & 무한루프 차단)
export function recordStudentLogin(studentId: string, force = false): void {
  if (typeof window === 'undefined' || !studentId) return;
  const students = getStudents();
  const existing = students.find((s) => s.id === studentId);
  if (!existing) return;

  // 10분 이내에 이미 접속 기록이 있다면 불필요한 네트워크 통신 및 재전송 방지
  if (!force && existing.lastLoginAt) {
    const elapsed = Date.now() - new Date(existing.lastLoginAt).getTime();
    if (elapsed < 10 * 60 * 1000) {
      return;
    }
  }

  const nowIso = new Date().toISOString();
  const newStudents = students.map((s) => {
    if (s.id === studentId) {
      return { ...s, lastLoginAt: nowIso };
    }
    return s;
  });

  // 로컬 저장만 조용히 수행하여 STUDENTS_UPDATED 브로드캐스트로 인한 loadData 무한루프 원천 차단
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(newStudents));
  postServerSync('STUDENT_LOGIN_PING', { studentId, lastLoginAt: nowIso });
}

// 학생 로그인 접속 이력 초기화 (필요시 교사가 개별/전체 초기화)
export function resetStudentLoginStatus(studentId: string): void {
  if (typeof window === 'undefined') return;
  const students = getStudents();
  let updated = false;
  const newStudents = students.map((s) => {
    if (s.id === studentId) {
      updated = true;
      const copy = { ...s };
      delete copy.lastLoginAt;
      return copy;
    }
    return s;
  });
  if (updated) {
    saveStudents(newStudents);
    broadcastUpdate('STUDENT_LOGIN_RECORDED', { studentId, lastLoginAt: null });
  }
}

// 8. 데이터 초기화 및 완전 삭제
export async function clearAllAbsenceData(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem('hoengseong_explicit_clear_action', 'true');
  localStorage.removeItem('hoengseong_records_vault_v1');
  clearDeletedRecordIds();
  localStorage.removeItem(STORAGE_KEYS.DAILY_SNAPSHOTS);
  localStorage.setItem('hoengseong_app_has_run_v1', 'true');
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.removeItem('hoengseong_daily_reminders_log_v1');
  broadcastUpdate('RESET_ALL');
  broadcastUpdate('RECORDS_UPDATED', []);
  broadcastUpdate('NOTIFICATIONS_UPDATED', []);
  await postServerSync('CLEAR_ABSENCE_DATA');
}

export async function wipeEntireDatabase(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem('hoengseong_explicit_clear_action', 'true');
  localStorage.removeItem('hoengseong_records_vault_v1');
  clearDeletedRecordIds();
  localStorage.removeItem(STORAGE_KEYS.DAILY_SNAPSHOTS);
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
  await postServerSync('WIPE_DATABASE');
}

export async function loadSampleMockData(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('hoengseong_explicit_clear_action');
  localStorage.setItem('hoengseong_app_has_run_v1', 'true');
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(SAMPLE_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(SAMPLE_RECORDS));
  localStorage.setItem('hoengseong_records_vault_v1', JSON.stringify(SAMPLE_RECORDS));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, 'std-30203');
  localStorage.removeItem('hoengseong_daily_reminders_log_v1');
  broadcastUpdate('RESET_ALL');
  await postServerSync('LOAD_SAMPLE_DATA');
}

// 기존 호환용: 초기화 시 결석 데이터 0건으로 완전 삭제
export async function resetMockData(): Promise<void> {
  await clearAllAbsenceData();
}

// 9. 교사 비밀번호(PIN) 및 인증 관리
export function getTeacherPin(): string {
  if (typeof window === 'undefined') return '1234';
  return localStorage.getItem(STORAGE_KEYS.TEACHER_PIN) || '1234';
}

export async function verifyTeacherPinServer(pin: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: '오프라인' };
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'VERIFY_TEACHER_PIN', pin: pin.trim() }),
      cache: 'no-store',
    });
    if (!res.ok) {
      return { success: false, error: '서버 인증 응답 오류가 발생했습니다.' };
    }
    const data = await res.json();
    if (data.authenticated) {
      return { success: true };
    }
    return { success: false, error: data.error || '비밀번호가 일치하지 않습니다.' };
  } catch {
    // 네트워크 실패 시 로컬 폴백
    const localPin = localStorage.getItem(STORAGE_KEYS.TEACHER_PIN) || '1234';
    if (pin.trim() === localPin.trim()) {
      return { success: true };
    }
    return { success: false, error: '비밀번호가 일치하지 않습니다.' };
  }
}

export async function setTeacherPin(newPin: string, currentPin?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  localStorage.setItem(STORAGE_KEYS.TEACHER_PIN, newPin.trim());
  broadcastUpdate('TEACHER_PIN_CHANGED');
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_TEACHER_PIN', newPin: newPin.trim(), currentPin: currentPin?.trim() }),
      cache: 'no-store',
      keepalive: true,
    });
    return res.ok;
  } catch {
    return true;
  }
}

export function isTeacherLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  // 🔒 보안: 탭/세션 단위 인증 - 브라우저 종료 시 자동 해제되며 타 기기/타 탭과 혼선 방지
  return sessionStorage.getItem('hoengseong_teacher_auth') === 'true';
}

export function setTeacherLoggedIn(loggedIn: boolean) {
  if (typeof window === 'undefined') return;
  if (loggedIn) {
    sessionStorage.setItem('hoengseong_teacher_auth', 'true');
    // 이전 영구 세션이 남아있었다면 정리하여 학생 화면 혼선 차단
    localStorage.removeItem('hoengseong_teacher_auth');
  } else {
    sessionStorage.removeItem('hoengseong_teacher_auth');
    localStorage.removeItem('hoengseong_teacher_auth');
  }
  broadcastUpdate('TEACHER_AUTH_CHANGED', loggedIn);
}
