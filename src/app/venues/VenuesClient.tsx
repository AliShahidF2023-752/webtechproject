'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import styles from './venues.module.css'

// Dynamically import MapView to avoid SSR issues
const MapView = dynamic(() => import('@/components/maps/MapView'), {
    ssr: false,
    loading: () => <div className={styles.mapLoading}>Loading map...</div>
})

interface Venue {
    id: string
    name: string
    address: string
    city: string
    location_lat: number
    location_lng: number
    images: string[]
    courts: {
        id: string
        name: string
        hourly_rate: number
        sport: {
            name: string
            icon: string
        } | null
    }[]
}

interface VenuesClientProps {
    venues: Venue[]
}

export default function VenuesClient({ venues }: VenuesClientProps) {
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
    const [userLocation, setUserLocation] = useState<[number, number]>([31.5204, 74.3587]) // Default Lahore

    // Group venues by city
    const venuesByCity: Record<string, Venue[]> = {}
    venues.forEach(venue => {
        if (!venuesByCity[venue.city]) {
            venuesByCity[venue.city] = []
        }
        venuesByCity[venue.city].push(venue)
    })

    const handleVenueSelect = (id: string) => {
        setSelectedVenueId(id)
        // Scroll to venue details card if in map mode? Or maybe map shows popup.
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Sports Venues</h1>
                    <p>Find and book courts at venues across Pakistan</p>
                </div>
                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        📋 List
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'map' ? styles.active : ''}`}
                        onClick={() => setViewMode('map')}
                    >
                        🗺️ Map
                    </button>
                </div>
            </div>

            {viewMode === 'map' ? (
                <div className={styles.mapContainer}>
                    <MapView
                        center={userLocation}
                        zoom={12}
                        venues={venues}
                        radius={50} // Show extensive radius
                        selectedVenue={selectedVenueId || undefined}
                        onVenueSelect={handleVenueSelect}
                    />
                </div>
            ) : (
                <>
                    {Object.entries(venuesByCity).map(([city, cityVenues]) => (
                        <section key={city} className={styles.citySection}>
                            <h2 className={styles.cityTitle}>
                                <span className={styles.cityIcon}>📍</span>
                                {city}
                            </h2>
                            <div className={styles.venueGrid}>
                                {cityVenues.map(venue => (
                                    <div key={venue.id} className={styles.venueCard}>
                                        <div className={styles.venueImage}>
                                            {venue.images?.[0] ? (
                                                <img src={venue.images[0]} alt={venue.name} />
                                            ) : (
                                                <div className={styles.venueImagePlaceholder}>🏟️</div>
                                            )}
                                        </div>
                                        <div className={styles.venueContent}>
                                            <h3 className={styles.venueName}>{venue.name}</h3>
                                            <p className={styles.venueAddress}>{venue.address}</p>

                                            <div className={styles.venueSports}>
                                                {(Array.from(new Set(venue.courts?.map(court =>
                                                    court.sport ? `${court.sport.icon} ${court.sport.name}` : null
                                                ).filter(Boolean))) as string[]).map((sportText, index) => (
                                                    <span key={index} className={styles.sportBadge}>
                                                        {sportText}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className={styles.venueInfo}>
                                                <span className={styles.priceRange}>
                                                    PKR {Math.min(...(venue.courts?.map(c => c.hourly_rate) || [0]))} - {Math.max(...(venue.courts?.map(c => c.hourly_rate) || [0]))}/hr
                                                </span>
                                                <span className={styles.courtCount}>
                                                    {venue.courts?.length || 0} courts
                                                </span>
                                            </div>

                                            <Link href={`/venues/${venue.id}`} className={styles.viewBtn}>
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </>
            )}

            {!venues.length && (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🏟️</span>
                    <h2>No Venues Available</h2>
                    <p>Check back later for new venues</p>
                </div>
            )}
        </div>
    )
}
