import * as XLSX from 'xlsx';
import { AbsenceRecord, Student } from '@/types';

export function exportAbsenceStatisticsToExcel(
  records: AbsenceRecord[],
  students: Student[],
  filename = '학급_스마트_출결마감_기록부.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. 전체 출결마감 상세 내역 시트
  const recordsData = records.map((r, idx) => ({
    연번: idx + 1,
    학년: r.grade,
    반: r.classNum,
    번호: r.studentNum,
    이름: r.studentName,
    출결종류: r.kind || '결석',
    출결구분: r.category,
    세부종류: r.typeName,
    시작일: r.startDate,
    종료일: r.endDate,
    일수: r.daysCount,
    교시: r.periodText || '전일',
    사유: r.reason,
    서류알림여부: r.requiresDocument ? '서류제출알림(필수)' : '단순기록(서류불필요)',
    진행상태:
      r.status === 'APPROVED'
        ? '최종승인완료'
        : r.status === 'SUBMITTED'
        ? '제출완료(확인대기)'
        : r.status === 'FORM_PICKED_UP'
        ? '양식수령(작성중)'
        : r.status === 'ATTENDED_NOTIFIED'
        ? '등교확인(미수령)'
        : r.status === 'RECORDED'
        ? '출결기록완료'
        : '등교전(대기)',
    첨부서류: r.attachments ? r.attachments.join(', ') + (r.otherAttachmentText ? ` (${r.otherAttachmentText})` : '') : '-',
    등교확인일시: r.attendedAt ? new Date(r.attendedAt).toLocaleString('ko-KR') : '-',
    서류수령일시: r.pickedUpAt ? new Date(r.pickedUpAt).toLocaleString('ko-KR') : '-',
    제출일시: r.submittedAt ? new Date(r.submittedAt).toLocaleString('ko-KR') : '-',
    교사승인일시: r.approvedAt ? new Date(r.approvedAt).toLocaleString('ko-KR') : '-',
    확인방법: r.verificationMethod || '-',
    리마인드횟수: r.remindCount || 0,
    메모: r.memo || '',
  }));
  const wsRecords = XLSX.utils.json_to_sheet(recordsData);
  XLSX.utils.book_append_sheet(wb, wsRecords, '출결마감_상세기록');

  // 2. 월별/학생별 출결 집계 시트 (NEIS 마감용 4종류 x 4구분)
  const currentMonth = new Date().getMonth() + 1;
  const studentStats = students.map((s, idx) => {
    const sRecords = records.filter(r => r.studentId === s.id);
    
    // 종류별 집계
    const absenceCount = sRecords.filter(r => (r.kind || '결석') === '결석').length;
    const lateCount = sRecords.filter(r => r.kind === '지각').length;
    const earlyLeaveCount = sRecords.filter(r => r.kind === '조퇴').length;
    const skipCount = sRecords.filter(r => r.kind === '결과').length;

    // 구분별 집계
    const illnessCount = sRecords.filter(r => r.category === '질병').length;
    const unexcusedCount = sRecords.filter(r => r.category === '미인정').length;
    const otherCount = sRecords.filter(r => r.category === '기타').length;
    const approvedCount = sRecords.filter(r => r.category === '출석인정' || r.category === '출석 인정').length;

    const menstrualRecords = sRecords.filter(r => r.type === 'MENSTRUAL');
    const menstrualThisMonth = menstrualRecords.filter(r => {
      const m = new Date(r.startDate).getMonth() + 1;
      return m === currentMonth;
    }).length;

    const fieldTripRecords = sRecords.filter(r => r.type === 'FIELD_EXPERIENCE');
    const totalFieldTripDays = fieldTripRecords.reduce((acc, cur) => acc + cur.daysCount, 0);

    const pendingDocCount = sRecords.filter(r => r.requiresDocument && r.status !== 'APPROVED').length;

    return {
      연번: idx + 1,
      학년: s.grade,
      반: s.classNum,
      번호: s.studentNum,
      이름: s.name,
      '결석_총건수': absenceCount,
      '지각_총건수': lateCount,
      '조퇴_총건수': earlyLeaveCount,
      '결과_총건수': skipCount,
      '질병_합계': illnessCount,
      '미인정_합계': unexcusedCount,
      '기타_합계': otherCount,
      '출석인정_합계': approvedCount,
      '당월_생리결석_횟수': `${menstrualThisMonth}회`,
      '생리결석_월1회_초과여부': menstrualThisMonth > 1 ? '⚠️ 초과 (확인필요)' : '정상',
      '현장체험학습_누적일수': `${totalFieldTripDays}일`,
      '현장체험학습_한도초과여부': totalFieldTripDays > 9.5 ? '⚠️ 9.5일 초과' : '정상(9.5일이내)',
      '미제출_결석계_진행건수': pendingDocCount > 0 ? `⚠️ ${pendingDocCount}건 진행중` : '0건 (완료)',
      학생연락처: s.phone || '',
      학부모연락처: s.parentPhone || '',
    };
  });
  const wsStats = XLSX.utils.json_to_sheet(studentStats);
  XLSX.utils.book_append_sheet(wb, wsStats, '학생별_출결통계_NEIS용');

  // 3. 파일 다운로드
  XLSX.writeFile(wb, filename);
}

export function downloadStudentTemplate() {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    { 학년: 2, 반: 3, 번호: 1, 이름: '강서윤', 학생연락처: '010-1111-0001', 학부모연락처: '010-2222-0001' },
    { 학년: 2, 반: 3, 번호: 2, 이름: '김다은', 학생연락처: '010-1111-0002', 학부모연락처: '010-2222-0002' },
    { 학년: 2, 반: 3, 번호: 3, 이름: '김민지', 학생연락처: '010-1111-0003', 학부모연락처: '010-2222-0003' },
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, '학생명단_양식');
  XLSX.writeFile(wb, '학급_학생명단_양식.xlsx');
}

export function parseStudentExcelFile(file: File): Promise<Omit<Student, 'id'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const students: Omit<Student, 'id'>[] = [];
        for (const row of json) {
          const grade = Number(row['학년'] || row['grade'] || 3);
          const classNum = Number(row['반'] || row['classNum'] || 2);
          const studentNum = Number(row['번호'] || row['studentNum'] || 1);
          const name = String(row['이름'] || row['name'] || '').trim();
          const phone = String(row['학생연락처'] || row['phone'] || '').trim();
          const parentPhone = String(row['학부모연락처'] || row['parentPhone'] || '').trim();

          if (name) {
            students.push({
              grade,
              classNum,
              studentNum,
              name,
              phone,
              parentPhone,
            });
          }
        }
        resolve(students);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
