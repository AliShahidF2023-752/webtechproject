import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check admin
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const formData = await request.formData()
        const action = formData.get('action') as string

        let status: string
        let adminNotes: string

        switch (action) {
            case 'warn':
                status = 'resolved'
                adminNotes = 'Warning issued to reported user'
                break
            case 'ban':
                status = 'resolved'
                adminNotes = 'User banned'
                // Also deactivate the reported user
                const { data: report } = await supabase
                    .from('reports')
                    .select('reported_user')
                    .eq('id', id)
                    .single()

                if (report) {
                    await supabase
                        .from('users')
                        .update({ is_active: false })
                        .eq('id', report.reported_user)
                }
                break
            case 'dismiss':
                status = 'dismissed'
                adminNotes = 'Report dismissed - no action required'
                break
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const { error } = await supabase
            .from('reports')
            .update({
                status,
                admin_notes: adminNotes,
                resolved_at: new Date().toISOString(),
                resolved_by: user.id
            })
            .eq('id', id)

        if (error) throw error

        return NextResponse.redirect(new URL('/admin/reports', request.url))
    } catch (error) {
        console.error('Report resolution error:', error)
        return NextResponse.json({ error: 'Failed to resolve report' }, { status: 500 })
    }
}
