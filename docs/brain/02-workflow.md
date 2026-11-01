# 02. 작업 절차

## 원칙
- **한 번에 하나의 작업만** 착수한다. 진행 중 작업은 `05-progress.md`의 "진행 중"에 1개만 존재.
- 모든 작업은 GitHub 이슈에서 시작한다.

## 절차
1. **이슈 생성** — 목적, 범위, 완료 조건을 적는다.
2. **브랜치** — 작업 브랜치에서 개발 (`main` 직접 push 금지).
3. **개발** — 설계(`01-architecture.md`)를 따른다. 설계 변경이 필요하면 먼저 문서를 고친다.
4. **자체 리뷰 1차 → 수정** — 정확성 버그, 요구사항 누락, 접근성, 타입 안전성 위주.
5. **자체 리뷰 2차 → 수정** — 1차 수정분 재검토 + 단순화·중복 제거.
6. **검증** — `npm run lint && npm run typecheck && npm test && npm run build` 통과.
7. **PR** — 제목은 이슈 제목, `.github/pull_request_template.md` 양식으로 본문에 `Closes #N`, 변경 요약, 리뷰 반영 내역(1차/2차), 확인 방법.
8. **머지** — 검증 통과 후 Claude가 직접 squash 머지. 이후 다음 이슈 착수.
9. **세컨브레인 갱신** — `05-progress.md` 작업 로그 추가(같은 PR 안에서).

## 역할 분담
| 단계 | 담당 | 비고 |
| --- | --- | --- |
| 기획 | Claude Fable 5.1 | 요구사항이 모호할 때만 |
| 설계 | Claude Opus 5.5 | 이슈 범위·구조 결정, 리뷰, 머지 |
| 코딩 | Claude Sonnet 5.5 | 구현과 리뷰 반영 |

## `@claude` (Claude GitHub App) 사용 규칙
공동 작업자(저장소 소유자)가 [Claude GitHub App](https://github.com/apps/claude)과 `.github/workflows/claude.yml`을 설치한 **이후**에는:
- 코드는 이슈/PR 코멘트에 `@claude 지시내용` 으로 요청해 작성한다.
- Claude Code(로컬/클라우드 세션)는 이슈 작성·지시·리뷰·머지만 하고 코드를 직접 쓰지 않는다.
- 설치 여부 확인: 저장소에 `.github/workflows/claude.yml`이 있는지 본다.

현재 상태는 `05-progress.md` 상단 "환경" 항목에 기록한다. (2026-11-01 설치 완료)

### 호출 방법
1. Claude Code(설계 담당)가 이슈를 만들고 범위·완료 조건·설계를 적는다.
2. 이슈 코멘트로 `@claude 이 이슈를 구현하고 PR을 올려 주세요. AGENTS.md 규칙과 PR 템플릿을 따르세요.` 처럼 지시한다.
3. 리뷰 1·2차 지적은 PR 리뷰 코멘트에 `@claude 다음을 수정해 주세요: ...` 로 전달한다.
4. 검증 통과 후 Claude Code가 머지한다.

- 호출 가능 계정: `realcdh`, `kokunut` (워크플로 `if` 조건). 다른 사람의 `@claude`는 무시된다.
- 모델: 워크플로의 `--model` (코딩 = Sonnet). 허용 명령: `npm` 관련만.
- 예외: 워크플로 자체가 고장 나면 `@claude`가 실행되지 않으므로 그 수정은 Claude Code가 직접 한다.

## 커밋 메시지
`type: 요약` 형식 (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`). 한국어 요약 가능.
