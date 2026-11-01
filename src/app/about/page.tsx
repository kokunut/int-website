import type { Metadata } from 'next';
import { getAboutPage, getOrg } from '@/lib/data';

export const revalidate = 600;

export const metadata: Metadata = { title: '학생회 소개' };

export default async function AboutPage() {
  const [page, org] = await Promise.all([getAboutPage(), getOrg()]);
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
        <div className="org">
          {org.map((u) => (
            <div key={u.name} className="card box">
              <h3>{u.name}</h3>
              <p>{u.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* TODO(후속 이슈): 집행부 명단(직책·이름) 구획을 이 자리(조직도 아래)에 추가한다. 지금은 초안과 동일하게 조직도까지만 표시 */}
    </section>
  );
}
