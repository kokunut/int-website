# 01. 기술 설계

## 스택
| 항목 | 선택 | 이유 |
| --- | --- | --- |
| 프레임워크 | Next.js (App Router) + TypeScript | ISR로 노션·구글 데이터를 서버에서 읽고 캐시 |
| 스타일 | 일반 CSS (`src/app/globals.css`) + CSS 변수 | 초안 CSS를 그대로 옮겨 디자인 손실 최소화 |
| 폰트 | Pretendard (CDN) | 초안과 동일 |
| 테스트 | Vitest | 날짜·캘린더·팝업 로직 단위 테스트 |
| E2E 테스트 | Playwright | `e2e/` — 데스크톱(1280)·모바일(Pixel 7). 시계를 2026-11-01 12:00 KST로 고정, 외부 폰트 차단, 포트 3100. Vitest는 `e2e/**` 제외 |
| 배포 | Vercel | 무료, ISR 지원 |
| CI | GitHub Actions | lint·typecheck·test·build |

## 디렉터리
```
src/
  app/                    # 라우트 (URL = 폴더)
    layout.tsx            # GNB, 푸터, FAB
    page.tsx              # 메인
    about/ departments/[id]/ notice/[id]/ calendar/ contest/[id]/
    payback/ partners/[id]/ suggest/ docs/[category]/[id]/ faq/
    not-found.tsx
    api/revalidate/       # POST 즉시 갱신 (x-revalidate-secret)
  components/             # UI 컴포넌트 (클라이언트 컴포넌트는 'use client')
  content/                # 목(mock) 데이터 = 초안의 DATA 객체. 연동 전 기본값/폴백
  lib/
    types.ts              # 데이터 타입 (초안 DATA 구조 그대로)
    date.ts               # 날짜 유틸 (KST 기준)
    events.ts             # 캘린더 이벤트 생성 (학사일정 + 공지 event + 공모전 마감)
    data/                 # 데이터 레이어: 페이지는 여기 함수만 호출
      index.ts            # getNotices(), getContests() ... (소스 선택 + 폴백)
      notion-schema.ts    # 노션 속성 이름 상수 + 매뉴얼용 스키마
      notion.ts           # 노션 API(fetch) / notion-map.ts 행 -> 도메인 타입 변환(순수)
      ics.ts csv.ts       # 학사일정 iCal 파서 / 페이백 CSV 파서·매핑 (remote.ts 가 가져옴)
docs/brain/               # 세컨브레인
public/                   # 정적 파일 (로고, 이미지)
```

## 라우팅 (초안 해시 → 실제 경로)
| 초안 | Next.js |
| --- | --- |
| `#/` | `/` |
| `#/about` | `/about` |
| `#/departments`, `#/departments/d1` | `/departments`, `/departments/[id]` |
| `#/notice`, `#/notice/1` | `/notice`, `/notice/[id]` |
| `#/calendar` | `/calendar` |
| `#/contest`, `#/contest/c2026-ai` | `/contest`, `/contest/[id]` |
| `#/payback` | `/payback` |
| `#/partners`, `#/partners/p1` | `/partners`, `/partners/[id]` |
| `#/suggest` | `/suggest` |
| `#/docs/rules`, `#/docs/rules/r1` | `/docs/[category]`, `/docs/[category]/[id]` |
| `#/faq` | `/faq` |

