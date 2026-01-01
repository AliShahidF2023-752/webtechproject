import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import styles from './admin.module.css'

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Check if admin
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') {
        redirect('/dashboard')
    }

    // Get stats
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

    const { count: totalVenues } = await supabase
        .from('venues')
        .select('*', { count: 'exact', head: true })

    const { count: totalMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })

    const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })

    const { count: pendingPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted')

    const { count: pendingReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    // Recent activity
    const { data: recentBookings } = await supabase
        .from('bookings')
        .select(`
      *,
      court:courts(venue:venues(name)),
      user:users(email)
    `)
        .order('created_at', { ascending: false })
        .limit(5)

    const { data: recentUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Admin Dashboard</h1>
                        <p>Manage your sports matchmaking platform</p>
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>👥</div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{totalUsers || 0}</span>
                                <span className={styles.statLabel}>Total Users</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>🏟️</div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{totalVenues || 0}</span>
                                <span className={styles.statLabel}>Venues</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>🎮</div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{totalMatches || 0}</span>
                                <span className={styles.statLabel}>Matches</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>📅</div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{totalBookings || 0}</span>
                                <span className={styles.statLabel}>Bookings</span>
                            </div>
                        </div>
                    </div>

                    {/* Alert Cards */}
                    <div className={styles.alertGrid}>
                        {(pendingPayments || 0) > 0 && (
                            <Link href="/admin/payments" className={styles.alertCard}>
                                <span className={styles.alertIcon}>💳</span>
                                <span className={styles.alertText}>{pendingPayments} payments pending verification</span>
                            </Link>
                        )}
                        {(pendingReports || 0) > 0 && (
                            <Link href="/admin/reports" className={styles.alertCard + ' ' + styles.alertWarning}>
                                <span className={styles.alertIcon}>⚠️</span>
                                <span className={styles.alertText}>{pendingReports} reports need review</span>
                            </Link>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.actionsGrid}>
                        <Link href="/admin/users" className={styles.actionCard}>
                            <span className={styles.actionIcon}>👥</span>
                            <h3>Users</h3>
                            <p>Manage player and vendor accounts</p>
                        </Link>
                        <Link href="/admin/venues" className={styles.actionCard}>
                            <span className={styles.actionIcon}>🗺️</span>
                            <h3>Venues</h3>
                            <p>Add and manage venues on map</p>
                        </Link>
                        <Link href="/admin/payments" className={styles.actionCard}>
                            <span className={styles.actionIcon}>💳</span>
                            <h3>Payments</h3>
                            <p>Verify payment screenshots</p>
                        </Link>
                        <Link href="/admin/bookings" className={styles.actionCard}>
                            <span className={styles.actionIcon}>📅</span>
                            <h3>Bookings</h3>
                            <p>Manage and confirm bookings</p>
                        </Link>
                        <Link href="/admin/reports" className={styles.actionCard}>
                            <span className={styles.actionIcon}>🚨</span>
                            <h3>Reports</h3>
                            <p>Handle player reports</p>
                        </Link>
                        <Link href="/admin/analytics" className={styles.actionCard}>
                            <span className={styles.actionIcon}>📊</span>
                            <h3>Analytics</h3>
                            <p>View visitor and interaction data</p>
                        </Link>
                        <Link href="/admin/config" className={styles.actionCard}>
                            <span className={styles.actionIcon}>⚙️</span>
                            <h3>Settings</h3>
                            <p>Configure system settings</p>
                        </Link>
                    </div>

                    {/* Recent Activity */}
                    <div className={styles.recentGrid}>
                        <div className={styles.recentCard}>
                            <h2>Recent Bookings</h2>
                            <div className={styles.recentList}>
                                {recentBookings?.map(booking => (
                                    <div key={booking.id} className={styles.recentItem}>
                                        <div className={styles.recentInfo}>
                                            <span className={styles.recentTitle}>{booking.court?.venue?.name}</span>
                                            <span className={styles.recentMeta}>{booking.booking_date} • PKR {booking.total_amount}</span>
                                        </div>
                                        <span className={`${styles.statusBadge} ${styles[booking.payment_status]}`}>
                                            {booking.payment_status}
                                        </span>
                                    </div>
                                ))}
                                {!recentBookings?.length && (
                                    <p className={styles.emptyText}>No recent bookings</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.recentCard}>
                            <h2>New Users</h2>
                            <div className={styles.recentList}>
                                {recentUsers?.map(user => (
                                    <div key={user.id} className={styles.recentItem}>
                                        <div className={styles.recentInfo}>
                                            <span className={styles.recentTitle}>{user.email}</span>
                                            <span className={styles.recentMeta}>{new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                ))}
                                {!recentUsers?.length && (
                                    <p className={styles.emptyText}>No recent users</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
