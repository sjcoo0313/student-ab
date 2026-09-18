import { NextRequest, NextResponse } from 'next/server';
import { getVapidPublicKey, savePushSubscription, removePushSubscription } from '@/lib/pushServer';
import { PushSubscriptionItem } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({
    success: true,
    publicKey,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: PushSubscriptionItem = await req.json();

    if (!body || !body.subscription || !body.subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 구독 정보입니다.' },
        { status: 400 }
      );
    }

    const ok = await savePushSubscription(body);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('POST /api/push/subscribe error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ success: false, error: 'Endpoint missing' }, { status: 400 });
    }
    const ok = await removePushSubscription(endpoint);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error('DELETE /api/push/subscribe error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
