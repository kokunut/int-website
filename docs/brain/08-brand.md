# 08. 브랜드 가이드

학생회가 제공한 로고·색상·폰트 (2026-11-02). 코드에서는 `src/app/globals.css`의 `:root` 토큰으로만 쓴다.

## 로고
- 파일: `public/brand/logo.svg` (단색 벡터, `fill="currentColor"` → CSS `color`로 색 지정)
- 기본 색: 브랜드 블루 `#548AEC`. 어두운 배경(`#181A16`) 위에서도 블루 그대로
- 원본: 학생회 제공 이미지에서 벡터로 추출(트레이싱). 원본 벡터 파일을 받으면 교체 (확인 필요)

## 색상
| 이름 | 값 | 용도 |
| --- | --- | --- |
| 블루(브랜드) | `#548AEC` | 로고, 강조선, 진행바, 선택 날짜, 배너 워드마크 |
| 잉크 | `#181A16` | 본문 글자, 주요 버튼, 배너·푸터 배경 |
| 페이퍼 | `#F8FAFD` | 페이지 배경 |
| 그레이 | `#D5D5D5` | 구분선 |
| 그라데이션 | `#181A16 → #548AEC` | 배너 하단 띠, 푸터 상단 띠, 진행바, 카카오톡 버튼 |

접근성: 흰 글자 + 블루 배경은 대비 3.4:1이라 **본문 글자에는 쓰지 않는다**. 블루 위 글자는 잉크색(대비 5.7:1).

## 폰트
| 역할 | 폰트 | 파일 |
| --- | --- | --- |
| 메인(제목·로고 옆 문구·큰 숫자) | Gmarket Sans (Bold, Medium) | `src/app/fonts/GmarketSans*.woff2` |
| 본문 (16px) | Pretendard Medium | `pretendard` npm 패키지 (기존) |

라이선스: G마켓 산스는 무료·상업적 사용 가능, 폰트 파일 자체 판매 금지 (출처: G마켓 공식 배포, 확인 필요).

## 구현 위치 (#37)
| 항목 | 위치 |
| --- | --- |
| 색 토큰 | `src/app/globals.css`의 `:root` (`--brand`, `--accent`, `--page`, `--line`, `--text`, `--brand-grad`) |
| 컴포넌트 규칙 | `src/app/globals.css` (`.banner`, `.footer`, `.fab` 등) |
| 로고 컴포넌트 | `src/components/Logo.tsx` (인라인 SVG, `currentColor`) — 헤더 30px, 푸터 34px |
| 폰트 등록 | `src/app/layout.tsx` (`next/font/local`, `--font-display`, `preload: false`) |
| 파비콘 | `src/app/icon.svg` (잉크 배경 + 블루 로고) |
| `theme-color` | `src/app/layout.tsx`의 `viewport` (`#181A16`) |

**운영 안내:** 색을 바꾸려면 `:root`의 `--brand`·`--accent`만 고친다. (그라데이션 `--brand-grad`, 파비콘, `theme-color`에는 같은 값이 따로 적혀 있으니 함께 확인한다.)

## 미리보기 기준
Artifact 미리보기에 적용한 토큰·규칙: `docs/brain/brand-preview.css` (구현 참고용, 사이트에서 직접 import 하지 않음).
