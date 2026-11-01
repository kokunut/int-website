'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ALL_CATEGORY, filterPartners, partnerCategories } from '@/lib/partners';
import type { ResolvedPartner } from '@/lib/types';

/** 제휴 목록 + 분류 필터 (데이터는 서버에서 props 로 전달) */
export default function PartnerBrowser({ partners }: { partners: ResolvedPartner[] }) {
  const [category, setCategory] = useState(ALL_CATEGORY);
  const categories = partnerCategories(partners);
  const shown = filterPartners(partners, category);

  return (
    <>
      <div className="tabs" role="group" aria-label="제휴 분류">
        {categories.map((c) => (
          <button key={c} type="button" className={category === c ? 'on' : undefined} aria-pressed={category === c} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="note" role="status">
          제휴 매장이 없어요
        </p>
      ) : (
        <div className="grid-cards">
          {shown.map((p) => (
            <Link key={p.id} className="card hover-card card-flush" href={`/partners/${p.id}`}>
              <div className="placeholder ratio-16-9">매장 사진</div>
              <div className="partner-body">
                <span className="badge">{p.cat}</span>
                <h3>{p.name}</h3>
                <p className="benefit">{p.benefit}</p>
                <p className="place">{p.place}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
