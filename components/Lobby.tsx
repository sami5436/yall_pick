"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import type { PhaseProps, RoomState } from "@/lib/types";
import ShareBar from "@/components/ShareBar";
import { Button, Notice, Panel, inputClass } from "@/components/ui";
import Roster from "@/components/Roster";

export default function Lobby({ state, token, onState }: PhaseProps) {
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const host = state.participants.find((p) => p.isHost);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!label.trim()) return;
    setError("");
    setBusy(true);
    try {
      onState(
        await api<RoomState>(`/api/rooms/${state.room.code}/choices`, { body: { label }, token }),
      );
      setLabel("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add that.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      onState(
        await api<RoomState>(`/api/rooms/${state.room.code}/choices/${id}`, {
          method: "DELETE",
          token,
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove that.");
    }
  }

  async function start() {
    setError("");
    setBusy(true);
    try {
      onState(
        await api<RoomState>(`/api/rooms/${state.room.code}/start`, { body: {}, token }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start voting.");
      setBusy(false);
    }
  }

  return (
    <>
      <ShareBar code={state.room.code} title={state.room.title} />
      <Roster participants={state.participants} meId={state.me.id} />

      <Panel>
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold">On the table</h2>
          <span className="text-sm text-muted">{state.choices.length}</span>
        </div>

        {state.choices.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Nothing yet. Throw in a couple of ideas and let everybody else pile on.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {state.choices.map((choice) => {
              const mine = choice.addedById === state.me.id;
              const canRemove = mine || state.me.isHost;
              return (
                <li
                  key={choice.id}
                  className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3"
                >
                  <span className="flex-1 font-medium">{choice.label}</span>
                  <span className="text-xs text-muted">{mine ? "you" : choice.addedByName}</span>
                  {canRemove ? (
                    <button
                      onClick={() => remove(choice.id)}
                      aria-label={`Remove ${choice.label}`}
                      className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-no-soft hover:text-no"
                    >
                      <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
                        <path
                          d="M6 6l8 8M14 6l-8 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={add} className="mt-4 flex gap-2">
          <input
            className={inputClass}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Add an idea"
            maxLength={80}
            autoComplete="off"
          />
          <Button type="submit" variant="quiet" disabled={busy || !label.trim()}>
            Add
          </Button>
        </form>
      </Panel>

      <Notice>{error}</Notice>

      {state.me.isHost ? (
        <div className="flex flex-col gap-2">
          <Button onClick={start} disabled={busy || state.choices.length < 2}>
            Start voting
          </Button>
          {state.choices.length < 2 ? (
            <p className="text-center text-xs text-muted">
              Two choices minimum, otherwise there is nothing to pick between.
            </p>
          ) : (
            <p className="text-center text-xs text-muted">
              This locks the list for everybody.
            </p>
          )}
        </div>
      ) : (
        <p className="text-center text-sm text-muted">
          Keep adding ideas. {host ? host.name : "The host"} starts the voting.
        </p>
      )}
    </>
  );
}
