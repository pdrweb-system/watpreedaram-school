-- =====================================================================
-- เว็บไซต์โรงเรียนวัดปรีดาราม: ตารางเนื้อหา + สิทธิ์ผู้ดูแล
--   * ทุกคนอ่านเนื้อหาได้ (หน้าเว็บสาธารณะ)
--   * เพิ่ม/แก้/ลบได้เฉพาะผู้ดูแลที่อยู่ในตาราง public.admins
--   * ปิดการสมัครสมาชิกเอง: บัญชีผู้ดูแลสร้างได้จาก Edge Function admin-users เท่านั้น
-- =====================================================================

-- ---------- schema ภายใน (ไม่เปิดผ่าน Data API) ----------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ---------- ผู้ดูแลระบบ ----------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- true เมื่อผู้ใช้ที่ล็อกอินอยู่เป็นผู้ดูแล ใช้ใน RLS policy ทุกตาราง
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public;

-- ---------- เนื้อหาเว็บไซต์ ----------
-- ข้อมูลทั่วไปของโรงเรียน มีแถวเดียว (id = 1)
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  motto text not null default '',
  vision text not null default '',
  missions text[] not null default '{}',
  school_identity text not null default '',
  core_values text not null default '',
  uniqueness text not null default '',
  director_name text not null default '',
  director_role text not null default '',
  director_note text not null default '',
  director_photo text not null default '',
  map_embed text not null default '',
  show_notes boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.news (
  id bigint generated always as identity primary key,
  title text not null check (btrim(title) <> ''),
  tag text not null default '',
  news_date date,
  body text not null default '',
  image_url text not null default '',
  link_url text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teachers (
  id bigint generated always as identity primary key,
  name text not null check (btrim(name) <> ''),
  subject text not null default '',
  initial text not null default '',
  photo_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departments (
  id bigint generated always as identity primary key,
  name text not null check (btrim(name) <> ''),
  detail text not null default '',
  link_text text not null default '',
  url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id bigint generated always as identity primary key,
  label text not null check (btrim(label) <> ''),
  value text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_updated_at before update on public.site_settings
  for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.news
  for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.teachers
  for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.departments
  for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.contacts
  for each row execute function private.touch_updated_at();

-- ---------- สิทธิ์การเข้าถึง ----------
alter table public.admins enable row level security;
alter table public.site_settings enable row level security;
alter table public.news enable row level security;
alter table public.teachers enable row level security;
alter table public.departments enable row level security;
alter table public.contacts enable row level security;

revoke all on public.admins, public.site_settings, public.news, public.teachers,
  public.departments, public.contacts from anon, authenticated;
grant select on public.site_settings, public.news, public.teachers,
  public.departments, public.contacts to anon, authenticated;
grant update on public.site_settings to authenticated;
grant insert, update, delete on public.news, public.teachers,
  public.departments, public.contacts to authenticated;
grant select on public.admins to authenticated;
grant all on public.admins, public.site_settings, public.news, public.teachers,
  public.departments, public.contacts to service_role;

create policy "Public can read site settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "Admins can update site settings" on public.site_settings
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ข่าวที่ซ่อนไว้ (is_published = false) เห็นเฉพาะผู้ดูแล
create policy "Public can read published news" on public.news
  for select to anon, authenticated
  using (is_published or (select private.is_admin()));
create policy "Admins can insert news" on public.news
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update news" on public.news
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete news" on public.news
  for delete to authenticated using ((select private.is_admin()));

create policy "Public can read teachers" on public.teachers
  for select to anon, authenticated using (true);
create policy "Admins can insert teachers" on public.teachers
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update teachers" on public.teachers
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete teachers" on public.teachers
  for delete to authenticated using ((select private.is_admin()));

create policy "Public can read departments" on public.departments
  for select to anon, authenticated using (true);
create policy "Admins can insert departments" on public.departments
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update departments" on public.departments
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete departments" on public.departments
  for delete to authenticated using ((select private.is_admin()));

create policy "Public can read contacts" on public.contacts
  for select to anon, authenticated using (true);
create policy "Admins can insert contacts" on public.contacts
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update contacts" on public.contacts
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete contacts" on public.contacts
  for delete to authenticated using ((select private.is_admin()));

create policy "Admins can read the admin list" on public.admins
  for select to authenticated using ((select private.is_admin()));

-- ---------- เนื้อหาทั้งหมดสำหรับหน้าเว็บ (เรียกครั้งเดียว) ----------
-- รูปแบบเดียวกับ SITE_DATA ใน data.js
create function public.get_site_content()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'school', jsonb_build_object(
      'motto', s.motto,
      'vision', s.vision,
      'missions', to_jsonb(s.missions),
      'identity', s.school_identity,
      'values', s.core_values,
      'uniqueness', s.uniqueness
    ),
    'director', jsonb_build_object(
      'name', s.director_name,
      'role', s.director_role,
      'note', s.director_note,
      'photo', s.director_photo
    ),
    'map', s.map_embed,
    'showNotes', s.show_notes,
    'news', coalesce((
      select jsonb_agg(jsonb_build_object(
        'tag', n.tag, 'date', n.news_date, 'title', n.title,
        'body', n.body, 'image', n.image_url, 'link', n.link_url
      ) order by n.news_date desc nulls last, n.id desc)
      from public.news n
      where n.is_published
    ), '[]'::jsonb),
    'teachers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', t.name, 'subject', t.subject, 'photo', t.photo_url, 'initial', t.initial
      ) order by t.sort_order, t.id)
      from public.teachers t
    ), '[]'::jsonb),
    'departments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', d.name, 'detail', d.detail, 'linkText', d.link_text, 'url', d.url
      ) order by d.sort_order, d.id)
      from public.departments d
    ), '[]'::jsonb),
    'contact', coalesce((
      select jsonb_agg(jsonb_build_object('label', c.label, 'value', c.value)
        order by c.sort_order, c.id)
      from public.contacts c
    ), '[]'::jsonb)
  )
  from public.site_settings s
  where s.id = 1;
