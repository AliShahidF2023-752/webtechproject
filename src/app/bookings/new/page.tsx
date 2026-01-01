'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import styles from './new-booking.module.css'

interface Court {
    id: string
    name: string
    hourly_rate: number
    capacity: number
    sport: { name: string; icon: string } | null
    venue: {
        id: string
        name: string
        city: string
    } | null
}

function NewBookingForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [court, setCourt] = useState<Court | null>(null)

    // Form state
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
    const [bookingTime, setBookingTime] = useState('17:00')
    const [duration, setDuration] = useState(60)

    const courtId = searchParams.get('court')

    useEffect(() => {
        if (courtId) {
            loadCourt(courtId)
        }
    }, [courtId])

    const loadCourt = async (id: string) => {
        const supabase = createClient()
        const { data } = await supabase
            .from('courts')
            .select(`
        id, name, hourly_rate, capacity,
        sport:sports(name, icon),
        venue:venues(id, name, city)
      `)
            .eq('id', id)
            .single()

        if (data) {
            // Transform Supabase's array format to expected format
            const transformed: Court = {
                id: data.id,
                name: data.name,
                hourly_rate: data.hourly_rate,
                capacity: data.capacity,
                sport: Array.isArray(data.sport) ? data.sport[0] : data.sport,
                venue: Array.isArray(data.venue) ? data.venue[0] : data.venue
            }
            setCourt(transformed)
        }
    }

    const totalAmount = court ? (court.hourly_rate * duration / 60) : 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!court) {
            setError('Please select a court')
            return
        }

        setLoading(true)
        setError('')

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            // Create booking
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    court_id: court.id,
                    user_id: user.id,
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    duration_minutes: duration,
                    total_amount: totalAmount,
                    commission_amount: Math.round(totalAmount * 0.1),
                    payment_status: 'pending'
                })
                .select()
                .single()

            if (bookingError) throw bookingError

            // Redirect to payment page
            router.push(`/bookings/${booking.id}/pay`)
        } catch (err: any) {
            setError(err.message || 'Failed to create booking')
        } finally {
            setLoading(false)
        }
    }

    const timeSlots = Array.from({ length: 15 }, (_, i) => {
        const hour = i + 8
        return `${hour.toString().padStart(2, '0')}:00`
    })

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <h1>New Booking</h1>

                    {error && (
                        <div className={styles.error}>
                            <span>⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className={styles.bookingGrid}>
                        {/* Form */}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Court Selection */}
                            {court ? (
                                <div className={styles.selectedCourt}>
                                    <div className={styles.courtInfo}>
                                        <span className={styles.sportBadge}>
                                            {court.sport?.icon} {court.sport?.name}
                                        </span>
                                        <h3>{court.name}</h3>
                                        <p>{court.venue?.name} • {court.venue?.city}</p>
                                    </div>
                                    <div className={styles.courtRate}>
                                        PKR {court.hourly_rate}/hr
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.noCourtSelected}>
                                    <p>No court selected</p>
                                    <button type="button" onClick={() => router.push('/venues')} className={styles.selectCourtBtn}>
                                        Select a Court
                                    </button>
                                </div>
                            )}

                            {/* Date */}
                            <div className={styles.formGroup}>
                                <label>Booking Date *</label>
                                <input
                                    type="date"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            {/* Time */}
                            <div className={styles.formGroup}>
                                <label>Start Time *</label>
                                <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}>
                                    {timeSlots.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Duration */}
                            <div className={styles.formGroup}>
                                <label>Duration</label>
                                <div className={styles.durationButtons}>
                                    {[30, 60, 90, 120].map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            className={`${styles.durationBtn} ${duration === d ? styles.selected : ''}`}
                                            onClick={() => setDuration(d)}
                                        >
                                            {d} min
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !court}
                                className={styles.submitBtn}
                            >
                                {loading ? 'Creating...' : 'Continue to Payment'}
                            </button>
                        </form>

                        {/* Summary */}
                        <div className={styles.summary}>
                            <h2>Booking Summary</h2>

                            <div className={styles.summaryRow}>
                                <span>Court</span>
                                <span>{court?.name || '-'}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Date</span>
                                <span>{bookingDate}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Time</span>
                                <span>{bookingTime}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Duration</span>
                                <span>{duration} minutes</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Rate</span>
                                <span>PKR {court?.hourly_rate || 0}/hr</span>
                            </div>

                            <div className={styles.summaryTotal}>
                                <span>Total</span>
                                <span>PKR {totalAmount}</span>
                            </div>

                            <p className={styles.paymentNote}>
                                💳 Payment via bank transfer. You&apos;ll upload a screenshot after booking.
                            </p>
                        </div>
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
                    <p>Loading...</p>
                </div>
            </div>
        </>
    )
}

export default function NewBookingPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <NewBookingForm />
        </Suspense>
    )
}
