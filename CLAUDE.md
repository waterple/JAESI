# PseudoANKI

21학번 총괄평가 재시험 대비 웹 기반 학습 앱.
PDF 문제집에서 추출한 213문제를 Anki 스타일 간격 반복 + 랜덤 퀴즈 + 순차 학습 + 오답노트로 학습한다.

## 기술 스택

| 레이어 | 선택 | 비고 |
|--------|------|------|
| 데이터 추출 | Python + PyMuPDF(fitz) + Pillow | 1회성 스크립트 |
| 프레임워크 | Vite + React 18 | 정적 데이터 SPA |
| 언어 | TypeScript | |
| 스타일 | Tailwind CSS | 모바일 우선 반응형 |
| 라우팅 | React Router v6 | 5개 라우트 |
| 상태관리 | React Context + useReducer | |
| 저장 | localStorage | 백엔드 없음 |
| 폰트 | Pretendard (CDN) | 한국어 웹폰트 |

## 프로젝트 구조

```
PseudoANKI/
├── data/                              # 원본 PDF (gitignore)
│   ├── 2025_21학번_총괄평가 1일차.pdf   # 91p, 124문제, 71이미지, 3MB
│   └── 2025_21학번_총괄평가 2일차.pdf   # 74p, 89문제, 60이미지, 93MB
├── scripts/
│   └── extract_questions.py           # PDF → JSON + 이미지 추출
├── public/data/
│   ├── questions.json                 # 추출된 문제 데이터
│   └── images/                        # 추출/최적화된 이미지
│       └── d{day}_q{num:03d}_{idx}.jpg
├── src/
│   ├── main.tsx
│   ├── App.tsx                        # Router 설정
│   ├── index.css                      # Tailwind imports
│   ├── types/index.ts                 # TypeScript 인터페이스
│   ├── data/questionLoader.ts         # questions.json fetch/cache
│   ├── lib/
│   │   ├── spacedRepetition.ts        # SM-2 알고리즘
│   │   ├── storage.ts                 # localStorage 헬퍼 (debounced)
│   │   └── utils.ts                   # shuffle, random 등
│   ├── hooks/
│   │   ├── useQuestions.ts            # 문제 로드/필터
│   │   ├── useProgress.ts            # localStorage 진행상황
│   │   └── useQuiz.ts                # 퀴즈 세션 상태머신
│   ├── context/
│   │   └── ProgressContext.tsx         # 전역 진행상황 Provider
│   ├── components/
│   │   ├── Layout.tsx                 # 네비게이션 쉘
│   │   ├── QuestionCard.tsx           # 문제 표시
│   │   ├── ChoiceList.tsx             # 선지 목록 (클릭)
│   │   ├── ExplanationPanel.tsx       # 해설 패널
│   │   ├── ImageViewer.tsx            # 임상사진 (클릭 확대)
│   │   ├── ProgressBar.tsx            # 세션 진행률
│   │   ├── SubjectFilter.tsx          # 과목/일차 필터
│   │   ├── StatsCard.tsx              # 정답률, 연속일수
│   │   └── ConfidenceButtons.tsx      # Again/Hard/Good/Easy
│   └── pages/
│       ├── HomePage.tsx               # 모드 선택 + 통계
│       ├── RandomQuizPage.tsx         # 랜덤 퀴즈
│       ├── SpacedRepPage.tsx          # 간격 반복 학습
│       ├── SequentialPage.tsx         # 순차 학습
│       └── WrongAnswerPage.tsx        # 오답노트
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── .gitignore
└── CLAUDE.md
```

## 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | HomePage | 모드 선택, 통계 개요 |
| `/quiz/random` | RandomQuizPage | 랜덤 문제 + 과목 필터 |
| `/quiz/spaced` | SpacedRepPage | SM-2 기반 복습 카드 |
| `/quiz/sequential` | SequentialPage | 순서대로 풀기, 북마크 이어하기 |
| `/wrong-answers` | WrongAnswerPage | 틀린 문제 모아보기/재학습 |

## 데이터

### 원본 PDF 정보

**1일차** (124문제):
- 과목: 수술환자관리(1-4), 성장과발달(5-8), 감염학(9-18), 신경계(19-35), 정신(36-51), 심혈관계(52-66), 호흡기계(67-82), 내분비및대사(83-101), 신장및요로(102-119), 옴니버스4/5/7(120-124)
- 선지: `N)` 형식
- 답: `답: N` 형식
- 120-124번은 O/X 문제 (선지 2개)

**2일차** (89문제):
- 과목: 소화기계(1-25), 근골격계(26-41), 생식및여성(42-57), 감각기(58-69), 응급중환자(70-78), 혈액및종양(79-89)
- 선지: **혼합** — `N)` 및 `①②③④⑤` 공존
- 답: **혼합** — `답: N`, `답 : N`, `답; N`, `답: ④`, `답:N` 등
- 응급중환자 섹션에서 문제 번호가 1부터 재시작됨

### questions.json 스키마