## 데이터 흐름
```
노션 DB(9개) ──────┐  fetch + Notion-Version 고정
구글 캘린더 iCal ──┼─> src/lib/data/*.ts (서버, fetch 캐시 10분, 태그 'notion') ─> 페이지(서버 컴포넌트) ─> 클라이언트 컴포넌트(props)
구글 시트 CSV(요약탭)┘        │ 환경변수 없거나 실패 시
                              └─> src/content/* 목 데이터 폴백 (소스별로 독립)
```
- 페이지는 **반드시 `src/lib/data` 함수만** 사용한다. `src/content`를 직접 import 하지 않는다.
- 소스별 규칙: 환경변수 없음 -> 목 데이터 / 있음 -> 원격 호출, 실패 시 `console.warn('[data] <소스> 실패, 목 데이터 사용')` 후 목 데이터. 원격이 성공한 빈 목록은 그대로 사용.
- 노션 행은 `notion-map.ts` 의 순수 함수로 변환하고, 잘못된 행은 경고 후 건너뛴다. 각 로더는 React `cache()` 로 요청 내 중복 호출을 합친다.
- 학과·학생회 조직·페이지 문구·사이트 링크는 코드(`src/content`) 그대로.
- 운영 방법(속성표, 설정 절차)은 [06-content-ops.md](06-content-ops.md).
- 모든 원격 fetch 는 `next: { revalidate: 600, tags: ['notion'] }`. `POST /api/revalidate` 가 이 태그와 레이아웃 경로를 무효화한다. 노션 이미지 URL은 약 1시간 후 만료되므로 이 주기보다 길게 잡지 않는다.
- **이미지 경로**: 노션에 직접 올린 파일(`file`)은 `notion-map.ts`가 `/api/notion-file/{pageId}/{field}/{index}` 로 바꿔 내보낸다. 이 라우트가 먼저 캐시된 DB 목록에서 pageId를 확인(없으면 404)하고, 목록 행의 서명 URL을 쓰되 없을 때만 `GET /v1/pages/{id}`(5분 캐시)로 새 서명 URL을 받아 307 리다이렉트한다(`Cache-Control: public, max-age=300, s-maxage=300`). 외부 링크(`external`)는 `safeImageSrc`를 거친 원래 URL 그대로. 검증·URL 선택은 순수 함수(`src/lib/data/file-proxy.ts`), 라우트는 얇게 유지한다. 허용 필드는 `FILE_FIELDS` 목록에만 추가한다.
  - `FILE_FIELDS` 에 필드 추가 방법: ① `src/lib/data/file-proxy.ts` 에 `'영문-키': { property: <notion-schema 의 속성 이름 상수>, dbEnv: 'NOTION_DB_…' }` 한 줄을 넣는다(영문 키가 URL 의 `{field}`).
  - ② `dbEnv` 는 `notion-map.ts` 의 `DB` 에 있는 환경변수 이름이어야 하고(테스트가 확인), 그 DB 를 새로 쓰면 `.env.example`·배포 환경에도 둔다.
  - ③ 매퍼에서 `fileProxyPath(page.id, '영문-키', index)` 로 경로를 만든다. DB 조회 인자(정렬)는 `notion-schema.ts` 의 `DB_QUERY` 한 곳에 두고, 로더·프록시 모두 `listRows(dbKey, dbId)` 를 써서 데이터 캐시를 공유한다.
- API 키는 서버 전용 환경변수(`NEXT_PUBLIC_` 접두사 금지).

## 날짜 규칙
- 날짜 문자열은 `YYYY-MM-DD`(KST 기준 날짜) 고정.
- "오늘"은 **KST 기준**으로 계산(`src/lib/date.ts`의 `todayKST()`). 서버(UTC)에서 날짜가 하루 밀리지 않게.
- 진행 상태(예정/진행중/마감)·D-day처럼 "오늘"에 의존하는 표시는 ISR 캐시로 최대 10분 늦을 수 있음(허용).
- 팝업 노출 여부는 클라이언트에서 다시 판정한다.

## 컴포넌트 원칙
- 기본은 서버 컴포넌트. 상태·이벤트가 필요한 것만 클라이언트: 배너 캐러셀, 캘린더, 모바일 메뉴, 팝업(제휴·행사·공지·공모전), 제휴 필터, FAQ 아코디언.
- 클래스명은 초안 CSS 클래스를 그대로 사용(디자인 일치 확인이 쉬움).
- 접근성: 초안의 `aria-*` 속성 유지, 키보드 조작 가능, `prefers-reduced-motion` 존중.
- 외부 링크는 `target="_blank" rel="noopener noreferrer"`.

## 색상 토큰
`globals.css`의 `:root` 변수(`--accent` 등)만 바꾸면 전체 색이 바뀐다. 컴포넌트에 색상 하드코딩 금지.
