import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './bookings.module.css'

export default async function BookingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
      *,
      court:courts(
        name,
        hourly_rate,
        sport:sports(name, icon),
        venue:venues(name, address, city)
      ),
      payment:payments(*)
    `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false })

    const upcomingBookings = bookings?.filter(b =>
        new Date(b.booking_date) >= new Date(new Date().toDateString())
    ) || []

    const pastBookings = bookings?.filter(b =>
        new Date(b.booking_date) < new Date(new Date().toDateString())
    ) || []

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>My Bookings</h1>
                        <Link href="/matchmaking" className={styles.newBookingBtn}>
                            + New Booking
                        </Link>
                    </div>

                    {/* Upcoming Bookings */}
                    <section className={styles.section}>
                        <h2>Upcoming Bookings</h2>
                        {upcomingBookings.length > 0 ? (
                            <div className={styles.bookingGrid}>
                                {upcomingBookings.map(booking => (
                                    <div key={booking.id} className={styles.bookingCard}>
                                        <div className={styles.bookingHeader}>
                                            <span className={styles.sportBadge}>
                                                {booking.court?.sport?.icon} {booking.court?.sport?.name}
                                            </span>
                                            <span className={`${styles.statusBadge} ${styles[booking.payment_status]}`}>
                                                {booking.payment_status}
                                            </span>
                                        </div>

                                        <div className={styles.bookingVenue}>
                                            <h3>{booking.court?.venue?.name}</h3>
                                            <p>{booking.court?.name}</p>
                                        </div>

                                        <div className={styles.bookingDetails}>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>📅 Date</span>
                                                <span className={styles.detailValue}>{booking.booking_date}</span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>🕐 Time</span>
                                                <span className={styles.detailValue}>{booking.booking_time}</span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>⏱️ Duration</span>
                                                <span className={styles.detailValue}>{booking.duration_minutes} min</span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>💰 Total</span>
                                                <span className={styles.detailValue}>PKR {booking.total_amount}</span>
                                            </div>
                                        </div>

                                        <div className={styles.bookingPayment}>
                                            <div className={styles.paymentInfo}>
                                                <span>Advance Paid: PKR {booking.advance_paid}</span>
                                                <span>Remaining: PKR {booking.total_amount - booking.advance_paid}</span>
                                            </div>
                                        </div>

                                        <div className={styles.bookingActions}>
                                            <Link href={`/bookings/${booking.id}`} className={styles.viewBtn}>
                                                View Details
                                            </Link>
                                            {booking.payment_status === 'pending' && (
                                                <Link href={`/bookings/${booking.id}/pay`} className={styles.payBtn}>
                                                    Submit Payment
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>📅</span>
                                <p>No upcoming bookings</p>
                                <Link href="/matchmaking" className={styles.findMatchLink}>
                                    Find a match to book
                                </Link>
                            </div>
                        )}
                    </section>

                    {/* Past Bookings */}
                    <section className={styles.section}>
                        <h2>Past Bookings</h2>
                        {pastBookings.length > 0 ? (
                            <div className={styles.bookingGrid}>
                                {pastBookings.map(booking => (
                                    <div key={booking.id} className={`${styles.bookingCard} ${styles.pastCard}`}>
                                        <div className={styles.bookingHeader}>
                                            <span className={styles.sportBadge}>
                                                {booking.court?.sport?.icon} {booking.court?.sport?.name}
                                            </span>
                                            <span className={`${styles.statusBadge} ${styles.completed}`}>
                                                completed
                                            </span>
                                        </div>

                                        <div className={styles.bookingVenue}>
                                            <h3>{booking.court?.venue?.name}</h3>
                                            <p>{booking.court?.name} • {booking.booking_date}</p>
                                        </div>

                                        <div className={styles.bookingActions}>
                                            <Link href={`/bookings/${booking.id}`} className={styles.viewBtn}>
                                                View Details
                                            </Link>
                                            {booking.payment_status === 'pending' && (
                                                <Link href={`/bookings/${booking.id}/pay`} className={styles.payBtn}>
                                                    Submit Payment
                                                </Link>
                                            )}
                                            {booking.payment_status === 'completed' && (
                                                <Link href={`/bookings/${booking.id}/invoice`} className={styles.invoiceBtn}>
                                                    📄 Invoice
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>📋</span>
                                <p>No past bookings</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
            <Footer />
        </>
    )
}
