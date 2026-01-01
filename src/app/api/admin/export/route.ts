import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
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

        const url = new URL(request.url)
        const type = url.searchParams.get('type') || 'users'
        const format = url.searchParams.get('format') || 'csv'

        let data: string
        let filename: string

        switch (type) {
            case 'users':
                const { data: users } = await supabase
                    .from('users')
                    .select('id, email, role, is_active, created_at')
                    .order('created_at', { ascending: false })

                data = convertToCSV(users || [], ['id', 'email', 'role', 'is_active', 'created_at'])
                filename = 'users_export.csv'
                break

            case 'bookings':
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('id, booking_date, booking_time, total_amount, payment_status, created_at')
                    .order('created_at', { ascending: false })

                data = convertToCSV(bookings || [], ['id', 'booking_date', 'booking_time', 'total_amount', 'payment_status', 'created_at'])
                filename = 'bookings_export.csv'
                break

            case 'revenue':
                const { data: revenue } = await supabase
                    .from('bookings')
                    .select('booking_date, total_amount, commission_amount, payment_status')
                    .eq('payment_status', 'verified')
                    .order('booking_date', { ascending: false })

                data = convertToCSV(revenue || [], ['booking_date', 'total_amount', 'commission_amount', 'payment_status'])
                filename = 'revenue_export.csv'
                break

                break

            case 'stats_pdf':
                // Simple text-based PDF generation logic would happen here or client-side.
                // Since jsPDF is client-side library, server-side PDF generation is complex without headless browser.
                // We will rely on CSV for now or simple HTML-to-PDF if handled on client.
                return NextResponse.json({ error: 'PDF export requires client-side generation' }, { status: 400 })

            default:
                return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
        }

        return new NextResponse(data, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })
    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}

function convertToCSV(data: Record<string, unknown>[], columns: string[]): string {
    if (data.length === 0) return columns.join(',') + '\n'

    const header = columns.join(',')
    const rows = data.map(row =>
        columns.map(col => {
            const val = row[col]
            if (val === null || val === undefined) return ''
            if (typeof val === 'string' && val.includes(',')) return `"${val}"`
            return String(val)
        }).join(',')
    )

    return [header, ...rows].join('\n')
}
