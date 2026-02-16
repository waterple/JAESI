"""
Analyze the structure of two Korean exam PDF files for parser development.
"""

import fitz
import os
import sys
import re

sys.stdout.reconfigure(encoding="utf-8")

DATA_DIR = r"c:\Users\water\WaterPLE_C\Claude\PseudoANKI\data"
DAY1_PDF = os.path.join(DATA_DIR, "2025_21\ud559\ubc88_\ucd1d\uad04\ud3c9\uac00 1\uc77c\ucc28.pdf")
DAY2_PDF = os.path.join(DATA_DIR, "2025_21\ud559\ubc88_\ucd1d\uad04\ud3c9\uac00 2\uc77c\ucc28.pdf")

SEP = "=" * 80
THIN = "-" * 60


def header(title):
    print(f"\n{SEP}\n  {title}\n{SEP}")


def page_text(doc, pn, label=""):
    if pn < 0 or pn >= len(doc):
        print(f"  [Page {pn} out of range]")
        return
    text = doc[pn].get_text()
    lbl = label or f"Page {pn+1}"
    print(f"\n{THIN}\n  {lbl}\n{THIN}")
    print(text)


def list_images(doc, n=10):
    print(f"\n  First {n} images:")
    print(f"  {'xref':>6} | {'Page':>5} | {'W':>6} | {'H':>6} | {'bpc':>4} | {'cs':>12} | {'KB':>9} | {'ext':>4}")
    print(f"  {'-'*6}-+-{'-'*5}-+-{'-'*6}-+-{'-'*6}-+-{'-'*4}-+-{'-'*12}-+-{'-'*9}-+-{'-'*4}")
    count = 0
    for pn in range(len(doc)):
        if count >= n:
            break
        for img in doc[pn].get_images(full=True):
            if count >= n:
                break
            xref, _, w, h, bpc, cs = img[0], img[1], img[2], img[3], img[4], img[5]
            try:
                d = doc.extract_image(xref)
                kb = len(d["image"]) / 1024
                ext = d["ext"]
            except:
                kb, ext = 0, "?"
            print(f"  {xref:>6} | {pn+1:>5} | {w:>6} | {h:>6} | {bpc:>4} | {cs:>12} | {kb:>8.1f} | {ext}")
            count += 1
    tot = sum(len(doc[p].get_images(full=True)) for p in range(len(doc)))
    pwi = sum(1 for p in range(len(doc)) if doc[p].get_images(full=True))
    print(f"\n  Total images: {tot}, Pages with images: {pwi}")


def analyze_day1():
    header("DAY 1 ANALYSIS")
    doc = fitz.open(DAY1_PDF)
    tp = len(doc)
    print(f"\n  Total pages: {tp}")

    header("DAY 1 - First 5 pages")
    for i in range(min(5, tp)):
        page_text(doc, i, f"Day1 p{i+1}/{tp}")

    header("DAY 1 - O/X questions (Q120-124)")
    ox_pages = [i for i in range(tp) if re.search(r'\b12[0-4]\b\s*\.', doc[i].get_text())]
    if ox_pages:
        print(f"  Pages with Q120-124: {[p+1 for p in ox_pages]}")
        for p in ox_pages:
            page_text(doc, p, f"Day1 p{p+1} (O/X)")
    else:
        print("  Not found by regex. Last 10 pages:")
        for i in range(max(0, tp-10), tp):
            page_text(doc, i, f"Day1 p{i+1}/{tp}")

    header("DAY 1 - Last 3 pages")
    for i in range(max(0, tp-3), tp):
        page_text(doc, i, f"Day1 p{i+1}/{tp} (end)")

    header("DAY 1 - Images")
    list_images(doc, 10)

    header("DAY 1 - Answer format samples")
    ans = []
    for i in range(tp):
        for line in doc[i].get_text().split("\n"):
            s = line.strip()
            if s.startswith("\ub2f5") and len(s) < 50:
                ans.append((i+1, s))
    print(f"  Found {len(ans)} answer lines. First 30:")
    for pg, ln in ans[:30]:
        print(f"    p{pg:>3}: '{ln}'")

    doc.close()


def analyze_day2():
    header("DAY 2 ANALYSIS")
    doc = fitz.open(DAY2_PDF)
    tp = len(doc)
    print(f"\n  Total pages: {tp}")

    header("DAY 2 - First 5 pages")
    for i in range(min(5, tp)):
        page_text(doc, i, f"Day2 p{i+1}/{tp}")

    header("DAY 2 - 응급중환자 section")
    em_pages = [i for i in range(tp) if "\uc751\uae09" in doc[i].get_text() or "\uc911\ud658\uc790" in doc[i].get_text()]
    if em_pages:
        print(f"  Pages with 응급/중환자: {[p+1 for p in em_pages]}")
        s = em_pages[0]
        for p in range(max(0, s-1), min(tp, s+4)):
            page_text(doc, p, f"Day2 p{p+1} (around 응급중환자)")
    else:
        print("  Not found")

    header("DAY 2 - Last 3 pages")
    for i in range(max(0, tp-3), tp):
        page_text(doc, i, f"Day2 p{i+1}/{tp} (end)")

    header("DAY 2 - Images")
    list_images(doc, 10)

    header("DAY 2 - Circled number format (\u2460\u2461\u2462\u2463\u2464)")
    cp = []
    first_shown = False
    for i in range(tp):
        text = doc[i].get_text()
        if "\u2460" in text:
            cp.append(i+1)
            if not first_shown:
                page_text(doc, i, f"Day2 p{i+1} (first \u2460)")
                first_shown = True
    if cp:
        print(f"\n  All pages with \u2460: {cp}")
    else:
        print("  No circled numbers found")

    header("DAY 2 - Answer format variations")
    ans = []
    for i in range(tp):
        for line in doc[i].get_text().split("\n"):
            s = line.strip()
            if "\ub2f5" in s and any(c.isdigit() or c in "\u2460\u2461\u2462\u2463\u2464" for c in s) and len(s) < 80:
                ans.append((i+1, s))
    print(f"  Found {len(ans)} answer-like lines.")
    seen = set()
    print("\n  Unique format patterns:")
    for pg, ln in ans:
        fp = re.sub(r"\d+", "N", ln)
        fp = re.sub(r"[\u2460-\u2464]", "C", fp)
        if fp not in seen:
            seen.add(fp)
            print(f"    p{pg:>3}: '{ln}'")
    print(f"\n  All {len(ans)} raw answer lines:")
    for pg, ln in ans:
        print(f"    p{pg:>3}: '{ln}'")

    doc.close()


def main():
    print("PDF Structure Analysis for PseudoANKI")
    print(f"PyMuPDF: {fitz.__version__}")
    for path in [DAY1_PDF, DAY2_PDF]:
        if not os.path.exists(path):
            print(f"ERROR: {path} not found")
            sys.exit(1)
        mb = os.path.getsize(path) / (1024*1024)
        print(f"  {os.path.basename(path)}: {mb:.1f} MB")
    analyze_day1()
    analyze_day2()
    print(f"\n{SEP}\n  Analysis complete.\n{SEP}")


if __name__ == "__main__":
    main()
