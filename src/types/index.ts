export type AttendanceKind = '결석' | '지각' | '조퇴' | '결과';
export type AttendanceCategory = '질병' | '미인정' | '기타' | '출석인정';

export type AbsenceCategory = AttendanceCategory | '출석 인정' | '질병' | '기타(사전결재)';

export type AbsenceType =
  | 'FIELD_EXPERIENCE' // 현장체험학습 (NEIS 출석인정, 1학기 9.5일 한도, 7일내 보고서)
  | 'MENSTRUAL' // 생리 (출석인정)
  | 'ILLNESS_UNDER_3' // 질병결석 (2일 이내)
  | 'ILLNESS_OVER_3' // 질병결석 (3일 이상)
  | 'OFFICIAL_FAMILY' // 경조사
  | 'OFFICIAL_INFECTIOUS' // 법정 전염병
  | 'OFFICIAL_OTHER' // 출석인정 기타
  | 'OTHER_PRE_APPROVAL' // 기타(사전결재)
  | 'STANDARD_RECORD'; // 나이스 표준 출결마감 기록 (지각/조퇴/결과/미인정 등)

export type AbsenceStatus =
  | 'PENDING_ATTENDANCE' // 결석 처리됨, 등교 확인 대기
  | 'ATTENDED_NOTIFIED' // 등교 확인됨 (학생에게 서류 챙기기 알림 발송됨, 미수령)
  | 'FORM_PICKED_UP' // 학생이 양식 수령함 (작성 중)
  | 'SUBMITTED' // 학생이 제출함에 넣고 앱에서 제출 완료 누름 (교사 확인 대기)
  | 'APPROVED' // 교사가 종이 서류 확인 후 최종 승인
  | 'RECORDED'; // 단순 출결 기록 완료 (서류 제출 불필요 건)

export type AttachmentProof =
  | '체험학습 보고서(NEIS)'
  | '일자별 배경 사진(날짜당 1장)'
  | '보호자 동반 사진'
  | '인솔자 위임장'
  | '학부모 의견서(생리)'
  | '진료확인서'
  | '학부모 의견서'
  | '의사 진단서'
  | '의사 소견서'
  | '담임교사 확인서'
  | '약봉투/처방전'
  | '청첩장'
  | '사망진단서'
  | '기타';

export type VerificationMethod =
  | '학부모 연락'
  | '학생 연락'
  | '학생 사전 대면 보고'
  | '기타';

export interface Student {
  id: string;
  grade: number;
  classNum: number;
  studentNum: number;
  name: string;
  phone?: string;
  parentPhone?: string;
  pin?: string; // 학생 비밀번호 (기본: '1234')
}

export interface AbsenceRecord {
  id: string;
  studentId: string;
  studentName: string;
  grade: number;
  classNum: number;
  studentNum: number;
  kind?: AttendanceKind; // 결석 | 지각 | 조퇴 | 결과 (기본값: '결석')
  category: AbsenceCategory; // 질병 | 미인정 | 기타 | 출석인정
  type: AbsenceType;
  typeName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  periodText?: string; // e.g. "전일", "1교시", "5~7교시"
  reason: string;
  status: AbsenceStatus;
  requiresDocument?: boolean; // 결석계/증빙서류 제출 및 학생 알림 필요 여부 (기본: true)
  attachments: AttachmentProof[];
  otherAttachmentText?: string;
  createdAt: string; // ISO
  attendedAt?: string; // 교사가 등교 확인 누른 일시
  pickedUpAt?: string; // 학생이 서류 챙김 누른 일시
  submittedAt?: string; // 학생이 제출함 투입 누른 일시
  approvedAt?: string; // 교사가 최종 승인한 일시
  verificationMethod?: VerificationMethod;
  verificationNote?: string;
  remindCount: number;
  lastRemindedAt?: string;
  memo?: string;
  // Field trip specific rules
  fieldTripDeadline?: string; // YYYY-MM-DD (보고서 제출 마감일: 다녀온 후 7일 이내)
  hasDelegationForm?: boolean; // 보호자 외 인솔자 위임장 필요 여부
}

export interface SystemNotification {
  id: string;
  type: 'SUBMIT_PING' | 'REMIND_ALERT' | 'ATTENDANCE_CHECKED' | 'SCHEDULED_REMIND';
  title: string;
  message: string;
  studentName: string;
  grade: number;
  classNum: number;
  studentNum: number;
  recordId: string;
  timestamp: string;
  read: boolean;
  attachments?: AttachmentProof[];
}
