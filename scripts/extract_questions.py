"""
PseudoANKI PDF 추출 스크립트
PDF 문제집에서 텍스트/이미지를 추출하여 questions.json + 이미지 파일 생성.

사용법: python scripts/extract_questions.py
"""

import fitz  # PyMuPDF
import json
import re
import sys
from pathlib import Path
from PIL import Image, ImageOps
import io

# Windows cp949 인코딩 문제 방지
sys.stdout.reconfigure(encoding="utf-8")

# ─── 경로 설정 ───────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
OUT_DIR = BASE_DIR / "public" / "data"
IMG_DIR = OUT_DIR / "images"

DAY1_PDF = DATA_DIR / "2025_21학번_총괄평가 1일차.pdf"
DAY2_PDF = DATA_DIR / "2025_21학번_총괄평가 2일차.pdf"

# ─── 과목 정의 ───────────────────────────────────────────────────
SUBJECTS_DAY1 = [
    {"id": "surgery", "name": "수술환자관리", "range": (1, 4)},
    {"id": "growth", "name": "성장과발달", "range": (5, 8)},
    {"id": "infection", "name": "감염학", "range": (9, 18)},
    {"id": "neuro", "name": "신경계", "range": (19, 35)},
    {"id": "mental", "name": "정신", "range": (36, 51)},
    {"id": "cardio", "name": "심혈관계", "range": (52, 66)},
    {"id": "respiratory", "name": "호흡기계", "range": (67, 82)},
    {"id": "endocrine", "name": "내분비및대사", "range": (83, 101)},
    {"id": "renal", "name": "신장및요로", "range": (102, 119)},
    {"id": "omnibus", "name": "옴니버스4/5/7", "range": (120, 124)},
]

SUBJECTS_DAY2 = [
    {"id": "digestive", "name": "소화기계", "range": (1, 25)},
    {"id": "musculo", "name": "근골격계", "range": (26, 41)},
    {"id": "reproductive", "name": "생식및여성", "range": (42, 57)},
    {"id": "sensory", "name": "감각기", "range": (58, 69)},
    {"id": "emergency", "name": "응급중환자", "range": (70, 78)},
    {"id": "hematology", "name": "혈액및종양", "range": (79, 89)},
]

