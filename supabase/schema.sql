-- COUCH+ · esquema de base de datos para Supabase
-- Tablas, permisos por rol (RLS) y funciones de cuentas. Ejecutar en el editor SQL de un proyecto nuevo.
-- Las cuentas iniciales (superadministrador con su código de 4 dígitos) se crean aparte; ver README.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

-- Perfiles: une cada usuario de Supabase Auth con su rol y su ficha
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super', 'trainer', 'student')),
  ref_id text not null unique,
  username text not null,
  pin_hash text,
  pin_ok_until timestamptz,
  pin_fails int not null default 0,
  pin_lock_until timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_key on public.profiles (lower(username));
alter table public.profiles enable row level security; -- sin políticas: solo se consulta vía funciones

-- Documentos de la app
create table if not exists public.docs (
  col text not null check (col in ('trainers', 'students', 'reviews', 'logs', 'meals', 'tpl', 'photos')),
  id text not null,
  trainer_id text,
  student_id text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
create index if not exists docs_trainer_idx on public.docs (trainer_id);
create index if not exists docs_student_idx on public.docs (student_id);
alter table public.docs enable row level security;
alter table public.docs replica identity full;
alter publication supabase_realtime add table public.docs;

-- ---------- Quién llama ----------
create or replace function public.cp_role() returns text language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.user_id = auth.uid() $$;
create or replace function public.cp_ref() returns text language sql stable security definer set search_path = '' as $$
  select p.ref_id from public.profiles p where p.user_id = auth.uid() $$;
-- El superadministrador solo tiene permisos tras ingresar su código (válido 12 horas)
create or replace function public.cp_is_super() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'super' and p.pin_ok_until > now()) $$;
create or replace function public.cp_trainer() returns text language sql stable security definer set search_path = '' as $$
  select case p.role when 'trainer' then p.ref_id
    when 'student' then (select d.trainer_id from public.docs d where d.col = 'students' and d.id = p.ref_id) end
  from public.profiles p where p.user_id = auth.uid() $$;
-- Un entrenador desactivado deja sin acceso a él y a sus alumnos
create or replace function public.cp_active() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select (d.data ->> 'active') is distinct from 'false' from public.docs d where d.col = 'trainers' and d.id = public.cp_trainer()), false) $$;
create or replace function public.cp_owns_student(p_student text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.docs d where d.col = 'students' and d.id = p_student and d.trainer_id = public.cp_ref()) $$;

-- ---------- Permisos (RLS) ----------
create policy docs_select on public.docs for select to authenticated using (
  (select public.cp_is_super())
  or ((select public.cp_role()) = 'trainer' and (select public.cp_active()) and trainer_id = (select public.cp_ref()))
  or ((select public.cp_role()) = 'student' and (select public.cp_active()) and student_id = (select public.cp_ref()) and col <> 'tpl'));
create policy docs_insert on public.docs for insert to authenticated with check (
  (select public.cp_is_super())
  or ((select public.cp_role()) = 'trainer' and (select public.cp_active()) and col <> 'trainers' and trainer_id = (select public.cp_ref())
      and (student_id is null or (col = 'students' and student_id = id) or public.cp_owns_student(student_id)))
  or ((select public.cp_role()) = 'student' and (select public.cp_active()) and col in ('logs', 'meals')
      and student_id = (select public.cp_ref()) and trainer_id = (select public.cp_trainer())));
create policy docs_update on public.docs for update to authenticated using (
  (select public.cp_is_super())
  or ((select public.cp_role()) = 'trainer' and (select public.cp_active()) and col <> 'trainers' and trainer_id = (select public.cp_ref()))
  or ((select public.cp_role()) = 'student' and (select public.cp_active()) and col in ('logs', 'meals') and student_id = (select public.cp_ref()))
) with check (
  (select public.cp_is_super())
  or ((select public.cp_role()) = 'trainer' and (select public.cp_active()) and col <> 'trainers' and trainer_id = (select public.cp_ref())
      and (student_id is null or (col = 'students' and student_id = id) or public.cp_owns_student(student_id)))
  or ((select public.cp_role()) = 'student' and (select public.cp_active()) and col in ('logs', 'meals')
      and student_id = (select public.cp_ref()) and trainer_id = (select public.cp_trainer())));
create policy docs_delete on public.docs for delete to authenticated using (
  (select public.cp_is_super())
  or ((select public.cp_role()) = 'trainer' and (select public.cp_active()) and col <> 'trainers' and trainer_id = (select public.cp_ref())));
