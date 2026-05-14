'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useVisibilityRefetch } from '@/lib/hooks/useVisibilityRefetch'
import { useToast } from '@/components/ui/Toast'
import { getTickets, convertTicketToTodo, dismissTicket, deleteTicket, deleteTickets, dismissTickets, type Ticket } from '@/app/actions/ticket-actions'
import { createClient } from '@/lib/supabase/client'

type Project = { id: string; name: string; code: string | null }

type FilterStatus = 'open' | 'all' | 'converted' | 'dismissed'

const TYPE_LABELS: Record<string, string> = {
    bug: 'Bug',
    suggestion: 'Suggestion',
    capability_gap: 'Capability Gap',
    workflow_friction: 'Workflow',
}

const SOURCE_LABELS: Record<string, string> = {
    'orb-auto': 'Orb',
    'user-request': 'User',
    'admin': 'Admin',
}

export default function SettingsTickets() {
    const toast = useToast()

    const [tickets, setTickets] = useState<Ticket[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [filter, setFilter] = useState<FilterStatus>('open')
    const [convertingId, setConvertingId] = useState<string | null>(null)
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const loaded = useRef(false)

    const load = useCallback(async () => {
        if (!loaded.current) setLoading(true)
        const [ticketRes, supabase] = await Promise.all([
            getTickets(filter === 'all' ? undefined : filter),
            Promise.resolve(createClient()),
        ])
        const { data: projs } = await supabase.from('projects').select('id, name, code').order('sort_order')
        setTickets(ticketRes.data ?? [])
        setProjects(projs ?? [])
        if (projs?.length && !selectedProjectId) setSelectedProjectId(projs[0].id)
        setSelectedIds([])
        loaded.current = true
        setLoading(false)
    }, [filter])

    useVisibilityRefetch(load)
    useEffect(() => { load() }, [load])

    function toggleSelect(id: string) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    function toggleSelectAll() {
        if (selectedIds.length === tickets.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(tickets.map(t => t.id))
        }
    }

    async function handleConvert(ticket: Ticket) {
        if (!selectedProjectId) {
            toast.error('Select a project first.')
            return
        }
        setSaving(true)
        const res = await convertTicketToTodo(ticket.id, selectedProjectId)
        setSaving(false)
        if (res.error) {
            toast.error(`Failed: ${res.error}`)
            return
        }
        const proj = projects.find(p => p.id === selectedProjectId)
        toast.success(`Todo created in ${proj?.code ?? proj?.name ?? 'project'}.`)
        setConvertingId(null)
        setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'converted' as const, converted_todo_id: res.todoId! } : t))
    }

    async function handleDismiss(ticketId: string) {
        setSaving(true)
        const res = await dismissTicket(ticketId)
        setSaving(false)
        if (res.error) {
            toast.error(`Failed: ${res.error}`)
            return
        }
        toast.success('Ticket dismissed.')
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'dismissed' as const } : t))
    }

    async function handleDelete(ticketId: string) {
        setSaving(true)
        const res = await deleteTicket(ticketId)
        setSaving(false)
        if (res.error) {
            toast.error(`Failed: ${res.error}`)
            return
        }
        toast.success('Ticket deleted.')
        setTickets(prev => prev.filter(t => t.id !== ticketId))
        setSelectedIds(prev => prev.filter(x => x !== ticketId))
    }

    async function handleBulkDismiss() {
        if (selectedIds.length === 0) return
        setSaving(true)
        const res = await dismissTickets(selectedIds)
        setSaving(false)
        if (res.error) {
            toast.error(`Failed: ${res.error}`)
            return
        }
        toast.success(`${selectedIds.length} tickets dismissed.`)
        setTickets(prev => prev.map(t => selectedIds.includes(t.id) ? { ...t, status: 'dismissed' as const } : t))
        setSelectedIds([])
    }

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return
        const count = selectedIds.length
        if (!confirm(`Permanently delete ${count} ticket${count > 1 ? 's' : ''}? This cannot be undone.`)) return
        setSaving(true)
        const res = await deleteTickets(selectedIds)
        setSaving(false)
        if (res.error) {
            toast.error(`Failed: ${res.error}`)
            return
        }
        toast.success(`${count} ticket${count > 1 ? 's' : ''} deleted.`)
        setTickets(prev => prev.filter(t => !selectedIds.includes(t.id)))
        setSelectedIds([])
    }

    if (loading) return <div className="s-loading">Loading…</div>

    const openCount = tickets.filter(t => t.status === 'open').length
    const allChecked = tickets.length > 0 && selectedIds.length === tickets.length
    const someChecked = selectedIds.length > 0

    return (
        <div className="settings-page s-page-wide">
            <div className="s-header">
                <div>
                    <h2 className="s-title" style={{ marginBottom: '4px' }}>Tickets</h2>
                    <p className="text-sm text-muted">
                        {filter === 'open' ? `${openCount} open` : `${tickets.length} tickets`}
                    </p>
                </div>
                <div className="flex-row gap-sm">
                    {(['open', 'all', 'converted', 'dismissed'] as FilterStatus[]).map(f => (
                        <button
                            key={f}
                            type="button"
                            className="oc-tool-btn"
                            aria-pressed={filter === f}
                            onClick={() => { setFilter(f); setSelectedIds([]) }}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {someChecked && (
                <div className="flex-row gap-sm" style={{
                    padding: '8px 12px',
                    background: 'var(--bg2)',
                    borderRadius: 'var(--r-md)',
                    marginBottom: '8px',
                    alignItems: 'center',
                }}>
                    <span className="text-sm" style={{ fontWeight: 500 }}>
                        {selectedIds.length} selected
                    </span>
                    <button
                        className="oc-tool-btn"
                        onClick={handleBulkDismiss}
                        disabled={saving}
                        style={{ fontSize: '12px' }}
                    >
                        Dismiss
                    </button>
                    <button
                        className="oc-tool-btn"
                        onClick={handleBulkDelete}
                        disabled={saving}
                        style={{ fontSize: '12px', color: 'var(--error)', borderColor: 'var(--error)' }}
                    >
                        Delete
                    </button>
                    <button
                        className="text-btn text-sm"
                        onClick={() => setSelectedIds([])}
                        style={{ color: 'var(--muted)' }}
                    >
                        Clear
                    </button>
                </div>
            )}

            {tickets.length === 0 ? (
                <div className="s-card s-empty">No tickets found.</div>
            ) : (
                <div className="s-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="audit-table">
                            <thead>
                                <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                                    <th className="audit-th" style={{ width: '36px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            onChange={toggleSelectAll}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </th>
                                    <th className="audit-th" style={{ width: '11%' }}>Date</th>
                                    <th className="audit-th" style={{ width: '7%' }}>Source</th>
                                    <th className="audit-th" style={{ width: '11%' }}>Type</th>
                                    <th className="audit-th" style={{ width: '35%' }}>Summary</th>
                                    <th className="audit-th" style={{ width: '8%' }}>Status</th>
                                    <th className="audit-th" style={{ textAlign: 'right', width: '20%' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(ticket => (
                                    <tr
                                        key={ticket.id}
                                        style={{
                                            borderBottom: '1px solid var(--border)',
                                            opacity: ticket.status !== 'open' ? 0.55 : 1,
                                            background: selectedIds.includes(ticket.id) ? 'var(--bg2)' : undefined,
                                        }}
                                    >
                                        <td className="audit-td" style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(ticket.id)}
                                                onChange={() => toggleSelect(ticket.id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td className="audit-td" style={{ color: 'var(--muted)', fontSize: '12px' }}>
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="audit-td">
                                            <span style={{
                                                fontSize: '11px',
                                                color: 'var(--text2)',
                                            }}>
                                                {SOURCE_LABELS[ticket.source] ?? ticket.source}
                                            </span>
                                        </td>
                                        <td className="audit-td">
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                fontSize: '11px',
                                                textTransform: 'uppercase',
                                                background: 'var(--bg3)',
                                                color: 'var(--text2)',
                                            }}>
                                                {TYPE_LABELS[ticket.type] ?? ticket.type}
                                            </span>
                                        </td>
                                        <td className="audit-td" style={{ fontWeight: 500, fontSize: '13px' }}>
                                            <div
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                                            >
                                                {ticket.summary}
                                            </div>
                                            {expandedId === ticket.id && (
                                                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text2)' }}>
                                                    {ticket.detail && Object.keys(ticket.detail).length > 0 && (
                                                        <div style={{
                                                            whiteSpace: 'pre-wrap',
                                                            background: 'var(--bg)',
                                                            padding: '6px 8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--border)',
                                                            marginBottom: '4px',
                                                        }}>
                                                            {typeof ticket.detail === 'object' && ticket.detail.detail
                                                                ? ticket.detail.detail
                                                                : JSON.stringify(ticket.detail, null, 2)}
                                                        </div>
                                                    )}
                                                    {ticket.conversation_snippet && (
                                                        <div style={{ fontStyle: 'italic', color: 'var(--muted)' }}>
                                                            &ldquo;{ticket.conversation_snippet}&rdquo;
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="audit-td">
                                            <span style={{
                                                fontSize: '11px',
                                                textTransform: 'capitalize',
                                                color: ticket.status === 'open' ? 'var(--status-open)' : 'var(--muted)',
                                            }}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="audit-td" style={{ textAlign: 'right' }}>
                                            <div className="flex-row gap-xs" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                {ticket.status === 'open' && (
                                                    <>
                                                        {convertingId === ticket.id ? (
                                                            <div className="flex-row gap-xs" style={{ alignItems: 'center' }}>
                                                                <select
                                                                    value={selectedProjectId}
                                                                    onChange={e => setSelectedProjectId(e.target.value)}
                                                                    style={{
                                                                        fontSize: '12px',
                                                                        padding: '3px 6px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid var(--border)',
                                                                        background: 'var(--bg)',
                                                                        color: 'var(--text)',
                                                                    }}
                                                                >
                                                                    {projects.map(p => (
                                                                        <option key={p.id} value={p.id}>
                                                                            {p.code ?? p.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    className="btn-primary"
                                                                    onClick={() => handleConvert(ticket)}
                                                                    disabled={saving}
                                                                    style={{ padding: '3px 8px', fontSize: '12px' }}
                                                                >
                                                                    Create
                                                                </button>
                                                                <button
                                                                    className="text-btn"
                                                                    onClick={() => setConvertingId(null)}
                                                                    style={{ padding: '3px', fontSize: '12px', color: 'var(--muted)' }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className="btn-primary"
                                                                    onClick={() => setConvertingId(ticket.id)}
                                                                    disabled={saving}
                                                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                                                >
                                                                    Generate Todo
                                                                </button>
                                                                <button
                                                                    className="text-btn"
                                                                    onClick={() => handleDismiss(ticket.id)}
                                                                    disabled={saving}
                                                                    style={{ color: 'var(--muted)', padding: '4px', fontSize: '12px' }}
                                                                >
                                                                    Dismiss
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                <button
                                                    className="text-btn"
                                                    onClick={() => handleDelete(ticket.id)}
                                                    disabled={saving}
                                                    title="Permanently delete"
                                                    style={{ color: 'var(--error)', padding: '4px', fontSize: '12px' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
