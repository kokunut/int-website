# 05. 작업 현황판

## 환경
- Claude GitHub App: **설치됨** (2026-11-01, `.github/workflows/claude.yml`, 시크릿 `CLAUDE_CODE_OAUTH_TOKEN`) → 이후 코드는 이슈/PR 코멘트의 `@claude`로 작성, Claude Code는 지시·리뷰·머지만
- 배포: 미배포 (Vercel 연결 필요 — 저장소 소유자 작업)

## 진행 중 (1개만)
- (없음)

## 대기 (순서대로)
(없음 — 1차 구축 완료. 다음 작업은 이슈로 등록 후 진행)

## 사람이 해야 할 일 (에이전트가 못 하는 것)
- [ ] Vercel 프로젝트 연결·도메인
- [ ] 노션 통합 생성·DB 12개 구성(팝업·아카이브·사이트 설정·부서·집행부 DB 포함), 구글 시트 요약 탭 웹 게시, 캘린더 iCal 주소 → Vercel 환경변수 등록 (`06-content-ops.md`, `npm run content:check`로 점검)
- [ ] Vercel 프로젝트에서 **Analytics** 탭 → Enable, **Speed Insights** 탭 → Enable (`06-content-ops.md` 4-1)
- [ ] 저장소 Settings → Advanced Security에서 **Dependabot alerts**와 **Dependabot security updates** 켜기 (보안 패치 자동 PR, 버전 업데이트는 `dependabot.yml`이 담당)
- [ ] 실제 링크(카카오 채널, 인스타그램, 구글폼) 및 학생회실 주소 확정
- [ ] 학과 약어 정식 명칭, 집행부 명단 가정(정후보→회장, 총원 26 vs 25) 확인 (`04-glossary.md`)