CIRCLED_MAP = {"①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5}
MAX_IMG_WIDTH = 800
JPEG_QUALITY = 85


def get_subject(original_num: int, day: str) -> str:
    subjects = SUBJECTS_DAY1 if day == "day1" else SUBJECTS_DAY2
    for subj in subjects:
        lo, hi = subj["range"]
        if lo <= original_num <= hi:
            return subj["id"]
    return "unknown"


def extract_text_with_page_markers(doc: fitz.Document) -> str:
    """전체 텍스트를 합치되, 페이지 경계에 마커를 삽입."""
    parts = []
    for page_idx in range(len(doc)):
        parts.append(f"\n<<PAGE:{page_idx}>>\n")
        parts.append(doc[page_idx].get_text())
    return "".join(parts)


# ─── y좌표 기반 이미지 매핑 ──────────────────────────────────────

def build_question_positions(doc: fitz.Document, question_numbers: list[int]) -> dict[int, tuple[int, float]]:
    """각 문제 번호가 PDF에서 어디에 위치하는지 반환.
    Returns: {q_num: (page_idx, y_pos)}"""
    positions: dict[int, tuple[int, float]] = {}
    q_set = set(question_numbers)
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        for q_num in sorted(q_set):
            if q_num in positions:
                continue
            # "N. " 패턴을 페이지에서 검색
            rects = page.search_for(f"{q_num}. ")
            if rects:
                positions[q_num] = (page_idx, rects[0].y0)
    return positions


def build_image_positions(doc: fitz.Document) -> list[tuple[int, int, float, int, int]]:
    """모든 이미지의 페이지와 y좌표 반환.
    Returns: [(page_idx, xref, y_pos, w, h), ...]"""
    result: list[tuple[int, int, float, int, int]] = []
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        for img_info in page.get_images(full=True):
            xref = img_info[0]
            w = img_info[2]
            h = img_info[3]
            rects = page.get_image_rects(xref)
            if rects:
                result.append((page_idx, xref, rects[0].y0, w, h))
    return result


def assign_images_to_questions(
    q_positions: dict[int, tuple[int, float]],
    img_positions: list[tuple[int, int, float, int, int]],
    question_numbers: list[int],
) -> dict[int, list[tuple[int, int, int]]]:
    """각 이미지를 y좌표 기준 가장 가까운 위의 문제에 할당.
    Returns: {q_num: [(xref, w, h), ...]}"""
    # 각 페이지별로 문제 시작 위치를 정렬
    page_questions: dict[int, list[tuple[float, int]]] = {}
    for q_num, (page_idx, y) in q_positions.items():
        page_questions.setdefault(page_idx, []).append((y, q_num))
    for pg in page_questions:
        page_questions[pg].sort()

    # 전체 문제를 (page, y) 순서로 정렬 (이전 페이지 fallback용)
    all_sorted: list[tuple[int, float, int]] = []
    for q_num, (pg, y) in q_positions.items():
        all_sorted.append((pg, y, q_num))
    all_sorted.sort()

    result: dict[int, list[tuple[int, int, int]]] = {n: [] for n in question_numbers}

    for page_idx, xref, img_y, w, h in img_positions:
        candidates = page_questions.get(page_idx, [])
        assigned = None

        # 같은 페이지에서 이미지 위(또는 같은 위치)의 문제 중 가장 가까운 것
        for y, q_num in reversed(candidates):
            if y <= img_y:
                assigned = q_num
                break

        if assigned is None:
            # 이미지가 이 페이지의 모든 문제보다 위에 있음 → 이전 페이지의 마지막 문제
            for pg, y, q_num in reversed(all_sorted):
                if pg < page_idx:
                    assigned = q_num
                    break
                elif pg == page_idx and y <= img_y:
                    assigned = q_num
                    break

        # 여전히 없으면 첫 문제
        if assigned is None and candidates:
            assigned = candidates[0][1]

        if assigned is not None:
            result[assigned].append((xref, w, h))

    return result


def save_optimized_image(doc: fitz.Document, xref: int, out_path: Path) -> bool:
    """이미지를 추출하고 리사이즈/포맷 변환 후 저장."""
    img_data = doc.extract_image(xref)
    if not img_data:
        return False

    image_bytes = img_data["image"]
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception:
        return False

    # EXIF 회전 정보 적용 (폰 카메라 사진 등)
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # RGBA/P → RGB 변환
    if img.mode in ("RGBA", "P", "LA"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        if img.mode in ("RGBA", "LA"):
            bg.paste(img, mask=img.split()[-1])
            img = bg
        else:
            img = img.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # 리사이즈
    if img.width > MAX_IMG_WIDTH:
        ratio = MAX_IMG_WIDTH / img.width
        new_h = int(img.height * ratio)
        img = img.resize((MAX_IMG_WIDTH, new_h), Image.LANCZOS)

    # JPEG 저장
    img.save(out_path, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return True


def split_questions(full_text: str, expected_max: int) -> list[tuple[int, str]]:
    """
    문제 번호와 텍스트로 분할.
    expected_max: 해당 일차의 최대 문제 번호 (Day1=124, Day2=89)
    단조 증가하는 번호만 인정하여 해설 내 번호 목록을 무시.
    """
    pattern = re.compile(r"(?:^|\n)(\d{1,3})\.\s", re.MULTILINE)
    matches = list(pattern.finditer(full_text))

    # 단조 증가 필터: 해설 내 "1. ACS는..." 등을 걸러냄
    filtered = []
    last_num = 0
    for m in matches:
        num = int(m.group(1))
        if num > last_num and num <= expected_max:
            filtered.append(m)
            last_num = num

    questions = []
    for i, m in enumerate(filtered):
        num = int(m.group(1))
        start = 0 if i == 0 else m.start()
        end = filtered[i + 1].start() if i + 1 < len(filtered) else len(full_text)
        text = full_text[start:end].strip()
        questions.append((num, text))

    return questions


def parse_choices(text: str) -> list[str]:
    """선지 파싱 — N) 형식과 ①②③④⑤ 형식 모두 지원. 이미지 선지도 처리."""
    # 페이지 마커 제거 후 답/해설 위치 찾기
    clean = re.sub(r"<<PAGE:\d+>>", "", text)
    answer_pos = len(clean)
    for pat in [r"\n\s*(?:정?답)\s*[:;]", r"\n\s*해설\s*:", r"\n\s*풀이\s*:"]:
        m = re.search(pat, clean)
        if m and m.start() < answer_pos:
            answer_pos = m.start()
    pre_answer = clean[:answer_pos]

    choices: list[str] = []

    # N) 형식: 각 선지를 개별 탐색 (trailing \s* 없이 — 다음 선지 \n 소비 방지)
    n_positions = list(re.finditer(r"(?:^|\n)\s*(\d)\)\s?", pre_answer))
    # ①②③④⑤ 형식
    c_positions = list(re.finditer(r"([①②③④⑤])\s?", pre_answer))

    if n_positions and len(n_positions) >= len(c_positions):
        for i, m in enumerate(n_positions):
            start = m.end()
            end = n_positions[i + 1].start() if i + 1 < len(n_positions) else answer_pos
            choice_text = pre_answer[start:end].strip()
            choice_text = re.sub(r"\s*\n\s*", " ", choice_text).strip()
            if not choice_text:
                choice_text = f"(보기 {m.group(1)} - 이미지 참조)"
            choices.append(choice_text)
    elif c_positions:
        for i, m in enumerate(c_positions):
            start = m.end()
            end = c_positions[i + 1].start() if i + 1 < len(c_positions) else answer_pos
            choice_text = pre_answer[start:end].strip()
            choice_text = re.sub(r"\s*\n\s*", " ", choice_text).strip()
            if not choice_text:
                num = CIRCLED_MAP.get(m.group(1), "?")
                choice_text = f"(보기 {num} - 이미지 참조)"
            choices.append(choice_text)

    return choices


def parse_answer(text: str) -> int | None:
    """답 파싱 — 다양한 형식 지원."""
    pattern = re.compile(r"(?:정답|답)\s*[:;]\s*(\d|[①②③④⑤])")
    m = pattern.search(text)
    if m:
        val = m.group(1)
        if val in CIRCLED_MAP:
            return CIRCLED_MAP[val]
        return int(val)
    return None


def parse_explanation(text: str) -> str:
    """해설/풀이 추출."""
    pattern = re.compile(r"(?:해설|풀이)\s*[:]\s*(.*)", re.DOTALL)
    m = pattern.search(text)
    if m:
        expl = m.group(1).strip()
        expl = re.sub(r"<<PAGE:\d+>>", "", expl).strip()
        expl = re.sub(r"\s*\n\s*", " ", expl).strip()
        return expl
    return ""


def get_question_text(raw: str) -> str:
    """문제 본문만 추출 (선지/답/해설 제거)."""
    # 줄 경계의 문제 번호를 찾아 그 이후부터 본문으로 사용
    m_start = re.search(r"(?:^|\n)\d{1,3}\.\s", raw)
    text = raw[m_start.end():] if m_start else raw

    # 선지 시작 이전까지가 문제 본문
    cut = None
    # N) 형식
    m = re.search(r"\n\s*1\)\s", text)
    if m:
        cut = m.start()
    # ①②③④⑤ 형식
    m2 = re.search(r"[①]", text)
    if m2 and (cut is None or m2.start() < cut):
        cut = m2.start()
    # 답 직접 시작 (선지 없는 경우)
    m3 = re.search(r"\n\s*(?:정?답)\s*[:;]", text)
    if m3 and (cut is None or m3.start() < cut):
        cut = m3.start()

    if cut is not None:
        text = text[:cut]

    text = re.sub(r"<<PAGE:\d+>>", "", text)
    text = re.sub(r"\s*\n\s*", " ", text)
    text = text.strip()
    return text


def process_pdf(
    pdf_path: Path, day: str, global_id_offset: int, expected_count: int
) -> list[dict]:
    """PDF를 처리하여 문제 목록 반환."""
    print(f"\n{'='*60}")
    print(f"처리 중: {pdf_path.name} ({day})")
    print(f"{'='*60}")

    doc = fitz.open(str(pdf_path))
    full_text = extract_text_with_page_markers(doc)

    # 문제 분할 (단조 증가 필터 적용)
    raw_questions = split_questions(full_text, expected_count)
    print(f"발견된 문제 수: {len(raw_questions)}")
    if len(raw_questions) != expected_count:
        print(f"  주의: 기대 {expected_count}개, 실제 {len(raw_questions)}개")
        nums = [n for n, _ in raw_questions]
        expected_nums = set(range(1, expected_count + 1))
        missing = expected_nums - set(nums)
        if missing:
            print(f"  누락된 번호: {sorted(missing)}")

    # y좌표 기반 이미지 매핑
    q_numbers = [n for n, _ in raw_questions]
    q_positions = build_question_positions(doc, q_numbers)
    img_positions = build_image_positions(doc)
    image_map = assign_images_to_questions(q_positions, img_positions, q_numbers)

    print(f"  문제 위치 감지: {len(q_positions)}/{len(q_numbers)}개")
    print(f"  이미지 위치 감지: {len(img_positions)}개")

    questions = []
    img_count = 0

    for q_num, q_raw in raw_questions:
        q_text = get_question_text(q_raw)
        choices = parse_choices(q_raw)
        answer = parse_answer(q_raw)
        explanation = parse_explanation(q_raw)

        global_id = q_num + global_id_offset
        subject = get_subject(q_num, day)
        is_ox = day == "day1" and 120 <= q_num <= 124

        # 이미지 저장 (사전 계산된 매핑 사용)
        q_images: list[str] = []
        img_idx = 1
        for xref, w, h in image_map.get(q_num, []):
            day_num = 1 if day == "day1" else 2
            img_name = f"d{day_num}_q{q_num:03d}_{img_idx}.jpg"
            img_path = IMG_DIR / img_name
            if save_optimized_image(doc, xref, img_path):
                q_images.append(f"images/{img_name}")
                img_idx += 1
                img_count += 1

        # 선지가 없으면서 이미지가 있으면 이미지 선지로 간주
        if not choices and answer is not None:
            for i in range(1, answer + 1):
                choices.append(f"(보기 {i} - 이미지 참조)")
            while len(choices) < 5 and not is_ox:
                choices.append(f"(보기 {len(choices)+1} - 이미지 참조)")
            if is_ox:
                choices = ["O", "X"]

        if not choices:
            print(f"  경고: Q{q_num} 선지 없음")
        if answer is None:
            print(f"  경고: Q{q_num} 답 없음")

        questions.append(
            {
                "id": global_id,
                "day": day,
                "originalNumber": q_num,
                "subject": subject,
                "questionText": q_text,
                "images": q_images,
                "choices": choices,
                "answer": answer if answer else 1,
                "explanation": explanation,
                "isOX": is_ox,
            }
        )

    doc.close()
    print(f"파싱 완료: {len(questions)}문제, {img_count}이미지")
    return questions


def build_meta(day1_count: int, day2_count: int) -> dict:
    """메타데이터 구성."""
    subjects = []
    for s in SUBJECTS_DAY1:
        subjects.append(
            {
                "id": s["id"],
                "name": s["name"],
                "day": "day1",
                "questionRange": list(s["range"]),
            }
        )
    for s in SUBJECTS_DAY2:
        lo, hi = s["range"]
        subjects.append(
            {
                "id": s["id"],
                "name": s["name"],
                "day": "day2",
                "questionRange": [lo + 124, hi + 124],
            }
        )

    return {
        "totalQuestions": day1_count + day2_count,
        "days": [
            {"id": "day1", "name": "1일차", "questionCount": day1_count},
            {"id": "day2", "name": "2일차", "questionCount": day2_count},
        ],
        "subjects": subjects,
    }


def validate(questions: list[dict]) -> int:
    """결과 검증."""
    print(f"\n{'='*60}")
    print("검증")
    print(f"{'='*60}")

    issues = 0

    ids = [q["id"] for q in questions]
    expected = list(range(1, len(questions) + 1))
    if ids != expected:
        print(f"  ID 불연속!")
        missing = set(expected) - set(ids)
        extra = set(ids) - set(expected)
        if missing:
            print(f"    빠진 ID: {sorted(missing)}")
        if extra:
            print(f"    초과 ID: {sorted(extra)}")
        issues += 1

    from collections import Counter
    subj_counts = Counter(q["subject"] for q in questions)
    print(f"\n  과목별 문제 수:")
    for subj, cnt in sorted(subj_counts.items(), key=lambda x: -x[1]):
        marker = " (!)" if subj == "unknown" else ""
        print(f"    {subj}: {cnt}{marker}")

    no_choices = [q for q in questions if len(q["choices"]) == 0]
    if no_choices:
        print(f"\n  선지 없는 문제: {[q['id'] for q in no_choices]}")
        issues += 1

    bad_answers = [
        q for q in questions
        if len(q["choices"]) > 0 and (q["answer"] < 1 or q["answer"] > len(q["choices"]))
    ]
    if bad_answers:
        print(f"\n  답 범위 오류: {[(q['id'], q['answer'], len(q['choices'])) for q in bad_answers]}")
        issues += 1

    img_count = sum(len(q["images"]) for q in questions)
    img_missing = []
    for q in questions:
        for img in q["images"]:
            full_path = OUT_DIR / img
            if not full_path.exists():
                img_missing.append(img)
    if img_missing:
        print(f"\n  누락된 이미지: {img_missing[:10]}...")
        issues += 1

    print(f"\n  총 문제: {len(questions)}")
    print(f"  총 이미지: {img_count}")
    print(f"  이슈: {issues}")
    return issues


def main():
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    day1_questions = process_pdf(DAY1_PDF, "day1", 0, 124)
    day2_questions = process_pdf(DAY2_PDF, "day2", 124, 89)

    all_questions = day1_questions + day2_questions
    meta = build_meta(len(day1_questions), len(day2_questions))
    issues = validate(all_questions)

    output = {"meta": meta, "questions": all_questions}
    out_path = OUT_DIR / "questions.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n저장 완료: {out_path}")
    print(f"파일 크기: {out_path.stat().st_size / 1024:.1f} KB")

    if issues > 0:
        print(f"\n{issues}개 이슈 발견 - 수동 확인 필요")
    else:
        print("\n모든 검증 통과!")


if __name__ == "__main__":
    main()
