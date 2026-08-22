import type { ResultRow, VoteValue } from "./types";

type ChoiceInput = { id: string; label: string };
type VoteInput = { participant_id: string; choice_id: string; value: VoteValue };

/**
 * Turn raw votes into the group result.
 *
 * Only people who finished are counted. Someone who joined and never voted is
 * silent, not a no, so one person wandering off cannot veto every option.
 *
 * A choice reaches consensus when nobody who finished voted no on it. Those
 * always sort above the vetoed ones. Within either group it is score first
 * (yes minus no), then more yes, then fewer meh, then alphabetical so the
 * order is stable across refreshes. Score matters for the vetoed group, where
 * one yes and two vetoes should rank below one yes and one veto.
 */
export function tally(
  choices: ChoiceInput[],
  votes: VoteInput[],
  finishedParticipantIds: string[],
): ResultRow[] {
  const counted = new Set(finishedParticipantIds);
  const rows = new Map<string, ResultRow>();

  for (const choice of choices) {
    rows.set(choice.id, {
      choiceId: choice.id,
      label: choice.label,
      yes: 0,
      meh: 0,
      no: 0,
      consensus: true,
      score: 0,
    });
  }

  for (const vote of votes) {
    if (!counted.has(vote.participant_id)) continue;
    const row = rows.get(vote.choice_id);
    if (!row) continue;
    if (vote.value === 1) row.yes += 1;
    else if (vote.value === 0) row.meh += 1;
    else row.no += 1;
  }

  for (const row of rows.values()) {
    row.consensus = row.no === 0;
    row.score = row.yes - row.no;
  }

  return [...rows.values()].sort(
    (a, b) =>
      Number(b.consensus) - Number(a.consensus) ||
      b.score - a.score ||
      b.yes - a.yes ||
      a.meh - b.meh ||
      a.label.localeCompare(b.label),
  );
}

/** True when at least one choice came through with no vetoes. */
export function hasCleanWinner(rows: ResultRow[]): boolean {
  return rows.length > 0 && rows[0].consensus;
}

/**
 * Every choice the group landed on equally. Usually one, but a small group
 * agreeing on several is the normal case, not an edge case, so the winner
 * card names all of them rather than picking one at random.
 */
export function topTied(rows: ResultRow[]): ResultRow[] {
  if (rows.length === 0) return [];
  const [best] = rows;
  return rows.filter(
    (row) =>
      row.consensus === best.consensus &&
      row.score === best.score &&
      row.yes === best.yes &&
      row.meh === best.meh,
  );
}

/** True when the top spot is shared, so the UI can say so. */
export function isTiedAtTop(rows: ResultRow[]): boolean {
  return topTied(rows).length > 1;
}
