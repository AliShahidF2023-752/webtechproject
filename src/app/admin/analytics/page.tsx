import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import HeatmapVisualization from './HeatmapVisualization'
import PDFExportButton from './PDFExportButton'
import styles from '../admin.module.css'

export default async function AdminAnalyticsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') {
        redirect('/dashboard')
    }

    // Get analytics data
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

    const { count: totalMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })

    const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })

    const { data: recentUsers } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const { data: recentBookings } = await supabase
        .from('bookings')
        .select('created_at, total_amount')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    // Revenue stats
    const { data: verifiedPayments } = await supabase
        .from('bookings')
        .select('total_amount, commission_amount')
        .eq('payment_status', 'verified')

    const totalRevenue = verifiedPayments?.reduce((sum: number, b: { total_amount: number }) => sum + b.total_amount, 0) || 0
    const totalCommission = verifiedPayments?.reduce((sum: number, b: { commission_amount: number }) => sum + b.commission_amount, 0) || 0

    // User growth data for chart
    const userGrowth = [
        { day: 'Mon', users: Math.floor(Math.random() * 10) + 5 },
        { day: 'Tue', users: Math.floor(Math.random() * 10) + 5 },
        { day: 'Wed', users: Math.floor(Math.random() * 10) + 5 },
        { day: 'Thu', users: Math.floor(Math.random() * 10) + 5 },
        { day: 'Fri', users: Math.floor(Math.random() * 10) + 5 },
        { day: 'Sat', users: Math.floor(Math.random() * 10) + 5 },
        { day: 'Sun', users: Math.floor(Math.random() * 10) + 5 },
    ]

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Analytics Dashboard</h1>
                        <p>Platform performance and insights</p>
                    </div>

                    {/* Key Metrics */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>👥</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{totalUsers || 0}</span>
                                <span className={styles.statLabel}>Total Users</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>🎮</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{totalMatches || 0}</span>
                                <span className={styles.statLabel}>Matches Played</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>📅</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{totalBookings || 0}</span>
                                <span className={styles.statLabel}>Total Bookings</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>💰</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>PKR {totalRevenue.toLocaleString()}</span>
                                <span className={styles.statLabel}>Total Revenue</span>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Stats */}
                    <div className={styles.recentGrid}>
                        <div className={styles.recentCard}>
                            <h2>This Week</h2>
                            <div className={styles.weeklyStats}>
                                <div className={styles.weeklyStat}>
                                    <span className={styles.weeklyValue}>{recentUsers?.length || 0}</span>
                                    <span className={styles.weeklyLabel}>New Users</span>
                                </div>
                                <div className={styles.weeklyStat}>
                                    <span className={styles.weeklyValue}>{recentBookings?.length || 0}</span>
                                    <span className={styles.weeklyLabel}>Bookings</span>
                                </div>
                                <div className={styles.weeklyStat}>
                                    <span className={styles.weeklyValue}>
                                        PKR {(recentBookings?.reduce((s: number, b: { total_amount: number }) => s + b.total_amount, 0) || 0).toLocaleString()}
                                    </span>
                                    <span className={styles.weeklyLabel}>Revenue</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.recentCard}>
                            <h2>Commission Earned</h2>
                            <div className={styles.commissionDisplay}>
                                <div className={styles.commissionValue}>
                                    PKR {totalCommission.toLocaleString()}
                                </div>
                                <p className={styles.commissionNote}>
                                    From {verifiedPayments?.length || 0} verified bookings
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Heatmap Visualization */}
                    <section className={styles.section}>
                        <h2>Interaction Heatmap</h2>
                        <HeatmapVisualization />
                    </section>

                    {/* User Growth Chart Placeholder */}
                    <section className={styles.section}>
                        <h2>User Growth (Last 7 Days)</h2>
                        <div className={styles.chartContainer}>
                            <div className={styles.barChart}>
                                {userGrowth.map((day, i) => (
                                    <div key={i} className={styles.barColumn}>
                                        <div
                                            className={styles.bar}
                                            style={{ height: `${day.users * 10}px` }}
                                        />
                                        <span className={styles.barLabel}>{day.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Export Options */}
                    <section className={styles.section}>
                        <h2>Export Data</h2>
                        <div className={styles.exportOptions}>
                            <div className={styles.exportGroup}>
                                <a href="/api/admin/export?type=users&format=csv" className={styles.exportBtn}>
                                    📥 Export Users (CSV)
                                </a>
                                <PDFExportButton type="users" />
                            </div>
                            <div className={styles.exportGroup}>
                                <a href="/api/admin/export?type=bookings&format=csv" className={styles.exportBtn}>
                                    📥 Export Bookings (CSV)
                                </a>
                                <PDFExportButton type="bookings" />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
}
