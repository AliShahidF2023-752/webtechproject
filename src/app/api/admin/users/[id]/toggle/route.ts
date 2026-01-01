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

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get current user status
        const { data: targetUser } = await supabase
            .from('users')
            .select('is_active')
            .eq('id', id)
            .single()

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Toggle status
        const { error } = await supabase
            .from('users')
            .update({ is_active: !targetUser.is_active })
            .eq('id', id)

        if (error) throw error

        return NextResponse.redirect(new URL('/admin/users', request.url))
    } catch (error) {
        console.error('User toggle error:', error)
        return NextResponse.json({ error: 'Failed to toggle user' }, { status: 500 })
    }
}