grant select, insert, update, delete on public.docs to authenticated;

-- ---------- Cuentas ----------
-- Usuario → correo interno: 'u' + hex(utf8(minúsculas)) + '@couchplus.app' (debe coincidir con emailOf() en src/store-supabase.js)
create or replace function public.cp_email(p_username text) returns text language sql immutable set search_path = '' as $$
  select 'u' || encode(convert_to(lower(trim(p_username)), 'UTF8'), 'hex') || '@couchplus.app' $$;

create or replace function private.new_auth_user(p_username text, p_password text) returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := gen_random_uuid(); em text := public.cp_email(p_username);
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em, extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '', '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true, 'phone_verified', false), 'email', now(), now(), now());
  return uid;
end $$;

create or replace function private.can_manage(p_ref text) returns boolean language plpgsql stable security definer set search_path = '' as $$
declare r text;
begin
  select role into r from public.profiles where ref_id = p_ref;
  if r is null or r = 'super' then return false; end if;
  if public.cp_is_super() then return true; end if;
  return public.cp_role() = 'trainer' and public.cp_active() and r = 'student' and public.cp_owns_student(p_ref);
end $$;

create or replace function public.cp_whoami() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('role', p.role, 'ref_id', p.ref_id, 'username', p.username,
    'active', case when p.role = 'super' then true else public.cp_active() end, 'pin_ok', coalesce(p.pin_ok_until > now(), false))
  from public.profiles p where p.user_id = auth.uid() $$;

