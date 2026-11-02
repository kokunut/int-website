# AGENTS.md — 에이전트 진입점

이 저장소에서 작업하는 **모든 AI 에이전트와 사람**이 가장 먼저 읽는 문서입니다.
자세한 내용은 [`docs/brain/`](docs/brain/README.md)(세컨브레인)에 있습니다.

## 1. 프로젝트 한 줄 요약
세종대학교 인공지능융합대학 학생회 **인트(int)** 공식 웹사이트. 단일 HTML 초안(`docs/prototype/index_1.html`)을 Next.js 사이트로 옮기고, 콘텐츠는 노션·구글에서 관리한다.

## 현재 상태
세부 진행 상황은 [`05-progress.md`](docs/brain/05-progress.md)가 기준입니다.

## 2. 작업 시작 전 필수 확인
1. [`docs/brain/05-progress.md`](docs/brain/05-progress.md) — 지금 누가 무엇을 하는지, 다음 할 일
2. [`docs/brain/02-workflow.md`](docs/brain/02-workflow.md) — 이슈·PR·리뷰 규칙 (**한 번에 한 작업만**)
3. [`docs/brain/01-architecture.md`](docs/brain/01-architecture.md) — 디렉터리·데이터 흐름·코딩 규칙
4. [`docs/brain/03-decisions.md`](docs/brain/03-decisions.md) — 이미 내려진 결정 (다시 논의하지 않기)

## 3. 핵심 규칙
- 한 번에 **하나의 이슈**만 진행한다. 진행 중 이슈는 `05-progress.md`에 표시한다.
- 흐름: **이슈 생성 → 개발 → 자체 리뷰·수정 2회 → PR → 머지**
- `main`에 직접 push 금지. PR 본문에 `Closes #이슈번호` 를 적는다.
- PR 본문은 [`.github/pull_request_template.md`](.github/pull_request_template.md) 양식(리뷰 1·2차 기록 포함)을 따른다.
- 작업이 끝나면 `05-progress.md`와(필요하면) `03-decisions.md`를 **같은 PR에서** 갱신한다.
- 콘텐츠 문구는 한국어, 코드 식별자는 영어.
- 비밀값(API 키)은 절대 커밋하지 않는다. `.env.local` 사용, 예시는 `.env.example`.

## 4. 자주 쓰는 명령어 (Next.js 이식 이후)
```bash
npm install        # 의존성 설치
npm run dev        # 개발 서버 http://localhost:3000
npm run lint       # ESLint
npm run typecheck  # TypeScript 검사
npm test           # 단위 테스트 (Vitest)
npm run test:e2e   # E2E 테스트 (Playwright, 최초 1회 npx playwright install chromium)
npm run build      # 프로덕션 빌드
npm run screenshots # README 화면 캡처 (서버 실행 후, docs/images/)
npm run content:check  # 노션·구글 연동 점검 (.env.local 필요, CI 제외)
npm run notion:setup -- --dry-run  # 노션 DB 8개 자동 생성 계획 (실행은 --dry-run 제거, 옵션: --seed --write-env --parent)
```
PR 전에는 `lint`, `typecheck`, `test`, `build` 가 모두 통과해야 한다.

## 5. 역할 분담 (모델)
| 단계 | 담당 |
| --- | --- |
| 기획 (필요 시) | Claude Fable 5.1 |
| 설계·리뷰·머지 | Claude Opus 5.5 |
| 코딩·리뷰 반영 | Claude Sonnet 5.5 |

Claude GitHub App이 **설치되어 있다**. 코드는 이슈/PR 코멘트의 `@claude` 호출로 작성하고, Claude Code는 지시·리뷰·머지만 한다. ([02-workflow.md](docs/brain/02-workflow.md) 참고)
