import { NextRequest, NextResponse } from 'next/server';
import { readServerDb, writeServerDb, getStorageInfo } from '@/lib/serverDb';
import { SAMPLE_STUDENTS, SAMPLE_RECORDS } from '@/lib/storage';
import { AbsenceRecord } from '@/types';
import { sendPushToStudent, sendPushToTeacher } from '@/lib/pushServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await readServerDb();
  const storageInfo = getStorageInfo();
  // 🔒 보안: 학생 및 일반 클라이언트 응답에서 교사 비밀번호(teacherPin)를 완벽히 제외
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { teacherPin, ...safeDb } = db;
  return NextResponse.json(
    { success: true, storageInfo, ...safeDb },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const current = await readServerDb();

    let updated = current;

    switch (action) {
      case 'SAVE_RECORDS': {
        if (Array.isArray(body.records)) {
          updated = await writeServerDb({ records: body.records });
        }
        break;
      }

      case 'SAVE_STUDENTS': {
        if (Array.isArray(body.students)) {
          updated = await writeServerDb({ students: body.students });
        }
        break;
      }

      case 'SAVE_NOTIFICATIONS': {
        if (Array.isArray(body.notifications)) {
          updated = await writeServerDb({ notifications: body.notifications });
        }
        break;
      }

      case 'SAVE_REMINDER_SETTINGS': {
        if (body.reminderSettings && typeof body.reminderSettings === 'object') {
          updated = await writeServerDb({ reminderSettings: body.reminderSettings });
        }
        break;
      }

      case 'SAVE_REMINDER_LOG': {
        if (body.reminderLog && typeof body.reminderLog === 'object') {
          updated = await writeServerDb({ reminderLog: body.reminderLog });
        }
        break;
      }

      case 'BATCH_SYNC': {
        const patch: Record<string, unknown> = {};
        if (Array.isArray(body.records)) patch.records = body.records;
        if (Array.isArray(body.students)) patch.students = body.students;
        if (Array.isArray(body.notifications)) patch.notifications = body.notifications;
        if (typeof body.teacherPin === 'string') patch.teacherPin = body.teacherPin;
        if (body.reminderSettings && typeof body.reminderSettings === 'object') patch.reminderSettings = body.reminderSettings;
        if (body.reminderLog && typeof body.reminderLog === 'object') patch.reminderLog = body.reminderLog;
        updated = await writeServerDb(patch);
        break;
      }

      case 'SUBMIT_PING': {
        const { recordId, attachments } = body;
        const nowIso = new Date().toISOString();
        const foundRec = current.records.find((r) => r.id === recordId);

        const newRecords = current.records.map((r) => {
          if (r.id === recordId) {
            return {
              ...r,
              status: 'SUBMITTED' as const,
              submittedAt: nowIso,
              updatedAt: nowIso,
              attachments: Array.isArray(attachments) ? attachments : r.attachments,
            };
          }
          return r;
        });

        const newNotifs = [...current.notifications];
        if (foundRec) {
          newNotifs.unshift({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'SUBMIT_PING',
            title: `📨 [제출 완료] ${foundRec.studentNum}번 ${foundRec.studentName}`,
            message: `${foundRec.typeName} 서류를 교실 제출함에 넣었습니다.`,
            studentName: foundRec.studentName,
            grade: foundRec.grade,
            classNum: foundRec.classNum,
            studentNum: foundRec.studentNum,
            recordId: foundRec.id,
            timestamp: nowIso,
            read: false,
            attachments: Array.isArray(attachments) ? attachments : foundRec.attachments,
          });

          // 📲 교사 스마트폰/PC로 백그라운드 웹 푸시 발송 (앱이 닫혀있어도 도착)
          sendPushToTeacher({
            title: `📨 [서류 제출] ${foundRec.studentNum}번 ${foundRec.studentName}`,
            body: `${foundRec.studentName} 학생이 [${foundRec.typeName}] 서류를 교실 제출함에 넣었습니다!`,
            url: '/teacher',
          }).catch(() => {});
        }

        updated = await writeServerDb({ records: newRecords, notifications: newNotifs });
        break;
      }

      case 'PICK_UP_FORM': {
        const { recordId } = body;
        const nowIso = new Date().toISOString();
        const newRecords = current.records.map((r) => {
          if (r.id === recordId) {
            return {
              ...r,
              status: 'FORM_PICKED_UP' as const,
              pickedUpAt: nowIso,
              updatedAt: nowIso,
            };
          }
          return r;
        });
        updated = await writeServerDb({ records: newRecords });
        break;
      }

      case 'ATTEND_STUDENT': {
        const { recordId } = body;
        const nowIso = new Date().toISOString();
        const foundRec = current.records.find((r) => r.id === recordId);

        const newRecords = current.records.map((r) => {
          if (r.id === recordId) {
            return {
              ...r,
              status: 'ATTENDED_NOTIFIED' as const,
              attendedAt: nowIso,
              remindCount: (r.remindCount || 0) + 1,
              lastRemindedAt: nowIso,
              updatedAt: nowIso,
            };
          }
          return r;
        });

        const newNotifs = [...current.notifications];
        if (foundRec) {
          const isFieldTrip = foundRec.type === 'FIELD_EXPERIENCE';
          newNotifs.unshift({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'REMIND_ALERT',
            title: isFieldTrip 
              ? `🎒 [등교 확인] ${foundRec.studentNum}번 ${foundRec.studentName} 학생`
              : `🔔 [등교 확인] ${foundRec.studentNum}번 ${foundRec.studentName} 학생`,
            message: isFieldTrip
              ? `${foundRec.studentName} 학생의 등교가 확인되어 '보고서를 7일이내 NEIS로 제출' 알림을 전송했습니다.`
              : `${foundRec.studentName} 학생에게 교실 서류함에서 [${foundRec.typeName}] 결석신고서를 챙기라는 알림을 전송했습니다.`,
            studentTitle: isFieldTrip
              ? `🎒 [등교 확인] 현장체험학습 보고서를 NEIS로 제출해주세요!`
              : `🏫 [등교 확인] 결석신고서 서류 양식을 챙겨주세요!`,
            studentMessage: isFieldTrip
              ? `${foundRec.studentName} 학생, 등교를 환영해요! 현장체험학습은 종이 결석계가 아니에요. 7일 이내에 NEIS로 보고서를 제출해주세요. (일자별 사진 + 동행 보호자 사진 필수!)`
              : `${foundRec.studentName} 학생, 등교를 환영해요! 교실 앞 서류함에서 [${foundRec.typeName}] 양식을 1장 챙겨서 가방에 넣어두세요. (집에서 부모님 서명 필요)`,
            studentName: foundRec.studentName,
            grade: foundRec.grade,
            classNum: foundRec.classNum,
            studentNum: foundRec.studentNum,
            recordId: foundRec.id,
            timestamp: nowIso,
            read: false,
          });

          // 📲 학생 스마트폰으로 백그라운드 웹 푸시 발송
          sendPushToStudent(foundRec.studentId, {
            title: isFieldTrip
              ? '🎒 [등교 확인] 현장체험학습 보고서를 NEIS로 제출해주세요!'
              : '🏫 [등교 확인] 결석신고서 서류 양식을 챙겨주세요!',
            body: isFieldTrip
              ? `${foundRec.studentName} 학생, 등교를 환영해요! 현장체험학습은 7일 이내에 NEIS로 보고서를 제출해주세요.`
              : `${foundRec.studentName} 학생, 등교를 환영해요! 교실 앞 서류함에서 [${foundRec.typeName}] 양식을 1장 챙겨서 가방에 넣어두세요.`,
            url: '/',
          }).catch(() => {});
        }

        updated = await writeServerDb({ records: newRecords, notifications: newNotifs });
        break;
      }

      case 'APPROVE_RECORD': {
        const { recordId, verificationMethod, verificationNote } = body;
        const nowIso = new Date().toISOString();
        const foundRec = current.records.find((r) => r.id === recordId);
        const newRecords = current.records.map((r) => {
          if (r.id === recordId) {
            return {
              ...r,
              status: 'APPROVED' as const,
              approvedAt: nowIso,
              updatedAt: nowIso,
              verificationMethod,
              verificationNote,
            };
          }
          return r;
        });

        // 📲 학생 스마트폰으로 최종 승인 완료 축하 푸시 발송
        if (foundRec) {
          sendPushToStudent(foundRec.studentId, {
            title: '🎉 [최종 승인 완료] 결석신고서가 승인되었습니다!',
            body: `${foundRec.studentName} 학생의 [${foundRec.typeName}] 출결 서류가 담임선생님께 최종 승인 처리되었습니다.`,
            url: '/',
          }).catch(() => {});
        }

        updated = await writeServerDb({ records: newRecords });
        break;
      }

      case 'UPDATE_STUDENT_PIN': {
        const { studentId, pin } = body;
        const newStudents = current.students.map((s) => {
          if (s.id === studentId) {
            return { ...s, pin };
          }
          return s;
        });
        updated = await writeServerDb({ students: newStudents });
        break;
      }

      case 'STUDENT_LOGIN_PING': {
        const { studentId, lastLoginAt } = body;
        const nowIso = lastLoginAt || new Date().toISOString();
        const newStudents = current.students.map((s) => {
          if (s.id === studentId) {
            return { ...s, lastLoginAt: nowIso };
          }
          return s;
        });
        updated = await writeServerDb({ students: newStudents });
        break;
      }

      case 'VERIFY_TEACHER_PIN': {
        const { pin } = body;
        const serverPin = current.teacherPin || '1234';
        const isMatch = typeof pin === 'string' && pin.trim() === serverPin.trim();
        return NextResponse.json({
          success: true,
          authenticated: isMatch,
          error: isMatch ? null : '비밀번호가 일치하지 않습니다.',
        });
      }

      case 'SET_TEACHER_PIN': {
        const { currentPin, newPin, pin } = body;
        const targetPin = newPin || pin;
        const serverPin = current.teacherPin || '1234';

        if (currentPin && typeof currentPin === 'string') {
          if (currentPin.trim() !== serverPin.trim()) {
            return NextResponse.json(
              { success: false, error: '현재 비밀번호가 일치하지 않습니다.' },
              { status: 400 }
            );
          }
        }

        if (targetPin && typeof targetPin === 'string') {
          updated = await writeServerDb({ teacherPin: targetPin.trim() });
          return NextResponse.json({ success: true, message: '교사 비밀번호가 성공적으로 변경되었습니다.' });
        }
        break;
      }

      case 'CLEAR_ABSENCE_DATA': {
        updated = await writeServerDb({
          records: [],
          notifications: [],
        });
        break;
      }

      case 'WIPE_DATABASE': {
        updated = await writeServerDb({
          students: [],
          records: [],
          notifications: [],
        });
        break;
      }

      case 'LOAD_SAMPLE_DATA': {
        updated = await writeServerDb({
          students: SAMPLE_STUDENTS,
          records: SAMPLE_RECORDS,
          notifications: [],
        });
        break;
      }

      case 'SYNC_PUSH': {
        const patch: Record<string, unknown> = {};
        if (Array.isArray(body.records)) patch.records = body.records;
        if (Array.isArray(body.students)) patch.students = body.students;
        if (Array.isArray(body.notifications)) patch.notifications = body.notifications;
        if (typeof body.teacherPin === 'string') patch.teacherPin = body.teacherPin;
        updated = await writeServerDb(patch);
        break;
      }

      default:
        break;
    }

    const storageInfo = getStorageInfo();
    return NextResponse.json(
      { success: true, storageInfo, ...updated },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('API /api/sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
