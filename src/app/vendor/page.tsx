import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import styles from './vendor.module.css'

export default async function VendorDashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Check if vendor
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'vendor' && userData?.role !== 'admin') {
        redirect('/dashboard')
    }

    // Get vendor's venues
    const { data: venues } = await supabase
        .from('venues')
        .select(`
      *,
      courts(
        id,
        name,
        hourly_rate,
        is_available,
        sport:sports(name, icon)
      )
    `)
        .eq('vendor_id', user.id)

    // Get recent bookings for vendor's venues
    const venueIds = venues?.map((v: { id: string }) => v.id) || []
    const { data: recentBookings } = await supabase
        .from('bookings')
        .select(`
      *,
      court:courts(name, venue_id, venue:venues(name)),
      user:users(email)
    `)
        .in('court_id', venues?.flatMap((v: { courts: { id: string }[] }) => v.courts?.map((c: { id: string }) => c.id)) || [])
        .order('created_at', { ascending: false })
        .limit(10)

    // Calculate stats
    const totalRevenue = recentBookings?.reduce((sum: number, b: { total_amount: number; payment_status: string }) =>
        b.payment_status === 'verified' ? sum + b.total_amount : sum, 0) || 0
    const totalCourts = venues?.reduce((sum: number, v: { courts: unknown[] }) => sum + (v.courts?.length || 0), 0) || 0

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Vendor Dashboard</h1>
                        <Link href="/vendor/venues/new" className={styles.addBtn}>
                            + Add Venue
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>🏟️</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{venues?.length || 0}</span>
                                <span className={styles.statLabel}>Venues</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>🏓</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{totalCourts}</span>
                                <span className={styles.statLabel}>Courts</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>📅</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{recentBookings?.length || 0}</span>
                                <span className={styles.statLabel}>Bookings</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>💰</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>PKR {totalRevenue.toLocaleString()}</span>
                                <span className={styles.statLabel}>Revenue</span>
                            </div>
                        </div>
                    </div>

                    {/* Venues */}
                    <section className={styles.section}>
                        <h2>My Venues</h2>
                        {venues && venues.length > 0 ? (
                            <div className={styles.venueGrid}>
                                {venues.map((venue: { id: string; name: string; city: string; is_active: boolean; courts: { id: string; name: string; hourly_rate: number; is_available: boolean; sport: { name: string; icon: string } | null }[] }) => (
                                    <div key={venue.id} className={styles.venueCard}>
                                        <div className={styles.venueHeader}>
                                            <h3>{venue.name}</h3>
                                            <span className={`${styles.statusDot} ${venue.is_active ? styles.active : styles.inactive}`} />
                                        </div>
                                        <p className={styles.venueCity}>{venue.city}</p>

                                        <div className={styles.courtsList}>
                                            {venue.courts?.map((court: { id: string; name: string; hourly_rate: number; is_available: boolean; sport: { name: string; icon: string } | null }) => (
                                                <div key={court.id} className={styles.courtItem}>
                                                    <span>{court.sport?.icon} {court.name}</span>
                                                    <span>PKR {court.hourly_rate}/hr</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={styles.venueActions}>
                                            <Link href={`/vendor/venues/${venue.id}`} className={styles.editBtn}>
                                                Edit
                                            </Link>
                                            <Link href={`/vendor/venues/${venue.id}/courts`} className={styles.courtsBtn}>
                                                Manage Courts
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span>🏟️</span>
                                <p>No venues yet. Add your first venue to start receiving bookings.</p>
                                <Link href="/vendor/venues/new" className={styles.addVenueBtn}>
                                    Add Venue
                                </Link>
                            </div>
                        )}
                    </section>

                    {/* Recent Bookings */}
                    <section className={styles.section}>
                        <h2>Recent Bookings</h2>
                        {recentBookings && recentBookings.length > 0 ? (
                            <div className={styles.bookingsTable}>
                                <div className={styles.tableHeader}>
                                    <span>Date</span>
                                    <span>Court</span>
                                    <span>Time</span>
                                    <span>Amount</span>
                                    <span>Status</span>
                                </div>
                                {recentBookings.map((booking: { id: string; booking_date: string; booking_time: string; total_amount: number; payment_status: string; court: { name: string } | null }) => (
                                    <div key={booking.id} className={styles.tableRow}>
                                        <span>{booking.booking_date}</span>
                                        <span>{booking.court?.name}</span>
                                        <span>{booking.booking_time}</span>
                                        <span>PKR {booking.total_amount}</span>
                                        <span className={`${styles.statusBadge} ${styles[booking.payment_status]}`}>
                                            {booking.payment_status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span>📅</span>
                                <p>No bookings yet</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    )
}
