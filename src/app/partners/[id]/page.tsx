import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppLink from '@/components/AppLink';
import DetailSection from '@/components/DetailSection';
import Pager from '@/components/Pager';
import { getPartner, getPartners, getPartnersPage } from '@/lib/data';
import { partnerMapUrl } from '@/lib/partners';

export const revalidate = 600;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const partners = await getPartners();
  return partners.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPartner((await params).id);
  return { title: p ? p.name : '제휴' };
}

export default async function PartnerDetailPage({ params }: Props) {
  const { id } = await params;
  const [p, partners, page] = await Promise.all([getPartner(id), getPartners(), getPartnersPage()]);
  if (!p) notFound();

  const details = p.details.length > 0 ? p.details : [p.benefit];
  const i = partners.findIndex((x) => x.id === p.id);
  const toItem = (x: typeof p) => ({ href: `/partners/${x.id}`, title: x.name });

  return (
    <section className="container page">
      <Link className="more back" href="/partners">
        ← 제휴 목록
      </Link>
      <div className="detail">
        <div>
          <div className="placeholder d-media ratio-16-9">매장 사진 자리</div>
          <p className="mt-28">
            <span className="badge">{p.cat}</span>
          </p>
          <h1 className="d-title">{p.name}</h1>
          <p className="d-lead">
            <b>{p.benefit}</b>
          </p>
          <DetailSection title="혜택 내용">
            <ul className="bullets">
              {details.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </DetailSection>
          <DetailSection title="이용 방법">
            <ol className="steps">
              {page.howTo.map((st) => (
                <li key={st.title}>
                  <b>{st.title}</b>
                  <span>{st.source ? p[st.source] : st.desc}</span>
                </li>
              ))}
            </ol>
          </DetailSection>
          <DetailSection title="위치">
            <div className="placeholder map-box ratio-16-7">지도 자리 (네이버·카카오 지도 임베드)</div>
            <p className="note mt-8">{p.address}</p>
          </DetailSection>
        </div>
        <aside className="card box detail-aside">
          <h2>제휴 정보</h2>
          <dl className="kv">
            <dt>혜택</dt>
            <dd>{p.benefit}</dd>
            <dt>위치</dt>
            <dd>{p.place}</dd>
            <dt>영업시간</dt>
            <dd>{p.hours}</dd>
            <dt>제휴 기간</dt>
            <dd>{p.period}</dd>
            <dt>이용 조건</dt>
            <dd>{p.condition}</dd>
          </dl>
          <AppLink className="btn ghost" href={partnerMapUrl(p)}>
            지도에서 보기 ↗
          </AppLink>
        </aside>
      </div>
      <Pager prev={partners[i - 1] && toItem(partners[i - 1])} next={partners[i + 1] && toItem(partners[i + 1])} />
    </section>
  );
}
