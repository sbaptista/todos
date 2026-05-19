'use server'

import { requireAdmin } from '@/lib/auth'

export async function createTodo(data: {
  title: string
  status?: string
  priority_value?: number | null
  product_id: string
}) {
  let ctx
  try {
    ctx = await requireAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  let defaultStatus = data.status
  if (!defaultStatus) {
    const { data: openStatus } = await ctx.admin
      .from('statuses').select('name').eq('is_open', true).limit(1).single()
    defaultStatus = openStatus?.name ?? 'open'
  }
  const { data: todo, error } = await ctx.admin
    .from('todos')
    .insert({
      title: data.title,
      status: defaultStatus,
      priority_value: data.priority_value ?? null,
      product_id: data.product_id,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { todo }
}

export async function updateTodo(id: string, data: {
  title?: string
  status?: string
  priority_value?: number | null
}) {
  let ctx
  try {
    ctx = await requireAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  const { data: todo, error } = await ctx.admin
    .from('todos')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { todo }
}

export async function deleteTodo(id: string) {
  let ctx
  try {
    ctx = await requireAdmin()
  } catch (e: any) {
    return { error: e.message }
  }

  const { error } = await ctx.admin.from('todos').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
