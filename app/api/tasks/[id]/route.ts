import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

function checkAuth(request: NextRequest): NextResponse | null {
  if (process.env.ORB_API_ENABLED !== 'true') {
    return NextResponse.json({ error: 'API disabled' }, { status: 503 })
  }
  if (request.headers.get('Authorization') !== process.env.ORB_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAuth(request)
  if (authError) return authError

  const { id } = await params
  const body = await request.json()
  const { title, description, status, priority_value, resolution_notes, urls, product_code } = body

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (priority_value !== undefined) updates.priority_value = priority_value
  if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes
  if (urls !== undefined) {
    updates.urls = typeof urls === 'string'
      ? urls.split('\n').map((u: string) => u.trim()).filter(Boolean)
      : urls
  }

  if (status !== undefined) {
    updates.status = status
  }

  const supabase = createServiceClient()

  if (product_code !== undefined) {
    const { data: targetProject } = await supabase
      .from('projects')
      .select('id')
      .ilike('code', String(product_code))
      .maybeSingle()

    if (!targetProject) {
      return NextResponse.json({ error: `Project "${product_code}" not found` }, { status: 404 })
    }

    const { data: maxRow } = await supabase
      .from('todos')
      .select('todo_number')
      .eq('product_id', targetProject.id)
      .order('todo_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    updates.product_id = targetProject.id
    updates.todo_number = (maxRow?.todo_number ?? 0) + 1
  }

  if (status !== undefined) {
    const { data: statusDef } = await supabase
      .from('statuses')
      .select('is_closed')
      .eq('name', status)
      .single()
    updates.closed_at = statusDef?.is_closed ? new Date().toISOString() : null
  }

  const { data: todo, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, todo_number, title, description, status, priority_value, resolution_notes, urls, created_at, updated_at, closed_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  return NextResponse.json(todo)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAuth(request)
  if (authError) return authError

  const { id } = await params
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('todos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
