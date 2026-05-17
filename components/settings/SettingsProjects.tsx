'use client'

import SettingsCrudList from './SettingsCrudList'
import { getAdminProjects, createProject, deleteProject, updateProject } from '@/app/actions/manage-project'

type Project = {
  id: string
  name: string
  code: string
  description: string | null
  is_shared: boolean
  sort_order: number
  created_by: string
}

type ProjectForm = {
  name: string
  code: string
  description: string
  is_shared: boolean
}

const EMPTY_FORM: ProjectForm = { name: '', code: '', description: '', is_shared: false }

export default function SettingsProjects() {
  return (
    <SettingsCrudList<Project, ProjectForm>
      config={{
        title: 'Projects',
        table: 'projects',
        itemLabel: 'Project',
        emptyForm: EMPTY_FORM,
        pageClass: 'settings-page s-page-wide',
        layout: 'table',
        subtitle: items => `${items.length} project${items.length !== 1 ? 's' : ''}`,
        tableColumns: [
          { label: 'Code',        width: '12%' },
          { label: 'Name',        width: '25%' },
          { label: 'Description', width: '30%' },
          { label: 'Shared',      width: '10%', align: 'center' },
          { label: 'Actions',     width: '23%', align: 'right' },
        ],

        load: async (_supabase) => {
          const res = await getAdminProjects()
          return { items: (res.projects ?? []) as Project[] }
        },

        validate: (form, items, editingId) => {
          if (!form.name.trim()) return 'Name is required'
          const code = form.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
          if (!code) return 'Code is required'
          if (items.some(p => p.id !== editingId && p.code?.toUpperCase() === code))
            return `Code "${code}" is already in use`
          return null
        },

        toRecord: (form) => ({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
          description: form.description.trim() || null,
          is_shared: form.is_shared,
        }),

        toForm: (item) => ({
          name: item.name,
          code: item.code ?? '',
          description: item.description ?? '',
          is_shared: item.is_shared ?? false,
        }),

        getId: (item) => item.id,

        onAdd: async (_supabase, record) => {
          const res = await createProject({
            name: record.name,
            code: record.code,
            description: record.description ?? null,
          })
          if (res.error) throw new Error(res.error)
        },

        onDelete: async (_supabase, item) => {
          const res = await deleteProject(item.id)
          if (res.error) throw new Error(res.error)
        },

        deleteWarning: (item) => (
          <>Delete project <strong>{item.name}</strong>? This will also delete all its todos.</>
        ),

        renderForm: ({ form, onChange, onSubmit, onCancel, submitLabel, saving }) => (
          <div className="s-form" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="label">Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => onChange({ ...form, name: e.target.value })}
                  autoFocus
                  placeholder="My Project"
                />
              </div>
              <div>
                <label className="label">Code *</label>
                <input
                  className="input"
                  value={form.code}
                  onChange={e => onChange({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  placeholder="PROJ"
                  maxLength={10}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label className="label">Description</label>
              <input
                className="input"
                value={form.description}
                onChange={e => onChange({ ...form, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="proj-is-shared"
                checked={form.is_shared}
                onChange={e => onChange({ ...form, is_shared: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="proj-is-shared" className="label" style={{ margin: 0, cursor: 'pointer' }}>
                Shared — visible to all program participants (pre-alpha, alpha, beta)
              </label>
            </div>
            <div className="flex-row gap-sm">
              <button className="btn-primary" onClick={onSubmit} disabled={saving}>
                {saving ? 'Saving…' : submitLabel}
              </button>
              <button className="btn-cancel" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        ),

        renderRow: ({ item, onEdit, onDelete }) => (
          <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <td className="audit-td" style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text2)', fontSize: '12px' }}>
              {item.code}
            </td>
            <td className="audit-td" style={{ fontWeight: 500 }}>
              {item.name}
            </td>
            <td className="audit-td" style={{ color: 'var(--muted)', fontSize: '12px' }}>
              {item.description ?? <span style={{ opacity: 0.4 }}>—</span>}
            </td>
            <td className="audit-td" style={{ textAlign: 'center' }}>
              {item.is_shared ? (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  background: 'var(--pill-active-bg)',
                  color: 'var(--pill-active-color)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>Shared</span>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>—</span>
              )}
            </td>
            <td className="audit-td" style={{ textAlign: 'right' }}>
              <div className="flex-row gap-xs" style={{ justifyContent: 'flex-end' }}>
                <button className="text-btn" onClick={onEdit} style={{ fontSize: '12px', padding: '4px' }}>Edit</button>
                <button className="text-btn" onClick={onDelete} style={{ fontSize: '12px', padding: '4px', color: 'var(--error)' }}>Delete</button>
              </div>
            </td>
          </tr>
        ),
      }}
    />
  )
}
