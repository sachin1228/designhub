-- Add is_public flag to communities.
-- Public communities appear in Explore Communities for all members.
-- Private communities are hidden from Explore (invite / auto-join only).
alter table communities
  add column if not exists is_public boolean not null default true;

comment on column communities.is_public is
  'When true the community is visible in Explore Communities. When false it is hidden (admin-managed or invite-only).';
