import type { Metadata } from 'next';
import { majorNames } from '@/content/council';
import { getAboutPage, getCouncilSummary, getOrg } from '@/lib/data';
import { PAGE_DESCRIPTIONS, pageMetadata } from '@/lib/seo';

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({ title: '학생회 소개', description: PAGE_DESCRIPTIONS.about, path: '/about' });

export default async function AboutPage() {
  const [page, org, summary] = await Promise.all([getAboutPage(), getOrg(), getCouncilSummary()]);
  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">소개</p>
        <h1>학생회 소개</h1>
        <p className="page-desc">{page.desc}</p>
      </div>
      <div className="split">
        <div className="card box">
          <h2>{page.greetingTitle}</h2>
          {page.greeting.map((t) => (
            <p key={t}>{t}</p>
          ))}
          <p className="mt-16 text-1">
            <b>{page.signer}</b>
          </p>
        </div>
        {page.photo ? (
          <div className="card about-photo-wrap">
            {/* 노션 등 외부 이미지 URL 이라 next/image 최적화 대상이 아니다 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="about-photo-img" src={page.photo.src} alt={page.photo.alt} />
          </div>
        ) : (
          <div className="placeholder card about-photo">단체 사진 자리</div>
        )}
      </div>
      <section className="section mt-56" aria-labelledby="org-title">
        <div className="sec-head">
          <h2 id="org-title">조직도</h2>
        </div>
        <div className="org org-grid">
          {org.map((u) => (
            <a key={u.id} href={`#unit-${u.id}`} className="card box org-link">
              <h3>{u.name}</h3>
              <p>{u.desc}</p>
              <p className="org-count">{u.members.length}명</p>
            </a>
          ))}
        </div>
      </section>
      <section className="section mt-56" aria-labelledby="roster-title">
        <div className="sec-head">
          <h2 id="roster-title">집행부</h2>
          <p className="text-1">총 {summary.total}명</p>
        </div>
        <div className="roster">
          {org.map((u) => (
            <article key={u.id} id={`unit-${u.id}`} className="card box roster-card" aria-labelledby={`roster-${u.id}`}>
              <h3 id={`roster-${u.id}`}>{u.name}</h3>
              <p>{u.desc}</p>
              <ul className="roster-list">
                {u.members.map((m, i) => (
                  <li key={`${m.name}-${i}`} className="roster-item">
                    <span className="roster-name">{m.name}</span>
                    {m.major && (
                      <span className="roster-major" title={majorNames[m.major]}>
                        {m.major}
                      </span>
                    )}
                    {m.role && <span className="badge">{m.role}</span>}
                    {m.lead && <span className="badge solid">부장</span>}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
