'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

type Platform = { id: string; name: string; sort_order: number }
type Form     = { name: string; sort_order: string }

const EMPTY: Form = { name: '', sort_order: '0' }

function RowForm({ nameLabel, namePlaceholder, form, onChange, onSubmit, onCancel, submitLabel, saving }: {
  nameLabel: string
  namePlaceholder: string
  form: Form
  onChange: (f: Form) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
  saving: boolean
}) {
  return (
    <div style={{
      padding: 'var(--sp-md) var(--sp-lg)',
      background: 'var(--bg3)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 'var(--sp-md)', marginBottom: 'var(--sp-md)' }}>
        <div>
          <label className="pf-label">{nameLabel} *</label>
          <input
            className="pf-input"
            value={form.name}
            onChange={e => onChange({ ...form, name: e.target.value })}
            autoFocus
            placeholder={namePlaceholder}
          />
        </div>
        <div>
          <label className="pf-label">Sort Order</label>
          <input
            type="number"
            className="pf-input"
            value={form.sort_order}
            onChange={e => onChange({ ...form, sort_order: e.target.value })}
          />
        </div>
      </div>
      <div className="flex-row" style={{ gap: 'var(--sp-sm)' }}>
        <button
          className="btn-primary"
          onClick={onSubmit}
          disabled={saving}
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function PlatformsSection({ supabase }: { supabase: ReturnType<typeof createClient> }) {
  const toast = useToast()
  const [platforms, setPlatforms]         = useState<Platform[]>([])
  const [loading, setLoading]             = useState(true)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [editForm, setEditForm]           = useState<Form>(EMPTY)
  const [showAdd, setShowAdd]             = useState(false)
  const [addForm, setAddForm]             = useState<Form>(EMPTY)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('platforms').select('*').order('sort_order')
      setPlatforms(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleAdd() {
    if (!addForm.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    const { data, error: err } = await supabase.from('platforms')
      .insert({ name: addForm.name.trim(), sort_order: Number(addForm.sort_order) || 0 })
      .select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Platform added.'); setPlatforms(prev => [...prev, data as Platform]) }
    setShowAdd(false); setAddForm(EMPTY)
  }

  async function handleSave(id: string) {
    if (!editForm.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    const { data, error: err } = await supabase.from('platforms')
      .update({ name: editForm.name.trim(), sort_order: Number(editForm.sort_order) || 0 })
      .eq('id', id).select().single()
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

  if (loading) return <p className="s-loading">Loading…</p>

  return (
    <div>
      <div className="s-row" style={{ justifyContent: 'space-between' }}>
        <span className="text-sm" style={{ fontWeight: 'var(--fw-medium)', color: 'var(--text2)' }}>Platforms</span>
        {!showAdd && (
          <button
            className="btn-row-action"
            onClick={() => { setShowAdd(true); setEditingId(null); setAddForm(EMPTY); setError('') }}
          >
            + Add
          </button>
        )}
      </div>

      {error && <p className="s-error">{error}</p>}

      {showAdd && <RowForm nameLabel="Name" namePlaceholder="Platform name" form={addForm} onChange={setAddForm} onSubmit={handleAdd} onCancel={() => { setShowAdd(false); setError('') }} submitLabel="Add Platform" saving={saving} />}

      {platforms.length === 0 && !showAdd ? (
        <p className="s-empty">No platforms yet.</p>
      ) : (
        <div>
          {platforms.map(p => editingId === p.id ? (
            <RowForm key={p.id} nameLabel="Name" namePlaceholder="Platform name" form={editForm} onChange={setEditForm} onSubmit={() => handleSave(p.id)} onCancel={() => { setEditingId(null); setError('') }} submitLabel="Save" saving={saving} />
          ) : confirmDeleteId === p.id ? (
            <div key={p.id} className="s-row-delete">
              <span className="text-sm flex-1">
                Delete <strong>{p.name}</strong>? All todo associations will also be removed.
              </span>
              <button className="btn-row-delete" onClick={() => handleDelete(p.id)} disabled={saving}>{saving ? 'Deleting…' : 'Confirm'}</button>
              <button className="btn-row-action" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
            </div>
          ) : (
            <div key={p.id} className="s-row">
              <span className="text-sm flex-1">{p.name}</span>
              <button className="btn-row-edit" onClick={() => { setEditingId(p.id); setEditForm({ name: p.name, sort_order: String(p.sort_order) }); setShowAdd(false); setConfirmDeleteId(null); setError('') }}>Edit</button>
              <button className="btn-row-edit" onClick={() => { setConfirmDeleteId(p.id); setEditingId(null) }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductConfigPanel({ productId, productName, productIcon, onClose }: {
  productId: string
  productName: string
  productIcon: string | null
  onClose: () => void
}) {
  const supabase = useMemo(() => createClient(), [])

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />

      <div className="slide-panel">
        <div className="slide-panel-header">
          <span style={{ fontSize: '20px' }}>{productIcon ?? '📦'}</span>
          <div className="flex-1" style={{ minWidth: 0 }}>
            <p className="truncate" style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text)', margin: 0 }}>{productName}</p>
            <p className="text-xs text-muted" style={{ margin: 0 }}>Product configuration</p>
          </div>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="slide-panel-body">
          <PlatformsSection supabase={supabase} />
        </div>
      </div>
    </>
  )
}
