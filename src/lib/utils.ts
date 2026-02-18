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
  let result = text;

  // 1) 검사 섹션 헤더 (앞에 줄바꿈)
  const sectionHeaders = [
    /,?\s+(?=혈액\s*검사\s*:)/g,
    /,?\s+(?=혈액\s*:)/g,
    /,?\s+(?=뇌척수액\s*(?:검사\s*)?:)/g,
    /,?\s+(?=소변\s*(?:검사\s*)?:)/g,
    /,?\s+(?=요검사\s*:)/g,
    /,?\s+(?=그람\s*염색\s*:)/g,
    /,?\s+(?=배양\s*검사\s*:)/g,
    /,?\s+(?=동맥혈\s*검사\s*:)/g,
    /,?\s+(?=검사\s*결과\s*:)/g,
    /,?\s+(?=•\s)/g,
  ];

  // 2) 대괄호 섹션
  const bracketedSections = [
    /,?\s+(?=\[혈액검사[^\]]*\])/g,
    /,?\s+(?=\[ABGA\])/g,
    /,?\s+(?=\[혈액\])/g,
    /,?\s+(?=\[소변\])/g,
    /,?\s+(?=\[입원[^\]]*\])/g,
    /,?\s+(?=\[의무기록[^\]]*\])/g,
    /,?\s+(?=\[검사[^\]]*\])/g,
  ];

  // 3) 개별 검사 항목 그룹 시작점 (앞에 줄바꿈)
  const labGroupStarters = [
    // 간효소
    /,?\s+(?=AST[/\s:])/g,
    /,?\s+(?=아스파르?트?산?\s*아미노)/g,
    // 빌리루빈
    /,?\s+(?=총\s*빌리루빈)/g,
    // 신기능
    /,?\s+(?=혈액요소질소)/g,
    /,?\s+(?=BUN[/\s])/g,
    // 응고
    /,?\s+(?=프로트롬빈)/g,
    // 담도계
    /,?\s+(?=알칼리인산분해효소)/g,
    /,?\s+(?=감마글루타밀전달효소)/g,
    // 췌장
    /,?\s+(?=아밀라아제)/g,
    /,?\s+(?=녹말분해효소)/g,
    /,?\s+(?=리파아제)/g,
    /,?\s+(?=지방분해효소)/g,
    // 혈당/대사
    /,?\s+(?=혈당\s*:?\s*\d)/g,
    /,?\s+(?=공복혈당)/g,
    /,?\s+(?=HbA1[cC])/g,
    // 암모니아
    /,?\s+(?=암모니아)/g,
    // 혈액가스
    /,?\s+(?=ABGA\s)/g,
    // 혈청학
    /,?\s+(?=HBsAg)/g,
    /,?\s+(?=HBeAg)/g,
    /,?\s+(?=IgG[\s-])/g,
    /,?\s+(?=IgM[\s-])/g,
    // 심근표지자
    /,?\s+(?=CK-MB)/g,
    /,?\s+(?=Troponin)/g,
    /,?\s+(?=심근효소)/g,
    // 염증표지자
    /,?\s+(?=CRP[\s:])/g,
    /,?\s+(?=C-?반응단백질)/g,
    /,?\s+(?=적혈구침강속도)/g,
    /,?\s+(?=ESR\s)/g,
    // 알부민 (뒤에 숫자가 올 때만 = 검사값 맥락)
    /,?\s+(?=알부민\s*:?\s*\d)/g,
    // 산소포화도
    /,?\s+(?=산소포화도)/g,
    // serum/urine 접두어
    /,?\s+(?=serum\s)/gi,
    /,?\s+(?=urine\s)/gi,
  ];

  for (const p of [...sectionHeaders, ...bracketedSections, ...labGroupStarters]) {
    result = result.replace(p, "\n");
  }

  // 4) 심도자 검사 테이블 행
  result = result.replace(
    /\s+(?=(?:상대정맥|우심방|우심실|주폐동맥|폐모세혈관|좌심방|좌심실|상행대동맥)\s*\()/g,
    "\n",
  );

  // 5) 연속 줄바꿈 정리
  result = result.replace(/\n{2,}/g, "\n");

  return result;
}
