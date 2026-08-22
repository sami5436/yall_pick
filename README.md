# Y'all Pick

Settle it without the group chat. One person starts a room and shares the link,
everybody piles on ideas, then each person votes yes, meh or no on every choice
in private. When the last person finishes, the app shows what the group agrees
on.

## How a room works

1. **Lobby.** Anyone in the room can add or remove ideas. The host taps Start
   voting, which locks the list.
2. **Voting.** One card at a time. Every tap saves immediately, so a dropped
   phone loses nothing. A review screen comes last, before you lock in.
3. **Results.** Revealed automatically the moment everybody has finished. The
   host can also reveal early, which counts only the people who finished.

A choice wins if nobody who finished voted no on it. Survivors rank by yes
count, then by fewest meh. If every choice got vetoed, the app says so plainly
instead of crowning something somebody hated.

## Vote privacy

The point of the app is that nobody sees your votes while they are making up
their own mind, so that has to hold against someone opening devtools, not just
in the UI.

- Every table has RLS enabled with **zero policies**, so the anon key can read
  nothing and write nothing. Verified: an anon `select` on any table returns an
  empty set, and an anon `insert` is refused.
- All reads and writes go through Next.js route handlers using the service role
  key, which never reaches the browser. Each one authorizes the caller by their
  per room participant token.
- `lib/state.ts` is the only place room data gets shaped for a browser. It
  returns your own votes, everybody's names and finished flags, and results only
  once the room is in the results phase, as aggregate counts with no per person
  attribution.
- Realtime carries **no data**. Clients subscribe to a public broadcast channel
  and the server sends a contentless nudge after each mutation. Every client
  then refetches its own authorized state. A leaked nudge tells an eavesdropper
  only that something changed.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in the three Supabase values
npm run dev
```

Get the keys from the Supabase dashboard under Project Settings, API Keys. The
`service_role` key is a secret and belongs only in `.env.local` and your host's
environment variables.

| Script | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm test` | Unit tests for the tally and ranking rules |
| `npm run lint` | ESLint |
| `npm run build` | Production build, includes a type check |

## Deploying

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SITE_URL` in your host.

`NEXT_PUBLIC_SITE_URL` must be the real origin. Link previews in iMessage and
elsewhere fetch `og:image` as an absolute URL, so previews stay blank until it
is set. Room links generate their own preview image showing the room title.

## Layout

```
app/api/rooms/...      route handlers, the only path to room data
app/r/[code]/          the room page and its link preview image
components/            one component per phase, plus shared UI
lib/results.ts         the tally and ranking rules, pure and unit tested
lib/state.ts           builds the snapshot a single caller may see
lib/api.ts             token auth, error shapes, the realtime nudge
supabase/migrations/   schema
```
