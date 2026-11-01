import type { Metadata } from 'next';
import Link from 'next/link';
import AppLink from '@/components/AppLink';
import { getDepartments, getDepartmentsPage } from '@/lib/data';

const SOURCE_HOME = 'https://www.sejong.ac.kr/kor/college/college-of-software-convergence.do';

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
            {d.college && <p className="note">{d.college}</p>}
            <h2>{d.name}</h2>
            <p>{d.intro}</p>
            {d.subjects && d.subjects.length > 0 && (
              <div className="tags">
                {d.subjects.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            )}
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
      <p className="note mt-16">
        출처: <AppLink href={SOURCE_HOME}>세종대학교 홈페이지</AppLink>. 학생회 확인 전 정보는 (확인 필요)로 표시했습니다.
      </p>
    </section>
  );
}
