"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import type { PhaseProps, RoomState } from "@/lib/types";
import Roster from "@/components/Roster";
import { Button, Notice, Panel } from "@/components/ui";

export default function Waiting({ state, token, onState }: PhaseProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = state.participants.filter((person) => !person.finished);

  async function call(body: Record<string, unknown>, path = "votes") {
    setError("");
    setBusy(true);
    try {
      onState(await api<RoomState>(`/api/rooms/${state.room.code}/${path}`, { body, token }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not go through.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Panel className="rise text-center">
        <p className="text-5xl" aria-hidden>
          🤠
        </p>
        <h2 className="mt-3 text-xl font-extrabold">You&apos;re locked in.</h2>
        <p className="mt-2 text-muted">
          {pending.length === 0
            ? "That was everybody. Counting it up."
            : `Waiting on ${listNames(pending.map((p) => p.name))}.`}
        </p>
      </Panel>

      <Roster participants={state.participants} meId={state.me.id} showDone />

      <Notice>{error}</Notice>

      <div className="flex flex-col gap-2">
        {state.me.isHost && pending.length > 0 ? (
          <>
            <Button onClick={() => call({}, "reveal")} disabled={busy}>
              Reveal what we have so far
            </Button>
            <p className="text-center text-xs text-muted">
              Counts only the people who finished.
            </p>
          </>
        ) : null}
        <Button variant="ghost" onClick={() => call({ finished: false })} disabled={busy}>
          Change my votes
        </Button>
      </div>
    </>
  );
}

function listNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
