-- ============================================================
-- AI Moderation System
-- ============================================================

-- ─── Moderation status enum ──────────────────────────────────
create type moderation_status as enum ('approved', 'rejected', 'review');

-- ─── Moderation logs (every AI decision) ─────────────────────
create table if not exists moderation_logs (
  id              uuid primary key default gen_random_uuid(),
  content_type    text        not null,          -- 'message', 'image', 'bio', 'username'
  content_id      uuid,                          -- null when content was rejected (never saved)
  content_preview text,                          -- first 300 chars of text, or image key
  user_id         uuid references users(id) on delete set null,
  community_id    uuid references communities(id) on delete set null,
  provider        text        not null,          -- 'openai', 'nudenet', 'custom_rules'
  status          moderation_status not null,
  confidence      float,
  reason          text,
  raw_response    jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_moderation_logs_user_id      on moderation_logs (user_id);
create index if not exists idx_moderation_logs_status       on moderation_logs (status);
create index if not exists idx_moderation_logs_content_type on moderation_logs (content_type);
create index if not exists idx_moderation_logs_created_at   on moderation_logs (created_at desc);
create index if not exists idx_moderation_logs_content_id   on moderation_logs (content_id);

-- ─── Add moderation columns to community_messages ────────────
alter table community_messages
  add column if not exists moderation_status moderation_status not null default 'approved',
  add column if not exists moderation_log_id uuid references moderation_logs(id) on delete set null;

create index if not exists idx_messages_moderation_status on community_messages (moderation_status);

-- ─── User punishments ────────────────────────────────────────
create type punishment_type as enum ('warning', 'mute', 'temp_ban', 'perm_ban');

create table if not exists user_punishments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid        not null references users(id) on delete cascade,
  type           punishment_type not null,
  reason         text        not null,
  expires_at     timestamptz,                    -- null = permanent
  moderator_note text,
  created_by     text        not null,           -- admin email
  created_at     timestamptz not null default now(),
  revoked_at     timestamptz,
  revoked_by     text
);

create index if not exists idx_punishments_user_id    on user_punishments (user_id);
create index if not exists idx_punishments_type       on user_punishments (type);
create index if not exists idx_punishments_expires_at on user_punishments (expires_at);

-- ─── Content reports (user-submitted) ────────────────────────
create type report_reason as enum (
  'spam', 'harassment', 'hate', 'violence',
  'nudity', 'scam', 'copyright', 'other'
);
create type report_status as enum ('pending', 'resolved_approve', 'resolved_reject');

create table if not exists content_reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid        not null references users(id) on delete cascade,
  content_type   text        not null,           -- 'message', 'image'
  content_id     uuid        not null,
  community_id   uuid references communities(id) on delete set null,
  reason         report_reason not null,
  description    text,
  status         report_status not null default 'pending',
  resolved_by    text,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  -- prevent duplicate reports for the same content from the same user
  unique (reporter_id, content_type, content_id)
);

create index if not exists idx_reports_status       on content_reports (status);
create index if not exists idx_reports_content_id   on content_reports (content_id);
create index if not exists idx_reports_reporter_id  on content_reports (reporter_id);
create index if not exists idx_reports_created_at   on content_reports (created_at desc);

-- ─── Moderation audit log (admin actions) ────────────────────
create table if not exists moderation_audit_log (
  id                  uuid primary key default gen_random_uuid(),
  moderator_email     text not null,
  action              text not null,             -- 'approve', 'reject', 'warn', 'ban', 'delete', 'resolve_report'
  target_user_id      uuid references users(id) on delete set null,
  target_content_type text,
  target_content_id   uuid,
  reason              text,
  metadata            jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists idx_audit_log_moderator on moderation_audit_log (moderator_email);
create index if not exists idx_audit_log_created   on moderation_audit_log (created_at desc);

-- ─── Moderation settings ─────────────────────────────────────
create table if not exists moderation_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Default settings
insert into moderation_settings (key, value) values
  ('openai_enabled',          'true'),
  ('nudenet_enabled',         'false'),
  ('nudenet_url',             ''),
  ('auto_reject_threshold',   '0.85'),
  ('review_threshold',        '0.60'),
  ('max_image_size_mb',       '20'),
  ('allowed_image_formats',   'jpeg,jpg,png,webp,gif,heic,heif')
on conflict (key) do nothing;

-- ─── RLS ─────────────────────────────────────────────────────
alter table moderation_logs       enable row level security;
alter table user_punishments      enable row level security;
alter table content_reports       enable row level security;
alter table moderation_audit_log  enable row level security;
alter table moderation_settings   enable row level security;
