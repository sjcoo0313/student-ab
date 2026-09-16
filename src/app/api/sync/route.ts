import { NextRequest, NextResponse } from 'next/server';
import { readServerDb, writeServerDb, getStorageInfo } from '@/lib/serverDb';
import { INITIAL_STUDENTS, INITIAL_RECORDS } from '@/lib/storage';
import { AbsenceRecord } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await readServerDb();
  const storageInfo = getStorageInfo();
  return NextResponse.json(
    { success: true, storageInfo, ...db },
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

      case 'BATCH_SYNC': {
        const patch: Record<string, unknown> = {};
        if (Array.isArray(body.records)) patch.records = body.records;
        if (Array.isArray(body.students)) patch.students = body.students;
        if (Array.isArray(body.notifications)) patch.notifications = body.notifications;
        if (typeof body.teacherPin === 'string') patch.teacherPin = body.teacherPin;
        if (body.reminderSettings && typeof body.reminderSettings === 'object') patch.reminderSettings = body.reminderSettings;
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
            };
          }
          return r;
        });

        const newNotifs = [...current.notifications];
        if (foundRec) {
          newNotifs.unshift({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'REMIND_ALERT',
            title: `🔔 [등교 확인] ${foundRec.studentName} 학생!`,
            message: `교실 앞 서류함에서 [${foundRec.typeName}] 결석신고서를 챙겨주세요!`,
            studentName: foundRec.studentName,
            grade: foundRec.grade,
            classNum: foundRec.classNum,
            studentNum: foundRec.studentNum,
            recordId: foundRec.id,
            timestamp: nowIso,
            read: false,
          });
        }

        updated = await writeServerDb({ records: newRecords, notifications: newNotifs });
        break;
      }

      case 'APPROVE_RECORD': {
        const { recordId, verificationMethod, verificationNote } = body;
        const nowIso = new Date().toISOString();
        const newRecords = current.records.map((r) => {
          if (r.id === recordId) {
            return {
              ...r,
              status: 'APPROVED' as const,
              approvedAt: nowIso,
              verificationMethod,
              verificationNote,
            };
          }
          return r;
        });
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

      case 'SET_TEACHER_PIN': {
        const { pin } = body;
        if (pin && typeof pin === 'string') {
          updated = await writeServerDb({ teacherPin: pin });
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
          students: INITIAL_STUDENTS,
          records: INITIAL_RECORDS,
          notifications: [],
        });
        break;
      }

      case 'SYNC_PUSH': {
        const patch: Record<string, unknown> = {};
        if (Array.isArray(body.records) && body.records.length > 0) patch.records = body.records;
        if (Array.isArray(body.students) && body.students.length > 0) patch.students = body.students;
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
