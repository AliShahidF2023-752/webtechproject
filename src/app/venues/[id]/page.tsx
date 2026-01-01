import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './venue-detail.module.css'

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: venue } = await supabase
        .from('venues')
        .select(`
      *,
      courts(
        id,
        name,
        hourly_rate,
        capacity,
        is_available,
        sport:sports(name, icon)
      )
    `)
        .eq('id', id)
        .single()

    if (!venue) {
        notFound()
    }

    return (
        <>
            <Navbar />
            <main className={styles.page}>
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <Link href="/venues" className={styles.backLink}>
                            ← Back to Venues
                        </Link>
                        <div className={styles.headerContent}>
                            <h1>{venue.name}</h1>
                            <p className={styles.location}>📍 {venue.address}, {venue.city}</p>
                        </div>
                    </div>

                    {/* Gallery */}
                    <div className={styles.gallery}>
                        {venue.images?.length > 0 ? (
                            venue.images.map((img: string, i: number) => (
                                <div key={i} className={styles.galleryImage}>
                                    <img src={img} alt={`${venue.name} - ${i + 1}`} />
                                </div>
                            ))
                        ) : (
                            <div className={styles.galleryPlaceholder}>
                                <span>🏟️</span>
                                <p>No images available</p>
                            </div>
                        )}
                    </div>

                    {/* Content Grid */}
                    <div className={styles.contentGrid}>
                        {/* Main Info */}
                        <div className={styles.mainContent}>
                            {/* Description */}
                            {venue.description && (
                                <section className={styles.section}>
                                    <h2>About</h2>
                                    <p>{venue.description}</p>
                                </section>
                            )}

                            {/* Courts */}
                            <section className={styles.section}>
                                <h2>Available Courts</h2>
                                <div className={styles.courtGrid}>
                                    {venue.courts?.map((court: { id: string; name: string; hourly_rate: number; capacity: number; is_available: boolean; sport: { name: string; icon: string } | null }) => (
                                        <div key={court.id} className={`${styles.courtCard} ${!court.is_available ? styles.unavailable : ''}`}>
                                            <div className={styles.courtHeader}>
                                                <span className={styles.courtSport}>
                                                    {court.sport?.icon} {court.sport?.name}
                                                </span>
                                                {!court.is_available && (
                                                    <span className={styles.unavailableBadge}>Unavailable</span>
                                                )}
                                            </div>
                                            <h3>{court.name}</h3>
                                            <div className={styles.courtInfo}>
                                                <span>👥 {court.capacity} players</span>
                                                <span className={styles.courtPrice}>PKR {court.hourly_rate}/hr</span>
                                            </div>
                                            {court.is_available && (
                                                <Link
                                                    href={`/bookings/new?court=${court.id}`}
                                                    className={styles.bookBtn}
                                                >
                                                    Book Now
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Rules */}
                            {venue.rules && (
                                <section className={styles.section}>
                                    <h2>Venue Rules</h2>
                                    <div className={styles.rulesBox}>
                                        <p>{venue.rules}</p>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className={styles.sidebar}>
                            {/* Quick Book */}
                            <div className={styles.sidebarCard}>
                                <h3>Quick Actions</h3>
                                <Link href={`/matchmaking?venue=${venue.id}`} className={styles.actionBtn}>
                                    🎯 Find Match Here
                                </Link>
                                <a
                                    href={`https://maps.google.com/?q=${venue.location_lat},${venue.location_lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.actionBtnSecondary}
                                >
                                    🗺️ Get Directions
                                </a>
                            </div>

                            {/* Pricing */}
                            <div className={styles.sidebarCard}>
                                <h3>Pricing</h3>
                                <div className={styles.priceRange}>
                                    <span>From</span>
                                    <span className={styles.priceValue}>
                                        PKR {Math.min(...(venue.courts?.map((c: { hourly_rate: number }) => c.hourly_rate) || [0]))}
                                    </span>
                                    <span>to</span>
                                    <span className={styles.priceValue}>
                                        PKR {Math.max(...(venue.courts?.map((c: { hourly_rate: number }) => c.hourly_rate) || [0]))}
                                    </span>
                                    <span>per hour</span>
                                </div>
                            </div>

                            {/* Sports */}
                            <div className={styles.sidebarCard}>
                                <h3>Sports Available</h3>
                                <div className={styles.sportsList}>
                                    {Array.from(new Set(venue.courts?.map((c: { sport: { name: string; icon: string } | null }) =>
                                        c.sport ? `${c.sport.icon} ${c.sport.name}` : null
                                    ).filter(Boolean))).map((sport, i) => (
                                        <span key={i} className={styles.sportTag}>{sport as string}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    )
}
