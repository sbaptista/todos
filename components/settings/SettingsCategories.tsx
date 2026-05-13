'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch'
import { useToast } from '@/components/ui/Toast'

type Product = { id: string; name: string }
type Category = { id: string; name: string; product_id: string | null; sort_order: number }
type CatForm = { name: string; product_id: string; sort_order: string }

const EMPTY_FORM: CatForm = { name: '', product_id: '', sort_order: '0' }

export default function SettingsCategories() {
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [todoCounts, setTodoCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CatForm>(EMPTY_FORM)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<CatForm>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [prodRes, catRes, todoRes] = await Promise.all([
      supabase.from('projects').select('id, name').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('todos').select('category_id'),
    ])
    setProducts(prodRes.data ?? [])
    setCategories(catRes.data ?? [])
    const counts: Record<string, number> = {}
    todoRes.data?.forEach(t => {
      if (t.category_id) counts[t.category_id] = (counts[t.category_id] || 0) + 1
    })
    setTodoCounts(counts)
    setLoading(false)
  }, [supabase])

  useVisibilityRefetch(load)
  useEffect(() => { load() }, [load])

  const displayed = categories.filter(c =>
    scope === '' ? c.product_id === null : c.product_id === scope
  )

  function startAdd() {
    setShowAdd(true)
    setEditingId(null)
    setConfirmDeleteId(null)
    setAddForm({ name: '', product_id: scope, sort_order: '0' })
    setError('')
  }

  function startEdit(c: Category) {
    setEditingId(c.id)
    setEditForm({
      name: c.name,
      product_id: c.product_id ?? '',
      sort_order: String(c.sort_order),
    })
    setShowAdd(false)
    setConfirmDeleteId(null)
    setError('')
  }

  async function handleAdd() {
    if (!addForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('categories')
      .insert({
        name: addForm.name.trim(),
        product_id: addForm.product_id || null,
        sort_order: Number(addForm.sort_order) || 0,
      })
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Category added.'); setCategories(prev => [...prev, data as Category]) }
    setShowAdd(false)
    setAddForm(EMPTY_FORM)
  }

  async function handleSave(id: string) {
    if (!editForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('categories')
      .update({
        name: editForm.name.trim(),
        product_id: editForm.product_id || null,
        sort_order: Number(editForm.sort_order) || 0,
      })
      .eq('id', id)
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) { toast.success('Category saved.'); setCategories(prev => prev.map(c => c.id === id ? data as Category : c)) }
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    setSaving(true)
    await supabase.from('categories').delete().eq('id', id)
    setSaving(false)
    toast.success('Category deleted.')
    setCategories(prev => prev.filter(c => c.id !== id))
    setConfirmDeleteId(null)
  }

  function CatFormComp({
    form,
    onChange,
    onSubmit,
    onCancel,
    submitLabel,
  }: {
    form: CatForm
    onChange: (f: CatForm) => void
    onSubmit: () => void
    onCancel: () => void
    submitLabel: string
  }) {
    return (
      <div className="s-form">
        <div className="grid-2col mb-md">
          <div>
            <label className="label">Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => onChange({ ...form, name: e.target.value })}
              autoFocus
              placeholder="Category name"
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
        <div className="mb-md">
          <label className="label">Product</label>
          <select
            className="select"
            value={form.product_id}
            onChange={e => onChange({ ...form, product_id: e.target.value })}
          >
            <option value="">Global</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
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

  if (loading) return <div className="s-loading">Loading…</div>

  return (
    <div className="s-page">
      <div className="s-header">
        <h2 className="s-title">Categories</h2>
        {!showAdd && (
          <button className="btn-outline" onClick={startAdd}>
            + Add Category
          </button>
        )}
      </div>

      <div className="flex-row gap-sm mb-xl" style={{ flexWrap: 'wrap' }}>
        <button
          className={`pill ${scope === '' ? 'pill-active' : ''}`}
          onClick={() => setScope('')}
        >
          Global
        </button>
        {products.map(p => (
          <button
            key={p.id}
            className={`pill ${scope === p.id ? 'pill-active' : ''}`}
            onClick={() => setScope(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {error && <p className="s-error">{error}</p>}

      <div className="s-list">
        {showAdd && (
          <CatFormComp
            form={addForm}
            onChange={setAddForm}
            onSubmit={handleAdd}
            onCancel={() => { setShowAdd(false); setError('') }}
            submitLabel="Add Category"
          />
        )}

        {displayed.length === 0 && !showAdd ? (
          <p className="s-empty">No categories in this scope.</p>
        ) : (
          displayed.map(c =>
            editingId === c.id ? (
              <CatFormComp
                key={c.id}
                form={editForm}
                onChange={setEditForm}
                onSubmit={() => handleSave(c.id)}
                onCancel={() => { setEditingId(null); setError('') }}
                submitLabel="Save"
              />
            ) : confirmDeleteId === c.id ? (
              <div key={c.id} className="s-row-delete">
                <span className="text-sm flex-1">
                  Delete <strong>{c.name}</strong>?
                  {(todoCounts[c.id] ?? 0) > 0 && (
                    <span className="text-muted" style={{ marginLeft: 'var(--sp-xs)' }}>
                      Cannot delete — {todoCounts[c.id]} todo{todoCounts[c.id] !== 1 ? 's' : ''} use this category.
                    </span>
                  )}
                </span>
                {(todoCounts[c.id] ?? 0) === 0 ? (
                  <>
                    <button
                      className="btn-danger-confirm"
                      onClick={() => handleDelete(c.id)}
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
              <div key={c.id} className="s-row">
                <div className="s-row-info">
                  <p style={{ margin: 0 }} className="text-sm">{c.name}</p>
                  <p style={{ margin: '2px 0 0' }} className="text-xs text-muted">sort: {c.sort_order}</p>
                </div>
                <span className="s-row-meta">
                  {todoCounts[c.id] ?? 0} todos
                </span>
                <button className="btn-row-action" onClick={() => startEdit(c)}>
                  Edit
                </button>
                <button
                  className="btn-row-action btn-row-delete"
                  onClick={() => { setConfirmDeleteId(c.id); setEditingId(null) }}
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
