import * as XLSX from 'xlsx';
import { AbsenceRecord, Student } from '@/types';

export function exportAbsenceStatisticsToExcel(
  records: AbsenceRecord[],
  students: Student[],
  filename = '횡성여고_결석신고서_출결통계.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. 전체 결석신고서 상세 목록 시트
  const recordsData = records.map((r, idx) => ({
    연번: idx + 1,
    학년: r.grade,
    반: r.classNum,
    번호: r.studentNum,
    이름: r.studentName,
    결석구분: r.category,
    세부종류: r.typeName,
    시작일: r.startDate,
    종료일: r.endDate,
    결석일수: r.daysCount,
    교시: r.periodText || '전일',
    사유: r.reason,
    진행상태:
      r.status === 'APPROVED'
        ? '최종승인완료'
        : r.status === 'SUBMITTED'
        ? '제출완료(확인대기)'
        : r.status === 'FORM_PICKED_UP'
        ? '양식수령(작성중)'
        : r.status === 'ATTENDED_NOTIFIED'
        ? '등교확인(미수령)'
        : '등교전(대기)',
    첨부서류: r.attachments.join(', ') + (r.otherAttachmentText ? ` (${r.otherAttachmentText})` : ''),
    등교확인일시: r.attendedAt ? new Date(r.attendedAt).toLocaleString('ko-KR') : '-',
    서류수령일시: r.pickedUpAt ? new Date(r.pickedUpAt).toLocaleString('ko-KR') : '-',
    제출일시: r.submittedAt ? new Date(r.submittedAt).toLocaleString('ko-KR') : '-',
    교사승인일시: r.approvedAt ? new Date(r.approvedAt).toLocaleString('ko-KR') : '-',
    확인방법: r.verificationMethod || '-',
    리마인드횟수: r.remindCount,
    메모: r.memo || '',
  }));
  const wsRecords = XLSX.utils.json_to_sheet(recordsData);
  XLSX.utils.book_append_sheet(wb, wsRecords, '결석신고서_상세내역');

  // 2. 월별/학생별 생리결석 및 질병결석 누적 통계 시트 (NEIS 마감용)
  const currentMonth = new Date().getMonth() + 1;
  const studentStats = students.map((s, idx) => {
    const sRecords = records.filter(r => r.studentId === s.id);
    const menstrualRecords = sRecords.filter(r => r.type === 'MENSTRUAL');
    const menstrualThisMonth = menstrualRecords.filter(r => {
      const m = new Date(r.startDate).getMonth() + 1;
      return m === currentMonth;
    }).length;

    const illnessRecords = sRecords.filter(r => r.category === '질병');
    const totalIllnessDays = illnessRecords.reduce((acc, cur) => acc + cur.daysCount, 0);

    const fieldTripRecords = sRecords.filter(r => r.type === 'FIELD_EXPERIENCE');
    const totalFieldTripDays = fieldTripRecords.reduce((acc, cur) => acc + cur.daysCount, 0);

    const pendingCount = sRecords.filter(r => r.status !== 'APPROVED').length;

    return {
      연번: idx + 1,
      학년: s.grade,
      반: s.classNum,
      번호: s.studentNum,
      이름: s.name,
      '당월_생리결석(인정)_횟수': `${menstrualThisMonth}회`,
      '생리결석_월1회_초과여부': menstrualThisMonth > 1 ? '⚠️ 초과 (확인필요)' : '정상(1회이내)',
      누적_생리결석_총일수: menstrualRecords.reduce((acc, cur) => acc + cur.daysCount, 0),
      누적_질병결석_총일수: totalIllnessDays,
      '누적_현장체험학습_일수(한도 9.5일)': `${totalFieldTripDays}일`,
      '현장체험학습_한도초과여부': totalFieldTripDays > 9.5 ? '⚠️ 9.5일 초과 (확인필요)' : '정상(9.5일 이내)',
      총_결석_건수: sRecords.length,
      현재_미제출_미승인_건수: pendingCount > 0 ? `⚠️ ${pendingCount}건 진행중` : '0건 (완료)',
      학생연락처: s.phone || '',
      학부모연락처: s.parentPhone || '',
    };
  });
  const wsStats = XLSX.utils.json_to_sheet(studentStats);
  XLSX.utils.book_append_sheet(wb, wsStats, '학생별_누적_출결현황');

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
