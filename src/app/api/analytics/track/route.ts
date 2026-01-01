import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase
            .from('visitor_analytics')
            .insert({
                session_id: body.session_id,
                user_id: user?.id || null,
                page: body.page,
                referrer: body.referrer || null,
                user_agent: body.user_agent || null,
                timestamp: body.timestamp || new Date().toISOString()
            })

        if (error) {
            console.error('Analytics track error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Analytics track error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