## 작업 로그
| 날짜 | 이슈 | PR | 요약 |
| --- | --- | --- | --- |
| 2026-11-01 | #1 | #2 | 세컨브레인(AGENTS.md, CLAUDE.md, docs/brain), PR 템플릿 추가 |
| 2026-11-01 | #3 | #4 | Next.js 스캐폴드, 공통 레이아웃(GNB·푸터·FAB·스킵링크), 타입·목 데이터·데이터 레이어, 날짜·이벤트 유틸+테스트, CI. 초안은 docs/prototype/로 이동 |
| 2026-11-01 | #5 | #6 | 메인(배너·캘린더·페이백·공모전·공지), 공지·캘린더(?date= 딥링크)·공모전 페이지, 공모전 팝업(오늘/일주일 숨김) |
| 2026-11-01 | #7 | #8 | 소개·학과·페이백·제휴·건의함·자료실(구글 드라이브/문서 미리보기·다운로드)·FAQ, sitemap/robots/OG. 페이지 문구는 `src/content/pages.ts`로 분리 |
| 2026-11-01 | #9 | #10 | 집행부 명단 25명·6개 부서 반영, /about 조직도↔명단 앵커, 사무국→사무부 |
| 2026-11-01 | #11 | #12 | 노션(공지·공모전·제휴·FAQ·자료·배너·건의)·iCal(학사일정)·게시 CSV(페이백) 연동, 소스별 목 폴백, `/api/revalidate`, `content:check`, 운영 매뉴얼 |
| 2026-11-01 | #13 | #14 | README 비개발자용 개편, 화면 캡처 8장·`npm run screenshots`, 캘린더 오늘 표시·모바일 배너 링크 정렬 CSS 수정 |
| 2026-11-01 | #15 | (본 PR) | 잘린 `claude.yml` 복구(액션·모델·Node 설정), App 설치 반영 |
| 2026-11-01 | #17 | (본 PR) | `npm run notion:setup`: 노션 DB 7개 자동 생성(멱등·`--dry-run`·`--seed`·`--write-env`), select 옵션 스키마화, 왕복 테스트 |
| 2026-11-01 | #19 | (본 PR) | 소속 학과 14곳·대학 주소·학과 약어를 웹 조사로 반영(`(확인 필요)` 표기·출처 링크), 비는 섹션 숨김, 명단 약어 `title`, `07-content-research.md` 추가 |
| 2026-11-01 | #21 | (본 PR) | Playwright E2E(`npm run test:e2e`): 라우트·내비·팝업·캘린더·제휴/FAQ·404·스킵링크. CI e2e job은 `ci.yml`을 사람이 추가해야 함 |
| 2026-11-01 | #24 | (본 PR) | Lighthouse 점검 반영: 폰트 자체 호스팅(ADR-009), `--text-3` 대비 4.5:1↑, 배너 점 히트 영역 24px, `icon.svg`, 링크 텍스트(sr-only 보강)·제목 순서(h1→h2), `lighthouserc.json`·`npm run lhci`. CI job은 사람이 `ci.yml`에 추가 |
| 2026-11-01 | #27 | (본 PR) | `.github/dependabot.yml`(npm·github-actions 주간, 그룹·major 개별 PR), Dependabot PR 처리 절차 문서화 |
| 2026-11-01 | #29 | (본 PR) | 방문 통계: Vercel Analytics·Speed Insights(운영 배포에서만 렌더, `isVercelProduction()`), 커스텀 이벤트 3종(팝업 자세히 보기·페이백 신청·카카오 FAB, 밖에서는 no-op), ADR-011, 운영 매뉴얼 "방문 통계 보기" |
| 2026-11-02 | #34 | (본 PR) | 노션 이미지 안정 경로 `/api/notion-file/[pageId]/[field]/[index]`(허용 필드·공개 행·DB 검증, 307, 5분 캐시), 배너 이미지·모바일 이미지에 적용, `file-proxy.ts` 순수 함수+테스트, ADR-012 |
| 2026-11-02 | #37 | (본 PR) | 브랜드 적용: 색 토큰·배너/푸터/FAB 규칙, `Logo` 컴포넌트, Gmarket Sans(`--font-display`), 파비콘·theme-color. README 스크린샷은 머지 후 재촬영 필요 |
| 2026-11-02 | #39 | (본 PR) | 범용 팝업: 노션 "팝업" DB(`NOTION_DB_POPUPS`, 제휴·행사·공지·공모전, 기간·이미지·링크·순서)+공모전 팝업 합치기, 한 모달 이전/다음(점·"1 / 3"·←/→), "보지 않기"는 열린 묶음 전체에 적용(`mergeSuppress`로 기간 단축 방지), 목 데이터 제휴·행사 각 1건, 단위·E2E 추가, 운영 매뉴얼 "팝업 올리기", ADR-013·014. 사람이 할 일: DB 8개 구성에 팝업 추가(`npm run notion:setup`은 없는 DB만 생성) |
| 2026-11-02 | #43 | (본 PR) | 취업 아카이브·병영 길라잡이: 노션 "아카이브" DB(`NOTION_DB_ARCHIVE`, 분류·주제·첨부·링크·고정), 새 상위 메뉴 "아카이브"(복지의 군입대 백서 외부 링크는 병영 길라잡이 상단 링크 카드로 이동), 주제 탭·제목 검색·고정 상단·첨부 개수 목록, 상세(배지·본문·첨부·원문·이전/다음), `archive-files` 안정 경로, sitemap, 목 데이터 취업 3·병영 3("예시" 문구). 본문 블록 확대: `blocksToContent`+`NotionBlocks`(문단·제목·목록·인용·콜아웃·구분선·체크리스트·외부 이미지)를 공지와 공유. 단위·E2E 추가, 운영 매뉴얼 "취업·병영 글 올리기", ADR-016. 사람이 할 일: 노션에 아카이브 DB 생성(`npm run notion:setup`은 없는 DB만 생성)·`NOTION_DB_ARCHIVE` 등록, 업로드 이미지 블록은 후속 |
| 2026-11-02 | #41 | (본 PR) | 카드뉴스 공지: 공지 DB `카드뉴스`(files)·`인스타그램`(url)·유형 "카드뉴스" 추가(`notice-images` 안정 경로, `safeInstagramUrl`), 공지 상세 슬라이더(`CardSlider`: 스와이프·이전/다음·점·"2 / 6"·←/→·4:5), 목록·메인 배지·장수·"카드뉴스" 탭, 첫 장 OG 이미지, 목 데이터 6번(SVG 3장), 단위·E2E 추가, 운영 매뉴얼 "카드뉴스 올리기", ADR-015. 사람이 할 일: 기존 공지 DB에 `카드뉴스`·`인스타그램` 속성과 유형 옵션 수동 추가 |
| 2026-11-02 | #45 | (본 PR) | 사이트 설정·집행부 노션 관리: DB 3개(`NOTION_DB_SETTINGS`·`NOTION_DB_UNITS`·`NOTION_DB_COUNCIL`), 정해진 설정 항목 13개(`SETTING_KEYS`, 항목 단위 목 폴백·모르는 항목 경고), 부서 매칭·"기타" 그룹·부장 중복 처리·총원 계산(`buildOrg`), `settings-file` 안정 경로, 푸터 이메일(값 있을 때만), `--seed`(설정 13·부서 6·명단 25), 단위 테스트, 운영 매뉴얼 3-9~3-11·인수인계 체크리스트·README FAQ, ADR-017. 사람이 할 일: 노션에 DB 3개 생성(`npm run notion:setup`은 없는 DB만 생성)·환경변수 등록 |
| 2026-11-03 | #47 | (본 PR) | 노션 링크 이름 변경: "군입대 백서"→"병역 길라잡이", "공모전 정보"→"인융 인터뷰 아카이브". 병영 길라잡이 카드 문구 변경, 인융 인터뷰 아카이브 카드를 취업 아카이브 목록 위로 이동(메인 바로가기 유지), 공모전 페이지 하단 안내 문장 삭제. 설정 id `notionMilitary`→`notionMilitaryGuide`, `notionContest`→`notionInterview`, 옛 이름은 별칭(`aliases`)으로 계속 인식하고 `content:check` 가 ⚠️ 로 안내. 단위·E2E 갱신, 운영 매뉴얼·용어집·README 반영. 사람이 할 일: 노션 사이트 설정 DB의 항목 이름을 새 이름으로 바꾸기(옛 이름도 동작) |
