-- Create a function to allow admins to delete users
-- Renamed argument to target_user_id to avoid ambiguity with table columns
create or replace function delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  -- Check if the executing user is an admin
  select exists(
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
    and role = 'admin'
  ) into is_admin;

  if not is_admin then
    raise exception 'Unauthorized: Only admins can delete users';
  end if;

  -- Delete from auth.users (cascades to public tables)
  delete from auth.users where id = target_user_id;
end;
$$;
