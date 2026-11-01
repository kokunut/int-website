import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppLink from '@/components/AppLink';
import DetailSection from '@/components/DetailSection';
import Pager from '@/components/Pager';
import { getDepartment, getDepartments } from '@/lib/data';
import { departmentSections } from '@/lib/departments';

export const revalidate = 600;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const departments = await getDepartments();
  return departments.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDepartment((await params).id);
  return { title: d ? d.name : '소속 학과' };
}

export default async function DepartmentDetailPage({ params }: Props) {
  const { id } = await params;
  const [d, departments] = await Promise.all([getDepartment(id), getDepartments()]);
  if (!d) notFound();

  const show = departmentSections(d);
  const i = departments.findIndex((x) => x.id === d.id);
  const toItem = (x: typeof d) => ({ href: `/departments/${x.id}`, title: x.name });

  return (
    <section className="container page">
      <Link className="more back" href="/departments">
        ← 소속 학과
      </Link>
      <div className="detail">
        <div>
          <p className="crumb">인공지능융합대학{d.college ? ` · ${d.college}` : ''}</p>
          <h1 className="d-title">{d.name}</h1>
          <p className="d-lead">{d.intro}</p>
          {d.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="d-media d-photo" src={d.photo} alt={`${d.name} 대표 사진`} />
          )}
          {show.body && (
            <DetailSection title="학과 소개">
              <div className="d-body">
                {d.body.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
            </DetailSection>
          )}
          {show.curriculum && d.curriculum && (
            <DetailSection title="학년별 주요 교과">
              <div className="curri">
                {d.curriculum.map((c) => (
                  <div key={c.year}>
                    <b>{c.year}</b>
                    <div className="tags">
                      {c.subjects.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}
          {show.subjects && (
            <DetailSection title="대표 교과">
              <div className="tags">
                {d.subjects?.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </DetailSection>
          )}
          {show.careers && (
            <DetailSection title="졸업 후 진로">
              <div className="tags">
                {d.careers?.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </DetailSection>
          )}
        </div>
        <aside className="card box detail-aside">
          <h2>학과 정보</h2>
          <dl className="kv">
            <dt>학과사무실</dt>
            <dd>{d.office}</dd>
            <dt>전화</dt>
            <dd>{d.phone}</dd>
          </dl>
          <AppLink className="btn" href={d.url}>
            학과 홈페이지 ↗
          </AppLink>
          <p className="note mt-8">
            출처: <AppLink href={d.source}>세종대학교 홈페이지</AppLink>
          </p>
        </aside>
      </div>
      <Pager prev={departments[i - 1] && toItem(departments[i - 1])} next={departments[i + 1] && toItem(departments[i + 1])} />
    </section>
  );
}
