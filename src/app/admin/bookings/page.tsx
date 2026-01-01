'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import styles from '../admin.module.css'

interface Booking {
    id: string
    booking_date: string
    booking_time: string
    duration_minutes: number
    total_amount: number
    payment_status: string
    created_at: string
    court: {
        name: string
        venue: { name: string; city: string }
    } | null
    user: {
        email: string
        player_profiles: { name: string }[]
    } | null
}

export default function AdminBookingsPage() {
    const router = useRouter()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        loadBookings()
    }, [])

    const loadBookings = async () => {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login')
            return
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'admin') {
            router.push('/dashboard')
            return
        }

        const { data } = await supabase
            .from('bookings')
            .select(`
                *,
                court:courts(name, venue:venues(name, city)),
                user:users(email, player_profiles(name))
            `)
            .order('created_at', { ascending: false })

        if (data) {
            setBookings(data as Booking[])
        }
        setLoading(false)
    }

    const updateBookingStatus = async (bookingId: string, newStatus: string) => {
        setUpdating(bookingId)
        const supabase = createClient()

        const { error } = await supabase
            .from('bookings')
            .update({ payment_status: newStatus })
            .eq('id', bookingId)

        if (!error) {
            setBookings(bookings.map(b =>
                b.id === bookingId ? { ...b, payment_status: newStatus } : b
            ))
        }
        setUpdating(null)
    }

    const filteredBookings = filter === 'all'
        ? bookings
        : bookings.filter(b => b.payment_status === filter)

    const statusCounts = {
        all: bookings.length,
        pending: bookings.filter(b => b.payment_status === 'pending').length,
        submitted: bookings.filter(b => b.payment_status === 'submitted').length,
        verified: bookings.filter(b => b.payment_status === 'verified').length,
        rejected: bookings.filter(b => b.payment_status === 'rejected').length,
    }

    if (loading) {
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

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Booking Management</h1>
                        <p>View and manage all court bookings</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className={styles.filterTabs}>
                        {(['all', 'pending', 'submitted', 'verified', 'rejected'] as const).map(status => (
                            <button
                                key={status}
                                className={`${styles.filterTab} ${filter === status ? styles.active : ''}`}
                                onClick={() => setFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
                            </button>
                        ))}
                    </div>

                    {/* Bookings List */}
                    <section className={styles.section}>
                        {filteredBookings.length > 0 ? (
                            <div className={styles.historyTable}>
                                <div className={styles.tableHeader}>
                                    <span>Date</span>
                                    <span>Player</span>
                                    <span>Venue / Court</span>
                                    <span>Amount</span>
                                    <span>Status</span>
                                    <span>Actions</span>
                                </div>
                                {filteredBookings.map(booking => (
                                    <div key={booking.id} className={styles.tableRow}>
                                        <span>
                                            {booking.booking_date}<br />
                                            <small>{booking.booking_time}</small>
                                        </span>
                                        <span>
                                            {booking.user?.player_profiles?.[0]?.name || booking.user?.email || 'Unknown'}
                                        </span>
                                        <span>
                                            {booking.court?.venue?.name || 'N/A'}<br />
                                            <small>{booking.court?.name}</small>
                                        </span>
                                        <span>PKR {booking.total_amount}</span>
                                        <span>
                                            <span className={`${styles.statusBadge} ${styles[booking.payment_status]}`}>
                                                {booking.payment_status}
                                            </span>
                                        </span>
                                        <span className={styles.actionButtons}>
                                            {booking.payment_status === 'pending' && (
                                                <button
                                                    className={styles.smallBtn}
                                                    onClick={() => updateBookingStatus(booking.id, 'verified')}
                                                    disabled={updating === booking.id}
                                                >
                                                    ✓ Confirm
                                                </button>
                                            )}
                                            {booking.payment_status === 'submitted' && (
                                                <>
                                                    <button
                                                        className={styles.verifyBtn}
                                                        onClick={() => updateBookingStatus(booking.id, 'verified')}
                                                        disabled={updating === booking.id}
                                                    >
                                                        ✓ Verify
                                                    </button>
                                                    <button
                                                        className={styles.rejectBtn}
                                                        onClick={() => updateBookingStatus(booking.id, 'rejected')}
                                                        disabled={updating === booking.id}
                                                    >
                                                        ✗ Reject
                                                    </button>
                                                </>
                                            )}
                                            {booking.payment_status === 'verified' && (
                                                <span className={styles.confirmedText}>✓ Confirmed</span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span>📋</span>
                                <p>No bookings found</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    )
}
