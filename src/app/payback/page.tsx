import type { Metadata } from 'next';
import PaybackCard from '@/components/PaybackCard';
import { getPayback, getPaybackPage, getSiteLinks } from '@/lib/data';

export const revalidate = 600;

export const metadata: Metadata = { title: '검정비 페이백' };

export default async function PaybackPage() {
  const [payback, page, links] = await Promise.all([getPayback(), getPaybackPage(), getSiteLinks()]);
  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">복지</p>
        <h1>검정비 페이백</h1>
        <p className="page-desc">{page.desc}</p>
      </div>
      <PaybackCard payback={payback} formUrl={links.paybackForm} />
      <section className="section mt-56" aria-labelledby="steps-title">
        <div className="sec-head">
          <h2 id="steps-title">신청 절차</h2>
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
      <div className="section split mt-56">
        <div className="card box">
          <h2>지원 대상</h2>
          <ul className="bullets mt-12">
            {page.eligibility.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="card box">
          <h2>유의사항</h2>
          <ul className="bullets mt-12">
            {page.notes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
