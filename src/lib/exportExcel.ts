import * as XLSX from 'xlsx';
import { AbsenceRecord, Student } from '@/types';

export function exportAbsenceStatisticsToExcel(
  records: AbsenceRecord[],
  students: Student[],
  filename = '학급_스마트_출결마감_기록부.xlsx',
  targetMonth?: number
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

  // 2. 월별/학생별 출결 집계 시트 (NEIS 마감용 4종류 x 4구분 + 특기사항)
  const monthToUse = targetMonth || (new Date().getMonth() + 1);
  const isCat = (rCat: string, target: '질병' | '미인정' | '기타' | '출석인정') => {
    if (target === '출석인정') return rCat === '출석인정' || rCat === '출석 인정';
    return rCat === target;
  };

  const formatMMDD = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length >= 3) return `${parts[1]}.${parts[2]}`;
    return dStr;
  };

  const sortedStudents = [...students].sort((a, b) => (Number(a.studentNum) || 0) - (Number(b.studentNum) || 0));

  const studentStats = sortedStudents.map((s, idx) => {
    // 해당 월 레코드 필터
    const monthRecords = records.filter(r => {
      if (r.studentId !== s.id) return false;
      if (!r.startDate) return false;
      const m = Number(r.startDate.split('-')[1]);
      return m === monthToUse;
    });

    // 1. 결석 (일수 기준)
    const absenceRecs = monthRecords.filter(r => (r.kind || '결석') === '결석');
    const absenceIllnessDays = absenceRecs.filter(r => isCat(r.category, '질병')).reduce((sum, r) => sum + (r.daysCount || 1), 0);
    const absenceUnexcusedDays = absenceRecs.filter(r => isCat(r.category, '미인정')).reduce((sum, r) => sum + (r.daysCount || 1), 0);
    const absenceOtherDays = absenceRecs.filter(r => isCat(r.category, '기타')).reduce((sum, r) => sum + (r.daysCount || 1), 0);
    const absenceApprovedDays = absenceRecs.filter(r => isCat(r.category, '출석인정')).reduce((sum, r) => sum + (r.daysCount || 1), 0);
    const absenceTotalDays = absenceIllnessDays + absenceUnexcusedDays + absenceOtherDays + absenceApprovedDays;

    // 2. 지각 (회수 기준)
    const lateRecs = monthRecords.filter(r => r.kind === '지각');
    const lateIllnessCount = lateRecs.filter(r => isCat(r.category, '질병')).length;
    const lateUnexcusedCount = lateRecs.filter(r => isCat(r.category, '미인정')).length;
    const lateOtherCount = lateRecs.filter(r => isCat(r.category, '기타')).length;
    const lateApprovedCount = lateRecs.filter(r => isCat(r.category, '출석인정')).length;
    const lateTotalCount = lateRecs.length;

    // 3. 조퇴 (회수 기준)
    const earlyRecs = monthRecords.filter(r => r.kind === '조퇴');
    const earlyIllnessCount = earlyRecs.filter(r => isCat(r.category, '질병')).length;
    const earlyUnexcusedCount = earlyRecs.filter(r => isCat(r.category, '미인정')).length;
    const earlyOtherCount = earlyRecs.filter(r => isCat(r.category, '기타')).length;
    const earlyApprovedCount = earlyRecs.filter(r => isCat(r.category, '출석인정')).length;
    const earlyTotalCount = earlyRecs.length;

    // 4. 결과 (회수 기준)
    const skipRecs = monthRecords.filter(r => r.kind === '결과');
    const skipIllnessCount = skipRecs.filter(r => isCat(r.category, '질병')).length;
    const skipUnexcusedCount = skipRecs.filter(r => isCat(r.category, '미인정')).length;
    const skipOtherCount = skipRecs.filter(r => isCat(r.category, '기타')).length;
    const skipApprovedCount = skipRecs.filter(r => isCat(r.category, '출석인정')).length;
    const skipTotalCount = skipRecs.length;

    // 생리결석
    const menstrualRecs = monthRecords.filter(r => r.type === 'MENSTRUAL');
    const menstrualCount = menstrualRecs.length;

    // 체험학습 누적 (해당 학생 전체)
    const allStudentRecs = records.filter(r => r.studentId === s.id);
    const fieldTripRecords = allStudentRecs.filter(r => r.type === 'FIELD_EXPERIENCE');
    const totalFieldTripDays = fieldTripRecords.reduce((acc, cur) => acc + (cur.daysCount || 1), 0);

    // 미제출 서류 진행건수
    const pendingDocCount = monthRecords.filter(r => r.requiresDocument !== false && r.status !== 'APPROVED').length;

    // 나이스 특기사항 텍스트 생성
    const specialRemarks = monthRecords.map(r => {
      const dateText = r.endDate && r.endDate !== r.startDate
        ? `${formatMMDD(r.startDate)}~${formatMMDD(r.endDate)}`
        : formatMMDD(r.startDate);
      const reasonText = r.reason || r.typeName || '사유 미기재';
      const kindText = r.kind || '결석';
      const catText = r.category === '출석 인정' ? '출석인정' : r.category;
      const countText = kindText === '결석' ? `${r.daysCount || 1}일` : '1회';
      return `${dateText} ${reasonText} (${catText}${kindText} ${countText})`;
    }).join('\n');

    return {
      연번: idx + 1,
      학년: s.grade,
      반: s.classNum,
      번호: s.studentNum,
      이름: s.name,
      '결석_질병(일)': absenceIllnessDays,
      '결석_미인정(일)': absenceUnexcusedDays,
      '결석_기타(일)': absenceOtherDays,
      '결석_인정(일)': absenceApprovedDays,
      '결석_합계(일)': absenceTotalDays,
      '지각_질병(회)': lateIllnessCount,
      '지각_미인정(회)': lateUnexcusedCount,
      '지각_기타(회)': lateOtherCount,
      '지각_인정(회)': lateApprovedCount,
      '지각_합계(회)': lateTotalCount,
      '조퇴_질병(회)': earlyIllnessCount,
      '조퇴_미인정(회)': earlyUnexcusedCount,
      '조퇴_기타(회)': earlyOtherCount,
      '조퇴_인정(회)': earlyApprovedCount,
      '조퇴_합계(회)': earlyTotalCount,
      '결과_질병(회)': skipIllnessCount,
      '결과_미인정(회)': skipUnexcusedCount,
      '결과_기타(회)': skipOtherCount,
      '결과_인정(회)': skipApprovedCount,
      '결과_합계(회)': skipTotalCount,
      '당월_생리결석_횟수': `${menstrualCount}회`,
      '생리결석_월1회_초과여부': menstrualCount > 1 ? '⚠️ 초과 (확인필요)' : '정상(1회이내)',
      '현장체험학습_누적일수': `${totalFieldTripDays}일`,
      '현장체험학습_한도초과여부': totalFieldTripDays > 9.5 ? '⚠️ 9.5일 초과' : '정상(9.5일이내)',
      '서류_진행상태': pendingDocCount > 0 ? `⚠️ ${pendingDocCount}건 진행중` : (monthRecords.length > 0 ? '✓ 마감 완료' : '해당없음'),
      '나이스_출결_특기사항': specialRemarks || '-',
      학생연락처: s.phone || '',
      학부모연락처: s.parentPhone || '',
    };
  });
  const wsStats = XLSX.utils.json_to_sheet(studentStats);
  XLSX.utils.book_append_sheet(wb, wsStats, `${monthToUse}월_NEIS출결통계`);

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
