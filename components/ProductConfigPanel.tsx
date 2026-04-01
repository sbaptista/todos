'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

type Group = { id: string; name: string; product_id: string | null; sort_order: number }
type Category = { id: string; name: string; product_id: string | null; sort_order: number }
type Platform = { id: string; name: string; sort_order: number }

type GroupForm = { name: string; sort_order: string }
type CatForm = { name: string; sort_order: string }
type PlatformForm = { name: string; sort_order: string }

const EMPTY_SHORT: GroupForm = { name: '', sort_order: '0' }

// --- Shared inline row form ---
function RowForm({
  nameLabel,
  namePlaceholder,
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  saving,
}: {
  nameLabel: string
  namePlaceholder: string
  form: GroupForm
  onChange: (f: GroupForm) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
  saving: boolean
}) {
  return (
    <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">{nameLabel} *</label>
          <input
            className="w-full border border-zinc-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            value={form.name}
            onChange={e => onChange({ ...form, name: e.target.value })}
            autoFocus
            placeholder={namePlaceholder}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Sort Order</label>
          <input
            type="number"
            className="w-full border border-zinc-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            value={form.sort_order}
            onChange={e => onChange({ ...form, sort_order: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={saving}
          className="text-sm bg-zinc-900 text-white px-3 py-1.5 rounded hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button onClick={onCancel} className="text-sm text-zinc-500 hover:text-zinc-800 px-3 py-1.5">
          Cancel
        </button>
      </div>
    </div>
  )
}

// --- Groups section ---
function GroupsSection({ productId, supabase }: { productId: string; supabase: ReturnType<typeof import('@/lib/supabase/client').createClient> }) {
  const [groups, setGroups] = useState<Group[]>([])
  const [todoCounts, setTodoCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GroupForm>(EMPTY_SHORT)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<GroupForm>(EMPTY_SHORT)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [groupRes, todoRes] = await Promise.all([
        supabase.from('groups').select('*').eq('product_id', productId).order('sort_order'),
        supabase.from('todos').select('group_id').eq('product_id', productId),
      ])
      setGroups(groupRes.data ?? [])
      const counts: Record<string, number> = {}
      todoRes.data?.forEach(t => {
        if (t.group_id) counts[t.group_id] = (counts[t.group_id] || 0) + 1
      })
      setTodoCounts(counts)
      setLoading(false)
    }
    load()
  }, [productId, supabase])

  async function handleAdd() {
    if (!addForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('groups')
      .insert({ name: addForm.name.trim(), product_id: productId, sort_order: Number(addForm.sort_order) || 0 })
      .select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) setGroups(prev => [...prev, data as Group])
    setShowAdd(false)
    setAddForm(EMPTY_SHORT)
  }

  async function handleSave(id: string) {
    if (!editForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('groups')
      .update({ name: editForm.name.trim(), sort_order: Number(editForm.sort_order) || 0 })
      .eq('id', id).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) setGroups(prev => prev.map(g => g.id === id ? data as Group : g))
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    setSaving(true)
    await supabase.from('groups').delete().eq('id', id)
    setSaving(false)
    setGroups(prev => prev.filter(g => g.id !== id))
    setConfirmDeleteId(null)
  }

  if (loading) return <p className="text-sm text-zinc-400 py-4 px-4">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <span className="text-sm font-medium text-zinc-700">Groups</span>
        {!showAdd && (
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setAddForm(EMPTY_SHORT); setError('') }}
            className="text-xs text-zinc-500 hover:text-zinc-800 border border-zinc-200 px-2 py-1 rounded transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 px-4 py-2">{error}</p>}

      {showAdd && (
        <RowForm
          nameLabel="Name"
          namePlaceholder="Group name"
          form={addForm}
          onChange={setAddForm}
          onSubmit={handleAdd}
          onCancel={() => { setShowAdd(false); setError('') }}
          submitLabel="Add Group"
          saving={saving}
        />
      )}

      {groups.length === 0 && !showAdd ? (
        <p className="text-xs text-zinc-400 px-4 py-4">No groups for this product.</p>
      ) : (
        <div className="divide-y divide-zinc-100">
          {groups.map(g =>
            editingId === g.id ? (
              <RowForm
                key={g.id}
                nameLabel="Name"
                namePlaceholder="Group name"
                form={editForm}
                onChange={setEditForm}
                onSubmit={() => handleSave(g.id)}
                onCancel={() => { setEditingId(null); setError('') }}
                submitLabel="Save"
                saving={saving}
              />
            ) : confirmDeleteId === g.id ? (
              <div key={g.id} className="flex items-center gap-3 px-4 py-3 bg-red-50">
                <span className="text-sm flex-1">
                  Delete <strong>{g.name}</strong>?
                  {(todoCounts[g.id] ?? 0) > 0 && (
                    <span className="text-zinc-500 ml-1">
                      Cannot delete — {todoCounts[g.id]} todo{todoCounts[g.id] !== 1 ? 's' : ''} use this group.
                    </span>
                  )}
                </span>
                {(todoCounts[g.id] ?? 0) === 0 ? (
                  <>
                    <button onClick={() => handleDelete(g.id)} disabled={saving} className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50">Confirm</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-sm text-zinc-500 hover:text-zinc-800">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDeleteId(null)} className="text-sm text-zinc-500 hover:text-zinc-800">OK</button>
                )}
              </div>
            ) : (
              <div key={g.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800">{g.name}</p>
                </div>
                <span className="text-xs text-zinc-400 shrink-0">{todoCounts[g.id] ?? 0} todos</span>
                <button onClick={() => { setEditingId(g.id); setEditForm({ name: g.name, sort_order: String(g.sort_order) }); setShowAdd(false); setConfirmDeleteId(null); setError('') }} className="text-xs text-zinc-400 hover:text-zinc-700 shrink-0">Edit</button>
                <button onClick={() => { setConfirmDeleteId(g.id); setEditingId(null) }} className="text-xs text-zinc-400 hover:text-red-600 shrink-0">Delete</button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

// --- Categories section ---
function CategoriesSection({ productId, supabase }: { productId: string; supabase: ReturnType<typeof import('@/lib/supabase/client').createClient> }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [todoCounts, setTodoCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CatForm>(EMPTY_SHORT)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<CatForm>(EMPTY_SHORT)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [catRes, todoRes] = await Promise.all([
        supabase.from('categories').select('*').eq('product_id', productId).order('sort_order'),
        supabase.from('todos').select('category_id').eq('product_id', productId),
      ])
      setCategories(catRes.data ?? [])
      const counts: Record<string, number> = {}
      todoRes.data?.forEach(t => {
        if (t.category_id) counts[t.category_id] = (counts[t.category_id] || 0) + 1
      })
      setTodoCounts(counts)
      setLoading(false)
    }
    load()
  }, [productId, supabase])

  async function handleAdd() {
    if (!addForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('categories')
      .insert({ name: addForm.name.trim(), product_id: productId, sort_order: Number(addForm.sort_order) || 0 })
      .select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) setCategories(prev => [...prev, data as Category])
    setShowAdd(false)
    setAddForm(EMPTY_SHORT)
  }

  async function handleSave(id: string) {
    if (!editForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('categories')
      .update({ name: editForm.name.trim(), sort_order: Number(editForm.sort_order) || 0 })
      .eq('id', id).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) setCategories(prev => prev.map(c => c.id === id ? data as Category : c))
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    setSaving(true)
    await supabase.from('categories').delete().eq('id', id)
    setSaving(false)
    setCategories(prev => prev.filter(c => c.id !== id))
    setConfirmDeleteId(null)
  }

  if (loading) return <p className="text-sm text-zinc-400 py-4 px-4">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <span className="text-sm font-medium text-zinc-700">Categories</span>
        {!showAdd && (
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setAddForm(EMPTY_SHORT); setError('') }}
            className="text-xs text-zinc-500 hover:text-zinc-800 border border-zinc-200 px-2 py-1 rounded transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 px-4 py-2">{error}</p>}

      {showAdd && (
        <RowForm
          nameLabel="Name"
          namePlaceholder="Category name"
          form={addForm}
          onChange={setAddForm}
          onSubmit={handleAdd}
          onCancel={() => { setShowAdd(false); setError('') }}
          submitLabel="Add Category"
          saving={saving}
        />
      )}

      {categories.length === 0 && !showAdd ? (
        <p className="text-xs text-zinc-400 px-4 py-4">No categories for this product.</p>
      ) : (
        <div className="divide-y divide-zinc-100">
          {categories.map(c =>
            editingId === c.id ? (
              <RowForm
                key={c.id}
                nameLabel="Name"
                namePlaceholder="Category name"
                form={editForm}
                onChange={setEditForm}
                onSubmit={() => handleSave(c.id)}
                onCancel={() => { setEditingId(null); setError('') }}
                submitLabel="Save"
                saving={saving}
              />
            ) : confirmDeleteId === c.id ? (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-red-50">
                <span className="text-sm flex-1">
                  Delete <strong>{c.name}</strong>?
                  {(todoCounts[c.id] ?? 0) > 0 && (
                    <span className="text-zinc-500 ml-1">
                      Cannot delete — {todoCounts[c.id]} todo{todoCounts[c.id] !== 1 ? 's' : ''} use this category.
                    </span>
                  )}
                </span>
                {(todoCounts[c.id] ?? 0) === 0 ? (
                  <>
                    <button onClick={() => handleDelete(c.id)} disabled={saving} className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50">Confirm</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-sm text-zinc-500 hover:text-zinc-800">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDeleteId(null)} className="text-sm text-zinc-500 hover:text-zinc-800">OK</button>
                )}
              </div>
            ) : (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800">{c.name}</p>
                </div>
                <span className="text-xs text-zinc-400 shrink-0">{todoCounts[c.id] ?? 0} todos</span>
                <button onClick={() => { setEditingId(c.id); setEditForm({ name: c.name, sort_order: String(c.sort_order) }); setShowAdd(false); setConfirmDeleteId(null); setError('') }} className="text-xs text-zinc-400 hover:text-zinc-700 shrink-0">Edit</button>
                <button onClick={() => { setConfirmDeleteId(c.id); setEditingId(null) }} className="text-xs text-zinc-400 hover:text-red-600 shrink-0">Delete</button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

// --- Platforms section ---
function PlatformsSection({ supabase }: { supabase: ReturnType<typeof import('@/lib/supabase/client').createClient> }) {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PlatformForm>(EMPTY_SHORT)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<PlatformForm>(EMPTY_SHORT)
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

  async function handleAdd() {
    if (!addForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('platforms')
      .insert({ name: addForm.name.trim(), sort_order: Number(addForm.sort_order) || 0 })
      .select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) setPlatforms(prev => [...prev, data as Platform])
    setShowAdd(false)
    setAddForm(EMPTY_SHORT)
  }

  async function handleSave(id: string) {
    if (!editForm.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('platforms')
      .update({ name: editForm.name.trim(), sort_order: Number(editForm.sort_order) || 0 })
      .eq('id', id).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) setPlatforms(prev => prev.map(p => p.id === id ? data as Platform : p))
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    setSaving(true)
    await supabase.from('todo_platforms').delete().eq('platform_id', id)
    await supabase.from('platforms').delete().eq('id', id)
    setSaving(false)
    setPlatforms(prev => prev.filter(p => p.id !== id))
    setConfirmDeleteId(null)
  }

  if (loading) return <p className="text-sm text-zinc-400 py-4 px-4">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <span className="text-sm font-medium text-zinc-700">Platforms</span>
        {!showAdd && (
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setAddForm(EMPTY_SHORT); setError('') }}
            className="text-xs text-zinc-500 hover:text-zinc-800 border border-zinc-200 px-2 py-1 rounded transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 px-4 py-2">{error}</p>}

      {showAdd && (
        <RowForm
          nameLabel="Name"
          namePlaceholder="Platform name"
          form={addForm}
          onChange={setAddForm}
          onSubmit={handleAdd}
          onCancel={() => { setShowAdd(false); setError('') }}
          submitLabel="Add Platform"
          saving={saving}
        />
      )}

      {platforms.length === 0 && !showAdd ? (
        <p className="text-xs text-zinc-400 px-4 py-4">No platforms yet.</p>
      ) : (
        <div className="divide-y divide-zinc-100">
          {platforms.map(p =>
            editingId === p.id ? (
              <RowForm
                key={p.id}
                nameLabel="Name"
                namePlaceholder="Platform name"
                form={editForm}
                onChange={setEditForm}
                onSubmit={() => handleSave(p.id)}
                onCancel={() => { setEditingId(null); setError('') }}
                submitLabel="Save"
                saving={saving}
              />
            ) : confirmDeleteId === p.id ? (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-red-50">
                <span className="text-sm flex-1">
                  Delete <strong>{p.name}</strong>? All todo associations will also be removed.
                </span>
                <button onClick={() => handleDelete(p.id)} disabled={saving} className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50">{saving ? 'Deleting…' : 'Confirm'}</button>
                <button onClick={() => setConfirmDeleteId(null)} className="text-sm text-zinc-500 hover:text-zinc-800">Cancel</button>
              </div>
            ) : (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800">{p.name}</p>
                </div>
                <button onClick={() => { setEditingId(p.id); setEditForm({ name: p.name, sort_order: String(p.sort_order) }); setShowAdd(false); setConfirmDeleteId(null); setError('') }} className="text-xs text-zinc-400 hover:text-zinc-700 shrink-0">Edit</button>
                <button onClick={() => { setConfirmDeleteId(p.id); setEditingId(null) }} className="text-xs text-zinc-400 hover:text-red-600 shrink-0">Delete</button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

// --- Main panel ---
type Tab = 'groups' | 'categories' | 'platforms'

export default function ProductConfigPanel({
  productId,
  productName,
  productIcon,
  onClose,
}: {
  productId: string
  productName: string
  productIcon: string | null
  onClose: () => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const [activeTab, setActiveTab] = useState<Tab>('groups')

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-200 shrink-0">
          <span className="text-xl">{productIcon ?? '📦'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate">{productName}</p>
            <p className="text-xs text-zinc-400">Product configuration</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 shrink-0">
          {(['groups', 'categories', 'platforms'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-zinc-900 text-zinc-900 font-medium'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white rounded-b-lg border-x border-b border-zinc-100 overflow-hidden">
            {activeTab === 'groups' && (
              <GroupsSection productId={productId} supabase={supabase} />
            )}
            {activeTab === 'categories' && (
              <CategoriesSection productId={productId} supabase={supabase} />
            )}
            {activeTab === 'platforms' && (
              <PlatformsSection supabase={supabase} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
