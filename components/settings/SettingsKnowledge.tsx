'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch'

type KnowledgeEntry = {
  id: string
  product_id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  projects: { name: string; code: string } | null
}

export default function SettingsKnowledge() {
  const supabase = useMemo(() => createClient(), [])
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadKnowledge = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true)
    const { data } = await supabase
      .from('knowledge_repo')
      .select('*, projects(name, code)')
      .order('created_at', { ascending: false })
    setEntries((data as KnowledgeEntry[]) ?? [])
    setLoading(false)
  }, [supabase])

  useVisibilityRefetch(() => loadKnowledge(false))

  useEffect(() => {
    loadKnowledge(true)
  }, [loadKnowledge])

  return (
    <div className="settings-page s-page-wide">
      <h2 className="s-title mb-2xl">Knowledge Repository</h2>

      {loading ? (
        <div className="s-loading">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="s-card s-empty">
          No knowledge entries found. Distill some from your closed tasks!
        </div>
      ) : (
        <div className="s-list">
          {entries.map((entry, i) => {
            const isExpanded = expandedId === entry.id
            return (
              <div
                key={entry.id}
                className="knowledge-row"
                style={{
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  transition: 'background var(--transition)',
                }}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="flex-between"
                  style={{
                    padding: 'var(--sp-md) var(--sp-lg)',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--bg3)' : 'transparent',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p className="text-base truncate" style={{ color: 'var(--text)', margin: 0 }}>
                      {entry.title}
                    </p>
                    <p className="text-xs text-muted" style={{ margin: '2px 0 0' }}>
                      {entry.projects?.code || 'ORB'} · {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--muted)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform var(--transition)'
                  }}>
                    ▶
                  </span>
                </div>

                {isExpanded && (
                  <div style={{
                    padding: '0 var(--sp-lg) var(--sp-lg)',
                    background: 'var(--bg3)',
                  }}>
                    <div className="text-sm" style={{
                      paddingTop: 'var(--sp-sm)',
                      borderTop: '1px solid var(--border)',
                      color: 'var(--text2)',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5
                    }}>
                      {entry.content}
                    </div>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex-row gap-xs mt-md">
                        {entry.tags.map(tag => (
                          <span key={tag} className="knowledge-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .knowledge-row {
          transition: background 0.2s ease;
        }
        .knowledge-row:hover {
          background: var(--bg3);
        }
      `}</style>
    </div>
  )
}
