import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const supabase = await createClient()

        const { error } = await supabase
            .from('interaction_events')
            .insert({
                session_id: body.session_id,
                event_type: body.event_type,
                element_id: body.element_id || null,
                element_class: body.element_class || null,
                x: body.x || null,
                y: body.y || null,
                scroll_depth: body.scroll_depth || null,
                page: body.page,
                viewport_width: body.viewport_width || null,
                viewport_height: body.viewport_height || null,
                timestamp: body.timestamp || new Date().toISOString()
            })

        if (error) {
            console.error('Analytics event error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Analytics event error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
