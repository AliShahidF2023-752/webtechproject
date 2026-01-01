'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import styles from './matchmaking.module.css'
import { useMatchmaking } from '@/context/MatchmakingContext'

// Dynamically import map component to prevent SSR issues
const MapComponent = dynamic(() => import('@/components/maps/MapView'), {
    ssr: false,
    loading: () => <div className={styles.mapLoading}>Loading map...</div>
})

interface Sport {
    id: string
    name: string
    icon: string
}

interface Venue {
    id: string
    name: string
    address: string
    city: string
    location_lat: number
    location_lng: number
}

interface QueueEntry {
    id: string
    user_id: string
    sport_id: string
    venue_id: string | null
    status: string
    match_id?: string
    user?: {
        name: string
        elo_rating: number
    }
}

// Main content component that uses searchParams
function MatchmakingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Use global matchmaking context
    const {
        inQueue,
        queueData,
        matchFound,
        matchData,
        joinQueue,
        leaveQueue,
        declineMatch,
        loading: contextLoading,
        error: contextError
    } = useMatchmaking()

    const [sports, setSports] = useState<Sport[]>([])
    const [venues, setVenues] = useState<Venue[]>([])
    const [localError, setLocalError] = useState('')

    // User location
    const [userLocation, setUserLocation] = useState<[number, number]>([31.5204, 74.3587]) // Default: Lahore
    const [radius, setRadius] = useState(10) // km

    // Form data
    const [selectedSport, setSelectedSport] = useState('')
    const [selectedVenue, setSelectedVenue] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedTime, setSelectedTime] = useState('17:00')
    const [genderPreference, setGenderPreference] = useState<'any' | 'male' | 'female'>('any')
    const [ratingTolerance, setRatingTolerance] = useState(200)

    useEffect(() => {
        loadSports()
        loadVenues()
        getUserLocation()

        // Check URL params for pre-selected sport
        const sportParam = searchParams.get('sport')
        if (sportParam) {
            // Handle sport name from URL logic if needed
        }
    }, [searchParams])

    // Sync form with queue data if returning to page
    useEffect(() => {
        if (inQueue && queueData) {
            if (queueData.sport_id) setSelectedSport(queueData.sport_id)
            if (queueData.venue_id) setSelectedVenue(queueData.venue_id)
            if (queueData.preferred_date) setSelectedDate(queueData.preferred_date)
            if (queueData.preferred_time) setSelectedTime(queueData.preferred_time)
        }
    }, [inQueue, queueData])

    const loadSports = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('sports')
            .select('id, name, icon')
            .eq('is_active', true)
        if (data) setSports(data)
    }

    const loadVenues = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('venues')
            .select('id, name, address, city, location_lat, location_lng')
            .eq('is_active', true)
        if (data) setVenues(data)
    }

    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude])
                },
                (error) => {
                    console.log('Geolocation error:', error)
                }
            )
        }
    }

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Filter venues by radius
    const filteredVenues = venues.filter(venue => {
        const distance = calculateDistance(
            userLocation[0], userLocation[1],
            venue.location_lat, venue.location_lng
        )
        return distance <= radius
    })

    const handleJoinQueue = async () => {
        if (!selectedSport) {
            setLocalError('Please select a sport')
            return
        }
        setLocalError('')

        await joinQueue({
            sportId: selectedSport,
            venueId: selectedVenue || null,
            date: selectedDate,
            time: selectedTime,
            ratingTolerance,
            genderPreference,
            lat: userLocation[0],
            lng: userLocation[1],
            radiusKm: radius
        })
    }

    // Auto-redirect when match is found
    useEffect(() => {
        if (matchFound) {
            const matchId = matchData?.id || matchData?.match_id || queueData?.match_id
            if (matchId) {
                router.push(`/bookings/new?match=${matchId}`)
            }
        }
    }, [matchFound, matchData, queueData, router])

    if (matchFound) {
        return (
            <>
                <Navbar />
                <div className={styles.page}>
                    <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</div>
                        <h1>Match Found!</h1>
                        <p>Redirecting you to the booking page...</p>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.sidebar}>
                        <h1>Find a Match</h1>
                        <p className={styles.subtitle}>Set your preferences and find nearby players</p>

                        {(localError || contextError) && (
                            <div className={styles.error}>
                                <span>⚠️</span>
                                {localError || contextError}
                            </div>
                        )}

                        {!inQueue ? (
                            <div className={styles.form}>
                                {/* Sport Selection */}
                                <div className={styles.formGroup}>
                                    <label>Sport *</label>
                                    <div className={styles.sportOptions}>
                                        {sports.map(sport => (
                                            <button
                                                key={sport.id}
                                                type="button"
                                                className={`${styles.sportOption} ${selectedSport === sport.id ? styles.sportOptionSelected : ''}`}
                                                onClick={() => setSelectedSport(sport.id)}
                                            >
                                                <span className={styles.sportIcon}>{sport.icon}</span>
                                                <span>{sport.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Date</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Time</label>
                                        <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
                                            {Array.from({ length: 15 }, (_, i) => i + 8).map(hour => (
                                                <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                                                    {hour.toString().padStart(2, '0')}:00
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Venue Selection */}
                                <div className={styles.formGroup}>
                                    <label>Preferred Venue (Optional)</label>
                                    <select
                                        value={selectedVenue}
                                        onChange={(e) => setSelectedVenue(e.target.value)}
                                    >
                                        <option value="">Any venue in radius</option>
                                        {filteredVenues.map(venue => (
                                            <option key={venue.id} value={venue.id}>
                                                {venue.name} - {venue.city}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Radius Slider */}
                                <div className={styles.formGroup}>
                                    <label>Search Radius: {radius} km</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={radius}
                                        onChange={(e) => setRadius(parseInt(e.target.value))}
                                        className={styles.rangeSlider}
                                    />
                                </div>

                                {/* Gender Preference */}
                                <div className={styles.formGroup}>
                                    <label>Opponent Gender Preference</label>
                                    <select
                                        value={genderPreference}
                                        onChange={(e) => setGenderPreference(e.target.value as any)}
                                    >
                                        <option value="any">Any</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>

                                {/* Rating Tolerance */}
                                <div className={styles.formGroup}>
                                    <label>Rating Tolerance: ±{ratingTolerance}</label>
                                    <input
                                        type="range"
                                        min="50"
                                        max="500"
                                        step="50"
                                        value={ratingTolerance}
                                        onChange={(e) => setRatingTolerance(parseInt(e.target.value))}
                                        className={styles.rangeSlider}
                                    />
                                </div>

                                <button
                                    onClick={handleJoinQueue}
                                    disabled={contextLoading || !selectedSport}
                                    className={styles.findBtn}
                                >
                                    {contextLoading ? 'Joining...' : '🎯 Find Match'}
                                </button>
                            </div>
                        ) : (
                            <div className={styles.queueStatus}>
                                <div className={styles.queueAnimation}>
                                    <div className={styles.pulse}></div>
                                    <span>🔍</span>
                                </div>
                                <h2>Looking for players...</h2>
                                <p>We&apos;re searching for players matching your criteria</p>

                                <div className={styles.queueInfo}>
                                    <span>Sport: {sports.find(s => s.id === selectedSport)?.name || queueData?.sport?.name}</span>
                                    <span>Date: {selectedDate}</span>
                                    <span>Time: {selectedTime}</span>
                                </div>

                                <button onClick={leaveQueue} className={styles.cancelBtn} disabled={contextLoading}>
                                    Cancel Search
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles.mapContainer}>
                        <MapComponent
                            center={userLocation}
                            zoom={12}
                            venues={filteredVenues}
                            radius={radius}
                            selectedVenue={selectedVenue}
                            onVenueSelect={(id) => setSelectedVenue(id)}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

function LoadingState() {
    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.mapLoading}>Loading...</div>
                </div>
            </div>
        </>
    )
}

export default function MatchmakingPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <MatchmakingContent />
        </Suspense>
    )
}
