'use server'

import { getAuthContext, requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkCodeConflict(admin: ReturnType<typeof createAdminClient>, code: string, excludeId?: string) {
  const query = admin.from('projects').select('id').ilike('code', code)
  if (excludeId) query.neq('id', excludeId)
  const { data } = await query.maybeSingle()
  return !!data
}

export async function createProject(data: {
  name: string
  code?: string | null
  description?: string | null
  color?: string | null
  sort_order?: number
  ownerId?: string | null
}) {
  const code = data.code?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!code) return { error: 'Project code is required' }

  const ctx = await getAuthContext()

  if (await checkCodeConflict(ctx.admin, code)) {
    return { error: `Code "${code}" is already in use` }
  }

  const ownerId = ctx.isAdmin ? (data.ownerId ?? ctx.user.id) : ctx.user.id

  const { data: project, error } = await ctx.admin
    .from('projects')
    .insert({
      name: data.name,
      code,
      description: data.description ?? null,
      color: data.color ?? null,
      sort_order: data.sort_order ?? 0,
      created_by: ownerId,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { project }
}

export async function getAdminProjects() {
  let ctx
  try {
    ctx = await requireAdmin()
  } catch (e: any) {
    return { error: e.message as string, projects: [] as any[] }
  }

  const { data, error } = await ctx.admin
    .from('projects')
    .select('id, name, code, description, is_dormant, sort_order, created_by')
    .order('sort_order')
  if (error) return { error: error.message, projects: [] as any[] }
  return { projects: data ?? [] }
}

export async function getUserProjects() {
  const ctx = await getAuthContext()
  const { data, error } = await ctx.supabase
    .from('projects')
    .select('id, name, code, description, is_dormant, sort_order, created_by')
    .order('sort_order')
  if (error) return { error: error.message, projects: [] as any[] }
  return { projects: data ?? [] }
}

export async function updateProject(id: string, data: {
  name?: string
  code?: string | null
  description?: string | null
  color?: string | null
  sort_order?: number
  is_dormant?: boolean
  created_by?: string | null
}) {
  const ctx = await getAuthContext()
  const client = ctx.isAdmin ? ctx.admin : ctx.supabase

  if (data.code !== undefined) {
    const code = data.code?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!code) return { error: 'Project code is required' }
    if (await checkCodeConflict(ctx.admin, code, id)) {
      return { error: `Code "${code}" is already in use` }
    }
    data = { ...data, code }
  }

  const { data: project, error } = await client
    .from('projects')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { project }
}

export async function toggleProjectDormancy(id: string, isDormant: boolean) {
  const ctx = await getAuthContext()
  const { data: project, error } = await ctx.supabase
    .from('projects')
    .update({ is_dormant: isDormant })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { project }
}

export async function deleteProjects(ids: string[]) {
  const ctx = await getAuthContext()
  const client = ctx.isAdmin ? ctx.admin : ctx.supabase
  const { error } = await client.from('projects').delete().in('id', ids)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteProject(id: string) {
  const ctx = await getAuthContext()
  const client = ctx.isAdmin ? ctx.admin : ctx.supabase
  const { error } = await client.from('projects').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
