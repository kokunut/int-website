import type { Rental } from '@/lib/types';

/** 메인 공지사항 오른쪽 — 대여사업 물품별 남은 수량 */
export default function RentalStatus({ rental }: { rental: Rental }) {
  return (
    <div className="card rental">
      <ul className="rental-list">
        {rental.items.map((it) => {
          const left = it.total - it.out;
          return (
            <li key={it.name} className={left === 0 ? 'none' : undefined}>
              <span className="rental-name">{it.name}</span>
              <span className="rental-bar" aria-hidden="true">
                <i style={{ width: `${it.total ? (left / it.total) * 100 : 0}%` }}></i>
              </span>
              <span className="rental-left">
                {left === 0 ? '대여 중' : <><b>{left}</b> / {it.total}</>}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="rental-foot">
        학생회실(학생회관 405호) · 학기 중 평일
        <br />
        대여 기간 3일 · 소모품은 장부 없이 가져가요
      </p>
    </div>
  );
}
