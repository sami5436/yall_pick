"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { rememberName, saveIdentity, useRememberedName } from "@/lib/identity";
import { Button, Field, Notice, Panel, Screen, Wordmark, inputClass } from "@/components/ui";

type JoinResponse = { code: string; token: string; participantId: string; name: string };

export default function NameGate({ code }: { code: string }) {
  const remembered = useRememberedName();
  const [typed, setTyped] = useState<string | null>(null);
  const name = typed ?? remembered;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function join(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const joined = await api<JoinResponse>(`/api/rooms/${code}/join`, { body: { name } });
      rememberName(joined.name);
      // Saving publishes to the identity store, which is what swaps this
      // screen out for the room itself.
      saveIdentity(code, {
        token: joined.token,
        participantId: joined.participantId,
        name: joined.name,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not join that room.");
      setBusy(false);
    }
  }

  return (
    <Screen>
      <header className="flex flex-col gap-3 pt-4">
        <Wordmark />
        <h1 className="text-2xl font-extrabold tracking-tight">You got invited to pick.</h1>
        <p className="text-muted">
          Room <span className="font-mono font-semibold text-ink">{code}</span>. Your votes stay
          yours. Nobody sees them until everybody is done.
        </p>
      </header>

      <Panel className="rise">
        <form onSubmit={join} className="flex flex-col gap-4">
          <Field label="What should we call you?">
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setTyped(event.target.value)}
              placeholder="Sami"
              maxLength={24}
              autoComplete="given-name"
              autoFocus
              required
            />
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Joining" : "I'm in"}
          </Button>
        </form>
      </Panel>

      <Notice>{error}</Notice>
    </Screen>
  );
}
