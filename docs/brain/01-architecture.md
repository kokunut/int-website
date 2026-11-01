# 01. 기술 설계

## 스택
| 항목 | 선택 | 이유 |
| --- | --- | --- |
| 프레임워크 | Next.js (App Router) + TypeScript | ISR로 노션·구글 데이터를 서버에서 읽고 캐시 |
| 스타일 | 일반 CSS (`src/app/globals.css`) + CSS 변수 | 초안 CSS를 그대로 옮겨 디자인 손실 최소화 |
| 폰트 | Pretendard (CDN) | 초안과 동일 |
| 테스트 | Vitest | 날짜·캘린더·팝업 로직 단위 테스트 |
| 배포 | Vercel | 무료, ISR 지원 |
| CI | GitHub Actions | lint·typecheck·test·build |

## 디렉터리
```
src/
  app/                    # 라우트 (URL = 폴더)
    layout.tsx            # GNB, 푸터, FAB, 공모전 팝업
    page.tsx              # 메인
    about/ departments/[id]/ notice/[id]/ calendar/ contest/[id]/
    payback/ partners/[id]/ suggest/ docs/[category]/[id]/ faq/
    not-found.tsx
  components/             # UI 컴포넌트 (클라이언트 컴포넌트는 'use client')
  content/                # 목(mock) 데이터 = 초안의 DATA 객체. 연동 전 기본값/폴백
  lib/
    types.ts              # 데이터 타입 (초안 DATA 구조 그대로)
    date.ts               # 날짜 유틸 (KST 기준)
    events.ts             # 캘린더 이벤트 생성 (학사일정 + 공지 event + 공모전 마감)
    data/                 # 데이터 레이어: 페이지는 여기 함수만 호출
      index.ts            # getNotices(), getContests() ... (소스 선택 + 폴백)
      notion.ts sheets.ts gcal.ts   # 외부 연동 어댑터 (#6에서 구현)
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
노션 DB ─┐
구글 시트 ─┼─> src/lib/data/*.ts (서버, ISR 10분) ─> 페이지(서버 컴포넌트) ─> 클라이언트 컴포넌트(props)
구글 캘린더┘        │ 환경변수 없거나 실패 시
                    └─> src/content/* 목 데이터 폴백
```
- 페이지는 **반드시 `src/lib/data` 함수만** 사용한다. `src/content`를 직접 import 하지 않는다.
- 모든 데이터 함수는 `async`. 외부 소스 실패 시 콘솔 경고 후 목 데이터 반환(사이트가 죽지 않게).
- `export const revalidate = 600` (10분). 노션 이미지 URL은 약 1시간 후 만료되므로 이 주기보다 길게 잡지 않는다.
- API 키는 서버 전용 환경변수(`NEXT_PUBLIC_` 접두사 금지).

## 날짜 규칙
- 날짜 문자열은 `YYYY-MM-DD`(KST 기준 날짜) 고정.
- "오늘"은 **KST 기준**으로 계산(`src/lib/date.ts`의 `todayKST()`). 서버(UTC)에서 날짜가 하루 밀리지 않게.
- 진행 상태(예정/진행중/마감)·D-day처럼 "오늘"에 의존하는 표시는 ISR 캐시로 최대 10분 늦을 수 있음(허용).
- 팝업 노출 여부는 클라이언트에서 다시 판정한다.

## 컴포넌트 원칙
- 기본은 서버 컴포넌트. 상태·이벤트가 필요한 것만 클라이언트: 배너 캐러셀, 캘린더, 모바일 메뉴, 공모전 팝업, 제휴 필터, FAQ 아코디언.
- 클래스명은 초안 CSS 클래스를 그대로 사용(디자인 일치 확인이 쉬움).
- 접근성: 초안의 `aria-*` 속성 유지, 키보드 조작 가능, `prefers-reduced-motion` 존중.
- 외부 링크는 `target="_blank" rel="noopener noreferrer"`.

## 색상 토큰
`globals.css`의 `:root` 변수(`--accent` 등)만 바꾸면 전체 색이 바뀐다. 컴포넌트에 색상 하드코딩 금지.
