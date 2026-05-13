'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch'
import { useToast } from '@/components/ui/Toast'

type Priority = { label: string; value: number }
type PrioForm = { label: string; value: string }

const EMPTY_FORM: PrioForm = { label: '', value: '' }

const ArrowUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
)

const ArrowDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)

export default function SettingsPriorities() {
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [todoCounts, setTodoCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [editingValue, setEditingValue] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<PrioForm>(EMPTY_FORM)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<PrioForm>(EMPTY_FORM)
  const [confirmDeleteValue, setConfirmDeleteValue] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [prioRes, todoRes] = await Promise.all([
      supabase.from('priorities').select('*').order('value'),
      supabase.from('todos').select('priority_value'),
    ])
    setPriorities(prioRes.data ?? [])

    const counts: Record<number, number> = {}
    todoRes.data?.forEach(t => {
      if (t.priority_value !== null) {
        counts[t.priority_value] = (counts[t.priority_value] || 0) + 1
      }
    })
    setTodoCounts(counts)
    setLoading(false)
  }, [supabase])

  useVisibilityRefetch(load)
  useEffect(() => { load() }, [load])

  function startAdd() {
    setShowAdd(true)
    setEditingValue(null)
    setConfirmDeleteValue(null)
    setAddForm({ label: '', value: String(priorities.length + 1) })
    setError('')
  }

  function startEdit(p: Priority) {
    setEditingValue(p.value)
    setEditForm({ label: p.label, value: String(p.value) })
    setShowAdd(false)
    setConfirmDeleteValue(null)
    setError('')
  }

  async function handleAdd() {
    const label = addForm.label.trim()
    if (!label) { setError('Label is required'); return }
    if (priorities.some(p => p.label.toLowerCase() === label.toLowerCase())) {
      setError('A priority with this label already exists'); return
    }

    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('priorities')
      .insert({
        label,
        value: priorities.length + 1,
      })
      .select()
      .single()

    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Priority added.'); setPriorities(prev => [...prev, data as Priority]) }
    setShowAdd(false)
    setAddForm(EMPTY_FORM)
  }

  async function handleSave(value: number) {
    const label = editForm.label.trim()
    if (!label) { setError('Label is required'); return }
    if (priorities.some(p => p.value !== value && p.label.toLowerCase() === label.toLowerCase())) {
      setError('A priority with this label already exists'); return
    }

    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('priorities')
      .update({ label })
      .eq('value', value)
      .select()
      .single()

    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Priority saved.'); setPriorities(prev => prev.map(p => p.value === value ? data as Priority : p)) }
    setEditingValue(null)
  }

  async function handleDelete(value: number) {
    setSaving(true)
    const { error: err } = await supabase.from('priorities').delete().eq('value', value)
    if (err) { setError(err.message); setSaving(false); return }

    const higher = priorities.filter(p => p.value > value)
    if (higher.length > 0) {
      await Promise.all(higher.map(p =>
        supabase.from('priorities')
          .update({ value: p.value - 1 })
          .eq('value', p.value)
      ))
    }

    setSaving(false)
    toast.success('Priority deleted.')
    setConfirmDeleteValue(null)
    load()
  }

  async function handleMove(label: string, direction: 'up' | 'down') {
    const idx = priorities.findIndex(p => p.label === label)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === priorities.length - 1) return

    const newValue = direction === 'up' ? priorities[idx - 1].value : priorities[idx + 1].value

    setSaving(true)
    setError('')

    const { error: rpcErr } = await supabase.rpc('smart_reorder_priorities', {
      p_label: label,
      p_new_value: newValue
    })

    if (rpcErr) {
      setError(`Failed to move: ${rpcErr.message}`)
    } else {
      load()
    }
    setSaving(false)
  }

  if (loading) return <div className="s-loading">Loading…</div>

  return (
    <div className="settings-page s-page">
      <div className="s-header">
        <h2 className="s-title">Priorities</h2>
        {!showAdd && (
          <button className="btn-outline" onClick={startAdd}>+ Add Priority</button>
        )}
      </div>

      {error && <p className="s-error">{error}</p>}

      <div className="s-list">
        {showAdd && (
          <div className="s-form">
            <label className="label">Label *</label>
            <div className="flex-row gap-sm mb-md">
              <input
                className="input"
                value={addForm.label}
                onChange={e => setAddForm({ ...addForm, label: e.target.value })}
                autoFocus
                placeholder="Priority label"
              />
            </div>
            <div className="flex-row gap-sm">
              <button className="btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? 'Adding…' : 'Add Priority'}
              </button>
              <button className="btn-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {priorities.map((p, idx) => (
          editingValue === p.value ? (
            <div key={`prio-edit-${p.value}`} className="s-form">
              <label className="label">Label *</label>
              <input
                className="input mb-md"
                value={editForm.label}
                onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                autoFocus
              />
              <div className="flex-row gap-sm">
                <button className="btn-primary" onClick={() => handleSave(p.value)} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="btn-cancel" onClick={() => setEditingValue(null)}>Cancel</button>
              </div>
            </div>
          ) : confirmDeleteValue === p.value ? (
            <div key={`prio-del-${p.value}`} className="s-row-delete">
              <span className="text-sm flex-1">
                Delete <strong>{p.label}</strong>?
                {(todoCounts[p.value] ?? 0) > 0 && (
                  <span className="text-muted" style={{ marginLeft: 'var(--sp-xs)' }}>
                    Cannot delete — {todoCounts[p.value]} todos use this priority.
                  </span>
                )}
              </span>
              {(todoCounts[p.value] ?? 0) === 0 ? (
                <>
                  <button className="btn-danger-confirm" onClick={() => handleDelete(p.value)} disabled={saving}>Confirm</button>
                  <button className="btn-cancel" onClick={() => setConfirmDeleteValue(null)}>Cancel</button>
                </>
              ) : (
                <button className="btn-cancel" onClick={() => setConfirmDeleteValue(null)}>OK</button>
              )}
            </div>
          ) : (
            <div
              key={`prio-row-${p.value}`}
              className="settings-list-row s-row"
            >
              <div className="text-xs text-muted" style={{ width: '24px', fontWeight: 600 }}>
                {p.value}
              </div>
              <div className="s-row-info">
                <p style={{ margin: 0 }} className="text-sm truncate">{p.label}</p>
              </div>
              <span className="s-row-meta" style={{ whiteSpace: 'nowrap' }}>
                {todoCounts[p.value] ?? 0} tasks
              </span>

              <div className="settings-row-actions flex-center" style={{ gap: '2px' }}>
                <button
                  className="btn-move"
                  onClick={() => handleMove(p.label, 'up')}
                  disabled={idx === 0 || saving}
                  title="Move Up"
                >
                  <ArrowUp />
                </button>
                <button
                  className="btn-move"
                  onClick={() => handleMove(p.label, 'down')}
                  disabled={idx === priorities.length - 1 || saving}
                  title="Move Down"
                >
                  <ArrowDown />
                </button>
                <button className="btn-row-action" onClick={() => startEdit(p)}>Edit</button>
                <button
                  className="btn-row-action btn-row-delete"
                  onClick={() => { setConfirmDeleteValue(p.value); setEditingValue(null) }}
                >
                  Delete
                </button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
