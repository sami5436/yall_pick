export type Phase = "lobby" | "voting" | "results";

/** -1 no, 0 meh, 1 yes */
export type VoteValue = -1 | 0 | 1;

export type PublicParticipant = {
  id: string;
  name: string;
  isHost: boolean;
  finished: boolean;
};

export type PublicChoice = {
  id: string;
  label: string;
  addedById: string | null;
  addedByName: string | null;
};

export type ResultRow = {
  choiceId: string;
  label: string;
  yes: number;
  meh: number;
  no: number;
  /** nobody who finished voted no on this */
  consensus: boolean;
  score: number;
};

/**
 * Everything a single caller is allowed to know. Note what is absent: other
 * people's individual votes never appear here in any phase. Results are
 * aggregate counts only, and only once the room reaches the results phase.
 */
export type RoomState = {
  room: { code: string; title: string; phase: Phase };
  me: PublicParticipant;
  participants: PublicParticipant[];
  choices: PublicChoice[];
  myVotes: Record<string, VoteValue>;
  results: ResultRow[] | null;
};

export type Identity = {
  token: string;
  participantId: string;
  name: string;
};

/** What each phase component needs: the snapshot, the caller's token, a way to publish a fresh snapshot. */
export type PhaseProps = {
  state: RoomState;
  token: string;
  onState: (next: RoomState) => void;
};
