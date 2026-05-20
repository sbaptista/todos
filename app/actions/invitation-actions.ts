'use server'

import { requireAdmin, getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendInviteEmail } from '@/lib/email'

export type Invitation = {
    id: string
    email: string
    release_stage: string
    status: 'pending' | 'accepted' | 'declined'
    invited_by: string | null
    invited_at: string
    responded_at: string | null
    decline_reason: string | null
}

export async function getInvitations(status?: string) {
    const ctx = await requireAdmin()
    let query = ctx.admin.from('invitations').select('*').order('invited_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) {
        console.error('getInvitations error:', error)
        return { error: error.message, data: null }
    }
    return { data: data as Invitation[], error: null }
}

export async function resendInvitation(invitationId: string) {
    const ctx = await requireAdmin()

    const { data: inv, error: fetchErr } = await ctx.admin
        .from('invitations')
        .select('email, first_name, last_name')
        .eq('id', invitationId)
        .single()
    if (fetchErr || !inv) return { error: fetchErr?.message ?? 'Invitation not found' }

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://orb-eight-lake.vercel.app'

    const { data: linkData, error: linkErr } = await ctx.admin.auth.admin.generateLink({
        type: 'invite',
        email: inv.email,
        options: { redirectTo: `${origin}/auth/callback` },
    })
    if (linkErr) return { error: linkErr.message }
    if (!linkData.user) return { error: 'Failed to generate invite link' }

    const inviteLink = `${origin}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=invite`
    const declineLink = `${origin}/invite/decline?id=${invitationId}`

    const emailResult = await sendInviteEmail({
        to: inv.email,
        firstName: inv.first_name ?? '',
        inviteLink,
        declineLink,
    })

    if (emailResult.error) return { error: emailResult.error }
    return { ok: true }
}

export async function deleteInvitation(invitationId: string) {
    const ctx = await requireAdmin()
    const { error } = await ctx.admin.from('invitations').delete().eq('id', invitationId)
    if (error) {
        console.error('deleteInvitation error:', error)
        return { error: error.message }
    }
    return { ok: true }
}

export async function deleteInvitations(ids: string[]) {
    const ctx = await requireAdmin()
    const { error } = await ctx.admin.from('invitations').delete().in('id', ids)
    if (error) {
        console.error('deleteInvitations error:', error)
        return { error: error.message }
    }
    return { ok: true }
}

export async function acceptInvitation(email: string) {
    const admin = createAdminClient()
    const { error } = await admin
        .from('invitations')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('email', email)
        .eq('status', 'pending')
    if (error) {
        console.error('acceptInvitation error:', error)
        return { error: error.message }
    }
    return { ok: true }
}

export async function declineInvitation(token: string, reason?: string) {
    const admin = createAdminClient()
    const { data: inv, error: fetchErr } = await admin
        .from('invitations')
        .select('id, email, status')
        .eq('id', token)
        .single()

    if (fetchErr || !inv) return { error: 'Invitation not found or already responded.' }
    if (inv.status !== 'pending') return { error: 'This invitation has already been responded to.' }

    const { error } = await admin
        .from('invitations')
        .update({
            status: 'declined',
            responded_at: new Date().toISOString(),
            decline_reason: reason || null,
        })
        .eq('id', inv.id)

    if (error) {
        console.error('declineInvitation error:', error)
        return { error: error.message }
    }
    return { ok: true }
}
