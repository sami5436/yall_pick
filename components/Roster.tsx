import type { PublicParticipant } from "@/lib/types";

export default function Roster({
  participants,
  meId,
  showDone = false,
}: {
  participants: PublicParticipant[];
  meId: string;
  showDone?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {participants.map((person) => {
        const done = showDone && person.finished;
        return (
          <span
            key={person.id}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
              done
                ? "border-yes/30 bg-yes-soft text-yes"
                : "border-line bg-card text-ink"
            }`}
          >
            {done ? (
              <svg viewBox="0 0 20 20" className="size-3.5" fill="none" aria-hidden>
                <path
                  d="M5 10.5 8.5 14 15 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
            <span className="font-medium">{person.name}</span>
            {person.id === meId ? <span className="text-xs opacity-60">you</span> : null}
            {person.isHost ? <span className="text-xs opacity-60">host</span> : null}
          </span>
        );
      })}
    </div>
  );
}
