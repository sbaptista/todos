'use server'

import { requireAdmin } from '@/lib/auth'

export async function getAuditLogs(page: number = 0, pageSize: number = 50) {
  const ctx = await requireAdmin()

  try {
    const from = page * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await ctx.admin
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return { ok: true, data, count }
  } catch (err: any) {
    console.error('[getAuditLogs] Error:', err)
    return { error: err.message }
  }
}
