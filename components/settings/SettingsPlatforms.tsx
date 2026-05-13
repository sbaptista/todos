'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

type Platform = { id: string; name: string; sort_order: number }
type PlatformForm = { name: string; sort_order: string }

const EMPTY_FORM: PlatformForm = { name: '', sort_order: '0' }

export default function SettingsPlatforms() {
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PlatformForm>(EMPTY_FORM)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<PlatformForm>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('platforms').select('*').order('sort_order')
      setPlatforms(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  function startEdit(p: Platform) {
    setEditingId(p.id)
    setEditForm({ name: p.name, sort_order: String(p.sort_order) })
    setShowAdd(false)
    setConfirmDeleteId(null)
    setError('')
  }

  async function handleAdd() {
    if (!addForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('platforms')
      .insert({
        name: addForm.name.trim(),
        sort_order: Number(addForm.sort_order) || 0,
      })
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Platform added.'); setPlatforms(prev => [...prev, data as Platform]) }
    setShowAdd(false)
    setAddForm(EMPTY_FORM)
  }

  async function handleSave(id: string) {
    if (!editForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('platforms')
      .update({
        name: editForm.name.trim(),
        sort_order: Number(editForm.sort_order) || 0,
      })
      .eq('id', id)
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Platform saved.'); setPlatforms(prev => prev.map(p => p.id === id ? data as Platform : p)) }
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    setSaving(true)
    await supabase.from('todo_platforms').delete().eq('platform_id', id)
    await supabase.from('platforms').delete().eq('id', id)
    setSaving(false)
    toast.success('Platform deleted.')
    setPlatforms(prev => prev.filter(p => p.id !== id))
    setConfirmDeleteId(null)
  }

  function PlatformFormComp({
    form,
    onChange,
    onSubmit,
    onCancel,
    submitLabel,
  }: {
    form: PlatformForm
    onChange: (f: PlatformForm) => void
    onSubmit: () => void
    onCancel: () => void
    submitLabel: string
  }) {
    return (
      <div className="s-form">
        <div className="settings-grid-2col grid-2col mb-md">
          <div>
            <label className="label">Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => onChange({ ...form, name: e.target.value })}
              autoFocus
              placeholder="Platform name"
            />
          </div>
          <div>
            <label className="label">Sort Order</label>
            <input
              type="number"
              className="input"
              value={form.sort_order}
              onChange={e => onChange({ ...form, sort_order: e.target.value })}
            />
          </div>
        </div>
        <div className="flex-row gap-sm">
          <button className="btn-primary" onClick={onSubmit} disabled={saving}>
            {saving ? 'Saving…' : submitLabel}
          </button>
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    )
  }

  if (loading) return <div className="s-loading">Loading…</div>

  return (
    <div className="settings-page s-page">
      <div className="s-header">
        <h2 className="s-title">Platforms</h2>
        {!showAdd && (
          <button
            className="btn-outline"
            onClick={() => {
              setShowAdd(true)
              setEditingId(null)
              setConfirmDeleteId(null)
              setAddForm(EMPTY_FORM)
              setError('')
            }}
          >
            + Add Platform
          </button>
        )}
      </div>

      {error && <p className="s-error">{error}</p>}

      <div className="s-list">
        {showAdd && (
          <PlatformFormComp
            form={addForm}
            onChange={setAddForm}
            onSubmit={handleAdd}
            onCancel={() => { setShowAdd(false); setError('') }}
            submitLabel="Add Platform"
          />
        )}

        {platforms.length === 0 && !showAdd ? (
          <p className="s-empty">No platforms yet.</p>
        ) : (
          platforms.map(p =>
            editingId === p.id ? (
              <PlatformFormComp
                key={p.id}
                form={editForm}
                onChange={setEditForm}
                onSubmit={() => handleSave(p.id)}
                onCancel={() => { setEditingId(null); setError('') }}
                submitLabel="Save"
              />
            ) : confirmDeleteId === p.id ? (
              <div key={p.id} className="s-row-delete">
                <span className="text-sm flex-1">
                  Delete <strong>{p.name}</strong>? All todo associations will also be removed.
                </span>
                <button
                  className="btn-danger-confirm"
                  onClick={() => handleDelete(p.id)}
                  disabled={saving}
                  style={{ opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Deleting…' : 'Confirm'}
                </button>
                <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              </div>
            ) : (
              <div key={p.id} className="s-row">
                <div className="s-row-info">
                  <p style={{ margin: 0 }} className="text-sm">{p.name}</p>
                  <p style={{ margin: '2px 0 0' }} className="text-xs text-muted">sort: {p.sort_order}</p>
                </div>
                <button className="btn-row-action" onClick={() => startEdit(p)}>Edit</button>
                <button
                  className="btn-row-action btn-row-delete"
                  onClick={() => { setConfirmDeleteId(p.id); setEditingId(null) }}
                >
                  Delete
                </button>
              </div>
            )
          )
        )}
      </div>
    </div>
  )
}
