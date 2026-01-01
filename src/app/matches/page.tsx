import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './matches.module.css'

export default async function MatchesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: matches } = await supabase
        .from('match_players')
        .select(`
      *,
      match:matches(
        *,
        venue:venues(name, city),
        sport:sports(name, icon),
        winner:users!winner_id(
          player_profiles(name)
        )
      )
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const upcomingMatches = matches?.filter((m: { match: { status: string } }) =>
        ['pending', 'confirmed'].includes(m.match?.status)
    ) || []

    const completedMatches = matches?.filter((m: { match: { status: string } }) =>
        m.match?.status === 'completed'
    ) || []

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>My Matches</h1>
                        <Link href="/matchmaking" className={styles.findMatchBtn}>
                            🎯 Find New Match
                        </Link>
                    </div>

                    {/* Upcoming Matches */}
                    <section className={styles.section}>
                        <h2>Upcoming Matches</h2>
                        {upcomingMatches.length > 0 ? (
                            <div className={styles.matchGrid}>
                                {upcomingMatches.map((mp: { id: string; match: { id: string; status: string; scheduled_date: string; scheduled_time: string; sport: { icon: string; name: string } | null; venue: { name: string; city: string } | null } }) => (
                                    <div key={mp.id} className={styles.matchCard}>
                                        <div className={styles.matchHeader}>
                                            <span className={styles.sportBadge}>
                                                {mp.match?.sport?.icon} {mp.match?.sport?.name}
                                            </span>
                                            <span className={`${styles.statusBadge} ${styles[mp.match?.status || 'pending']}`}>
                                                {mp.match?.status}
                                            </span>
                                        </div>

                                        <div className={styles.matchVenue}>
                                            <h3>{mp.match?.venue?.name}</h3>
                                            <p>{mp.match?.venue?.city}</p>
                                        </div>

                                        <div className={styles.matchDetails}>
                                            <div className={styles.detail}>
                                                <span>📅</span>
                                                <span>{mp.match?.scheduled_date}</span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span>🕐</span>
                                                <span>{mp.match?.scheduled_time}</span>
                                            </div>
                                        </div>

                                        <div className={styles.matchActions}>
                                            <Link href={`/matches/${mp.match?.id}`} className={styles.viewBtn}>
                                                View Details
                                            </Link>
                                            <Link href={`/matches/${mp.match?.id}/chat`} className={styles.chatBtn}>
                                                💬 Chat
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>🎮</span>
                                <p>No upcoming matches</p>
                                <Link href="/matchmaking" className={styles.findLink}>
                                    Find a match
                                </Link>
                            </div>
                        )}
                    </section>

                    {/* Match History */}
                    <section className={styles.section}>
                        <h2>Match History</h2>
                        {completedMatches.length > 0 ? (
                            <div className={styles.historyTable}>
                                <div className={styles.tableHeader}>
                                    <span>Sport</span>
                                    <span>Date</span>
                                    <span>Venue</span>
                                    <span>Result</span>
                                    <span>Actions</span>
                                </div>
                                {completedMatches.map((mp: { id: string; user_id: string; match: { id: string; scheduled_date: string; winner_id: string; sport: { icon: string; name: string } | null; venue: { name: string } | null; winner: { player_profiles: { name: string }[] } | null } }) => (
                                    <div key={mp.id} className={styles.tableRow}>
                                        <span>{mp.match?.sport?.icon} {mp.match?.sport?.name}</span>
                                        <span>{mp.match?.scheduled_date}</span>
                                        <span>{mp.match?.venue?.name}</span>
                                        <span className={mp.match?.winner_id === mp.user_id ? styles.won : styles.lost}>
                                            {mp.match?.winner_id === mp.user_id ? '🏆 Won' : '😔 Lost'}
                                        </span>
                                        <Link href={`/matches/${mp.match?.id}`} className={styles.viewLink}>
                                            View
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>📋</span>
                                <p>No match history yet</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
            <Footer />
        </>
    )
}
