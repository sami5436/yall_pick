"use client";

import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { RequestError, api } from "@/lib/client";
import { UNKNOWN, clearIdentity, useIdentity } from "@/lib/identity";
import { browserSupabase } from "@/lib/supabase-browser";
import type { RoomState } from "@/lib/types";
import Lobby from "@/components/Lobby";
import NameGate from "@/components/NameGate";
import Results from "@/components/Results";
import VoteDeck from "@/components/VoteDeck";
import Waiting from "@/components/Waiting";
import { Notice, Screen, Wordmark } from "@/components/ui";

const POLL_MS = 6000;

export default function RoomClient({ code }: { code: string }) {
  const identity = useIdentity(code);
  const token = identity && identity !== UNKNOWN ? identity.token : null;
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setState(await api<RoomState>(`/api/rooms/${code}/state`, { token }));
      setError("");
    } catch (caught) {
      if (caught instanceof RequestError && caught.status === 401) {
        // The room was wiped or this token is stale. Clearing it sends this
        // component back to the name gate through the identity store.
        clearIdentity(code);
        setState(null);
        return;
      }
      setError(caught instanceof Error ? caught.message : "Lost the room for a second.");
    }
  }, [code, token]);

  useEffect(() => {
    if (!token) return;
    // refresh is async and only calls setState after awaiting the response,
    // so this is a promise continuation rather than the synchronous cascade
    // the rule is guarding against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();

    // Broadcast is the fast path. Polling is the safety net for a dropped
    // socket or a phone that just woke up, so the room never sits stale.
    let channel: RealtimeChannel | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      channel = browserSupabase.channel(`room:${code}`);
      channel
        .on("broadcast", { event: "changed" }, () => void refresh())
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            // Drop the dead channel and try again shortly. Until it is back,
            // the poll below is what keeps the room current.
            const dead = channel;
            channel = null;
            if (dead) void browserSupabase.removeChannel(dead);
            if (!stopped) retry = setTimeout(connect, 2000);
          }
        });
    };
    connect();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      if (channel) void browserSupabase.removeChannel(channel);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [code, token, refresh]);

  const applyState = useCallback((next: RoomState) => {
    setState(next);
    setError("");
  }, []);

  if (identity === UNKNOWN) {
    return (
      <Screen>
        <Wordmark small />
        <p className="text-muted">Getting the room.</p>
      </Screen>
    );
  }

  if (!identity) {
    return <NameGate code={code} />;
  }

  if (!state) {
    return (
      <Screen>
        <Wordmark small />
        <Notice>{error}</Notice>
        {error ? null : <p className="text-muted">Getting the room.</p>}
      </Screen>
    );
  }

  const shared = { state, token: identity.token, onState: applyState };

  return (
    <Screen>
      <RoomHeader state={state} />
      <Notice>{error}</Notice>
      {state.room.phase === "lobby" ? <Lobby {...shared} /> : null}
      {state.room.phase === "voting" && !state.me.finished ? <VoteDeck {...shared} /> : null}
      {state.room.phase === "voting" && state.me.finished ? <Waiting {...shared} /> : null}
      {state.room.phase === "results" ? <Results state={state} /> : null}
    </Screen>
  );
}

function RoomHeader({ state }: { state: RoomState }) {
  return (
    <header className="flex flex-col gap-2 pt-2">
      <div className="flex items-center justify-between">
        <Wordmark small />
        <span className="text-sm text-muted">
          {state.participants.length} {state.participants.length === 1 ? "person" : "people"}
        </span>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-balance">{state.room.title}</h1>
    </header>
  );
}
