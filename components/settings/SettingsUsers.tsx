'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { updateUserRole } from '@/app/actions/update-user-role'

type UserRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role_id: number
}

type RoleRow = {
  id: number
  value: number
  name: string
}

const SUPER_ADMIN_ROLE_ID = 3

export default function SettingsUsers() {
  const supabase = useMemo(() => createClient(), [])
  const toast = useToast()

  const [users, setUsers] = useState<UserRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: usersData }, { data: rolesData }] = await Promise.all([
        supabase.from('users').select('id, email, first_name, last_name, role_id').order('email'),
        supabase.from('roles').select('*').order('value'),
      ])
      setUsers(usersData ?? [])
      setRoles(rolesData ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleRoleChange(userId: string, roleId: number) {
    const { error } = await updateUserRole(userId, roleId)
    if (error) { toast.error(error); return }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: roleId } : u))
    toast.success('Role updated.')
  }

  const assignableRoles = roles.filter(r => r.id !== SUPER_ADMIN_ROLE_ID)
  const roleName = (roleId: number) => roles.find(r => r.id === roleId)?.name ?? 'Unknown'

  if (loading) return (
    <div style={{ padding: 'var(--sp-3xl)', fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>
      Loading…
    </div>
  )

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg2)',
    borderRadius: 'var(--r-lg)',
    border: '1px solid var(--border)',
    padding: 'var(--sp-xl)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--fs-xs)',
    fontWeight: 'var(--fw-medium)',
    color: 'var(--text3)',
    display: 'block',
    marginBottom: 'var(--sp-xs)',
  }

  const selectStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 'var(--r)',
    padding: '6px var(--sp-sm)',
    fontSize: 'var(--fs-sm)',
    background: 'var(--bg)',
    color: 'var(--text)',
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <div className="settings-page" style={{ padding: 'var(--sp-2xl)', maxWidth: '600px' }}>
      <h2 style={{
        fontSize: 'var(--fs-lg)',
        fontWeight: 'var(--fw-bold)',
        color: 'var(--text)',
        margin: '0 0 var(--sp-2xl)',
      }}>
        Users
      </h2>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px',
            gap: 'var(--sp-md)',
            padding: '0 0 var(--sp-sm)',
            borderBottom: '1px solid var(--border)',
            marginBottom: 'var(--sp-sm)',
          }}>
            <span style={labelStyle}>User</span>
            <span style={labelStyle}>Role</span>
          </div>

          {users.map(user => {
            const isSuperAdmin = user.role_id === SUPER_ADMIN_ROLE_ID
            return (
            <div key={user.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px',
              gap: 'var(--sp-md)',
              padding: 'var(--sp-sm) 0',
              borderBottom: '1px solid var(--border)',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>
                  {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                  {user.email}
                </div>
              </div>
              {isSuperAdmin ? (
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)' }}>
                  {roleName(user.role_id)}
                </span>
              ) : (
              <select
                value={user.role_id}
                onChange={e => handleRoleChange(user.id, Number(e.target.value))}
                style={selectStyle}
              >
                {assignableRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              )}
            </div>
            )
          })}

          {users.length === 0 && (
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', textAlign: 'center', padding: 'var(--sp-xl) 0' }}>
              No users found.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
