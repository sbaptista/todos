'use server'

import { requireAdmin } from '@/lib/auth'

export async function diagnoseAudit() {
  let ctx
  try {
    ctx = await requireAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  const result: any = {}

  const { count, error: countError } = await ctx.admin
    .from('audit_log')
    .select('*', { count: 'exact', head: true })
  result.rowCount = count
  result.countError = countError?.message ?? null

  const { data: badData, error: badError } = await ctx.admin
    .from('audit_log')
    .insert({
      action: 'diagnostic_probe_null_record',
      table_name: 'system',
      record_id: null,
      after: { probe: 'null_record_id', ts: new Date().toISOString() }
    })
    .select()
    .single()
  result.badProbe = {
    error: badError?.message ?? null,
    code: badError?.code ?? null,
    inserted: !!badData
  }

  const { data: goodData, error: goodError } = await ctx.admin
    .from('audit_log')
    .insert({
      action: 'diagnostic_probe_with_record',
      table_name: 'system',
      record_id: '00000000-0000-0000-0000-000000000001',
      after: { probe: 'with_record_id', ts: new Date().toISOString() }
    })
    .select()
    .single()
  result.goodProbe = {
    error: goodError?.message ?? null,
    code: goodError?.code ?? null,
    inserted: !!goodData,
    columns: goodData ? Object.keys(goodData) : null
  }

  const { count: finalCount } = await ctx.admin
    .from('audit_log')
    .select('*', { count: 'exact', head: true })
  result.finalRowCount = finalCount

  return result
}
