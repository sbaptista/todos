-- Tickets table: system-wide issue tracking (replaces orb_friction)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('orb-auto', 'user-request', 'admin')),
    type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'capability_gap', 'workflow_friction')),
    summary TEXT NOT NULL,
    detail JSONB DEFAULT '{}',
    conversation_snippet TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'converted', 'dismissed')),
    converted_todo_id UUID REFERENCES public.todos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at DESC);

-- Migrate existing orb_friction rows into tickets
INSERT INTO public.tickets (source, type, summary, detail, conversation_snippet, created_at)
SELECT
    'orb-auto',
    CASE category
        WHEN 'capability_gap' THEN 'capability_gap'
        WHEN 'user_confusion' THEN 'bug'
        WHEN 'data_quality' THEN 'bug'
        WHEN 'workflow_friction' THEN 'workflow_friction'
        WHEN 'suggestion' THEN 'suggestion'
        ELSE 'bug'
    END,
    summary,
    detail,
    conversation_snippet,
    created_at
FROM public.orb_friction;

-- RLS: service-role only (admin client handles all access)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
