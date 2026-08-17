-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- enums
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.member_role AS ENUM ('owner', 'member');

-- projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- project members
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
CREATE INDEX project_members_user_id_idx ON public.project_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- tasks
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date date,
  position integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tasks_project_id_idx ON public.tasks(project_id);
CREATE INDEX tasks_assignee_id_idx ON public.tasks(assignee_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- helpers
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_project_with(_other_user uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members m1
    JOIN public.project_members m2 ON m1.project_id = m2.project_id
    WHERE m1.user_id = _user_id AND m2.user_id = _other_user
  );
$$;

-- profiles policies
CREATE POLICY "profiles_select_self_or_teammates" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.shares_project_with(id, auth.uid()));
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- projects policies
CREATE POLICY "projects_select_members" ON public.projects
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_project_member(id, auth.uid()));
CREATE POLICY "projects_insert_owner" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "projects_update_owner" ON public.projects
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "projects_delete_owner" ON public.projects
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- project_members policies
CREATE POLICY "members_select_same_project" ON public.project_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_project_member(project_id, auth.uid()));
CREATE POLICY "members_insert_owner" ON public.project_members
  FOR INSERT TO authenticated WITH CHECK (public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "members_update_owner" ON public.project_members
  FOR UPDATE TO authenticated USING (public.is_project_owner(project_id, auth.uid()))
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));
CREATE POLICY "members_delete_owner" ON public.project_members
  FOR DELETE TO authenticated USING (public.is_project_owner(project_id, auth.uid()));

-- tasks policies
CREATE POLICY "tasks_select_members" ON public.tasks
  FOR SELECT TO authenticated USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "tasks_insert_members" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "tasks_update_members" ON public.tasks
  FOR UPDATE TO authenticated USING (public.is_project_member(project_id, auth.uid()))
  WITH CHECK (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "tasks_delete_members" ON public.tasks
  FOR DELETE TO authenticated USING (public.is_project_member(project_id, auth.uid()));

-- timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tasks_set_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- owner becomes first member
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();