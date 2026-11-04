import type { Metadata } from 'next';
import Link from 'next/link';
import AppLink from '@/components/AppLink';
import ContestList from '@/components/ContestList';
import { getContests } from '@/lib/data';
import { contestStatus, dday, full } from '@/lib/date';
import { PAGE_DESCRIPTIONS, pageMetadata } from '@/lib/seo';

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({ title: '공모전', description: PAGE_DESCRIPTIONS.contest, path: '/contest' });

export default async function ContestPage() {
  const contests = await getContests();
  const live = contests.filter((c) => contestStatus(c) !== '마감');
  const past = contests.filter((c) => contestStatus(c) === '마감');

  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">소식</p>
        <h1>공모전</h1>
        <p className="page-desc">인트 학생회가 주최하는 공모전입니다.</p>
      </div>
      {live.length === 0 && <p className="empty">현재 진행 중인 공모전이 없어요</p>}
      {live.map((c) => {
        const dd = dday(c.end);
        return (
          <div className="card contest-hero" key={c.id}>
            <div className="placeholder hero-img">
              공모전 포스터 자리
            </div>
            <div className="box">
              <span className="badge solid">{contestStatus(c)}</span>
              <h2 className="hero-title">
                <Link href={`/contest/${c.id}`}>{c.title}</Link>
              </h2>
              <p>{c.desc}</p>
              <dl className="kv">
                <dt>접수 기간</dt>
                <dd>
                  {full(c.start)} ~ {full(c.end)}
                </dd>
                <dt>마감까지</dt>
                <dd>{dd >= 0 ? (dd === 0 ? 'D-DAY' : `D-${dd}`) : '-'}</dd>
              </dl>
              <div className="btn-row">
                <Link className="btn" href={`/contest/${c.id}`}>
                  자세히 보기<span className="sr-only"> · {c.title}</span>
                </Link>
                {c.applyUrl && (
                  <AppLink className="btn ghost" href={c.applyUrl}>
                    참가 신청 ↗
                  </AppLink>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div className="section mt-56">
        <div className="sec-head">
          <h2>지난 공모전</h2>
        </div>
        <ContestList items={past} emptyText="지난 공모전이 없어요" />
      </div>
    </section>
  );
}
