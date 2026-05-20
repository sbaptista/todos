import { createServiceClient } from './supabase/service'
import { Resend } from 'resend'
import { FROM_EMAIL } from './email'

type DBTodo = {
  id: string
  todo_number: number | null
  title: string
  description: string | null
  status: string
  due_at: string
  product_id: string
  projects: {
    id: string
    name: string
    code: string | null
    created_by: string
  } | null
}

function getUTCFromLocalTime(dueAtStr: string, timezone: string): Date {
  const [datePart, timePart] = dueAtStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  })

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes))
  const parts = formatter.formatToParts(utcGuess)
  const partMap: Record<string, string> = {}
  for (const part of parts) {
    partMap[part.type] = part.value
  }

  const fYear = Number(partMap.year)
  const fMonth = Number(partMap.month)
  const fDay = Number(partMap.day)
  const fHour = Number(partMap.hour) === 24 ? 0 : Number(partMap.hour)
  const fMinute = Number(partMap.minute)

  const targetTime = Date.UTC(year, month - 1, day, hours, minutes)
  const formattedTime = Date.UTC(fYear, fMonth - 1, fDay, fHour, fMinute)

  const offsetMs = formattedTime - targetTime
  return new Date(utcGuess.getTime() - offsetMs)
}

function formatLocalDateString(dueAtStr: string): string {
  const [datePart, timePart] = dueAtStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  const date = new Date(year, month - 1, day, hours, minutes)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export async function processReminders(): Promise<{ notifiedCount: number; message: string }> {
  const supabase = createServiceClient()
  
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping reminders process')
    return { notifiedCount: 0, message: 'Resend API key not configured.' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  // 1. Fetch all open/active statuses
  const { data: statuses } = await supabase
    .from('statuses')
    .select('name, is_open')

  const openStatusNames = statuses?.filter(s => s.is_open).map(s => s.name) ?? ['open', 'in progress']

  // 2. Fetch todos that are active, have a due date, and haven't been reminded
  const { data: todosData, error: todosError } = await supabase
    .from('todos')
    .select(`
      id,
      todo_number,
      title,
      description,
      status,
      due_at,
      product_id,
      projects (
        id,
        name,
        code,
        created_by
      )
    `)
    .is('deleted_at', null)
    .is('reminded_at', null)
    .not('due_at', 'is', null)
    .in('status', openStatusNames)

  if (todosError) {
    console.error('Failed to fetch todos for reminders:', todosError)
    throw new Error(todosError.message)
  }

  const todos = (todosData ?? []) as unknown as DBTodo[]
  if (todos.length === 0) {
    return { notifiedCount: 0, message: 'No pending due todos found.' }
  }

  // 3. Extract unique creator IDs and fetch their profiles
  const creatorIds = Array.from(new Set(todos.map(t => t.projects?.created_by).filter(Boolean))) as string[]
  if (creatorIds.length === 0) {
    return { notifiedCount: 0, message: 'No users found for projects.' }
  }

  const { data: usersData } = await supabase
    .from('users')
    .select('id, email, timezone, first_name, urgency_threshold_hours')
    .in('id', creatorIds)

  const userMap = new Map(usersData?.map(u => [u.id, u]) ?? [])
  const now = new Date()
  let notifiedCount = 0

  // 4. Evaluate each todo for reminder threshold
  for (const todo of todos) {
    const creatorId = todo.projects?.created_by
    if (!creatorId) continue

    const user = userMap.get(creatorId)
    if (!user || !user.email) continue

    const userTz = user.timezone || 'America/Los_Angeles'
    const dueUTC = getUTCFromLocalTime(todo.due_at, userTz)

    // Calculate when the warning/trigger window opens based on urgency_threshold_hours
    const thresholdHours = user.urgency_threshold_hours || 0
    const warningMs = thresholdHours * 60 * 60 * 1000
    const triggerTime = new Date(dueUTC.getTime() - warningMs)

    // Send email if the current time is at or past the trigger threshold
    if (now >= triggerTime) {
      const projectCode = todo.projects?.code ?? 'TODO'
      const formattedDate = formatLocalDateString(todo.due_at)

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: `Orb Reminder: ${projectCode}-${todo.todo_number ?? todo.id.slice(0, 4)} is due`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <h2 style="color: #333; margin-bottom: 20px;">Task Due Reminder</h2>
              <p>Hi ${user.first_name || 'there'},</p>
              <p>This is a reminder that your task is now due:</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #5a3090; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #111;">${projectCode}-${todo.todo_number ?? ''}: ${todo.title}</h3>
                ${todo.description ? `<p style="color: #666; font-size: 14px;">${todo.description}</p>` : ''}
                <p style="margin-bottom: 0; font-size: 14px;"><strong>Due Date:</strong> ${formattedDate}</p>
              </div>
              <p style="color: #888; font-size: 12px; margin-top: 30px;">— The Orb</p>
            </div>
          `
        })

        // Update reminded_at to prevent resending
        await supabase
          .from('todos')
          .update({ reminded_at: new Date().toISOString() })
          .eq('id', todo.id)

        notifiedCount++
      } catch (err) {
        console.error(`Failed to send reminder email for todo ${todo.id}:`, err)
      }
    }
  }

  return { notifiedCount, message: `Dispatched ${notifiedCount} reminders.` }
}