-- Código de 4 dígitos: 5 intentos fallidos bloquean 5 minutos
create or replace function public.cp_verify_pin(p_pin text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  select * into p from public.profiles where user_id = auth.uid() and role = 'super';
  if p.user_id is null then return jsonb_build_object('ok', false, 'error', 'not_super'); end if;
  if p.pin_lock_until > now() then return jsonb_build_object('ok', false, 'locked_until', p.pin_lock_until); end if;
  if p.pin_hash = extensions.crypt(coalesce(p_pin, ''), p.pin_hash) then
    update public.profiles set pin_ok_until = now() + interval '12 hours', pin_fails = 0, pin_lock_until = null where user_id = p.user_id;
    return jsonb_build_object('ok', true);
  end if;
  update public.profiles set pin_fails = case when pin_fails + 1 >= 5 then 0 else pin_fails + 1 end,
    pin_lock_until = case when pin_fails + 1 >= 5 then now() + interval '5 minutes' else null end where user_id = p.user_id;
  return jsonb_build_object('ok', false);
end $$;
create or replace function public.cp_end_session() returns void language sql security definer set search_path = '' as $$
  update public.profiles set pin_ok_until = null where user_id = auth.uid() and role = 'super' $$;
create or replace function public.cp_set_pin(p_pin text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.cp_is_super() then raise exception 'Solo el superadministrador puede cambiar el código'; end if;
  if p_pin !~ '^\d{4}$' then raise exception 'El código debe tener 4 dígitos'; end if;
  update public.profiles set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')) where user_id = auth.uid();
end $$;

create or replace function public.cp_create_account(p_role text, p_ref text, p_username text, p_password text, p_trainer text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid; u text := trim(p_username);
begin
  if p_role = 'trainer' then
    if not public.cp_is_super() then raise exception 'No tienes permiso para crear entrenadores'; end if;
  elsif p_role = 'student' then
    if not (public.cp_is_super() or (public.cp_role() = 'trainer' and public.cp_active() and p_trainer = public.cp_ref())) then raise exception 'No tienes permiso para crear este alumno'; end if;
  else raise exception 'Rol no válido'; end if;
  if u = '' or length(u) > 30 then raise exception 'El usuario debe tener entre 1 y 30 caracteres'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres'; end if;
  if exists (select 1 from public.profiles where lower(username) = lower(u)) or exists (select 1 from auth.users where email = public.cp_email(u)) then raise exception 'Ese usuario ya existe'; end if;
  if exists (select 1 from public.profiles where ref_id = p_ref) then raise exception 'La ficha ya tiene una cuenta'; end if;
  uid := private.new_auth_user(u, p_password);
  insert into public.profiles (user_id, role, ref_id, username) values (uid, p_role, p_ref, u);
end $$;

create or replace function public.cp_set_password(p_ref text, p_password text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.can_manage(p_ref) then raise exception 'No tienes permiso para cambiar esta contraseña'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = (select user_id from public.profiles where ref_id = p_ref);
end $$;

create or replace function public.cp_set_username(p_ref text, p_username text) returns void language plpgsql security definer set search_path = '' as $$
declare u text := trim(p_username); uid uuid;
begin
  if not private.can_manage(p_ref) then raise exception 'No tienes permiso para cambiar este usuario'; end if;
  if u = '' or length(u) > 30 then raise exception 'El usuario debe tener entre 1 y 30 caracteres'; end if;
  select user_id into uid from public.profiles where ref_id = p_ref;
  if exists (select 1 from public.profiles where lower(username) = lower(u) and user_id <> uid) then raise exception 'Ese usuario ya existe'; end if;
  update public.profiles set username = u where user_id = uid;
  update auth.users set email = public.cp_email(u), updated_at = now() where id = uid;
  update auth.identities set identity_data = identity_data || jsonb_build_object('email', public.cp_email(u)), updated_at = now() where user_id = uid and provider = 'email';
end $$;

-- Eliminar cuenta: queda bloqueada para siempre, sin contraseña, y el nombre de usuario se libera
create or replace function public.cp_remove_account(p_ref text) returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid; tag text := replace(gen_random_uuid()::text, '-', '');
begin
  if not private.can_manage(p_ref) then raise exception 'No tienes permiso para eliminar esta cuenta'; end if;
  select user_id into uid from public.profiles where ref_id = p_ref;
  update auth.users set banned_until = 'infinity', encrypted_password = '', email = 'removed_' || tag || '@couchplus.app', updated_at = now() where id = uid;
  update auth.identities set identity_data = identity_data || jsonb_build_object('email', 'removed_' || tag || '@couchplus.app'), updated_at = now() where user_id = uid;
  update public.profiles set ref_id = 'removed_' || tag, username = 'removed_' || tag, pin_ok_until = null where user_id = uid;
end $$;

create or replace function public.cp_reassign_student(p_student text, p_trainer text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.cp_is_super() then raise exception 'Solo el superadministrador puede reasignar alumnos'; end if;
  if not exists (select 1 from public.docs where col = 'trainers' and id = p_trainer) then raise exception 'Entrenador no encontrado'; end if;
  update public.docs set trainer_id = p_trainer,
    data = case when data ? 'trainerId' or col in ('students', 'reviews', 'logs', 'meals') then jsonb_set(data, '{trainerId}', to_jsonb(p_trainer)) else data end, updated_at = now()
  where student_id = p_student;
end $$;

create or replace function public.cp_username_free(p_username text, p_except_ref text default null) returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(trim(p_username)) and ref_id is distinct from p_except_ref) $$;

-- Solo usuarios con sesión pueden llamar a estas funciones (cada una valida además el rol)
revoke execute on function public.cp_role(), public.cp_ref(), public.cp_is_super(), public.cp_trainer(), public.cp_active(), public.cp_owns_student(text),
  public.cp_whoami(), public.cp_verify_pin(text), public.cp_end_session(), public.cp_set_pin(text), public.cp_create_account(text, text, text, text, text),
  public.cp_set_password(text, text), public.cp_set_username(text, text), public.cp_remove_account(text), public.cp_reassign_student(text, text),
  public.cp_username_free(text, text) from public, anon;
grant execute on function public.cp_role(), public.cp_ref(), public.cp_is_super(), public.cp_trainer(), public.cp_active(), public.cp_owns_student(text),
  public.cp_whoami(), public.cp_verify_pin(text), public.cp_end_session(), public.cp_set_pin(text), public.cp_create_account(text, text, text, text, text),
  public.cp_set_password(text, text), public.cp_set_username(text, text), public.cp_remove_account(text), public.cp_reassign_student(text, text),
  public.cp_username_free(text, text) to authenticated;

-- ---------- Cuenta inicial del superadministrador (reemplaza los valores antes de ejecutar) ----------
-- with s as (select private.new_auth_user('USUARIO_SUPERADMIN', 'CONTRASEÑA') as uid)
-- insert into public.profiles (user_id, role, ref_id, username, pin_hash)
-- select uid, 'super', 'super', 'USUARIO_SUPERADMIN', extensions.crypt('CODIGO_4_DIGITOS', extensions.gen_salt('bf')) from s;
