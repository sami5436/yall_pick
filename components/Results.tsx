"use client";

import Link from "next/link";
import { useState } from "react";
import { hasCleanWinner, topTied } from "@/lib/results";
import type { ResultRow, RoomState } from "@/lib/types";
import { Button, Panel } from "@/components/ui";
import Roster from "@/components/Roster";

export default function Results({ state }: { state: RoomState }) {
  const rows = state.results ?? [];
  const [copied, setCopied] = useState(false);
  const winner = rows[0];
  const clean = hasCleanWinner(rows);
  const tied = topTied(rows);
  const isTie = tied.length > 1;
  const voters = state.participants.filter((person) => person.finished).length;

  async function copyResult() {
    const lines = [
      `${state.room.title}`,
      clean
        ? `Y'all picked: ${tied.map((row) => row.label).join(" or ")}`
        : `No clean winner. Closest: ${winner?.label ?? ""}`,
      "",
      ...rows.map((row) => `${row.label}: ${row.yes} yes, ${row.meh} meh, ${row.no} no`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked. The results are on screen anyway.
    }
  }

  if (!winner) {
    return (
      <Panel>
        <p className="text-muted">Nothing was on the table, so there is nothing to show.</p>
      </Panel>
    );
  }

  return (
    <>
      <div className="rise overflow-hidden rounded-3xl border border-line bg-card text-center shadow-sm">
        <div className="quarters h-1.5" aria-hidden />
        <div className="p-6">
        <p className="text-sm font-bold tracking-wide text-accent uppercase">
          {clean ? (isTie ? "Y'all agreed on all of these" : "Y'all picked") : "No clean winner"}
        </p>
        <p className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-balance">
          {tied.map((row) => row.label).join(" or ")}
        </p>
        <p className="mt-3 text-sm text-muted">
          {clean
            ? `Nobody said no. ${winner.yes} of ${voters} said yes${isTie ? " to each" : ""}.`
            : "Somebody vetoed everything, so here is what came closest."}
        </p>
        </div>
      </div>

      <Panel>
        <h2 className="font-bold">How it shook out</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {rows.map((row) => (
            <Row key={row.choiceId} row={row} voters={voters} />
          ))}
        </ul>
      </Panel>

      <Roster participants={state.participants} meId={state.me.id} showDone />

      <div className="flex flex-col gap-2">
        <Button variant="quiet" onClick={copyResult}>
          {copied ? "Copied" : "Copy the results"}
        </Button>
        <Link
          href="/"
          className="text-center text-sm font-semibold text-muted transition hover:text-ink"
        >
          Start another room
        </Link>
      </div>
    </>
  );
}

function Row({ row, voters }: { row: ResultRow; voters: number }) {
  const total = Math.max(voters, row.yes + row.meh + row.no, 1);
  const segments = [
    { count: row.yes, className: "bg-yes" },
    { count: row.meh, className: "bg-meh" },
    { count: row.no, className: "bg-no" },
  ];

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`font-semibold ${row.consensus ? "" : "text-muted line-through"}`}>
          {row.label}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted">
          {row.yes} yes, {row.meh} meh, {row.no} no
        </span>
      </div>
      <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-line">
        {segments.map((segment, i) =>
          segment.count > 0 ? (
            <div
              key={i}
              className={segment.className}
              style={{ width: `${(segment.count / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
    </li>
  );
}
