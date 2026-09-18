import { NextRequest, NextResponse } from 'next/server';
import { sendPushToStudent, sendPushToMultipleStudents, sendPushToTeacher } from '@/lib/pushServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, studentId, studentIds, payload } = body;

    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json({ success: false, error: 'Payload missing' }, { status: 400 });
    }

    let count = 0;

    if (target === 'STUDENT' && studentId) {
      count = await sendPushToStudent(studentId, payload);
    } else if (target === 'MULTIPLE_STUDENTS' && Array.isArray(studentIds)) {
      count = await sendPushToMultipleStudents(studentIds, payload);
    } else if (target === 'TEACHER') {
      count = await sendPushToTeacher(payload);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid target' }, { status: 400 });
    }

    return NextResponse.json({ success: true, count });
  } catch (err) {
    console.error('POST /api/push/send error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
