
CREATE TYPE public.app_role AS ENUM ('master_admin', 'consultor');
CREATE TYPE public.user_status AS ENUM ('pendente', 'aprovado', 'bloqueado');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  status public.user_status NOT NULL DEFAULT 'pendente',
  criado_em timestamptz NOT NULL DEFAULT now(),
  aprovado_em timestamptz,
  aprovado_por uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'master_admin')
$$;

CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado'
  )
$$;

-- profiles policies
CREATE POLICY "Usuario le o proprio perfil"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Aprovados leem todos os perfis"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_approved_user());

CREATE POLICY "Master admin atualiza perfis de terceiros"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_master_admin() AND id <> auth.uid())
  WITH CHECK (public.is_master_admin() AND id <> auth.uid());

CREATE POLICY "Master admin remove perfis de terceiros"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_master_admin() AND id <> auth.uid());

-- user_roles policies
CREATE POLICY "Usuario le o proprio papel"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Aprovados leem papeis"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_approved_user());

-- trigger: cria profile + papel no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  primeiro boolean;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO primeiro;

  INSERT INTO public.profiles (id, nome_completo, email, avatar_url, status, aprovado_em)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome_completo', NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'avatar_url',
    CASE WHEN primeiro THEN 'aprovado'::public.user_status ELSE 'pendente'::public.user_status END,
    CASE WHEN primeiro THEN now() ELSE NULL END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN primeiro THEN 'master_admin'::public.app_role ELSE 'consultor'::public.app_role END)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
