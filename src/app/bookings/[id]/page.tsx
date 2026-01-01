import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from '../bookings.module.css'

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: booking } = await supabase
        .from('bookings')
        .select(`
            *,
            court:courts(
                name,
                hourly_rate,
                capacity,
                sport:sports(name, icon),
                venue:venues(name, address, city, location_lat, location_lng)
            ),
            match:matches(
                id,
                status,
                sport:sports(name)
            ),
            payment:payments(*)
        `)
        .eq('id', id)
        .single()

    if (!booking) {
        return (
            <>
                <Navbar />
                <div className={styles.page}>
                    <div className={styles.container}>
                        <div className={styles.error}>Booking not found</div>
                        <Link href="/bookings" className={styles.backBtn}>Back to Bookings</Link>
                    </div>
                </div>
            </>
        )
    }

    // Determine status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return styles.verified
            case 'pending': return styles.pending
            case 'cancelled': return styles.rejected
            case 'completed': return styles.verified
            default: return ''
        }
    }

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.detailsHeader}>
                        <Link href="/bookings" className={styles.backLink}>
                            ← Back to My Bookings
                        </Link>
                        <h1>Booking Details</h1>
                        <span className={`${styles.statusBadge} ${getStatusColor(booking.payment_status)}`}>
                            {booking.payment_status}
                        </span>
                    </div>

                    <div className={styles.detailsGrid}>
                        {/* Venue & Court Info */}
                        <div className={styles.card}>
                            <h2>Venue Information</h2>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Venue</span>
                                <span className={styles.value}>{booking.court.venue.name}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Address</span>
                                <span className={styles.value}>{booking.court.venue.address}, {booking.court.venue.city}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Court</span>
                                <span className={styles.value}>{booking.court.name}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Sport</span>
                                <span className={styles.value}>{booking.court.sport.icon} {booking.court.sport.name}</span>
                            </div>
                        </div>

                        {/* Booking Info */}
                        <div className={styles.card}>
                            <h2>Booking Schedule</h2>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Date</span>
                                <span className={styles.value}>{booking.booking_date}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Time</span>
                                <span className={styles.value}>{booking.booking_time}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Duration</span>
                                <span className={styles.value}>{booking.duration_minutes} Minutes</span>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className={styles.card}>
                            <h2>Payment Summary</h2>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Total Amount</span>
                                <span className={styles.amount}>PKR {booking.total_amount}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Advance Paid</span>
                                <span className={styles.value}>PKR {booking.advance_paid}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.label}>Remaining</span>
                                <span className={styles.value}>PKR {booking.total_amount - booking.advance_paid}</span>
                            </div>

                            {booking.payment_status === 'pending' && (
                                <div className={styles.actionArea}>
                                    <Link href={`/bookings/${booking.id}/pay`} className={styles.primaryBtn}>
                                        Submit Payment Proof
                                    </Link>
                                </div>
                            )}

                            {booking.payment_status === 'verified' && (
                                <div className={styles.successMessage}>
                                    ✅ Payment Verified
                                </div>
                            )}
                        </div>

                        {/* Match Info (if linked) */}
                        {booking.match && (
                            <div className={styles.card}>
                                <h2>Match Details</h2>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Match Status</span>
                                    <span className={styles.value}>{booking.match.status}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Match ID</span>
                                    <span className={styles.mono}>{booking.match.id.slice(0, 8)}...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}
