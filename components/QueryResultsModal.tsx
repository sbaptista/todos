'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OrbResponse } from '@/app/actions/orb-converse'
import TodoPanel from './TodoPanel'
import type { Todo, Group, Category, Product, Priority } from './TodoView'

type ResultItem = NonNullable<OrbResponse['results']>[number]

const PRIORITY_DOT: Record<number, string> = {
  1: '#a05010',
  2: '#5a3090',
  3: 'var(--muted)',
  4: 'var(--muted)',
}

const STATUS_COLOR: Record<string, string> = {
  open:        'var(--status-open)',
  in_progress: 'var(--status-in-progress)',
  on_hold:     'var(--status-on-hold)',
  done:        'var(--status-done)',
}

export default function QueryResultsModal({
  results,
  queryLabel,
  onClose,
}: {
  results: ResultItem[]
  queryLabel: string
  onClose: () => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [items, setItems] = useState<ResultItem[]>(results)

  async function openTodo(item: ResultItem) {
    const [todoRes, groupRes, catRes, prodRes, priRes] = await Promise.all([
      supabase.from('todos').select('*, groups(name), categories(name)').eq('id', item.id).single(),
      supabase.from('groups').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('projects').select('id, name, color, code').order('sort_order'),
      supabase.from('priorities').select('value, label').order('value'),
    ])
    if (todoRes.data) {
      setGroups(groupRes.data ?? [])
      setCategories(catRes.data ?? [])
      setProducts((prodRes.data ?? []).map((p: { id: string; name: string; color: string | null; code: string | null }) => ({ ...p, icon: null })))
      setPriorities(priRes.data ?? [])
      setSelectedTodo(todoRes.data as Todo)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.25)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Query results"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
          width: '100%',
          maxWidth: '480px',
          maxHeight: '70dvh',
          background: 'var(--bg2)',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-md)',
          padding: 'var(--sp-lg) var(--sp-xl)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <p style={{
            flex: 1,
            margin: 0,
            fontSize: 'var(--fs-sm)',
            color: 'var(--text3)',
            fontFamily: 'var(--font-ui)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {queryLabel}
          </p>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {items.length === 0 ? (
            <p style={{ padding: 'var(--sp-2xl)', textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--muted)', margin: 0 }}>
              No results
            </p>
          ) : (
            items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => openTodo(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-md)',
                  width: '100%',
                  padding: 'var(--sp-md) var(--sp-xl)',
                  background: 'none',
                  border: 'none',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background var(--transition)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3, var(--bg))')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {/* Priority dot */}
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: item.priority_value ? PRIORITY_DOT[item.priority_value] ?? 'var(--muted)' : 'var(--border)',
                  flexShrink: 0,
                }} />

                {/* Code */}
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--muted)',
                  flexShrink: 0,
                  minWidth: '64px',
                }}>
                  {item.code}
                </span>

                {/* Title */}
                <span style={{
                  flex: 1,
                  fontSize: 'var(--fs-sm)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-ui)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </span>

                {/* Status */}
                <span style={{
                  fontSize: 'var(--fs-xs)',
                  color: STATUS_COLOR[item.status] ?? 'var(--muted)',
                  flexShrink: 0,
                  textTransform: 'capitalize',
                }}>
                  {item.status.replace('_', ' ')}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* TodoPanel for selected item */}
      {selectedTodo && (
        <TodoPanel
          todo={selectedTodo}
          groups={groups}
          categories={categories}
          products={products}
          priorities={priorities}
          isAll={false}
          onClose={() => setSelectedTodo(null)}
          onSave={updated => {
            setSelectedTodo(null)
            setItems(prev => prev.map(it =>
              it.id === updated.id
                ? { ...it, title: updated.title, status: updated.status, priority_value: updated.priority_value }
                : it
            ))
          }}
          onDelete={id => {
            setSelectedTodo(null)
            setItems(prev => prev.filter(it => it.id !== id))
          }}
        />
      )}
    </>
  )
}
