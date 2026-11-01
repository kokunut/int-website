import type { Metadata } from 'next';
import AppLink from '@/components/AppLink';
import { getSiteLinks, getSuggestAnswers, getSuggestPage } from '@/lib/data';
import { full } from '@/lib/date';

export const revalidate = 600;

export const metadata: Metadata = { title: '건의함' };

export default async function SuggestPage() {
  const [links, answers, page] = await Promise.all([getSiteLinks(), getSuggestAnswers(), getSuggestPage()]);
  const sorted = [...answers].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">복지</p>
        <h1>건의함</h1>
        <p className="page-desc">{page.desc}</p>
      </div>
      <div className="card box cta-card">
        <div>
          <h2>{page.ctaTitle}</h2>
          <p>{page.ctaDesc}</p>
        </div>
        <AppLink className="btn" href={links.suggestForm}>
          건의 작성 ↗
        </AppLink>
      </div>
      <section className="section mt-56" aria-labelledby="proc-title">
        <div className="sec-head">
          <h2 id="proc-title">처리 절차</h2>
        </div>
        <ol className="steps">
          {page.steps.map((st) => (
            <li key={st.title}>
              <b>{st.title}</b>
              <span>{st.desc}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="section faq mt-56" aria-labelledby="ans-title">
        <div className="sec-head">
          <h2 id="ans-title">최근 답변</h2>
        </div>
        {sorted.length === 0 ? (
          <p className="note">아직 공개된 답변이 없어요</p>
        ) : (
          sorted.map((a) => (
            <details key={`${a.date}-${a.title}`}>
              <summary>
                {a.title}
                <span className="note">{full(a.date)}</span>
              </summary>
              <div className="a">{a.answer}</div>
            </details>
          ))
        )}
      </section>
    </section>
  );
}
