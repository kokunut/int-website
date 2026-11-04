import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppLink, { isPlaceholderHref } from '@/components/AppLink';
import JsonLd from '@/components/JsonLd';
import Pager from '@/components/Pager';
import { getContest, getContests } from '@/lib/data';
import { contestStatus, dday, full } from '@/lib/date';
import { contestJsonLd, detailDescription, pageMetadata } from '@/lib/seo';
import type { ReactNode } from 'react';

export const revalidate = 600;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const contests = await getContests();
  return contests.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const contest = await getContest((await params).id);
  if (!contest) return { title: '공모전' };
  return pageMetadata({
    title: contest.title,
    description: detailDescription(contest.desc, `${contest.title} - 세종대학교 인공지능융합대학 학생회 인트의 공모전입니다.`),
    path: `/contest/${contest.id}`,
  });
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="d-sec">
    <h2>{title}</h2>
    {children}
  </section>
);

function ddayText(end: string): string {
  const d = dday(end);
  return d < 0 ? '마감' : d === 0 ? 'D-DAY' : `D-${d}`;
}

export default async function ContestDetailPage({ params }: Props) {
  const { id } = await params;
  const [c, contests] = await Promise.all([getContest(id), getContests()]);
  if (!c) notFound();

  const s = contestStatus(c);
  const closed = s === '마감';
  const i = contests.findIndex((x) => x.id === c.id);
  const toItem = (x: typeof c) => ({ href: `/contest/${x.id}`, title: x.title });

  return (
    <section className="container page">
      <JsonLd data={contestJsonLd(c)} />
      <Link className="more back" href="/contest">
        ← 공모전 목록
      </Link>
      <div className="detail">
        <div>
          <div className="placeholder d-media d-media-poster">
            공모전 포스터 자리
          </div>
          <p className="mt-28">
            <span className={`badge${s === '진행중' ? ' solid' : ''}`}>{s}</span>
          </p>
          <h1 className="d-title">{c.title}</h1>
          <p className="d-lead">{c.desc}</p>
          {c.result && (
            <div className="callout">
              <b>결과</b>
              <span className="text-2">{c.result}</span>
            </div>
          )}
          {c.schedule && (
            <Section title="일정">
              <ul className="timeline">
                {c.schedule.map((r) => (
                  <li key={r.label}>
                    <b>{r.label}</b>
                    <span>{r.value}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {c.prizes && (
            <Section title="시상">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">구분</th>
                    <th scope="col">인원</th>
                    <th scope="col">상금</th>
                  </tr>
                </thead>
                <tbody>
                  {c.prizes.map((r) => (
                    <tr key={r.rank}>
                      <td>{r.rank}</td>
                      <td>{r.count}</td>
                      <td>{r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}
          {c.howTo && (
            <Section title="참가 방법">
              <ol className="steps">
                {c.howTo.map((h) => (
                  <li key={h.title}>
                    <b>{h.title}</b>
                    <span>{h.desc}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}
          {c.notes && (
            <Section title="유의사항">
              <ul className="bullets">
                {c.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Section>
          )}
        </div>
        <aside className="card box detail-aside">
          <p className="d-dday">{closed ? '마감' : ddayText(c.end)}</p>
          <dl className="kv">
            <dt>접수 기간</dt>
            <dd>
              {full(c.start)} ~ {full(c.end)}
            </dd>
            <dt>대상</dt>
            <dd>{c.target || '-'}</dd>
            <dt>시상</dt>
            <dd>{c.prize || '-'}</dd>
            <dt>문의</dt>
            <dd>{c.contact || '-'}</dd>
          </dl>
          {closed ? (
            <span className="btn" aria-disabled="true">
              접수 마감
            </span>
          ) : isPlaceholderHref(c.applyUrl) ? (
            <span className="btn" aria-disabled="true">
              참가 신청 준비 중
            </span>
          ) : (
            <AppLink className="btn" href={c.applyUrl as string}>
              참가 신청 ↗
            </AppLink>
          )}
          {c.guideUrl && !isPlaceholderHref(c.guideUrl) && (
            <AppLink className="btn ghost" href={c.guideUrl}>
              공모 요강 다운로드
            </AppLink>
          )}
        </aside>
      </div>
      <Pager prev={contests[i - 1] && toItem(contests[i - 1])} next={contests[i + 1] && toItem(contests[i + 1])} />
    </section>
  );
}