```jsonc
{
  "meta": {
    "totalQuestions": 213,
    "days": [
      { "id": "day1", "name": "1일차", "questionCount": 124 },
      { "id": "day2", "name": "2일차", "questionCount": 89 }
    ],
    "subjects": [
      { "id": "surgery", "name": "수술환자관리", "day": "day1", "questionRange": [1, 4] }
      // ... 16개 과목
    ]
  },
  "questions": [
    {
      "id": 1,                          // 글로벌 ID (1~213)
      "day": "day1",
      "originalNumber": 1,              // PDF 내 원래 번호
      "subject": "surgery",             // 과목 ID
      "questionText": "...",
      "images": ["images/d1_q001_1.jpg"], // 빈 배열 가능
      "choices": ["선지1", "선지2", ...],  // 2~5개
      "answer": 3,                       // 1-indexed
      "explanation": "...",
      "isOX": false                      // O/X 문제 여부
    }
  ]
}
```

글로벌 ID: 1일차 1~124, 2일차 125~213 (originalNumber는 PDF 원본 번호 보존).

### localStorage 스키마

```jsonc
{
  "pseudoanki_progress": {
    "version": 1,
    "srData": {
      "1": { "ease": 2.5, "interval": 1, "repetitions": 0, "nextReview": "2026-02-18" }
    },
    "history": [
      { "questionId": 1, "correct": true, "timestamp": 1708160000000 }
    ],
    "wrongAnswerBook": [3, 15, 42],
    "sequentialProgress": { "day1": 24, "day2": 0 },
    "stats": {
      "totalAttempts": 50,
      "correctCount": 35,
      "streakDays": 3,
      "lastStudyDate": "2026-02-17"
    }
  }
}
```

## SM-2 간격 반복 알고리즘

신뢰도 등급: Again(q=0) / Hard(q=2) / Good(q=4) / Easy(q=5)

- **실패** (q < 3): `repetitions=0`, `interval=1`
- **성공**: `repetitions++`
  - rep 1 → interval=1일
  - rep 2 → interval=3일
  - rep 3+ → interval = round(interval × ease)
- **ease 조정**: `ease = max(1.3, min(3.0, ease + 0.1 - (5-q)×(0.08 + (5-q)×0.02)))`
- 세션당 새 카드 최대 **20장** 도입
- 복습 큐 정렬: 실패 카드 우선 → 오래된 due date 우선

## PDF 추출 규칙 (scripts/extract_questions.py)

### 파싱 전략
1. 페이지별 파싱 X → **전체 텍스트를 합친 후** 문제 경계(`\n{N}. `)로 분할
2. 페이지 경계 마커(`<<PAGE:{idx}>>`)를 삽입하여 이미지 매핑에 활용

### 선지 파싱
- `N)` 형식: `r'^\s*(\d)\)\s*(.+)'`
- `①②③④⑤` 형식: 원문자 → 숫자 매핑 후 동일 처리

### 답 정규화
```python
# 모든 변형을 처리하는 패턴
r'답\s*[:;]\s*(\d|[①②③④⑤])'
circled_map = {'①':1, '②':2, '③':3, '④':4, '⑤':5}
```

### 이미지 처리
- `doc.extract_image(xref)`로 추출
- 500KB 초과 PNG → JPEG 변환 (quality=85)
- 최대 800px 너비로 리사이즈
- 네이밍: `d{day}_q{num:03d}_{idx}.jpg`
- **주의**: Python 페이지 인덱스는 0-based, PDF 페이지는 1-based

### 엣지 케이스
- 문제가 여러 페이지에 걸침 (1일차 44, 46, 49, 62페이지 등)
- 2일차 응급중환자 섹션 번호 재시작 → 선형 파싱 + 과목 헤더 추적
- 2일차 거대 이미지 2개 (19MB, 63MB 폰카메라 사진) → 반드시 리사이즈
- O/X 문제 (1일차 120~124): 선지 2개, `isOX: true`

## 코딩 컨벤션

- 한국어 텍스트: `lang="ko"`, `word-break: keep-all`
- 컴포넌트 탭 타겟 최소 48px (모바일 터치)
- localStorage 저장은 500ms debounce
- 진행상황 JSON export/import 기능 포함
- 데이터는 정적 — 하드코딩 허용

## 구현 순서

1. **데이터 추출** — extract_questions.py 작성/실행, 샘플 검증
2. **프로젝트 스캐폴드** — Vite + React + TS + Tailwind 초기화
3. **핵심 컴포넌트** — QuestionCard, ChoiceList, ExplanationPanel, ImageViewer
4. **퀴즈 로직** — useQuiz 훅, RandomQuizPage
5. **영속성** — storage.ts, ProgressContext, useProgress
6. **간격 반복** — spacedRepetition.ts, SpacedRepPage, ConfidenceButtons
7. **순차 학습 + 오답노트** — SequentialPage, WrongAnswerPage
8. **마무리** — HomePage 통계, 모바일 반응형, export/import
