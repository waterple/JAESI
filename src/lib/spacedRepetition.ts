import type { SRCard, Confidence, Progress } from "@/types";
import { CONFIDENCE_MAP } from "@/types";
import { todayStr } from "./utils";

function newCard(): SRCard {
  return { ease: 2.5, interval: 0, repetitions: 0, nextReview: todayStr() };
}

export function reviewCard(card: SRCard, confidence: Confidence): SRCard {
  const q = CONFIDENCE_MAP[confidence];
  let { ease, interval, repetitions } = card;

  if (q < 3) {
    // fail
    repetitions = 0;
    interval = 1;
  } else {
    repetitions++;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 3;
    else interval = Math.round(interval * ease);
  }

  ease = Math.max(1.3, Math.min(3.0, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  const next = new Date();
  next.setDate(next.getDate() + interval);
  const nextReview = next.toISOString().slice(0, 10);

  return { ease, interval, repetitions, nextReview };
}

export function getDueCards(progress: Progress, allIds: number[]): number[] {
  const today = todayStr();
  return allIds.filter((id) => {
    const card = progress.srData[String(id)];
    if (!card) return false;
    return card.nextReview <= today;
  });
}

export function getNewCards(
  progress: Progress,
  allIds: number[],
  maxNew: number
): number[] {
  const newIds = allIds.filter((id) => !progress.srData[String(id)]);
  return newIds.slice(0, maxNew);
}

export function getOrCreateCard(progress: Progress, questionId: number): SRCard {
  return progress.srData[String(questionId)] || newCard();
}
