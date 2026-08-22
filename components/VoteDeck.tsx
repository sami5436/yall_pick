"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/client";
import type { PhaseProps, RoomState, VoteValue } from "@/lib/types";
import { Button, Notice, Panel } from "@/components/ui";

const CHOICES: { value: VoteValue; label: string; className: string }[] = [
  { value: -1, label: "No", className: "bg-no-soft text-no border-no/25" },
  { value: 0, label: "Meh", className: "bg-meh-soft text-meh border-meh/25" },
  { value: 1, label: "Yes", className: "bg-yes-soft text-yes border-yes/25" },
];

export default function VoteDeck({ state, token, onState }: PhaseProps) {
  // Local answers so a tap lands instantly. The server copy arrives right
  // behind it and is the one that counts.
  const [answers, setAnswers] = useState<Record<string, VoteValue>>(state.myVotes);
  const [index, setIndex] = useState(() =>
    Math.min(Object.keys(state.myVotes).length, state.choices.length),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const total = state.choices.length;
  const answered = useMemo(
    () => state.choices.filter((choice) => answers[choice.id] !== undefined).length,
    [state.choices, answers],
  );

  async function vote(value: VoteValue) {
    const choice = state.choices[index];
    if (!choice) return;
    setAnswers((prev) => ({ ...prev, [choice.id]: value }));
    setIndex((prev) => Math.min(prev + 1, total));
    setError("");
    try {
      onState(
        await api<RoomState>(`/api/rooms/${state.room.code}/votes`, {
          body: { choiceId: choice.id, value },
          token,
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That vote did not save.");
    }
  }

  async function lockIn() {
    setError("");
    setBusy(true);
    try {
      onState(
        await api<RoomState>(`/api/rooms/${state.room.code}/votes`, {
          body: { finished: true },
          token,
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not lock that in.");
      setBusy(false);
    }
  }

  if (index >= total) {
    return (
      <>
        <Panel className="rise">
          <h2 className="font-bold">Here is what you said</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {state.choices.map((choice) => {
              const value = answers[choice.id];
              const look = CHOICES.find((option) => option.value === value);
              return (
                <li
                  key={choice.id}
                  className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3"
                >
                  <span className="flex-1 font-medium">{choice.label}</span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      look ? look.className : "border-line text-muted"
                    }`}
                  >
                    {look ? look.label : "skipped"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Notice>{error}</Notice>

        <div className="flex flex-col gap-2">
          <Button onClick={lockIn} disabled={busy || answered < total}>
            {busy ? "Locking in" : "Lock in my votes"}
          </Button>
          <Button variant="ghost" onClick={() => setIndex(total - 1)}>
            Go back and change one
          </Button>
        </div>
      </>
    );
  }

  const choice = state.choices[index];
  const existing = answers[choice.id];

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
        <span className="text-sm tabular-nums text-muted">
          {index + 1} of {total}
        </span>
      </div>

      <div
        key={choice.id}
        className="rise grid min-h-52 place-items-center rounded-3xl border border-line bg-card p-8 text-center shadow-sm"
      >
        <p className="text-3xl font-extrabold leading-tight tracking-tight text-balance">
          {choice.label}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {CHOICES.map((option) => (
          <button
            key={option.value}
            onClick={() => vote(option.value)}
            className={`rounded-2xl border-2 py-5 text-lg font-bold transition active:scale-95 ${option.className} ${
              existing === option.value ? "ring-4 ring-ink/10" : ""
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Notice>{error}</Notice>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setIndex((prev) => Math.max(prev - 1, 0))} disabled={index === 0}>
          Back
        </Button>
        <p className="text-xs text-muted">Nobody sees this until everybody is done.</p>
      </div>
    </>
  );
}
