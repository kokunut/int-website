import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NotionBlocks, { linesToBlocks } from '@/components/NotionBlocks';
import Pager from '@/components/Pager';
import { getNotice, getNotices } from '@/lib/data';
import CardSlider from '@/components/CardSlider';
import { isCardNews, ogImageUrl } from '@/lib/cardnews';
import { full } from '@/lib/date';
import { blocksText, detailDescription, pageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 600;

type Props = { params: Promise<{ id: string }> };

/** 양의 정수 문자열만 허용 (아니면 null) */
const parseId = (raw: string): number | null => (/^\d+$/.test(raw) ? Number(raw) : null);

export async function generateStaticParams() {
  const notices = await getNotices();
  return notices.map((n) => ({ id: String(n.id) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  const notice = id === null ? undefined : await getNotice(id);
  if (!notice) return { title: '공지사항' };
  const og = ogImageUrl(notice.cards?.[0], absoluteUrl);
  return pageMetadata({
    title: notice.title,
    description: detailDescription(notice.body.join(' ') || blocksText(notice.blocks), `${notice.title} - 세종대학교 인공지능융합대학 학생회 인트의 공지사항입니다.`),
    path: `/notice/${notice.id}`,
    // 카드뉴스 공지는 첫 장을 공유 이미지로, 나머지는 기본 공유 이미지(opengraph-image)
    ...(og ? { image: { url: og, width: 1080, height: 1350 } } : {}),
  });
}

export default async function NoticeDetailPage({ params }: Props) {
  const id = parseId((await params).id);
  if (id === null) notFound();
  const [notice, notices] = await Promise.all([getNotice(id), getNotices()]);
  if (!notice) notFound();

  const i = notices.findIndex((x) => x.id === notice.id);
  const newer = notices[i - 1];
  const older = notices[i + 1];
  const toItem = (n: typeof notice) => ({ href: `/notice/${n.id}`, title: n.title });

  return (
    <section className="container page">
      <div className="article">
        <Link className="more" href="/notice">
          ← 공지사항 목록
        </Link>
        <p className="mt-24">
          <span className="badge">{isCardNews(notice) ? '카드뉴스' : notice.type}</span>
        </p>
        <h1>{notice.title}</h1>
        <p className="meta">{full(notice.date)} 작성</p>
        {notice.event && (
          <div className="callout">
            <i className="mk mk-event"></i>
            <b>
              일정 {full(notice.event.start)}
              {notice.event.end !== notice.event.start ? ` ~ ${full(notice.event.end)}` : ''}
            </b>
            <span className="text-2">캘린더에 함께 표시돼요</span>
            <Link className="link-btn ml-auto" href={`/calendar?date=${notice.event.start}`}>
              캘린더 보기
            </Link>
          </div>
        )}
        {notice.cards && notice.cards.length > 0 && (
          <CardSlider title={notice.title} images={notice.cards} instagram={notice.instagram} />
        )}
        <NotionBlocks blocks={notice.blocks ?? linesToBlocks(notice.body)} />
        <Pager prev={newer && toItem(newer)} next={older && toItem(older)} labels={['최신 글', '이전 글']} />
      </div>
    </section>
  );
}
