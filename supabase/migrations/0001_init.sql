-- Y'all Pick: rooms, participants, choices, private votes.
--
-- Security posture: RLS is enabled with ZERO policies, so `anon` and
-- `authenticated` can read and write nothing. All access goes through Next.js
-- route handlers holding the service-role key, which authorize the caller by
-- their per-room participant token. This is what makes "votes are private"
-- true against devtools, not just true in the UI.

create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  phase text not null default 'lobby' check (phase in ('lobby','voting','results')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms on delete cascade,
  name text not null,
  token text not null,          -- secret; lives only in that person's localStorage
  is_host boolean not null default false,
  finished boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, token)
);

create table choices (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms on delete cascade,
  label text not null,
  added_by uuid references participants on delete set null,
  position int not null,
  created_at timestamptz not null default now()
);

create table votes (
  participant_id uuid not null references participants on delete cascade,
  choice_id uuid not null references choices on delete cascade,
  value smallint not null check (value in (-1, 0, 1)),   -- no / meh / yes
  updated_at timestamptz not null default now(),
  primary key (participant_id, choice_id)
);

create index participants_room_idx on participants (room_id);
create index choices_room_position_idx on choices (room_id, position);
create index votes_choice_idx on votes (choice_id);

alter table rooms        enable row level security;
alter table participants enable row level security;
alter table choices      enable row level security;
alter table votes        enable row level security;
