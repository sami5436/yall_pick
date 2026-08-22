"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { normalizeCode } from "@/lib/codes";
import { rememberName, saveIdentity, useRememberedName } from "@/lib/identity";
import { Button, Field, Notice, Panel, Screen, Wordmark, inputClass } from "@/components/ui";

type CreateResponse = { code: string; token: string; participantId: string; name: string };

export default function Landing() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const remembered = useRememberedName();
  const [typed, setTyped] = useState<string | null>(null);
  const name = typed ?? remembered;
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createRoom(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const room = await api<CreateResponse>("/api/rooms", { body: { title, name } });
      rememberName(room.name);
      saveIdentity(room.code, {
        token: room.token,
        participantId: room.participantId,
        name: room.name,
      });
      router.push(`/r/${room.code}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the room.");
      setBusy(false);
    }
  }

  function goToRoom(event: React.FormEvent) {
    event.preventDefault();
    const code = normalizeCode(joinCode);
    if (code.length < 4) {
      setError("That code looks too short.");
      return;
    }
    router.push(`/r/${code}`);
  }

  return (
    <Screen>
      <header className="flex flex-col gap-3 pt-4">
        <Wordmark />
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-balance">
          Settle it without the group chat.
        </h1>
        <p className="text-muted">
          Everybody votes in private. When the last person finishes, the app shows what y&apos;all
          actually agree on.
        </p>
      </header>

      <Panel className="rise">
        <form onSubmit={createRoom} className="flex flex-col gap-4">
          <Field label="What are y'all deciding?">
            <input
              className={inputClass}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Dinner Friday"
              maxLength={80}
              autoComplete="off"
              required
            />
          </Field>
          <Field label="Your name">
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setTyped(event.target.value)}
              placeholder="Sami"
              maxLength={24}
              autoComplete="given-name"
              required
            />
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Setting it up" : "Start a room"}
          </Button>
        </form>
      </Panel>

      <Notice>{error}</Notice>

      <form onSubmit={goToRoom} className="flex items-end gap-2">
        <div className="flex-1">
          <Field label="Got a code?">
            <input
              className={`${inputClass} font-mono uppercase tracking-[0.3em]`}
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="K4M2PQ"
              maxLength={8}
              autoComplete="off"
              autoCapitalize="characters"
            />
          </Field>
        </div>
        <Button type="submit" variant="quiet">
          Join
        </Button>
      </form>

      <ol className="mt-2 flex flex-col gap-3 text-sm text-muted">
        <Step n={1}>Start a room and send the link.</Step>
        <Step n={2}>Everybody piles on their ideas.</Step>
        <Step n={3}>Vote yes, meh or no on each one, privately.</Step>
        <Step n={4}>See the ones nobody vetoed.</Step>
      </ol>
    </Screen>
  );
}

// One step per quarter of the mark, in the same order.
const STEP_LOOKS = [
  "bg-no-soft text-no",
  "bg-meh-soft text-meh",
  "bg-yes-soft text-yes",
  "bg-accent-soft text-accent",
];

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
          STEP_LOOKS[(n - 1) % STEP_LOOKS.length]
        }`}
      >
        {n}
      </span>
      {children}
    </li>
  );
}
