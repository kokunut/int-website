import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { REMOTE_TAG } from '@/lib/data/notion';

export const dynamic = 'force-dynamic';

/** 길이가 달라도 시간 차이가 새지 않도록 SHA-256 으로 맞춘 뒤 비교 */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** 콘텐츠 즉시 갱신: POST + `x-revalidate-secret` 헤더 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: 'REVALIDATE_SECRET 미설정' }, { status: 500 });
  const given = req.headers.get('x-revalidate-secret') ?? '';
  if (!safeEqual(given, secret)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  // expire 0: 오래된 캐시를 내보내지 않고 다음 방문에서 바로 새로 가져온다
  revalidateTag(REMOTE_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}

export function GET(): NextResponse {
  return NextResponse.json({ ok: false, error: 'method not allowed' }, { status: 405, headers: { Allow: 'POST' } });
}
