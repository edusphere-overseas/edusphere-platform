-- =====================================================================
-- Edusphere student and parent portal (Step 4)
--
-- Accounts and roles, family links, consent, student profiles, documents,
-- applications, service requests, messages, leads and the activity log.
--
-- Every table has row level security. Helper functions live in the schema
-- "private", which the website's API does not expose. Changes that need
-- extra checks (onboarding, family links) go through functions; document
-- uploads are confirmed by the server only after it has checked the file.
-- =====================================================================

create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text check (role in ('student', 'parent', 'counsellor', 'admin', 'editor')),
  full_name text not null default '' check (char_length(full_name) <= 120),
  email text not null default '',
  phone text check (char_length(phone) <= 30),
  onboarded_at timestamptz,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per account. Role is chosen at sign-up (student or parent); staff roles are set by an admin.';
create index profiles_email_idx on public.profiles (lower(email));

create function private.new_link_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O, 1/I/L
  b bytea := extensions.gen_random_bytes(8);
  code text := '';
begin
  for i in 0..7 loop
    code := code || substr(alphabet, 1 + (get_byte(b, i) % 31), 1);
  end loop;
  return code;
end $$;

create table public.student_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth date check (date_of_birth > date '1940-01-01'),
  city text check (char_length(city) <= 80),
  preferred_countries text[] not null default '{}' check (cardinality(preferred_countries) <= 10),
  preferred_level text check (char_length(preferred_level) <= 60),
  preferred_course text check (char_length(preferred_course) <= 160),
  preferred_intake text check (char_length(preferred_intake) <= 40),
  academic_history jsonb not null default '[]' check (jsonb_typeof(academic_history) = 'array' and pg_column_size(academic_history) < 16000),
  test_scores jsonb not null default '[]' check (jsonb_typeof(test_scores) = 'array' and pg_column_size(test_scores) < 8000),
  work_experience text check (char_length(work_experience) <= 2000),
  funding text check (char_length(funding) <= 60),
  counsellor_id uuid references public.profiles (id) on delete set null,
  office text not null default 'mangalore',
  link_code text not null unique default private.new_link_code(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.student_profiles.link_code is 'Code a parent can enter to ask to link; the student still approves.';
create index student_profiles_counsellor_idx on public.student_profiles (counsellor_id);

create table public.parent_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  relationship text not null default 'Parent' check (relationship in ('Mother', 'Father', 'Parent', 'Guardian')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'removed')),
  requested_via text not null check (requested_via in ('email', 'code', 'invite')),
  requested_as text check (char_length(requested_as) <= 254), -- what the parent typed, shown to them while pending
  guardian_confirmed_at timestamptz not null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, student_id),
  check (parent_id <> student_id)
);
create index parent_links_student_idx on public.parent_links (student_id);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('data_processing', 'guardian')),
  version text not null check (char_length(version) <= 40),
  student_id uuid references public.profiles (id) on delete cascade, -- for guardian confirmations
  given_at timestamptz not null default now()
);
comment on table public.consents is 'Consent to process data and share documents with universities and visa authorities; parents confirming they are the parent or legal guardian.';
create index consents_user_idx on public.consents (user_id);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  university text not null check (char_length(university) between 1 and 160),
  course text not null default '' check (char_length(course) <= 200),
  country text check (char_length(country) <= 40), -- destination id, e.g. uk, australia
  intake text check (char_length(intake) <= 40),
  stage text not null default 'counselling'
    check (stage in ('counselling', 'shortlist', 'applied', 'offer', 'deposit', 'cas', 'visa_filed', 'visa_granted', 'pre_departure')),
  status text not null default 'active' check (status in ('active', 'withdrawn', 'unsuccessful')),
  deadline date,
  note text check (char_length(note) <= 1000), -- shown to the student and linked parents
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_student_idx on public.applications (student_id);

create table public.application_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  stage text not null,
  status text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index application_events_app_idx on public.application_events (application_id);

create function private.service_steps(service text) returns text[]
language sql immutable set search_path = '' as $$
  select case service
    when 'airport_pickup' then array['requested', 'confirmed', 'details_sent', 'completed']
    when 'accommodation' then array['requested', 'options_sent', 'booked', 'completed']
    when 'post_study_work_visa' then array['requested', 'eligibility_checked', 'documents_ready', 'submitted', 'decision']
    when 'scholarship' then array['requested', 'shortlist_sent', 'applied', 'result']
    when 'uk_onshore' then array['requested', 'eligibility_checked', 'admission_applied', 'visa_submitted', 'decision']
  end
