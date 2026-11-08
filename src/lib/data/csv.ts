/** RFC 4180 CSV 파서 + 페이백 집계 매핑 */
import type { DateString, Payback, Rental, RentalItem } from '../types';

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuote = false;
      } else field += ch;
    } else if (ch === '"') inQuote = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** 시트에서 읽는 키 (이 키 외의 행·열은 무시한다) */
export const PAYBACK_KEYS = {
  budget: '총예산',
  paid: '지급액',
  recipients: '지급인원',
  applyPeriod: '신청기간',
  nextPayDate: '다음지급일',
  updatedAt: '갱신일',
} as const;

/** `1,000원`, ` 500000 ` -> 숫자. 음수·소수·문자 섞임은 null */
function toCount(s: string | undefined): number | null {
  if (!s) return null;
  const t = s.replace(/[,\s]/g, '').replace(/원$/, '');
  return /^\d+$/.test(t) ? Number(t) : null;
}

/** `2026-11-14`, `2026.11.14`, `2026/11/14` -> `2026-11-14` (실제 존재하는 날짜만) */
function toDate(s: string | undefined): DateString | null {
  const m = s ? /^(\d{4})[-./]\s*(\d{1,2})[-./]\s*(\d{1,2})\.?$/.exec(s.trim()) : null;
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${m[1]}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** 2열(키, 값) 표 -> Payback. 하나라도 잘못되면 null (목 데이터로 폴백) */
export function mapPayback(rows: string[][]): Payback | null {
  const kv = new Map<string, string>();
  for (const r of rows) {
    const key = r[0]?.trim();
    if (key && !kv.has(key)) kv.set(key, (r[1] ?? '').trim());
  }
  const budget = toCount(kv.get(PAYBACK_KEYS.budget));
  const paid = toCount(kv.get(PAYBACK_KEYS.paid));
  const recipients = toCount(kv.get(PAYBACK_KEYS.recipients));
  const applyPeriod = kv.get(PAYBACK_KEYS.applyPeriod);
  const nextPayDate = toDate(kv.get(PAYBACK_KEYS.nextPayDate));
  const updatedAt = toDate(kv.get(PAYBACK_KEYS.updatedAt));
  if (budget === null || paid === null || recipients === null || !applyPeriod || !nextPayDate || !updatedAt) {
    console.warn('[data] PAYBACK_CSV_URL 형식 오류: 총예산/지급액/지급인원/신청기간/다음지급일/갱신일 확인');
    return null;
  }
  return { budget, paid, recipients, applyPeriod, nextPayDate, updatedAt };
}

/** 대여 현황 시트: 머리행에 `물품`, `총수량`, `대여중` 열. 갱신일 열(선택)은 첫 값만 쓴다 */
export function mapRental(rows: string[][], today: DateString): Rental | null {
  const head = rows[0]?.map((h) => h.trim());
  if (!head) return null;
  const [ni, ti, oi, ui] = ['물품', '총수량', '대여중', '갱신일'].map((k) => head.indexOf(k));
  if (ni < 0 || ti < 0 || oi < 0) return null;
  const items: RentalItem[] = [];
  let updatedAt: DateString | null = null;
  for (const r of rows.slice(1)) {
    const name = r[ni]?.trim();
    const total = toCount(r[ti]);
    const out = toCount(r[oi]);
    if (ui >= 0 && !updatedAt) updatedAt = toDate(r[ui]);
    if (!name || total === null || out === null) continue;
    items.push({ name, total, out: Math.min(out, total) });
  }
  return items.length ? { items, updatedAt: updatedAt ?? today } : null;
}
