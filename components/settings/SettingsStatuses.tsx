'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch'
import { useToast } from '@/components/ui/Toast'

type Status = { id: string; name: string; sort_order: number; is_closed: boolean }
type StatusForm = { name: string; is_closed: boolean }

const EMPTY_FORM: StatusForm = { name: '', is_closed: false }

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

export default function SettingsStatuses() {
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()
  const [statuses, setStatuses] = useState<Status[]>([])
  const [todoCounts, setTodoCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<StatusForm>(EMPTY_FORM)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<StatusForm>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [statusRes, todoRes] = await Promise.all([
      supabase.from('statuses').select('*').order('sort_order'),
      supabase.from('todos').select('status'),
    ])
    setStatuses(statusRes.data ?? [])

    const counts: Record<string, number> = {}
    todoRes.data?.forEach(t => {
      if (t.status) {
        counts[t.status] = (counts[t.status] || 0) + 1
      }
    })

    const idCounts: Record<string, number> = {}
    statusRes.data?.forEach(s => {
      idCounts[s.id] = counts[s.name] || 0
    })
    setTodoCounts(idCounts)
    setLoading(false)
  }, [supabase])

  useVisibilityRefetch(load)
  useEffect(() => { load() }, [load])

  function startAdd() {
    setShowAdd(true)
    setEditingId(null)
    setConfirmDeleteId(null)
    setAddForm({ name: '', is_closed: false })
    setError('')
  }

  function startEdit(s: Status) {
    setEditingId(s.id)
    setEditForm({ name: s.name, is_closed: s.is_closed })
    setShowAdd(false)
    setConfirmDeleteId(null)
    setError('')
  }

  async function handleAdd() {
    const name = addForm.name.trim().toLowerCase()
    if (!name) { setError('Name is required'); return }
    if (statuses.some(s => s.name.toLowerCase() === name)) {
      setError('A status with this name already exists'); return
    }

    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('statuses')
      .insert({
        name,
        is_closed: addForm.is_closed,
        sort_order: statuses.length + 1,
      })
      .select()
      .single()

    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Status added.'); setStatuses(prev => [...prev, data as Status]) }
    setShowAdd(false)
    setAddForm(EMPTY_FORM)
  }

  async function handleSave(id: string) {
    const name = editForm.name.trim().toLowerCase()
    if (!name) { setError('Name is required'); return }
    if (statuses.some(s => s.id !== id && s.name.toLowerCase() === name)) {
      setError('A status with this name already exists'); return
    }

    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('statuses')
      .update({ name, is_closed: editForm.is_closed })
      .eq('id', id)
      .select()
      .single()

    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Status saved.'); setStatuses(prev => prev.map(s => s.id === id ? data as Status : s)) }
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    const target = statuses.find(s => s.id === id)
    if (!target) return

    setSaving(true)
    const { error: err } = await supabase.from('statuses').delete().eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }

    const higher = statuses.filter(s => s.sort_order > target.sort_order)
    if (higher.length > 0) {
      await Promise.all(higher.map(s =>
        supabase.from('statuses')
          .update({ sort_order: s.sort_order - 1 })
          .eq('id', s.id)
      ))
    }

    setSaving(false)
    toast.success('Status deleted.')
    setConfirmDeleteId(null)
    load()
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const idx = statuses.findIndex(s => s.id === id)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === statuses.length - 1) return

    const otherIdx = direction === 'up' ? idx - 1 : idx + 1
    const s1 = statuses[idx]
    const s2 = statuses[otherIdx]

    setSaving(true)
    setError('')

    try {
      const tempOrder = -999
      const { error: err1 } = await supabase.from('statuses').update({ sort_order: tempOrder }).eq('id', s1.id)
      if (err1) throw err1

      const { error: err2 } = await supabase.from('statuses').update({ sort_order: s1.sort_order }).eq('id', s2.id)
      if (err2) {
        await supabase.from('statuses').update({ sort_order: s1.sort_order }).eq('id', s1.id)
        throw err2
      }

      const { error: err3 } = await supabase.from('statuses').update({ sort_order: s2.sort_order }).eq('id', s1.id)
      if (err3) throw err3

      load()
    } catch (err: any) {
      setError(`Failed to move: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="s-loading">Loading…</div>

  return (
    <div className="settings-page s-page">
      <div className="s-header">
        <h2 className="s-title">Statuses</h2>
        {!showAdd && (
          <button className="btn-outline" onClick={startAdd}>
            + Add Status
          </button>
        )}
      </div>

      {error && <p className="s-error">{error}</p>}

      <div className="s-list">
        {showAdd && (
          <div className="s-form">
            <div className="mb-md">
              <label className="label">Name *</label>
              <input
                className="input"
                value={addForm.name}
                onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                autoFocus
                placeholder="Status name (e.g. open, in_progress)"
              />
            </div>
            <div className="flex-center gap-sm mb-md">
              <input
                type="checkbox"
                id="add-is-closed"
                className="checkbox"
                checked={addForm.is_closed}
                onChange={e => setAddForm({ ...addForm, is_closed: e.target.checked })}
              />
              <label htmlFor="add-is-closed" className="label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                Is Closed (Todo is finished)
              </label>
            </div>
            <div className="flex-row gap-sm">
              <button className="btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? 'Adding…' : 'Add Status'}
              </button>
              <button className="btn-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {statuses.map((s, idx) => (
          editingId === s.id ? (
            <div key={`status-edit-${s.id}`} className="s-form">
              <div className="mb-md">
                <label className="label">Name *</label>
                <input
                  className="input"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="flex-center gap-sm mb-md">
                <input
                  type="checkbox"
                  id={`edit-is-closed-${s.id}`}
                  className="checkbox"
                  checked={editForm.is_closed}
                  onChange={e => setEditForm({ ...editForm, is_closed: e.target.checked })}
                />
                <label htmlFor={`edit-is-closed-${s.id}`} className="label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  Is Closed (Todo is finished)
                </label>
              </div>
              <div className="flex-row gap-sm">
                <button className="btn-primary" onClick={() => handleSave(s.id)} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : confirmDeleteId === s.id ? (
            <div key={`status-del-${s.id}`} className="s-row-delete">
              <span className="text-sm flex-1">
                Delete <strong>{s.name}</strong>?
                {(todoCounts[s.id] ?? 0) > 0 && (
                  <span className="text-muted" style={{ marginLeft: 'var(--sp-xs)' }}>
                    Cannot delete — {todoCounts[s.id]} todos use this status.
                  </span>
                )}
              </span>
              {(todoCounts[s.id] ?? 0) === 0 ? (
                <>
                  <button className="btn-danger-confirm" onClick={() => handleDelete(s.id)} disabled={saving}>Confirm</button>
                  <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                </>
              ) : (
                <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>OK</button>
              )}
            </div>
          ) : (
            <div
              key={`status-row-${s.id}`}
              className="settings-list-row s-row"
            >
              <div className="text-xs text-muted" style={{ width: '24px', fontWeight: 600 }}>
                {s.sort_order}
              </div>
              <div className="s-row-info">
                <div className="flex-center gap-sm">
                  <p style={{ margin: 0, fontWeight: 500 }} className="text-sm">{s.name}</p>
                  {s.is_closed && <span className="badge">Closed</span>}
                </div>
              </div>
              <span className="s-row-meta">
                {todoCounts[s.id] ?? 0} todos
              </span>

              <div className="settings-row-actions flex-center" style={{ gap: '2px' }}>
                <button
                  className="btn-move"
                  onClick={() => handleMove(s.id, 'up')}
                  disabled={idx === 0 || saving}
                  title="Move Up"
                >
                  <ArrowUp />
                </button>
                <button
                  className="btn-move"
                  onClick={() => handleMove(s.id, 'down')}
                  disabled={idx === statuses.length - 1 || saving}
                  title="Move Down"
                >
                  <ArrowDown />
                </button>
                <button className="btn-row-action" onClick={() => startEdit(s)}>Edit</button>
                <button
                  className="btn-row-action btn-row-delete"
                  onClick={() => { setConfirmDeleteId(s.id); setEditingId(null) }}
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