$$;

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  service text not null check (service in ('airport_pickup', 'accommodation', 'post_study_work_visa', 'scholarship', 'uk_onshore')),
  status text not null default 'requested',
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object' and pg_column_size(details) < 8000),
  price text check (char_length(price) <= 60), -- price shown when the request was made; empty when free or not set
  payment_status text not null default 'not_required' check (payment_status in ('not_required', 'awaiting', 'confirmed')),
  assigned_to uuid references public.profiles (id) on delete set null,
  requested_by uuid references public.profiles (id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'cancelled' or status = any (private.service_steps(service)))
);
create index service_requests_student_idx on public.service_requests (student_id);

create table public.service_request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.service_requests (id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index service_request_events_req_idx on public.service_request_events (request_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  doc_type text not null check (doc_type ~ '^[a-z0-9_]{2,40}$'),
  label text check (char_length(label) <= 120),
  application_id uuid references public.applications (id) on delete set null,
  service_request_id uuid references public.service_requests (id) on delete set null,
  file_key text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 160),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes between 1 and 10485760), -- 10 MB
  status text not null default 'uploading' check (status in ('uploading', 'under_review', 'approved', 'reupload', 'replaced')),
  replaces uuid references public.documents (id) on delete set null,
  reviewer_reason text check (char_length(reviewer_reason) <= 500),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- the storage key is tied to the student and the row, so a row can never point at another student's file
  check (file_key like 'students/' || student_id::text || '/' || id::text || '/%')
);
create index documents_student_idx on public.documents (student_id, doc_type);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  service_request_id uuid references public.service_requests (id) on delete cascade, -- empty: the general thread with the counsellor
  sender_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  sender_name text, -- filled in by the database, so families see who wrote without seeing staff profiles
  sender_role text,
  created_at timestamptz not null default now()
);
create index messages_student_idx on public.messages (student_id, service_request_id, created_at);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('portal_signup', 'website_enquiry', 'booking', 'programme')),
  profile_id uuid unique references public.profiles (id) on delete set null,
  name text check (char_length(name) <= 120),
  email text check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 30),
  interest text check (char_length(interest) <= 200),
  message text check (char_length(message) <= 4000),
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  assigned_to uuid references public.profiles (id) on delete set null,
  office text not null default 'mangalore',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.leads is 'Enquiry inbox: website enquiries and every new verified portal account.';
create index leads_status_idx on public.leads (status, created_at desc);

create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  student_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
comment on table public.activity_log is 'Who viewed, downloaded, approved or changed records.';
create index activity_log_student_idx on public.activity_log (student_id, created_at desc);
create index activity_log_actor_idx on public.activity_log (actor_id, action, created_at desc);

-- ---------------------------------------------------------------------
-- Access helpers (security definer, so policies don't recurse)
-- ---------------------------------------------------------------------

create function private.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_role() = 'admin', false)
$$;

create function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_role() in ('counsellor', 'admin'), false)
$$;

create function private.is_linked_parent(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.parent_links
    where parent_id = (select auth.uid()) and student_id = sid and status = 'approved'
  )
$$;

