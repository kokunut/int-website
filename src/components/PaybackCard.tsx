import { full, won } from '@/lib/date';
import type { Payback } from '@/lib/types';
import AppLink from './AppLink';

export default function PaybackCard({ payback: p, formUrl }: { payback: Payback; formUrl: string }) {
  const rate = p.budget > 0 ? Math.min(100, (p.paid / p.budget) * 100) : 0;
  return (
    <div className="card pb">
      <div>
        <p className="pb-label">예산 소진율</p>
        <div className="pb-rate">
          <span className="pb-num">{rate.toFixed(1)}</span>
          <span className="pb-unit">%</span>
        </div>
        <div
          className="bar"
          role="progressbar"
          aria-valuenow={Number(rate.toFixed(1))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="예산 소진율"
        >
          <i style={{ width: `${rate}%` }}></i>
        </div>
        <div className="pb-scale">
          <span>0원</span>
          <span>총 예산 {won(p.budget)}</span>
        </div>
      </div>
      <dl className="pb-stats">
        <div>
          <dt>지급 완료</dt>
          <dd>{won(p.paid)}</dd>
          <dd className="pb-sub">{p.recipients}명</dd>
        </div>
        <div>
          <dt>남은 예산</dt>
          <dd>{won(p.budget - p.paid)}</dd>
          <dd className="pb-sub">소진 시 조기 마감</dd>
        </div>
        <div>
          <dt>신청 기간</dt>
          <dd>{p.applyPeriod}</dd>
        </div>
        <div>
          <dt>다음 지급일</dt>
          <dd>{full(p.nextPayDate)}</dd>
        </div>
      </dl>
      <div className="pb-cta">
        <AppLink className="btn" href={formUrl}>
          신청하기 ↗
        </AppLink>
        <p className="note">{full(p.updatedAt)} 기준</p>
      </div>
    </div>
  );
}
