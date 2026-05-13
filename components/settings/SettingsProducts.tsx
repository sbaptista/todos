'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch'
import { useToast } from '@/components/ui/Toast'

type Product = {
  id: string
  name: string
  description: string | null
  color: string | null
  sort_order: number
}

type ItemForm = {
  name: string
  description: string
  color: string
  sort_order: string
}

const EMPTY_FORM: ItemForm = {
  name: '',
  description: '',
  color: '#6366f1',
  sort_order: '0',
}

function ProductForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  saving,
}: {
  form: ItemForm
  onChange: (f: ItemForm) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
  saving: boolean
}) {
  return (
    <div className="s-form">
      <div className="mb-md">
        <label className="label">Name *</label>
        <input
          className="input"
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
          autoFocus
          placeholder="Project name"
        />
      </div>
      <div className="mb-md">
        <label className="label">Description</label>
        <input
          className="input"
          value={form.description}
          onChange={e => onChange({ ...form, description: e.target.value })}
          placeholder="Optional description"
        />
      </div>
      <div className="flex-center gap-xl mb-md" style={{ alignItems: 'flex-end' }}>
        <div>
          <label className="label">Color</label>
          <input
            type="color"
            className="color-swatch"
            value={form.color}
            onChange={e => onChange({ ...form, color: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Sort Order</label>
          <input
            type="number"
            className="input"
            style={{ width: '80px' }}
            value={form.sort_order}
            onChange={e => onChange({ ...form, sort_order: e.target.value })}
          />
        </div>
      </div>
      <div className="flex-row gap-sm">
        <button
          className="btn-primary"
          onClick={onSubmit}
          disabled={saving}
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

export default function SettingsProducts() {
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [todoCounts, setTodoCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ItemForm>(EMPTY_FORM)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<ItemForm>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [prodRes, todoRes] = await Promise.all([
      supabase.from('projects').select('*').order('sort_order'),
      supabase.from('todos').select('product_id'),
    ])
    setProducts(prodRes.data ?? [])
    const counts: Record<string, number> = {}
    todoRes.data?.forEach(t => {
      counts[t.product_id] = (counts[t.product_id] || 0) + 1
    })
    setTodoCounts(counts)
    setLoading(false)
  }, [supabase])

  useVisibilityRefetch(load)
  useEffect(() => { load() }, [load])

  function startEdit(p: Product) {
    setEditingId(p.id)
    setEditForm({
      name: p.name,
      description: p.description ?? '',
      color: p.color ?? '#6366f1',
      sort_order: String(p.sort_order),
    })
    setShowAdd(false)
    setConfirmDeleteId(null)
    setError('')
  }

  async function handleSave(id: string) {
    if (!editForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('projects')
      .update({
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        color: editForm.color,
        sort_order: Number(editForm.sort_order) || 0,
      })
      .eq('id', id)
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Project saved.'); setProducts(prev => prev.map(p => p.id === id ? data as Product : p)) }
    setEditingId(null)
  }

  async function handleAdd() {
    if (!addForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('projects')
      .insert({
        name: addForm.name.trim(),
        description: addForm.description.trim() || null,
        color: addForm.color,
        sort_order: Number(addForm.sort_order) || 0,
      })
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Project added.'); setProducts(prev => [...prev, data as Product]) }
    setShowAdd(false)
    setAddForm(EMPTY_FORM)
  }

  async function handleDelete(id: string) {
    setSaving(true)
    await supabase.from('projects').delete().eq('id', id)
    setSaving(false)
    toast.success('Project deleted.')
    setProducts(prev => prev.filter(p => p.id !== id))
    setConfirmDeleteId(null)
  }

  if (loading) return <div className="s-loading">Loading…</div>

  return (
    <div className="settings-page s-page">
      <div className="s-header">
        <h2 className="s-title">Projects</h2>
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
            + Add Project
          </button>
        )}
      </div>

      {error && <p className="s-error">{error}</p>}

      <div className="s-list">
        {showAdd && (
          <ProductForm
            form={addForm}
            onChange={setAddForm}
            onSubmit={handleAdd}
            onCancel={() => { setShowAdd(false); setError('') }}
            submitLabel="Add Project"
            saving={saving}
          />
        )}

        {products.length === 0 && !showAdd ? (
          <p className="s-empty">No projects yet.</p>
        ) : (
          products.map(p =>
            editingId === p.id ? (
              <ProductForm
                key={p.id}
                form={editForm}
                onChange={setEditForm}
                onSubmit={() => handleSave(p.id)}
                onCancel={() => { setEditingId(null); setError('') }}
                submitLabel="Save"
                saving={saving}
              />
            ) : confirmDeleteId === p.id ? (
              <div key={p.id} className="s-row-delete">
                <span className="text-sm flex-1">
                  Delete <strong>{p.name}</strong>?
                  {(todoCounts[p.id] ?? 0) > 0 && (
                    <span className="text-muted" style={{ marginLeft: 'var(--sp-xs)' }}>
                      Cannot delete — {todoCounts[p.id]} todo{todoCounts[p.id] !== 1 ? 's' : ''} exist.
                    </span>
                  )}
                </span>
                {(todoCounts[p.id] ?? 0) === 0 ? (
                  <>
                    <button
                      className="btn-danger-confirm"
                      onClick={() => handleDelete(p.id)}
                      disabled={saving}
                      style={{ opacity: saving ? 0.6 : 1 }}
                    >
                      Confirm
                    </button>
                    <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>
                    OK
                  </button>
                )}
              </div>
            ) : (
              <div key={p.id} className="s-row">
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: 'var(--r)',
                    flexShrink: 0,
                    border: '1px solid var(--border)',
                    backgroundColor: p.color ?? '#e5e7eb',
                  }}
                />
                <div className="s-row-info">
                  <p style={{ margin: 0 }} className="text-sm">{p.name}</p>
                  {p.description && (
                    <p style={{ margin: '2px 0 0' }} className="text-xs text-muted truncate">
                      {p.description}
                    </p>
                  )}
                </div>
                <span className="s-row-meta">
                  {todoCounts[p.id] ?? 0} todos
                </span>
                <button className="btn-row-action" onClick={() => startEdit(p)}>
                  Edit
                </button>
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