-- Can the signed-in person see this student's records?
create function private.can_view_student(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    (sid = (select auth.uid()) and private.my_role() = 'student')
    or private.is_admin()
    or (private.my_role() = 'counsellor' and exists (
          select 1 from public.student_profiles where user_id = sid and counsellor_id = (select auth.uid())))
    or private.is_linked_parent(sid)
$$;

-- The student themselves, or an approved parent (requests, messages, uploads)
create function private.can_act_for_student(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select (sid = (select auth.uid()) and private.my_role() = 'student') or private.is_linked_parent(sid)
$$;

create function private.student_is_adult(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select date_of_birth <= (current_date - interval '18 years')::date
                   from public.student_profiles where user_id = sid), false)
$$;

create function private.has_approved_parent(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.parent_links where student_id = sid and status = 'approved')
$$;

-- Under-18 students need an approved parent link before documents are uploaded (DPDP Act).
create function private.can_upload_for(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    (private.is_staff() and private.can_view_student(sid))
    or (private.can_act_for_student(sid) and (private.student_is_adult(sid) or private.has_approved_parent(sid)))
$$;

-- Profiles a person may see: their own, students they can view, those students'
-- counsellors, staff (for staff), and both sides of their own family links.
create function private.can_see_profile(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    pid = (select auth.uid())
    or private.is_admin()
    or private.can_view_student(pid)
    or exists (select 1 from public.student_profiles sp
               where sp.counsellor_id = pid and private.can_view_student(sp.user_id))
    or (private.is_staff() and exists (select 1 from public.profiles p where p.id = pid and p.role in ('counsellor', 'admin', 'editor')))
    or (private.is_staff() and exists (select 1 from public.parent_links l where l.parent_id = pid and private.can_view_student(l.student_id)))
    or exists (select 1 from public.parent_links l
               where l.student_id = (select auth.uid()) and l.parent_id = pid and l.status in ('pending', 'approved'))
$$;

create function private.log(p_actor uuid, p_student uuid, p_action text, p_entity text, p_entity_id uuid, p_details jsonb default '{}')
returns void language sql security definer set search_path = '' as $$
  insert into public.activity_log (actor_id, student_id, action, entity, entity_id, details)
  values (p_actor, p_student, p_action, p_entity, p_entity_id, coalesce(p_details, '{}'))
$$;

grant execute on all functions in schema private to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger touch before update on public.profiles for each row execute function private.touch_updated_at();
create trigger touch before update on public.student_profiles for each row execute function private.touch_updated_at();
create trigger touch before update on public.parent_links for each row execute function private.touch_updated_at();
create trigger touch before update on public.applications for each row execute function private.touch_updated_at();
create trigger touch before update on public.service_requests for each row execute function private.touch_updated_at();
create trigger touch before update on public.documents for each row execute function private.touch_updated_at();
create trigger touch before update on public.leads for each row execute function private.touch_updated_at();

-- New account: profile (+ student details, + consent when given at sign-up).
-- Only "student" or "parent" is accepted from sign-up data; staff roles are set by an admin.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}');
  r text := meta ->> 'role';
  consent text := nullif(left(meta ->> 'consent_version', 40), '');
  dob date;
begin
  if r is null or r not in ('student', 'parent') then r := null; end if;
  begin
    dob := (meta ->> 'date_of_birth')::date;
    if dob <= date '1940-01-01' or dob > current_date then dob := null; end if;
  exception when others then dob := null;
  end;

  insert into public.profiles (id, role, full_name, email, phone, onboarded_at)
  values (
    new.id, r,
    left(btrim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), 120),
    coalesce(new.email, ''),
    nullif(left(btrim(coalesce(meta ->> 'phone', '')), 30), ''),
    case when r is not null and consent is not null and (r = 'parent' or dob is not null) then now() end
  );
  if r = 'student' then
    insert into public.student_profiles (user_id, date_of_birth) values (new.id, dob);
  end if;
  if r is not null and consent is not null then
    insert into public.consents (user_id, kind, version) values (new.id, 'data_processing', consent);
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Every verified account becomes a lead in the enquiry inbox (Google accounts are verified at once).
create function private.handle_verified_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    insert into public.leads (source, profile_id, name, email, phone, message)
    select 'portal_signup', p.id, nullif(p.full_name, ''), p.email, p.phone,
           case when p.invited_by is not null then 'Account created by a parent' end
    from public.profiles p where p.id = new.id
    on conflict (profile_id) do nothing;
  end if;
  if tg_op = 'UPDATE' and new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_lead after insert or update of email_confirmed_at, email on auth.users
  for each row execute function private.handle_verified_user();

-- Student details: the counsellor and office are set by an admin; a date of birth,
-- once given, is corrected by staff (it decides whether a parent must approve uploads).
create function private.guard_student_profile() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if (new.counsellor_id is distinct from old.counsellor_id or new.office is distinct from old.office) and not private.is_admin() then
      raise exception 'Only an admin can change the counsellor or office' using errcode = '42501';
    end if;
    if old.date_of_birth is not null and new.date_of_birth is distinct from old.date_of_birth and not private.is_staff() then
      raise exception 'Ask your counsellor to correct your date of birth' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger guard before update on public.student_profiles for each row execute function private.guard_student_profile();

-- Document review: only staff change a document, and only its review fields.
create function private.guard_document() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if not private.is_staff() then
      raise exception 'Documents are reviewed by Edusphere staff' using errcode = '42501';
    end if;
    if new.student_id <> old.student_id or new.file_key <> old.file_key or new.file_name <> old.file_name
       or new.mime_type <> old.mime_type or new.size_bytes <> old.size_bytes or new.doc_type <> old.doc_type
       or new.uploaded_by is distinct from old.uploaded_by or new.created_at <> old.created_at then
      raise exception 'Only the review of a document can be changed' using errcode = '42501';
    end if;
    if new.status not in ('under_review', 'approved', 'reupload') or old.status in ('uploading', 'replaced') then
      raise exception 'That status change is not allowed' using errcode = '42501';
    end if;
    if new.status = 'reupload' and coalesce(btrim(new.reviewer_reason), '') = '' then
      raise exception 'Give a reason when asking for a re-upload' using errcode = '23514';
    end if;
    if new.status <> old.status then
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
      if new.status <> 'reupload' then new.reviewer_reason := null; end if;
    end if;
  end if;
  return new;
end $$;
create trigger guard before update on public.documents for each row execute function private.guard_document();

-- Service requests: families create them (always "requested") and may cancel while
-- still "requested"; staff assign them, move them through their steps and confirm payment.
create function private.guard_service_request() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' and not private.is_staff() then
    if tg_op = 'INSERT' then
      new.status := 'requested';
      new.assigned_to := null;
      new.closed_at := null;
      new.requested_by := (select auth.uid());
      new.payment_status := case when coalesce(btrim(new.price), '') = '' then 'not_required' else 'awaiting' end;
    else
      if not (old.status = 'requested' and new.status = 'cancelled')
         or new.service <> old.service or new.student_id <> old.student_id or new.details <> old.details
         or new.price is distinct from old.price or new.payment_status <> old.payment_status
         or new.assigned_to is distinct from old.assigned_to then
        raise exception 'A request can only be cancelled before our team confirms it' using errcode = '42501';
      end if;
    end if;
  end if;
  if new.status in ('completed', 'decision', 'result', 'cancelled') then
    new.closed_at := coalesce(new.closed_at, now());
  elsif tg_op = 'UPDATE' then
    new.closed_at := null;
  end if;
  return new;
end $$;
create trigger guard before insert or update on public.service_requests for each row execute function private.guard_service_request();

create function private.message_sender() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select coalesce(nullif(full_name, ''), 'Edusphere team'), role into new.sender_name, new.sender_role
  from public.profiles where id = new.sender_id;
  if new.sender_role in ('counsellor', 'admin', 'editor') then
    new.sender_name := split_part(new.sender_name, ' ', 1) || ' (Edusphere)';
  end if;
  return new;
end $$;
create trigger sender before insert on public.messages for each row execute function private.message_sender();

create function private.service_request_history() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status <> old.status then
    insert into public.service_request_events (request_id, status, changed_by) values (new.id, new.status, (select auth.uid()));
    perform private.log((select auth.uid()), new.student_id,
      case when tg_op = 'INSERT' then 'service_requested' else 'service_status' end,
      'service_request', new.id, jsonb_build_object('service', new.service, 'status', new.status));
  end if;
  return null;
end $$;
create trigger history after insert or update on public.service_requests for each row execute function private.service_request_history();

create function private.application_history() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.stage <> old.stage or new.status <> old.status then
    insert into public.application_events (application_id, stage, status, changed_by) values (new.id, new.stage, new.status, (select auth.uid()));
    perform private.log((select auth.uid()), new.student_id,
      case when tg_op = 'INSERT' then 'application_added' else 'application_stage' end,
      'application', new.id, jsonb_build_object('university', new.university, 'stage', new.stage, 'status', new.status));
  end if;
  return null;
end $$;
create trigger history after insert or update on public.applications for each row execute function private.application_history();

create function private.document_history() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.status <> old.status and new.status <> 'uploading' then
    perform private.log(coalesce((select auth.uid()), new.reviewed_by, new.uploaded_by), new.student_id,
      case new.status when 'under_review' then 'document_uploaded' when 'approved' then 'document_approved'
                      when 'reupload' then 'document_reupload' else 'document_replaced' end,
      'document', new.id, jsonb_build_object('type', new.doc_type, 'file', new.file_name, 'reason', new.reviewer_reason));
  elsif tg_op = 'DELETE' and old.status <> 'uploading'
        and exists (select 1 from public.profiles where id = old.student_id) then -- not when a whole account is erased
    perform private.log(coalesce((select auth.uid()), old.uploaded_by), old.student_id, 'document_deleted', 'document', old.id,
      jsonb_build_object('type', old.doc_type, 'file', old.file_name));
  end if;
  return null;
end $$;
create trigger history after update or delete on public.documents for each row execute function private.document_history();

-- ---------------------------------------------------------------------
-- Functions the portal calls
-- ---------------------------------------------------------------------

-- First visit after Google sign-in (or an invitation): choose student or parent and give consent.
create function public.complete_onboarding(p_role text, p_full_name text, p_phone text, p_date_of_birth date, p_consent_version text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  current_role_ text;
begin
  if me is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select role into current_role_ from public.profiles where id = me;
  if p_role not in ('student', 'parent') or (current_role_ is not null and current_role_ <> p_role) then
    raise exception 'That account type cannot be chosen' using errcode = '42501';
  end if;
  if coalesce(btrim(p_full_name), '') = '' or coalesce(btrim(p_consent_version), '') = '' then
    raise exception 'Name and consent are required' using errcode = '23514';
  end if;
  if p_role = 'student' and (p_date_of_birth is null or p_date_of_birth <= date '1940-01-01' or p_date_of_birth > current_date) then
    raise exception 'A valid date of birth is required' using errcode = '23514';
  end if;

  update public.profiles
     set role = p_role, full_name = left(btrim(p_full_name), 120),
         phone = nullif(left(btrim(coalesce(p_phone, '')), 30), ''),
         onboarded_at = coalesce(onboarded_at, now())
   where id = me;
  if p_role = 'student' then
    insert into public.student_profiles (user_id, date_of_birth) values (me, p_date_of_birth)
    on conflict (user_id) do update set date_of_birth = coalesce(public.student_profiles.date_of_birth, excluded.date_of_birth);
  end if;
  insert into public.consents (user_id, kind, version) values (me, 'data_processing', left(p_consent_version, 40));
  perform private.log(me, case when p_role = 'student' then me end, 'onboarded', 'profile', me, jsonb_build_object('role', p_role));
end $$;

create function private.link_attempts_exceeded(p_parent uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select count(*) >= 10 from public.activity_log
  where actor_id = p_parent and action = 'link_attempt' and created_at > now() - interval '1 hour'
$$;

-- Create or reopen a pending link; returns the link id.
create function private.open_link(p_parent uuid, p_student uuid, p_relationship text, p_via text, p_as text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  link uuid;
  rel text := case when p_relationship in ('Mother', 'Father', 'Parent', 'Guardian') then p_relationship else 'Parent' end;
begin
  insert into public.parent_links (parent_id, student_id, relationship, status, requested_via, requested_as, guardian_confirmed_at)
  values (p_parent, p_student, rel, 'pending', p_via, left(p_as, 254), now())
  on conflict (parent_id, student_id) do update
     set status = 'pending', relationship = excluded.relationship, requested_via = excluded.requested_via,
         requested_as = excluded.requested_as, guardian_confirmed_at = now(), decided_at = null
   where public.parent_links.status in ('declined', 'removed')
  returning id into link;
  if link is null then
    select id into link from public.parent_links where parent_id = p_parent and student_id = p_student;
  end if;
  insert into public.consents (user_id, kind, version, student_id) values (p_parent, 'guardian', 'guardian-2026-11', p_student);
  perform private.log(p_parent, p_student, 'link_requested', 'parent_link', link, jsonb_build_object('via', p_via));
  return link;
end $$;

-- Parent enters the student's link code. Result: requested | already_linked | not_found | rate_limited
create function public.request_link_by_code(p_code text, p_relationship text, p_guardian_confirmed boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  sid uuid;
  existing text;
  link uuid;
begin
  if me is null or private.my_role() <> 'parent' then raise exception 'Only parent accounts can link to a student' using errcode = '42501'; end if;
  if not coalesce(p_guardian_confirmed, false) then raise exception 'Please confirm you are the parent or legal guardian' using errcode = '23514'; end if;
  if private.link_attempts_exceeded(me) then return jsonb_build_object('result', 'rate_limited'); end if;
  perform private.log(me, null, 'link_attempt', 'parent_link', null, jsonb_build_object('via', 'code'));

  select sp.user_id into sid from public.student_profiles sp join public.profiles p on p.id = sp.user_id
   where sp.link_code = code and p.role = 'student';
  if sid is null then return jsonb_build_object('result', 'not_found'); end if;
  select status into existing from public.parent_links where parent_id = me and student_id = sid;
  if existing = 'approved' then return jsonb_build_object('result', 'already_linked'); end if;
  if existing = 'pending' then return jsonb_build_object('result', 'requested'); end if;
  link := private.open_link(me, sid, p_relationship, 'code', left(code, 4) || '-' || substr(code, 5));
  return jsonb_build_object('result', 'requested', 'link_id', link);
end $$;

-- Parent enters the student's email. Called by the server only (so the answer can't be used to
-- discover who has an account). Result: requested | already_linked | invite | ignored | rate_limited
create function public.request_link_by_email(p_parent uuid, p_email text, p_relationship text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  target public.profiles;
  existing text;
  link uuid;
begin
  if not exists (select 1 from public.profiles where id = p_parent and role = 'parent') then
    raise exception 'Only parent accounts can link to a student' using errcode = '42501';
  end if;
  if private.link_attempts_exceeded(p_parent) then return jsonb_build_object('result', 'rate_limited'); end if;
  perform private.log(p_parent, null, 'link_attempt', 'parent_link', null, jsonb_build_object('via', 'email'));

  select * into target from public.profiles where lower(email) = lower(btrim(p_email)) limit 1;
  if target.id is null then return jsonb_build_object('result', 'invite'); end if;
  if target.id = p_parent or target.role is distinct from 'student' then return jsonb_build_object('result', 'ignored'); end if;
  select status into existing from public.parent_links where parent_id = p_parent and student_id = target.id;
  if existing = 'approved' then return jsonb_build_object('result', 'already_linked'); end if;
  if existing = 'pending' then return jsonb_build_object('result', 'requested', 'student_id', target.id); end if;
  link := private.open_link(p_parent, target.id, p_relationship, 'email', lower(btrim(p_email)));
  return jsonb_build_object('result', 'requested', 'link_id', link, 'student_id', target.id);
end $$;

-- After the server has just created a student account for a parent (server only):
-- record who created it and open the link request the student will approve.
create function public.link_invited_student(p_parent uuid, p_student uuid, p_relationship text, p_email text)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles where id = p_parent and role = 'parent') then
    raise exception 'Only parent accounts can invite a student' using errcode = '42501';
  end if;
  update public.profiles set invited_by = p_parent
   where id = p_student and role = 'student' and onboarded_at is null and invited_by is null;
  if not found then raise exception 'Not a new student account' using errcode = '42501'; end if;
  return private.open_link(p_parent, p_student, p_relationship, 'invite', lower(btrim(p_email)));
end $$;

-- approve / decline (student, pending links) or remove (either side). Returns the new status.
create function public.update_parent_link(p_link uuid, p_action text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  l public.parent_links;
  next_status text;
begin
  select * into l from public.parent_links where id = p_link;
  if l.id is null or me is null or (me <> l.student_id and me <> l.parent_id) then
    raise exception 'Link not found' using errcode = '42501';
  end if;
  if p_action in ('approve', 'decline') and (me <> l.student_id or l.status <> 'pending') then
    raise exception 'Only the student can approve or decline a pending request' using errcode = '42501';
  end if;
  if p_action = 'remove' and l.status not in ('pending', 'approved') then
    raise exception 'This link is not active' using errcode = '42501';
  end if;
  next_status := case p_action when 'approve' then 'approved' when 'decline' then 'declined' when 'remove' then 'removed' end;
  if next_status is null then raise exception 'Unknown action' using errcode = '22023'; end if;
  update public.parent_links set status = next_status, decided_at = now() where id = p_link;
  perform private.log(me, l.student_id, 'link_' || next_status, 'parent_link', p_link, '{}');
  return next_status;
end $$;

create function public.regenerate_link_code() returns text
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  code text;
begin
  if private.my_role() <> 'student' then raise exception 'Only students have a link code' using errcode = '42501'; end if;
  update public.student_profiles set link_code = private.new_link_code() where user_id = me returning link_code into code;
  return code;
end $$;

-- Everything the portal needs to start a page, in one round trip. Runs with the caller's
-- access rules (security invoker), so it returns only what they may see.
-- p_student: for a parent, the linked student they last picked.
create function public.portal_context(p_student uuid default null)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  me public.profiles;
  focus uuid;
  links jsonb;
  student jsonb;
begin
  select * into me from public.profiles where id = (select auth.uid());
  if me.id is null then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', l.id, 'status', l.status, 'relationship', l.relationship, 'requestedVia', l.requested_via,
           'requestedAs', l.requested_as, 'createdAt', l.created_at,
           'person', case when p.id is null then null else jsonb_build_object(
             'id', p.id, 'name', coalesce(nullif(p.full_name, ''), p.email), 'email', p.email, 'phone', p.phone) end)
         order by l.created_at desc), '[]')
    into links
    from public.parent_links l
    left join public.profiles p on p.id = case when me.role = 'student' then l.parent_id else l.student_id end
   where l.status in ('pending', 'approved') and (l.parent_id = me.id or l.student_id = me.id);

  if me.role = 'student' then
    focus := me.id;
  elsif me.role = 'parent' then
    select l.student_id into focus from public.parent_links l
     where l.parent_id = me.id and l.status = 'approved'
     order by (l.student_id = p_student) desc, l.created_at
     limit 1;
  end if;

  if focus is not null then
    select jsonb_build_object(
             'id', p.id, 'name', coalesce(nullif(p.full_name, ''), p.email), 'email', p.email, 'phone', p.phone,
             'details', to_jsonb(sp),
             'counsellor', (select jsonb_build_object('name', c.full_name, 'email', c.email) from public.profiles c where c.id = sp.counsellor_id),
             'hasApprovedParent', exists (select 1 from public.parent_links a where a.student_id = p.id and a.status = 'approved'))
      into student
      from public.profiles p left join public.student_profiles sp on sp.user_id = p.id
     where p.id = focus;
  end if;

  return jsonb_build_object('profile', to_jsonb(me), 'links', links, 'student', student);
end $$;
revoke execute on function public.portal_context(uuid) from public, anon;
grant execute on function public.portal_context(uuid) to authenticated;

revoke execute on function public.request_link_by_email(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.link_invited_student(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.request_link_by_email(uuid, text, text) to service_role;
grant execute on function public.link_invited_student(uuid, uuid, text, text) to service_role;
revoke execute on function public.complete_onboarding(text, text, text, date, text) from public, anon;
revoke execute on function public.request_link_by_code(text, text, boolean) from public, anon;
revoke execute on function public.update_parent_link(uuid, text) from public, anon;
revoke execute on function public.regenerate_link_code() from public, anon;

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.parent_links enable row level security;
alter table public.consents enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.service_requests enable row level security;
alter table public.service_request_events enable row level security;
alter table public.documents enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.activity_log enable row level security;

-- Nothing here is public: no access at all without signing in.
revoke all on public.profiles, public.student_profiles, public.parent_links, public.consents,
  public.applications, public.application_events, public.service_requests, public.service_request_events,
  public.documents, public.messages, public.leads, public.activity_log from anon;

-- profiles: people edit only their own name and phone
create policy "see allowed profiles" on public.profiles for select to authenticated
  using (private.can_see_profile(id));
create policy "edit own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "admin edits profiles" on public.profiles for update to authenticated
  using (private.is_admin()) with check (private.is_admin());
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- student details
create policy "see student details" on public.student_profiles for select to authenticated
  using (private.can_view_student(user_id));
create policy "student or staff edit details" on public.student_profiles for update to authenticated
  using (user_id = (select auth.uid()) or (private.is_staff() and private.can_view_student(user_id)))
  with check (user_id = (select auth.uid()) or (private.is_staff() and private.can_view_student(user_id)));
revoke insert, update, delete on public.student_profiles from authenticated;
grant update (date_of_birth, city, preferred_countries, preferred_level, preferred_course, preferred_intake,
  academic_history, test_scores, work_experience, funding, counsellor_id, office) on public.student_profiles to authenticated;

-- family links: both sides and the student's staff can see them; changes go through functions
create policy "see own family links" on public.parent_links for select to authenticated
  using (parent_id = (select auth.uid()) or student_id = (select auth.uid()) or (private.is_staff() and private.can_view_student(student_id)));
revoke insert, update, delete on public.parent_links from authenticated;

-- consent records: your own, or a student's for their staff
create policy "see consents" on public.consents for select to authenticated
  using (user_id = (select auth.uid()) or (private.is_staff() and private.can_view_student(coalesce(student_id, user_id))));
revoke insert, update, delete on public.consents from authenticated;

-- applications: family view, staff manage
create policy "see applications" on public.applications for select to authenticated
  using (private.can_view_student(student_id));
create policy "staff add applications" on public.applications for insert to authenticated
  with check (private.is_staff() and private.can_view_student(student_id));
create policy "staff change applications" on public.applications for update to authenticated
  using (private.is_staff() and private.can_view_student(student_id))
  with check (private.is_staff() and private.can_view_student(student_id));
create policy "admin removes applications" on public.applications for delete to authenticated
  using (private.is_admin());

create policy "see application history" on public.application_events for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and private.can_view_student(a.student_id)));
revoke insert, update, delete on public.application_events from authenticated;

-- service requests
create policy "see service requests" on public.service_requests for select to authenticated
  using (private.can_view_student(student_id));
create policy "family or staff request services" on public.service_requests for insert to authenticated
  with check (private.can_act_for_student(student_id) or (private.is_staff() and private.can_view_student(student_id)));
create policy "cancel or manage service requests" on public.service_requests for update to authenticated
  using (private.can_act_for_student(student_id) or (private.is_staff() and private.can_view_student(student_id)))
  with check (private.can_act_for_student(student_id) or (private.is_staff() and private.can_view_student(student_id)));
revoke delete on public.service_requests from authenticated;

create policy "see service history" on public.service_request_events for select to authenticated
  using (exists (select 1 from public.service_requests r where r.id = request_id and private.can_view_student(r.student_id)));
revoke insert, update, delete on public.service_request_events from authenticated;

-- documents: uploads start as "uploading" and are confirmed by the server after it checks the file;
-- staff review them; nobody changes a file once stored
create policy "see documents" on public.documents for select to authenticated
  using (private.can_view_student(student_id));
create policy "start an upload" on public.documents for insert to authenticated
  with check (
    private.can_upload_for(student_id)
    and uploaded_by = (select auth.uid())
    and status = 'uploading' and reviewed_by is null and reviewed_at is null and reviewer_reason is null and replaces is null
    and (application_id is null or exists (select 1 from public.applications a where a.id = application_id and a.student_id = documents.student_id))
    and (service_request_id is null or exists (select 1 from public.service_requests r where r.id = service_request_id and r.student_id = documents.student_id))
  );
create policy "staff review documents" on public.documents for update to authenticated
  using (private.is_staff() and private.can_view_student(student_id))
  with check (private.is_staff() and private.can_view_student(student_id));
revoke delete on public.documents from authenticated;

-- messages: the student, approved parents and the student's staff
create policy "see messages" on public.messages for select to authenticated
  using (private.can_view_student(student_id));
create policy "send messages" on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.can_view_student(student_id)
    and (service_request_id is null or exists (select 1 from public.service_requests r where r.id = service_request_id and r.student_id = messages.student_id))
  );
revoke update, delete on public.messages from authenticated;

-- leads: admins see all, counsellors their own
create policy "staff see leads" on public.leads for select to authenticated
  using (private.is_admin() or (private.my_role() = 'counsellor' and assigned_to = (select auth.uid())));
create policy "staff update leads" on public.leads for update to authenticated
  using (private.is_admin() or (private.my_role() = 'counsellor' and assigned_to = (select auth.uid())))
  with check (private.is_admin() or (private.my_role() = 'counsellor' and assigned_to = (select auth.uid())));
revoke insert, delete on public.leads from authenticated;

-- activity log: read-only, staff only
create policy "staff see activity" on public.activity_log for select to authenticated
  using (private.is_admin() or (private.my_role() = 'counsellor' and student_id is not null and private.can_view_student(student_id)));
revoke insert, update, delete on public.activity_log from authenticated;
