'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './profile.module.css'

interface Profile {
    name: string
    username: string
    avatar_url: string | null
    gender: string
    age: number
    elo_rating: number
    wins: number
    losses: number
    total_matches: number
}

export default function ProfilePage() {
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadProfile = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/auth/login')
                return
            }

            const { data } = await supabase
                .from('player_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (data) {
                setProfile(data)
            } else {
                // If no profile, redirect to setup
                router.push('/profile/setup')
            }
            setLoading(false)
        }

        loadProfile()
    }, [router])

    if (loading) return <div>Loading...</div>

    if (!profile) return null

    return (
        <>
            <Navbar />
            <main className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.avatar}>
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.name} />
                            ) : (
                                <span>{profile.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className={styles.info}>
                            <h1>{profile.name}</h1>
                            <p className={styles.username}>@{profile.username}</p>
                            <Link href="/profile/setup" className={styles.editBtn}>
                                Edit Profile
                            </Link>
                        </div>
                    </div>

                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <h3>ELO Rating</h3>
                            <div className={styles.statValue}>{profile.elo_rating}</div>
                            <span className={styles.statLabel}>Current Rank</span>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Matches</h3>
                            <div className={styles.statValue}>{profile.total_matches || (profile.wins + profile.losses)}</div>
                            <span className={styles.statLabel}>Total Played</span>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Win Rate</h3>
                            <div className={styles.statValue}>
                                {profile.total_matches > 0
                                    ? Math.round((profile.wins / profile.total_matches) * 100)
                                    : 0}%
                            </div>
                            <span className={styles.statLabel}>{profile.wins}W - {profile.losses}L</span>
                        </div>
                    </div>

                    <div className={styles.detailsSection}>
                        <h2>Player Details</h2>
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                                <label>Age</label>
                                <span>{profile.age} years</span>
                            </div>
                            <div className={styles.detailItem}>
                                <label>Gender</label>
                                <span style={{ textTransform: 'capitalize' }}>{profile.gender}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    )
}
