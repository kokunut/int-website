import type { Metadata } from 'next';
import Link from 'next/link';
import { getDepartments, getDepartmentsPage } from '@/lib/data';

export const revalidate = 600;

export const metadata: Metadata = { title: '소속 학과' };

export default async function DepartmentsPage() {
  const [departments, page] = await Promise.all([getDepartments(), getDepartmentsPage()]);
  return (
    <section className="container page">
      <div className="page-head">
        <p className="crumb">소개</p>
        <h1>소속 학과</h1>
        <p className="page-desc">{page.desc}</p>
      </div>
      <div className="grid-cards">
        {departments.map((d) => (
          <Link key={d.id} className="card box hover-card" href={`/departments/${d.id}`}>
            <h2>{d.name}</h2>
            <p>{d.intro}</p>
            <div className="tags">
              {d.subjects.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
            <dl className="kv">
              <dt>진로</dt>
              <dd>{d.career}</dd>
              <dt>학과사무실</dt>
              <dd>{d.office}</dd>
            </dl>
            <span className="more more-inline">자세히 →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
