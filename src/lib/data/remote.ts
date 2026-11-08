/** 노션 외 원격 소스(구글 캘린더 iCal, 구글 시트 CSV) 가져오기 */
import type { AcademicEvent, Payback, Rental } from '../types';
import { mapPayback, mapRental, parseCsv } from './csv';
import { parseIcs } from './ics';
import { REMOTE_TAG, REVALIDATE_SECONDS } from './notion';

async function fetchText(url: string, label: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: REVALIDATE_SECONDS, tags: [REMOTE_TAG] },
  });
  if (!res.ok) throw new Error(`${label} ${res.status}`);
  return res.text();
}

export async function fetchAcademic(url: string): Promise<AcademicEvent[]> {
  return parseIcs(await fetchText(url, 'ACADEMIC_ICS_URL'));
}

/** 형식이 맞지 않으면 throw -> 목 데이터 폴백 */
export async function fetchPayback(url: string): Promise<Payback> {
  const p = mapPayback(parseCsv(await fetchText(url, 'PAYBACK_CSV_URL')));
  if (!p) throw new Error('PAYBACK_CSV_URL 형식 오류');
  return p;
}

/** 형식이 맞지 않으면 throw -> 목 데이터 폴백 */
export async function fetchRental(url: string): Promise<Rental> {
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const r = mapRental(parseCsv(await fetchText(url, 'RENTAL_CSV_URL')), today);
  if (!r) throw new Error('RENTAL_CSV_URL 형식 오류');
  return r;
}
