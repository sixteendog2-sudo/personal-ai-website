-- Design reference only. Production migrations are generated from db/schema.ts.
-- Personal AI digital avatar website / PostgreSQL + pgvector schema draft

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE visibility_type AS ENUM ('public', 'unlisted', 'private');
CREATE TYPE publish_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE admin_role AS ENUM ('owner', 'admin');
CREATE TYPE admin_status AS ENUM ('active', 'disabled');
CREATE TYPE asset_type AS ENUM ('image', 'video', 'document', 'resume', 'other');
CREATE TYPE source_type AS ENUM ('manual', 'profile', 'study_item', 'work_project', 'life_record', 'visitor_question', 'chat_summary');
CREATE TYPE sync_status AS ENUM ('none', 'pending', 'chunked', 'embedded', 'failed');
CREATE TYPE chat_role AS ENUM ('system', 'user', 'assistant');
CREATE TYPE question_status AS ENUM ('new', 'valuable', 'converted', 'ignored');
CREATE TYPE contact_intent_type AS ENUM ('admission', 'social', 'career', 'collaboration', 'other');

CREATE TABLE owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  role admin_role NOT NULL DEFAULT 'admin',
  status admin_status NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, email)
);

CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  type asset_type NOT NULL DEFAULT 'image',
  url text NOT NULL,
  storage_key text,
  mime_type text,
  size_bytes bigint,
  width int,
  height int,
  alt_text text,
  tags text[] NOT NULL DEFAULT '{}',
  visibility visibility_type NOT NULL DEFAULT 'private',
  status publish_status NOT NULL DEFAULT 'draft',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE owner_profiles (
  owner_id uuid PRIMARY KEY REFERENCES owners(id) ON DELETE CASCADE,
  avatar_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  nickname text NOT NULL,
  real_name text,
  headline text,
  bio text,
  city text,
  birthday date,
  tags text[] NOT NULL DEFAULT '{}',
  contact_methods jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility visibility_type NOT NULL DEFAULT 'private',
  status publish_status NOT NULL DEFAULT 'draft',
  is_ai_usable boolean NOT NULL DEFAULT false,
  is_public_indexable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE study_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  summary text,
  body text,
  institution text,
  started_at date,
  ended_at date,
  tags text[] NOT NULL DEFAULT '{}',
  visibility visibility_type NOT NULL DEFAULT 'private',
  status publish_status NOT NULL DEFAULT 'draft',
  is_ai_usable boolean NOT NULL DEFAULT false,
  is_public_indexable boolean NOT NULL DEFAULT false,
  sync_status sync_status NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE work_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  body text,
  role text,
  tech_stack text[] NOT NULL DEFAULT '{}',
  result_summary text,
  project_url text,
  repo_url text,
  started_at date,
  ended_at date,
  tags text[] NOT NULL DEFAULT '{}',
  visibility visibility_type NOT NULL DEFAULT 'private',
  status publish_status NOT NULL DEFAULT 'draft',
  is_ai_usable boolean NOT NULL DEFAULT false,
  is_public_indexable boolean NOT NULL DEFAULT false,
  sync_status sync_status NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE life_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  title text NOT NULL,
  excerpt text,
  body text,
  occurred_at timestamptz,
  location_text text,
  mood text,
  tags text[] NOT NULL DEFAULT '{}',
  visibility visibility_type NOT NULL DEFAULT 'private',
  status publish_status NOT NULL DEFAULT 'draft',
  is_ai_usable boolean NOT NULL DEFAULT false,
  is_public_indexable boolean NOT NULL DEFAULT false,
  sync_status sync_status NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE life_record_assets (
  life_record_id uuid NOT NULL REFERENCES life_records(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (life_record_id, asset_id)
);

CREATE TABLE work_project_assets (
  work_project_id uuid NOT NULL REFERENCES work_projects(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (work_project_id, asset_id)
);

CREATE TABLE knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  body text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  source_type source_type NOT NULL DEFAULT 'manual',
  source_id uuid,
  visibility visibility_type NOT NULL DEFAULT 'private',
  status publish_status NOT NULL DEFAULT 'draft',
  is_ai_usable boolean NOT NULL DEFAULT false,
  is_public_indexable boolean NOT NULL DEFAULT false,
  sync_status sync_status NOT NULL DEFAULT 'none',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  knowledge_item_id uuid NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  token_count int,
  tags text[] NOT NULL DEFAULT '{}',
  visibility visibility_type NOT NULL DEFAULT 'private',
  status publish_status NOT NULL DEFAULT 'draft',
  is_ai_usable boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (knowledge_item_id, chunk_index)
);

CREATE TABLE knowledge_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  chunk_id uuid NOT NULL REFERENCES knowledge_chunks(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text NOT NULL,
  dimension int NOT NULL DEFAULT 1536,
  embedding vector(1536) NOT NULL,
  embedded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chunk_id, provider, model)
);

CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL DEFAULT gen_random_uuid(),
  entry text,
  topic text,
  related_source_type source_type,
  related_source_id uuid,
  ip_hash text,
  user_agent text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  content text NOT NULL,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  llm_provider text,
  llm_model text,
  prompt_tokens int,
  completion_tokens int,
  latency_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE chat_message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  rating text NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE visitor_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  session_id uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
  message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  question text NOT NULL,
  answer text,
  topic text,
  status question_status NOT NULL DEFAULT 'new',
  converted_knowledge_item_id uuid REFERENCES knowledge_items(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contact_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  intent contact_intent_type NOT NULL DEFAULT 'other',
  visitor_id uuid,
  name text,
  contact text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE model_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  chat_provider text NOT NULL DEFAULT 'deepseek',
  chat_base_url text NOT NULL DEFAULT 'https://api.deepseek.com',
  chat_model text NOT NULL DEFAULT 'deepseek-v4-flash',
  encrypted_api_key text,
  embedding_provider text,
  embedding_model text,
  temperature numeric(3,2) NOT NULL DEFAULT 0.70,
  top_p numeric(3,2) NOT NULL DEFAULT 0.90,
  max_tokens int NOT NULL DEFAULT 1200,
  timeout_ms int NOT NULL DEFAULT 30000,
  stream_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id)
);

