# 03. 결정 기록 (ADR)

형식: `## ADR-번호 제목` / 날짜 / 상태(채택·대체됨) / 결정 / 이유

## ADR-001 Next.js(App Router) + Vercel
- 2026-11-01 · 채택
- 결정: 초안 README의 추천 방향을 따른다.
- 이유: ISR로 노션·구글 데이터를 키 노출 없이 읽을 수 있고 무료 배포 가능.

## ADR-002 스타일은 일반 CSS로 초안 이식
- 2026-11-01 · 채택
- 결정: Tailwind 등 도입 없이 초안 CSS를 `globals.css`로 옮기고 클래스명 유지.
- 이유: 디자인 손실 없이 빠르게 이식, 다음 집행부가 색상 변수만 바꿔도 됨.

## ADR-003 데이터 레이어 + 목 데이터 폴백
- 2026-11-01 · 채택
- 결정: 페이지는 `src/lib/data`만 호출. 외부 연동 환경변수가 없거나 실패하면 `src/content` 목 데이터 사용.
- 이유: 연동 전에도 사이트 완성, 외부 API 장애 시에도 사이트 유지.

## ADR-004 "오늘"은 KST 기준
- 2026-11-01 · 채택
- 결정: 서버·클라이언트 모두 `Asia/Seoul` 기준 날짜로 판정.
- 이유: Vercel 서버는 UTC라 자정~오전 9시에 날짜가 하루 밀림.

## ADR-005 작업 브랜치 운용
- 2026-11-01 · 채택
- 결정: 클라우드 세션은 지정 브랜치 하나를 쓴다. PR squash 머지 후 브랜치를 리셋(force push)하지 않고 `origin/main`을 merge해 동기화한 뒤 다음 이슈를 진행한다.
- 이유: 세션은 지정 브랜치에만 push 가능. 이슈별 PR 단위는 유지.

## ADR-006 "오늘" 의존 UI는 클라이언트에서 재확인
- 2026-11-01 · 채택
- 결정: 서버가 계산한 `today`를 초기값으로 렌더하고, 캘린더·팝업은 마운트 후 `todayKST()`로 다시 판정한다.
- 이유: ISR은 오래 방치되면 첫 요청에 이전 페이지를 내보내므로(stale-while-revalidate) 날짜가 하루 이상 지날 수 있음.

## ADR-007 편집 가능한 문구는 페이지 코드가 아닌 콘텐츠로
- 2026-11-01 · 채택
- 결정: 문단 단위 문구(인사말, 신청 절차, 유의사항 등)는 `src/content/pages.ts` → 데이터 레이어 getter로 제공. 페이지에는 짧은 UI 라벨만 둔다.
- 이유: 다음 집행부가 페이지 코드를 몰라도 수정 가능, 이후 노션 연동 대상으로 옮기기 쉬움.

## ADR-008 콘텐츠 연동: 서비스 계정 없이 게시 CSV·iCal + 노션 fetch
- 2026-11-01 · 채택
- 결정: 구글은 서비스 계정/API 없이 시트 `요약` 탭의 "웹에 게시" CSV와 캘린더 iCal URL만 읽는다. 노션은 SDK 없이 `fetch`로 호출하고 `Notion-Version: 2022-06-28`을 고정한다. 소스별로 환경변수가 없거나 실패하면 목 데이터로 폴백한다. 즉시 갱신은 `POST /api/revalidate`(비밀 헤더).
- 이유: 비밀키·권한 설정이 줄어 다음 집행부 인수인계가 쉽고, 의존성이 없으며, 노출 범위가 게시한 집계 탭으로 제한됨. 한계: iCal 반복 일정 미지원.

## ADR-009 웹폰트 자체 호스팅 (Pretendard 가변 dynamic-subset)
- 2026-11-01 · 채택
- 결정: CDN `<link>` 대신 `pretendard`(1.3.9) npm 패키지의 `pretendardvariable-dynamic-subset.css`를 `layout.tsx`에서 import해 번들에 포함한다. `font-family`는 `'Pretendard Variable', Pretendard, …`. 폰트 CSS는 `font-display: swap`.
- 이유: 외부 CSS가 렌더링을 약 950ms 차단했고 외부 도메인 의존이 생김. dynamic-subset은 화면에 쓰인 글자 조각만 받아 전송량이 작음.

## ADR-010 팝업 SSR + 첫 페인트 전 숨김
- 2026-11-01 · 채택
- 결정: 메인 팝업은 서버(`page.tsx`, `todayKST()` 기준)에서 후보를 골라 초기 HTML에 포함한다. "보지 않기"는 팝업 앞의 인라인 스크립트(`popupHideScript`)가 `localStorage`와 KST 오늘 날짜를 비교해 `<html data-popup-hidden>`을 표시하고, CSS(`html[data-popup-hidden] .modal{display:none}`)가 첫 페인트 전에 숨긴다. 클라이언트 컴포넌트는 하이드레이션 후 기존 로직으로 재판정하며(ADR-006) 서버와 다르면 클라이언트가 우선한다. 초기 상태는 localStorage를 쓰지 않아 하이드레이션 경고가 없다. `requestIdleCallback` 지연은 제거.
- 이유: 마운트 후에 그리면 팝업 본문이 LCP가 되어 늦어지고, 유휴 지연은 오히려 더 늦춤. 스크립트의 규칙은 `isSuppressed`와 같으며 단위 테스트로 고정.

## ADR-011 방문 통계: Vercel Analytics·Speed Insights, Vercel 빌드에서만 렌더
- 2026-11-01 · 채택
- 결정: `@vercel/analytics`, `@vercel/speed-insights`를 쓰고 `layout.tsx`(서버 컴포넌트)에서 `isVercel()`(`process.env.VERCEL === "1"`)일 때만 `<Analytics />`, `<SpeedInsights />`를 렌더한다. 커스텀 이벤트(`popup_detail`, `payback_apply`, `kakao_fab`)는 `src/lib/analytics.ts`의 `EVENTS`로 상수화하고, 클라이언트에서는 `next.config.ts`가 주입한 `NEXT_PUBLIC_VERCEL`이 `1`일 때만 전송한다(그 외 no-op).
- 이유: 무료이고 쿠키·개인 식별 정보가 없다. Vercel 밖(로컬 `next start`, CI)에서는 `/_vercel/insights/script.js`가 404여서 E2E 콘솔 에러 검사와 Lighthouse 권장사항이 실패한다. 한계: 커스텀 이벤트는 유료 플랜 기능일 수 있어 무료 플랜에서는 페이지뷰만 보일 수 있음(확인 필요).
