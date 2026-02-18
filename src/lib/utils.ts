export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 검사 결과 섹션 키워드 앞에 줄바꿈을 삽입하여 가독성 향상.
 * 추출 시 제거된 줄바꿈을 프론트엔드에서 복원한다.
 */
export function formatLabText(text: string): string {
  // 검사 결과 섹션 헤더 패턴 (앞에 줄바꿈 삽입)
  const sectionPatterns = [
    /\s+(?=혈액\s*검사\s*:)/g,
    /\s+(?=혈액\s*:)/g,
    /\s+(?=뇌척수액\s*(?:검사\s*)?:)/g,
    /\s+(?=소변\s*(?:검사\s*)?:)/g,
    /\s+(?=요검사\s*:)/g,
    /\s+(?=그람\s*염색\s*:)/g,
    /\s+(?=배양\s*검사\s*:)/g,
    /\s+(?=동맥혈\s*검사\s*:)/g,
    /\s+(?=\[혈액검사[^\]]*\])/g,
    /\s+(?=\[ABGA\])/g,
    /\s+(?=\[혈액\])/g,
    /\s+(?=\[소변\])/g,
    /\s+(?=검사\s*결과\s*:)/g,
    /\s+(?=•\s)/g,
  ];

  let result = text;
  for (const pattern of sectionPatterns) {
    result = result.replace(pattern, "\n");
  }

  // 심도자 검사 테이블 행
  result = result.replace(
    /\s+(?=(?:상대정맥|우심방|우심실|주폐동맥|폐모세혈관|좌심방|좌심실|상행대동맥)\s*\()/g,
    "\n"
  );

  // 연속 줄바꿈 정리
  result = result.replace(/\n{2,}/g, "\n");

  return result;
}
