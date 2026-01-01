'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import styles from './invoice.module.css'

interface InvoiceData {
    id: string
    booking_date: string
    booking_time: string
    duration_minutes: number
    total_amount: number
    court: {
        name: string
        venue: {
            name: string
            address: string
            city: string
        }
    }
    user: {
        email: string
        user_metadata: {
            name: string
        }
    }
    created_at: string
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [booking, setBooking] = useState<InvoiceData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            const resolvedParams = await params
            const supabase = createClient()

            // Get booking details
            const { data: bookingData, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    booking_date,
                    booking_time,
                    duration_minutes,
                    total_amount,
                    created_at,
                    court:courts(
                        name,
                        venue:venues(name, address, city)
                    )
                `)
                .eq('id', resolvedParams.id)
                .single()

            if (error || !bookingData) {
                router.push('/bookings')
                return
            }

            // Get user details
            const { data: { user } } = await supabase.auth.getUser()

            // Transform nested data
            const courtData = Array.isArray(bookingData.court) ? bookingData.court[0] : bookingData.court
            const venueData = Array.isArray(courtData.venue) ? courtData.venue[0] : courtData.venue

            setBooking({
                ...bookingData,
                court: {
                    ...courtData,
                    venue: venueData
                },
                user: user as any
            })
            setLoading(false)
        }

        loadData()
    }, [params, router])

    if (loading) return <div>Loading invoice...</div>

    if (!booking) return null

    return (
        <div className={styles.page}>
            <div className={styles.actions}>
                <button onClick={() => window.print()} className={styles.printBtn}>
                    🖨️ Print Invoice
                </button>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    Back
                </button>
            </div>

            <div className={styles.invoice} id="invoice">
                <div className={styles.header}>
                    <div className={styles.brand}>
                        <h1>SportMatch</h1>
                        <p>Invoice #INV-{booking.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className={styles.meta}>
                        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                        <p><strong>Status:</strong> Paid via Bank Transfer</p>
                    </div>
                </div>

                <div className={styles.parties}>
                    <div className={styles.billTo}>
                        <h3>Bill To:</h3>
                        <p>{booking.user.user_metadata?.name || booking.user.email}</p>
                        <p>{booking.user.email}</p>
                    </div>
                    <div className={styles.billFrom}>
                        <h3>Venue:</h3>
                        <p>{booking.court.venue.name}</p>
                        <p>{booking.court.venue.address}</p>
                        <p>{booking.court.venue.city}</p>
                    </div>
                </div>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Duration</th>
                            <th className={styles.amount}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Court Booking - {booking.court.name}</td>
                            <td>{booking.booking_date}</td>
                            <td>{booking.booking_time}</td>
                            <td>{booking.duration_minutes} min</td>
                            <td className={styles.amount}>PKR {booking.total_amount}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={4} className={styles.totalLabel}>Total</td>
                            <td className={styles.totalAmount}>PKR {booking.total_amount}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className={styles.footer}>
                    <p>Thank you for booking with SportMatch!</p>
                    <p className={styles.small}>This is a computer generated invoice.</p>
                </div>
            </div>
        </div>
    )
}
