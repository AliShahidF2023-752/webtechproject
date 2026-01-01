import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './dashboard.module.css'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Check if profile exists - if error or no profile, show a setup prompt instead of redirecting
    // Check if profile exists - if error or no profile, show a setup prompt instead of redirecting
    const { data: profile, error: profileError } = await supabase
        .from('player_profiles')
        .select('*') // Removed behavior_metrics(*) to prevent join errors
        .eq('user_id', user.id)
        .single()

    // If no profile, show setup prompt instead of redirecting (prevents loop)
    const needsSetup = !profile || !profile.is_profile_complete || profileError

    if (profileError) {
        console.error('Dashboard profile check error:', profileError)
    }

    // Only fetch additional data if profile exists
    let playerSports = null
    let recentMatches = null
    let upcomingBookings = null

    if (!needsSetup) {
        // Get player sports
        const { data: sports } = await supabase
            .from('player_sports')
            .select('*, sport:sports(*)')
            .eq('user_id', user.id)
        playerSports = sports

        // Get recent matches
        const { data: matches } = await supabase
            .from('match_players')
            .select(`
              *,
              match:matches(
                *,
                venue:venues(name),
                sport:sports(name, icon)
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)
        recentMatches = matches

        // Get upcoming bookings
        const { data: bookings } = await supabase
            .from('bookings')
            .select(`
              *,
              court:courts(name, venue:venues(name)),
              match:matches(sport:sports(name, icon))
            `)
            .eq('user_id', user.id)
            .gte('booking_date', new Date().toISOString().split('T')[0])
            .order('booking_date', { ascending: true })
            .limit(3)
        upcomingBookings = bookings
    }

    const behaviorMetrics = profile?.behavior_metrics?.[0]

    // Show setup prompt if profile is incomplete
    if (needsSetup) {
        return (
            <>
                <Navbar />
                <div className={styles.page}>
                    <div className={styles.container}>
                        <div className={styles.setupPrompt}>
                            <div className={styles.setupIcon}>👤</div>
                            <h1>Complete Your Profile</h1>
                            <p>Set up your player profile to start finding matches and booking courts.</p>
                            {profileError && (
                                <p style={{ color: 'red', fontSize: '0.8em', marginTop: '10px' }}>
                                    Debug Error: {profileError.message} ({profileError.code})
                                </p>
                            )}
                            <Link href="/profile/setup" className={styles.findMatchBtn}>
                                Complete Profile Setup →
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    {/* Welcome Header */}
                    <div className={styles.header}>
                        <div className={styles.welcome}>
                            <h1>Welcome back, {profile?.name || 'Player'}!</h1>
                            <p>Ready to find your next match?</p>
                        </div>
                        <Link href="/matchmaking" className={styles.findMatchBtn}>
                            🎯 Find Match
                        </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>⭐</div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{profile.elo_rating}</span>
                                <span className={styles.statLabel}>ELO Rating</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>🏆</div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{profile.wins}</span>
                                <span className={styles.statLabel}>Wins</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>📊</div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{profile.losses}</span>
                                <span className={styles.statLabel}>Losses</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>🎮</div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{profile.wins + profile.losses}</span>
                                <span className={styles.statLabel}>Total Games</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.grid}>
                        {/* Left Column */}
                        <div className={styles.column}>
                            {/* My Sports */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h2>My Sports</h2>
                                    <Link href="/profile" className={styles.cardLink}>Edit</Link>
                                </div>
                                <div className={styles.sportsList}>
                                    {playerSports?.map(ps => (
                                        <div key={ps.id} className={styles.sportItem}>
                                            <span className={styles.sportIcon}>{ps.sport?.icon || '🎯'}</span>
                                            <div className={styles.sportInfo}>
                                                <span className={styles.sportName}>{ps.sport?.name}</span>
                                                <span className={styles.sportRating}>Rating: {ps.elo_rating}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {!playerSports?.length && (
                                        <p className={styles.emptyText}>No sports added yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Behavior Metrics */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h2>Behavior Metrics</h2>
                                </div>
                                <div className={styles.metrics}>
                                    <div className={styles.metric}>
                                        <span className={styles.metricLabel}>Tone</span>
                                        <div className={styles.metricBar}>
                                            <div
                                                className={styles.metricFill}
                                                style={{ width: `${((behaviorMetrics?.tone || 3) / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className={styles.metricValue}>{behaviorMetrics?.tone?.toFixed(1) || '3.0'}</span>
                                    </div>
                                    <div className={styles.metric}>
                                        <span className={styles.metricLabel}>Aggressiveness</span>
                                        <div className={styles.metricBar}>
                                            <div
                                                className={styles.metricFill}
                                                style={{ width: `${((behaviorMetrics?.aggressiveness || 3) / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className={styles.metricValue}>{behaviorMetrics?.aggressiveness?.toFixed(1) || '3.0'}</span>
                                    </div>
                                    <div className={styles.metric}>
                                        <span className={styles.metricLabel}>Sportsmanship</span>
                                        <div className={styles.metricBar}>
                                            <div
                                                className={styles.metricFill}
                                                style={{ width: `${((behaviorMetrics?.sportsmanship || 3) / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className={styles.metricValue}>{behaviorMetrics?.sportsmanship?.toFixed(1) || '3.0'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className={styles.column}>
                            {/* Upcoming Bookings */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h2>Upcoming Bookings</h2>
                                    <Link href="/bookings" className={styles.cardLink}>View All</Link>
                                </div>
                                <div className={styles.bookingsList}>
                                    {upcomingBookings?.map(booking => (
                                        <div key={booking.id} className={styles.bookingItem}>
                                            <div className={styles.bookingIcon}>
                                                {booking.match?.sport?.icon || '🎯'}
                                            </div>
                                            <div className={styles.bookingInfo}>
                                                <span className={styles.bookingVenue}>
                                                    {booking.court?.venue?.name}
                                                </span>
                                                <span className={styles.bookingDetails}>
                                                    {booking.court?.name} • {booking.booking_date} at {booking.booking_time}
                                                </span>
                                            </div>
                                            <span className={`${styles.bookingStatus} ${styles[booking.payment_status]}`}>
                                                {booking.payment_status}
                                            </span>
                                        </div>
                                    ))}
                                    {!upcomingBookings?.length && (
                                        <p className={styles.emptyText}>No upcoming bookings</p>
                                    )}
                                </div>
                            </div>

                            {/* Recent Matches */}
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h2>Recent Matches</h2>
                                    <Link href="/matches" className={styles.cardLink}>View All</Link>
                                </div>
                                <div className={styles.matchesList}>
                                    {recentMatches?.map(mp => (
                                        <div key={mp.id} className={styles.matchItem}>
                                            <div className={styles.matchIcon}>
                                                {mp.match?.sport?.icon || '🎯'}
                                            </div>
                                            <div className={styles.matchInfo}>
                                                <span className={styles.matchVenue}>
                                                    {mp.match?.venue?.name}
                                                </span>
                                                <span className={styles.matchDetails}>
                                                    {mp.match?.scheduled_date} • {mp.match?.sport?.name}
                                                </span>
                                            </div>
                                            <span className={`${styles.matchStatus} ${styles[mp.match?.status || 'pending']}`}>
                                                {mp.match?.status}
                                            </span>
                                        </div>
                                    ))}
                                    {!recentMatches?.length && (
                                        <p className={styles.emptyText}>No matches yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.quickActions}>
                        <Link href="/matchmaking" className={styles.quickAction}>
                            <span className={styles.actionIcon}>🎯</span>
                            <span>Find Match</span>
                        </Link>
                        <Link href="/venues" className={styles.quickAction}>
                            <span className={styles.actionIcon}>📍</span>
                            <span>Browse Venues</span>
                        </Link>
                        <Link href="/profile" className={styles.quickAction}>
                            <span className={styles.actionIcon}>👤</span>
                            <span>Edit Profile</span>
                        </Link>
                        <Link href="/bookings" className={styles.quickAction}>
                            <span className={styles.actionIcon}>📅</span>
                            <span>My Bookings</span>
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}
