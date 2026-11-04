/** 앞뒤 공백과 탭·개행을 제거한다. 브라우저가 URL 에서 탭·개행을 지우므로 검사 전에 먼저 지워야 한다 */
export const cleanUrlText = (v: string | null | undefined): string => (v ?? '').trim().replace(/[\t\n\r]/g, '');

/** 사이트 내부 경로 판정: `/` 한 개로 시작(`//host`, `/\host` 는 외부 사이트로 해석되므로 제외). 입력은 `cleanUrlText` 를 거친 값 */
export const isInternalPath = (s: string): boolean => /^\/(?![/\\])/.test(s);
