-- ============================================================
-- Back in BeesKnees — Supabase Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor)
-- ============================================================


-- ── Tables ───────────────────────────────────────────────────

-- Role attached to each auth user. Defaults to 'mom' via trigger (see below).
-- To make an account a PT, run:
--   update profiles set role = 'pt' where id = '<user-uuid>';
create table profiles (
  id   uuid primary key references auth.users on delete cascade,
  role text not null default 'mom' check (role in ('mom', 'pt'))
);

-- Exercise library. PT controls unlocked state and parameters.
create table exercises (
  id         uuid primary key default gen_random_uuid(),
  name       text    not null,
  nickname   text,
  notes      text,
  category   text    not null default 'Strength',
  sets       integer not null default 3,
  reps       integer not null default 8,
  unlocked   boolean not null default false,
  sort_order integer,
  created_at timestamptz default now()
);

-- One row per completed set per exercise per day per user.
-- set_index is 0-based (set 0, 1, 2 … up to exercises.sets - 1).
-- A row existing = that set was completed. Deleting the row = unchecked.
create table set_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid    not null references auth.users on delete cascade,
  exercise_id uuid    not null references exercises   on delete cascade,
  date        date    not null,
  set_index   integer not null,
  logged_at   timestamptz default now(),
  unique (user_id, exercise_id, date, set_index)
);

-- Equipment catalog (managed by PT).
create table equipment (
  id         uuid primary key default gen_random_uuid(),
  name       text    not null,
  sort_order integer
);

-- Mom's equipment checklist (which items she has at home).
create table user_equipment (
  user_id      uuid references auth.users on delete cascade,
  equipment_id uuid references equipment  on delete cascade,
  primary key (user_id, equipment_id)
);


-- ── Helper function ───────────────────────────────────────────

-- Used by RLS policies to check the caller's role without a join.
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;


-- ── Auto-create profile on signup ─────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ── Row Level Security ────────────────────────────────────────

alter table profiles      enable row level security;
alter table exercises     enable row level security;
alter table set_logs      enable row level security;
alter table equipment     enable row level security;
alter table user_equipment enable row level security;

-- profiles: each user sees only their own row
create policy "own profile" on profiles
  for select using (id = auth.uid());

-- exercises: everyone can read; only PT can write
create policy "read exercises" on exercises
  for select using (true);

create policy "pt manages exercises" on exercises
  for all using (get_my_role() = 'pt');

-- set_logs: mom manages her own; PT can read all
create policy "own set logs" on set_logs
  for all using (user_id = auth.uid());

create policy "pt reads all logs" on set_logs
  for select using (get_my_role() = 'pt');

-- equipment: everyone reads; PT manages
create policy "read equipment" on equipment
  for select using (true);

create policy "pt manages equipment" on equipment
  for all using (get_my_role() = 'pt');

-- user_equipment: own rows only
create policy "own equipment list" on user_equipment
  for all using (user_id = auth.uid());


-- ── Seed Data ─────────────────────────────────────────────────

insert into exercises (name, nickname, notes, category, sets, reps, unlocked, sort_order) values
  ('Straight Leg Raise',      'Morning Sunbeam', 'Keep core tight, lift to 45°. Slow and steady wins the race!', 'Strength',   3, 8, true,  1),
  ('Heel Slides',             'Happy Ankles',    'Slide as far as comfortable. Don''t push through pain.',         'Mobility',   3, 8, true,  2),
  ('Terminal Knee Extension', 'Knee Kickbacks',  'Use the resistance band. Feel that quad activate!',             'Strength',   3, 8, true,  3),
  ('Glute Bridges',           'Bridge Builder',  'Squeeze glutes at the top. Hold for 2 seconds.',               'Strength',   3, 8, false, 4),
  ('Mini Squats',             'Baby Squats',     'Only go to 30° bend. Use wall for balance.',                   'Functional', 3, 8, false, 5),
  ('Standing Balance',        'Flamingo Pose',   'Fix gaze on a point on the wall. Breathe!',                    'Balance',    3, 8, false, 6);

insert into equipment (name, sort_order) values
  ('Resistance Band (Light)',  1),
  ('Resistance Band (Medium)', 2),
  ('Foam Roller',              3),
  ('Exercise Mat',             4),
  ('Balance Board',            5),
  ('Ice Pack',                 6),
  ('Ankle Weights',            7);
