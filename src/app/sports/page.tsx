import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './sports.module.css'

export default function SportsPage() {
    const sports = [
        {
            id: 'table-tennis',
            name: 'Table Tennis',
            icon: '🏓',
            description: 'Fast-paced action for reflexes and skill.',
            players: '2-4'
        },
        {
            id: 'badminton',
            name: 'Badminton',
            icon: '🏸',
            description: 'Agility and precision on the court.',
            players: '2-4'
        },
        {
            id: 'cricket',
            name: 'Cricket',
            icon: '🏏',
            description: 'The gentleman\'s game (Coming Soon)',
            players: '11-22',
            comingSoon: true
        }
    ]

    return (
        <>
            <Navbar />
            <main className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Available Sports</h1>
                        <p>Choose your game and find your perfect match.</p>
                    </div>

                    <div className={styles.grid}>
                        {sports.map(sport => (
                            <div key={sport.id} className={`${styles.card} ${sport.comingSoon ? styles.comingSoon : ''}`}>
                                <div className={styles.icon}>{sport.icon}</div>
                                <h2>{sport.name}</h2>
                                <p>{sport.description}</p>
                                <div className={styles.meta}>
                                    <span>👥 {sport.players} Players</span>
                                </div>
                                {!sport.comingSoon && (
                                    <div className={styles.actions}>
                                        <Link href="/matchmaking" className={styles.playBtn}>
                                            Find Match
                                        </Link>
                                        <Link href="/venues" className={styles.venueBtn}>
                                            Find Venues
                                        </Link>
                                    </div>
                                )}
                                {sport.comingSoon && (
                                    <span className={styles.label}>Coming Soon</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    )
}
