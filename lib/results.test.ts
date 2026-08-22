import assert from "node:assert/strict";
import test from "node:test";
import { hasCleanWinner, isTiedAtTop, tally, topTied } from "./results.ts";
import type { VoteValue } from "./types.ts";

const choices = [
  { id: "tacos", label: "Tacos" },
  { id: "pizza", label: "Pizza" },
  { id: "sushi", label: "Sushi" },
];

const vote = (participant: string, choice: string, value: VoteValue) => ({
  participant_id: participant,
  choice_id: choice,
  value,
});

test("a choice nobody vetoed wins, ranked by yes count", () => {
  const rows = tally(
    choices,
    [
      vote("a", "tacos", 1),
      vote("a", "pizza", 1),
      vote("a", "sushi", -1),
      vote("b", "tacos", 1),
      vote("b", "pizza", 0),
      vote("b", "sushi", 1),
    ],
    ["a", "b"],
  );

  assert.equal(rows[0].label, "Tacos");
  assert.equal(rows[0].yes, 2);
  assert.equal(rows[0].consensus, true);
  assert.equal(hasCleanWinner(rows), true);

  // Pizza survives on zero vetoes and outranks the sushi somebody killed.
  assert.deepEqual(
    rows.map((row) => row.label),
    ["Tacos", "Pizza", "Sushi"],
  );
  assert.equal(rows[2].consensus, false);
});

test("fewer meh breaks a tie on yes count", () => {
  const rows = tally(
    [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Bravo" },
    ],
    [
      vote("p1", "a", 1),
      vote("p1", "b", 1),
      vote("p2", "a", 0),
      vote("p2", "b", 1),
    ],
    ["p1", "p2"],
  );

  assert.equal(rows[0].label, "Bravo");
  assert.equal(isTiedAtTop(rows), false);
});

test("a genuine tie is reported as one", () => {
  const rows = tally(
    [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Bravo" },
    ],
    [vote("p1", "a", 1), vote("p1", "b", 1)],
    ["p1"],
  );

  assert.equal(isTiedAtTop(rows), true);
});

test("everything vetoed means no clean winner, closest still ranks first", () => {
  const rows = tally(
    choices,
    [
      vote("a", "tacos", 1),
      vote("a", "pizza", -1),
      vote("a", "sushi", -1),
      vote("b", "tacos", -1),
      vote("b", "pizza", -1),
      vote("b", "sushi", -1),
    ],
    ["a", "b"],
  );

  assert.equal(hasCleanWinner(rows), false);
  assert.equal(rows[0].label, "Tacos");
  assert.equal(rows[0].yes, 1);
});

test("somebody who joined but never finished is silent, not a veto", () => {
  const rows = tally(
    choices,
    [
      vote("a", "tacos", 1),
      vote("a", "pizza", 1),
      vote("a", "sushi", 1),
      // b is still voting, and hated everything so far.
      vote("b", "tacos", -1),
      vote("b", "pizza", -1),
    ],
    ["a"],
  );

  assert.equal(hasCleanWinner(rows), true);
  assert.equal(rows.every((row) => row.consensus), true);
  assert.equal(rows[0].yes, 1);
});

test("one person deciding alone still gets a result", () => {
  const rows = tally(choices, [vote("a", "tacos", 1), vote("a", "pizza", 0), vote("a", "sushi", -1)], [
    "a",
  ]);

  assert.equal(rows[0].label, "Tacos");
  assert.equal(rows[2].label, "Sushi");
  assert.equal(rows[2].consensus, false);
});

test("no votes at all does not crash", () => {
  const rows = tally(choices, [], []);
  assert.equal(rows.length, 3);
  assert.equal(rows.every((row) => row.consensus), true);
});

test("among vetoed choices, more vetoes ranks lower", () => {
  const rows = tally(
    [
      { id: "hated", label: "Hated" },
      { id: "mixed", label: "Mixed" },
    ],
    [
      // Both got one yes, but Hated took two vetoes to Mixed's one.
      vote("a", "hated", 1),
      vote("b", "hated", -1),
      vote("c", "hated", -1),
      vote("a", "mixed", 1),
      vote("b", "mixed", 0),
      vote("c", "mixed", -1),
    ],
    ["a", "b", "c"],
  );

  assert.equal(hasCleanWinner(rows), false);
  assert.deepEqual(
    rows.map((row) => row.label),
    ["Mixed", "Hated"],
  );
});

test("a shared top spot names every choice that tied", () => {
  const rows = tally(
    [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Bravo" },
      { id: "c", label: "Charlie" },
    ],
    [
      vote("p1", "a", 1),
      vote("p1", "b", 1),
      vote("p1", "c", 0),
      vote("p2", "a", 1),
      vote("p2", "b", 1),
      vote("p2", "c", 1),
    ],
    ["p1", "p2"],
  );

  // Alpha and Bravo both took two yes votes; Charlie only one.
  assert.deepEqual(
    topTied(rows).map((row) => row.label),
    ["Alpha", "Bravo"],
  );
  assert.equal(isTiedAtTop(rows), true);
});

test("a clear winner is not reported as a tie", () => {
  const rows = tally(
    [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Bravo" },
    ],
    [vote("p1", "a", 1), vote("p1", "b", 0)],
    ["p1"],
  );

  assert.deepEqual(topTied(rows).map((row) => row.label), ["Alpha"]);
  assert.equal(isTiedAtTop(rows), false);
});
