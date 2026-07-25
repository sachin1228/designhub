-- Open drafthub to developers without requiring a reviewed application.
-- Existing invited users remain linked to applications; new users use NULL.

ALTER TABLE users
  ALTER COLUMN application_id DROP NOT NULL;

ALTER TABLE designer_profiles
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS website_url text;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;

-- Retire the old designer-only interest options and add developer topics.
UPDATE design_interests
SET is_active = false, updated_at = now()
WHERE name IN (
  'UI / UX Design', 'Product Design', 'Graphic Design', 'Illustration',
  'Visual Design', 'Motion Design', 'Brand Identity', 'Typography',
  'Design Systems', 'User Research', 'Interaction Design',
  'Design Leadership', 'Design Strategy', 'Industrial Design', 'Web Design',
  'Game Design', 'Photography', '3D Design'
);

INSERT INTO design_interests (name) VALUES
  ('Frontend Development'),
  ('Backend Development'),
  ('Full-Stack Development'),
  ('Mobile Development'),
  ('DevOps & Cloud'),
  ('Data Engineering'),
  ('Artificial Intelligence'),
  ('Machine Learning'),
  ('Open Source'),
  ('Web Performance'),
  ('Cybersecurity'),
  ('Developer Tools'),
  ('Testing & Quality'),
  ('Systems Programming'),
  ('Blockchain'),
  ('Game Development'),
  ('Accessibility'),
  ('Technical Writing')
ON CONFLICT (name) DO UPDATE SET is_active = true, updated_at = now();

UPDATE experience_levels
SET name = CASE slug
  WHEN 'junior' THEN 'Junior Developers'
  WHEN 'mid_level' THEN 'Mid-Level Developers'
  WHEN 'senior' THEN 'Senior Developers'
  WHEN 'lead' THEN 'Lead Developers'
  WHEN 'principal' THEN 'Principal Developers'
  WHEN 'staff' THEN 'Staff Developers'
  WHEN 'design_manager' THEN 'Engineering Managers'
  WHEN 'head_of_design' THEN 'Heads of Engineering'
  WHEN 'director' THEN 'Engineering Directors'
  WHEN 'vp' THEN 'VP of Engineering'
  WHEN 'consultant' THEN 'Developer Consultants'
  ELSE name
END
WHERE slug IN (
  'junior', 'mid_level', 'senior', 'lead', 'principal', 'staff',
  'design_manager', 'head_of_design', 'director', 'vp', 'consultant'
);