$$;
revoke all on function public.get_site_content() from public;
grant execute on function public.get_site_content() to anon, authenticated, service_role;

-- ---------- การสร้างบัญชีผู้ดูแล ----------
-- Edge Function ใส่อีเมลไว้ที่นี่ก่อนสร้างบัญชี ถ้าไม่มี การสร้างบัญชีจะถูกปฏิเสธ
create table private.pending_admins (
  email text primary key,
  expires_at timestamptz not null
);
alter table private.pending_admins enable row level security;

-- รหัสตั้งค่าครั้งแรก (เก็บเฉพาะค่า hash) ใช้ได้เฉพาะตอนที่ยังไม่มีผู้ดูแลเลย
create table private.setup_code (
  id smallint primary key default 1 check (id = 1),
  code_hash text not null,
  created_at timestamptz not null default now()
);
alter table private.setup_code enable row level security;

grant select, insert, update, delete on private.pending_admins to service_role;
grant select on private.setup_code to service_role;

-- เรียกได้เฉพาะ service_role (Edge Function admin-users)
create function public.prepare_admin_signup(p_email text)
returns void
language sql
set search_path = ''
as $$
  insert into private.pending_admins (email, expires_at)
  values (lower(btrim(p_email)), now() + interval '10 minutes')
  on conflict (email) do update set expires_at = excluded.expires_at;
$$;
revoke all on function public.prepare_admin_signup(text) from public, anon, authenticated;
grant execute on function public.prepare_admin_signup(text) to service_role;

create function public.prepare_first_admin(p_email text, p_code text)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.admins) then
    return false;
  end if;
  if not exists (
    select 1 from private.setup_code
    where code_hash = encode(sha256(convert_to(
      upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'UTF8')), 'hex')
  ) then
    return false;
  end if;
  perform public.prepare_admin_signup(p_email);
  return true;
end;
$$;
revoke all on function public.prepare_first_admin(text, text) from public, anon, authenticated;
grant execute on function public.prepare_first_admin(text, text) to service_role;

-- บัญชีใหม่ทุกบัญชีต้องผ่านการเตรียมไว้ก่อน แล้วจะเป็นผู้ดูแลทันที
-- (กันคนทั่วไปสมัครสมาชิกเองผ่าน API)
create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.pending_admins
  where email = lower(new.email) and expires_at > now();
  if not found then
    raise exception 'Sign-ups are disabled. Admin accounts are created from the admin panel only.';
  end if;
  insert into public.admins (user_id, email) values (new.id, lower(new.email));
  return null;
end;
$$;
revoke all on function private.handle_new_auth_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- ---------- ที่เก็บรูปภาพ ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- bucket เป็น public: ทุกคนเปิดรูปผ่านลิงก์ได้ ส่วนอัปโหลด/แทนที่/ลบได้เฉพาะผู้ดูแล
create policy "Admins can upload site images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-images' and (select private.is_admin()));
create policy "Admins can read site image objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'site-images' and (select private.is_admin()));
create policy "Admins can replace site images" on storage.objects
  for update to authenticated
  using (bucket_id = 'site-images' and (select private.is_admin()))
  with check (bucket_id = 'site-images' and (select private.is_admin()));
create policy "Admins can delete site images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-images' and (select private.is_admin()));
