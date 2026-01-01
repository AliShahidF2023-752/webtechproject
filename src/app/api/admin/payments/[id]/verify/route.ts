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

        const formData = await request.formData()
        const action = formData.get('action') as string

        let paymentStatus: string
        let bookingStatus: string

        switch (action) {
            case 'verify':
                paymentStatus = 'verified'
                bookingStatus = 'confirmed'
                break
            case 'reject':
                paymentStatus = 'rejected'
                bookingStatus = 'pending'
                break
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        // Update payment
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .update({
                status: paymentStatus,
                verified_at: action === 'verify' ? new Date().toISOString() : null,
                verified_by: action === 'verify' ? user.id : null
            })
            .eq('id', id)
            .select('booking_id')
            .single()

        if (paymentError) throw paymentError

        // Update booking status
        if (payment?.booking_id) {
            await supabase
                .from('bookings')
                .update({ payment_status: bookingStatus })
                .eq('id', payment.booking_id)
        }

        return NextResponse.redirect(new URL('/admin/payments', request.url))
    } catch (error) {
        console.error('Payment verification error:', error)
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
    }
}
