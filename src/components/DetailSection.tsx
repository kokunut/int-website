import type { ReactNode } from 'react';

/** 상세 페이지 공통 구획 (초안 dsec) */
export default function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="d-sec">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
