import { NextResponse, type NextRequest } from 'next/server';
import { allowedDbIdsFor, parseFileProxyParams, resolveFileUrl } from '@/lib/data/file-proxy';
import { FILE_REVALIDATE_SECONDS, fetchPage, queryDatabase } from '@/lib/data/notion';

/** 거절 이유는 노출하지 않는다 */
const notFound = (): NextResponse => new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

/** 노션 업로드 파일의 안정 경로: 새 서명 URL 을 받아 307 리다이렉트 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ pageId: string; field: string; index: string }> },
): Promise<NextResponse> {
  if (!process.env.NOTION_TOKEN) return notFound();
  const parsed = parseFileProxyParams(await ctx.params);
  if (!parsed) return notFound();
  const allowed = allowedDbIdsFor(parsed.field, process.env);
  if (allowed.length === 0) return notFound();
  try {
    // 목록 캐시(배너 로더와 동일 요청)에 없는 id 는 노션 호출 없이 404
    const url = await resolveFileUrl(parsed, allowed, { listPages: (id) => queryDatabase(id), fetchPage });
    if (!url) return notFound();
    const age = FILE_REVALIDATE_SECONDS;
    return NextResponse.redirect(url, {
      status: 307,
      headers: { 'Cache-Control': `public, max-age=${age}, s-maxage=${age}` },
    });
  } catch {
    return notFound();
  }
}
