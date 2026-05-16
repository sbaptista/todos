'use client'

import { useEffect, useState, useMemo, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch'
import { useToast } from '@/components/ui/Toast'

type TableColumn = { label: string; width?: string; align?: 'left' | 'right' | 'center' }

type CrudConfig<T, F> = {
  title: string
  table: string
  itemLabel: string
  emptyForm: F
  orderBy?: string
  pageClass?: string
  idColumn?: string
  subtitle?: (items: T[]) => string

  layout?: 'list' | 'table'
  tableColumns?: TableColumn[]

  load?: (supabase: any) => Promise<{ items: T[]; extra?: any }>
  validate?: (form: F, items: T[], editingId: string | null) => string | null
  toRecord: (form: F, items: T[]) => Record<string, any>
  toForm: (item: T) => F
  getId: (item: T) => string

  onAdd?: (supabase: any, record: Record<string, any>, items: T[]) => Promise<void>
  onDelete?: (supabase: any, item: T, items: T[]) => Promise<void>
  onBeforeDelete?: (supabase: any, item: T) => Promise<void>
  deleteWarning?: (item: T, extra: any) => ReactNode
  canDelete?: (item: T, extra: any) => boolean

  renderForm: (props: {
    form: F
    onChange: (f: F) => void
    onSubmit: () => void
    onCancel: () => void
    submitLabel: string
    saving: boolean
    extra: any
  }) => ReactNode

  renderRow: (props: {
    item: T
    index: number
    items: T[]
    onEdit: () => void
    onDelete: () => void
    onMove?: (direction: 'up' | 'down') => void
    saving: boolean
    extra: any
  }) => ReactNode

  scopeFilter?: {
    getScopes: (extra: any) => Array<{ id: string; label: string }>
    defaultScope: string
    defaultLabel: string
    filterItem: (item: T, scope: string) => boolean
    applyToForm?: (form: F, scope: string) => F
  }

  onMove?: (supabase: any, item: T, items: T[], direction: 'up' | 'down') => Promise<void>
}

export default function SettingsCrudList<T, F>({ config }: { config: CrudConfig<T, F> }) {
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()

  const [items, setItems] = useState<T[]>([])
  const [extra, setExtra] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<F>(config.emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<F>(config.emptyForm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [scope, setScope] = useState(config.scopeFilter?.defaultScope ?? '')

  const load = useCallback(async () => {
    if (config.load) {
      const result = await config.load(supabase)
      setItems(result.items)
      if (result.extra) setExtra(result.extra)
    } else {
      const { data } = await supabase.from(config.table).select('*').order(config.orderBy ?? 'sort_order')
      setItems(data ?? [])
    }
    setLoading(false)
  }, [supabase, config])

  useVisibilityRefetch(load)
  useEffect(() => { load() }, [load])

  const displayed = config.scopeFilter
    ? items.filter(item => config.scopeFilter!.filterItem(item, scope))
    : items

  const idCol = config.idColumn ?? 'id'
  const isTable = config.layout === 'table'

  function startAdd() {
    let form = { ...config.emptyForm }
    if (config.scopeFilter?.applyToForm) {
      form = config.scopeFilter.applyToForm(form, scope)
    }
    setShowAdd(true)
    setEditingId(null)
    setConfirmDeleteId(null)
    setAddForm(form)
    setError('')
  }

  function startEdit(item: T) {
    setEditingId(config.getId(item))
    setEditForm(config.toForm(item))
    setShowAdd(false)
    setConfirmDeleteId(null)
    setError('')
  }

  async function handleAdd() {
    const err = config.validate?.(addForm, items, null)
    if (err) { setError(err); return }
    setSaving(true)
    setError('')
    try {
      if (config.onAdd) {
        await config.onAdd(supabase, config.toRecord(addForm, items), items)
        toast.success(`${config.itemLabel} added.`)
        await load()
      } else {
        const { data, error: dbErr } = await supabase
          .from(config.table)
          .insert(config.toRecord(addForm, items))
          .select()
          .single()
        if (dbErr) { setError(dbErr.message); setSaving(false); return }
        if (data) {
          toast.success(`${config.itemLabel} added.`)
          setItems(prev => [...prev, data as T])
        }
      }
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
    setShowAdd(false)
    setAddForm(config.emptyForm)
  }

  async function handleSave(id: string) {
    const err = config.validate?.(editForm, items, id)
    if (err) { setError(err); return }
    setSaving(true)
    setError('')
    const { data, error: dbErr } = await supabase
      .from(config.table)
      .update(config.toRecord(editForm, items))
      .eq(idCol, id)
      .select()
      .single()
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    if (data) {
      toast.success(`${config.itemLabel} saved.`)
      setItems(prev => prev.map(item => config.getId(item) === id ? data as T : item))
    }
    setEditingId(null)
  }

  async function handleDelete(item: T) {
    setSaving(true)
    if (config.onDelete) {
      await config.onDelete(supabase, item, items)
      setSaving(false)
      toast.success(`${config.itemLabel} deleted.`)
      setConfirmDeleteId(null)
      load()
    } else {
      const id = config.getId(item)
      if (config.onBeforeDelete) await config.onBeforeDelete(supabase, item)
      await supabase.from(config.table).delete().eq(idCol, id)
      setSaving(false)
      toast.success(`${config.itemLabel} deleted.`)
      setItems(prev => prev.filter(i => config.getId(i) !== id))
      setConfirmDeleteId(null)
    }
  }

  async function handleMove(item: T, direction: 'up' | 'down') {
    if (!config.onMove) return
    setSaving(true)
    setError('')
    try {
      await config.onMove(supabase, item, items, direction)
      await load()
    } catch (err: any) {
      setError(`Failed to move: ${err.message}`)
    }
    setSaving(false)
  }

  if (loading) return <div className="s-loading">Loading…</div>

  const colCount = config.tableColumns?.length ?? 1

  function renderDeleteConfirm(item: T) {
    const deletable = config.canDelete ? config.canDelete(item, extra) : true
    const content = (
      <>
        <span className="text-sm flex-1">
          {config.deleteWarning
            ? config.deleteWarning(item, extra)
            : <>Delete <strong>{(item as any).name ?? (item as any).label}</strong>?</>
          }
        </span>
        {deletable ? (
          <>
            <button className="btn-danger-confirm" onClick={() => handleDelete(item)} disabled={saving}
              style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Deleting…' : 'Confirm'}
            </button>
            <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
          </>
        ) : (
          <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>OK</button>
        )}
      </>
    )
    if (isTable) {
      return (
        <tr key={config.getId(item)}>
          <td colSpan={colCount} className="audit-td">
            <div className="s-row-delete" style={{ border: 'none', padding: 0 }}>{content}</div>
          </td>
        </tr>
      )
    }
    return <div key={config.getId(item)} className="s-row-delete">{content}</div>
  }

  function renderEditForm(id: string) {
    const formNode = config.renderForm({
      form: editForm,
      onChange: setEditForm,
      onSubmit: () => handleSave(id),
      onCancel: () => { setEditingId(null); setError('') },
      submitLabel: 'Save',
      saving,
      extra,
    })
    if (isTable) {
      return (
        <tr key={id}>
          <td colSpan={colCount} className="audit-td">{formNode}</td>
        </tr>
      )
    }
    return <div key={id}>{formNode}</div>
  }

  function renderItemRow(item: T, idx: number) {
    const rowNode = config.renderRow({
      item,
      index: idx,
      items: displayed,
      onEdit: () => startEdit(item),
      onDelete: () => { setConfirmDeleteId(config.getId(item)); setEditingId(null) },
      onMove: config.onMove ? (dir) => handleMove(item, dir) : undefined,
      saving,
      extra,
    })
    if (isTable) return rowNode
    return <div key={config.getId(item)}>{rowNode}</div>
  }

  function renderAddForm() {
    const formNode = config.renderForm({
      form: addForm,
      onChange: setAddForm,
      onSubmit: handleAdd,
      onCancel: () => { setShowAdd(false); setError('') },
      submitLabel: `Add ${config.itemLabel}`,
      saving,
      extra,
    })
    if (isTable) {
      return (
        <tr key="__add__">
          <td colSpan={colCount} className="audit-td">{formNode}</td>
        </tr>
      )
    }
    return formNode
  }

  const itemRows = displayed.map((item, idx) => {
    const id = config.getId(item)
    if (editingId === id) return renderEditForm(id)
    if (confirmDeleteId === id) return renderDeleteConfirm(item)
    return renderItemRow(item, idx)
  })

  return (
    <div className={config.pageClass ?? 'settings-page s-page'}>
      <div className="s-header">
        <div>
          <h2 className="s-title">{config.title}</h2>
          {config.subtitle && (
            <p className="text-sm text-muted">{config.subtitle(displayed)}</p>
          )}
        </div>
        {!showAdd && (
          <button className="btn-outline" onClick={startAdd}>
            + Add {config.itemLabel}
          </button>
        )}
      </div>

      {config.scopeFilter && (
        <div className="flex-row gap-sm mb-xl" style={{ flexWrap: 'wrap' }}>
          <button
            className={`pill ${scope === config.scopeFilter.defaultScope ? 'pill-active' : ''}`}
            onClick={() => setScope(config.scopeFilter!.defaultScope)}
          >
            {config.scopeFilter.defaultLabel}
          </button>
          {config.scopeFilter.getScopes(extra).map(s => (
            <button
              key={s.id}
              className={`pill ${scope === s.id ? 'pill-active' : ''}`}
              onClick={() => setScope(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {error && <p className="s-error">{error}</p>}

      {isTable ? (
        displayed.length === 0 && !showAdd ? (
          <div className="s-card s-empty">No {config.title.toLowerCase()} yet.</div>
        ) : (
          <div className="s-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="audit-table">
                <thead>
                  <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                    {config.tableColumns?.map((col, i) => (
                      <th key={i} className="audit-th"
                        style={{ width: col.width, textAlign: col.align ?? 'left' }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {showAdd && renderAddForm()}
                  {itemRows}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="s-list">
          {showAdd && renderAddForm()}
          {displayed.length === 0 && !showAdd ? (
            <p className="s-empty">No {config.title.toLowerCase()} yet.</p>
          ) : itemRows}
        </div>
      )}
    </div>
  )
}