CREATE TABLE prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  scene text NOT NULL,
  name text NOT NULL,
  system_prompt text NOT NULL,
  style_rules text,
  safety_rules text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, scene, name)
);

CREATE TABLE ai_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  session_id uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
  provider text NOT NULL,
  model text NOT NULL,
  request_type text NOT NULL,
  prompt_tokens int,
  completion_tokens int,
  latency_ms int,
  success boolean NOT NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_assets_owner_visibility ON media_assets(owner_id, visibility, status);
CREATE INDEX idx_study_items_owner_public ON study_items(owner_id, visibility, status, is_ai_usable);
CREATE INDEX idx_work_projects_owner_public ON work_projects(owner_id, visibility, status, is_ai_usable);
CREATE INDEX idx_life_records_owner_public ON life_records(owner_id, visibility, status, is_ai_usable);
CREATE INDEX idx_life_records_occurred_at ON life_records(owner_id, occurred_at DESC);
CREATE INDEX idx_knowledge_items_owner_source ON knowledge_items(owner_id, source_type, source_id);
CREATE INDEX idx_knowledge_items_owner_ai ON knowledge_items(owner_id, visibility, status, is_ai_usable);
CREATE INDEX idx_knowledge_chunks_owner_ai ON knowledge_chunks(owner_id, visibility, status, is_ai_usable);
CREATE INDEX idx_chat_sessions_owner_started ON chat_sessions(owner_id, started_at DESC);
CREATE INDEX idx_chat_messages_session_created ON chat_messages(session_id, created_at);
CREATE INDEX idx_visitor_questions_owner_status ON visitor_questions(owner_id, status, created_at DESC);
CREATE INDEX idx_contact_intents_owner_status ON contact_intents(owner_id, status, created_at DESC);
CREATE INDEX idx_ai_call_logs_owner_created ON ai_call_logs(owner_id, created_at DESC);
CREATE INDEX idx_admin_audit_logs_owner_created ON admin_audit_logs(owner_id, created_at DESC);

-- Enable after data volume grows. For small MVP data, exact search is acceptable.
CREATE INDEX idx_knowledge_embeddings_vector
ON knowledge_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Optional RLS baseline. Application code still needs explicit guards.
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_intents ENABLE ROW LEVEL SECURITY;
