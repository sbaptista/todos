CREATE TABLE IF NOT EXISTS public.orb_friction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'capability_gap', 'user_confusion', 'data_quality', 'workflow_friction', 'suggestion'
    )),
    summary TEXT NOT NULL,
    detail JSONB DEFAULT '{}',
    conversation_snippet TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orb_friction_category ON public.orb_friction(category);
CREATE INDEX idx_orb_friction_created_at ON public.orb_friction(created_at DESC);
