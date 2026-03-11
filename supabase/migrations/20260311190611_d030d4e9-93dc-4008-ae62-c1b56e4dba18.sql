
-- bot_config: single row configuration
CREATE TABLE public.bot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text,
  instance_name text,
  group_id text,
  bot_trigger text NOT NULL DEFAULT '@bot',
  session_timeout_minutes int NOT NULL DEFAULT 5,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view bot_config" ON public.bot_config FOR SELECT TO public USING (true);
CREATE POLICY "Everyone can insert bot_config" ON public.bot_config FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Everyone can update bot_config" ON public.bot_config FOR UPDATE TO public USING (true);

-- Insert default config row
INSERT INTO public.bot_config (bot_trigger, session_timeout_minutes, enabled) VALUES ('@bot', 5, false);

-- bot_sessions: active conversation sessions
CREATE TABLE public.bot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text,
  started_by_phone text,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  context_messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view bot_sessions" ON public.bot_sessions FOR SELECT TO public USING (true);
CREATE POLICY "Everyone can insert bot_sessions" ON public.bot_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Everyone can update bot_sessions" ON public.bot_sessions FOR UPDATE TO public USING (true);

-- bot_message_logs: audit trail
CREATE TABLE public.bot_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL,
  phone text,
  message_type text DEFAULT 'text',
  message_text text,
  parsed_intent text,
  session_id uuid REFERENCES public.bot_sessions(id),
  status text DEFAULT 'processed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view bot_message_logs" ON public.bot_message_logs FOR SELECT TO public USING (true);
CREATE POLICY "Everyone can insert bot_message_logs" ON public.bot_message_logs FOR INSERT TO public WITH CHECK (true);
