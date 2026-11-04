import type { CSSProperties } from 'react';
import { full, won } from '@/lib/date';
import type { Payback } from '@/lib/types';
import { EVENTS } from '@/lib/analytics';
import { PAYBACK_STATE_LABEL, paybackState } from '@/lib/payback';
import TrackedLink from './TrackedLink';

export default function PaybackCard({ payback: p, formUrl }: { payback: Payback; formUrl: string }) {
  const rate = p.budget > 0 ? Math.min(100, (p.paid / p.budget) * 100) : 0;
  const shown = rate.toFixed(1);
  const state = paybackState(Number(shown));
  const stateLabel = PAYBACK_STATE_LABEL[state];
  const remain = p.budget - p.paid;
  const valueText = `${shown}%, ${won(p.budget)} 중 ${won(p.paid)} 지급${stateLabel ? `, ${stateLabel}` : ''}`;
  return (
    <div className="card pb">
      <div>
        <p className="pb-label">예산 소진율</p>
        <div className="pb-rate">
          <span className="pb-num">{rate.toFixed(1)}</span>
          <span className="pb-unit">%</span>
        </div>
        <div
          className="meter"
          data-state={state}
          style={{ '--fill': `${rate}%` } as CSSProperties}
          role="meter"
          tabIndex={0}
          aria-valuenow={Number(shown)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={valueText}
          aria-label="예산 소진율"
        >
          <div className="bar">
            <i style={{ width: `${rate}%` }}></i>
          </div>
          <span className="meter-tip" aria-hidden="true">
            지급 {won(p.paid)} · 남은 {won(remain)}
          </span>
        </div>
        {stateLabel && <p className="pb-state">{stateLabel}</p>}
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
          <dd>{won(remain)}</dd>
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
        <TrackedLink className="btn" href={formUrl} event={EVENTS.paybackApply}>
          신청하기 ↗
        </TrackedLink>
        <p className="note">{full(p.updatedAt)} 기준</p>
      </div>
    </div>
  );
}
