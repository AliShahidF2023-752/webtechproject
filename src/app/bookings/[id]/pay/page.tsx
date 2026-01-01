'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import styles from './pay.module.css'

interface Booking {
    id: string
    booking_date: string
    booking_time: string
    duration_minutes: number
    total_amount: number
    court: {
        name: string
        venue: { name: string } | null
        sport: { name: string; icon: string } | null
    } | null
}

interface BankAccount {
    id: string
    bank_name: string
    account_number: string
    account_title: string
    iban: string
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()

    const [bookingId, setBookingId] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [booking, setBooking] = useState<Booking | null>(null)
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

    const [selectedBank, setSelectedBank] = useState('')
    const [whatsappNumber, setWhatsappNumber] = useState('')
    const [screenshotUrl, setScreenshotUrl] = useState('')

    useEffect(() => {
        const loadData = async () => {
            const { id } = await params
            setBookingId(id)
            await loadBooking(id)
            await loadBankAccounts()
            setLoading(false)
        }
        loadData()
    }, [params])

    const loadBooking = async (id: string) => {
        const supabase = createClient()
        const { data } = await supabase
            .from('bookings')
            .select(`
        id, booking_date, booking_time, duration_minutes, total_amount,
        court:courts(
          name,
          venue:venues(name),
          sport:sports(name, icon)
        )
      `)
            .eq('id', id)
            .single()

        if (data) {
            // Transform Supabase's array format to expected format
            const courtData = Array.isArray(data.court) ? data.court[0] : data.court
            const transformed: Booking = {
                id: data.id,
                booking_date: data.booking_date,
                booking_time: data.booking_time,
                duration_minutes: data.duration_minutes,
                total_amount: data.total_amount,
                court: courtData ? {
                    name: courtData.name,
                    venue: Array.isArray(courtData.venue) ? courtData.venue[0] : courtData.venue,
                    sport: Array.isArray(courtData.sport) ? courtData.sport[0] : courtData.sport
                } : null
            }
            setBooking(transformed)
        }
    }

    const loadBankAccounts = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('is_active', true)

        if (data) {
            setBankAccounts(data)
            if (data.length > 0) {
                setSelectedBank(data[0].id)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBank || !whatsappNumber) {
            setError('Please fill in all required fields')
            return
        }

        setSubmitting(true)
        setError('')

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            // Create payment record
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    booking_id: bookingId,
                    amount: booking?.total_amount || 0,
                    payment_method: 'bank_transfer',
                    bank_account_id: selectedBank,
                    screenshot_url: screenshotUrl || null,
                    whatsapp_number: whatsappNumber,
                    status: 'submitted'
                })

            if (paymentError) throw paymentError

            // Update booking status
            await supabase
                .from('bookings')
                .update({ payment_status: 'submitted', advance_paid: booking?.total_amount })
                .eq('id', bookingId)

            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to submit payment')
        } finally {
            setSubmitting(false)
        }
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

    if (success) {
        return (
            <>
                <Navbar />
                <div className={styles.page}>
                    <div className={styles.successCard}>
                        <span className={styles.successIcon}>✅</span>
                        <h1>Payment Submitted!</h1>
                        <p>Your payment is being verified. We&apos;ll notify you once confirmed.</p>
                        <div className={styles.successActions}>
                            <button onClick={() => router.push('/bookings')} className={styles.viewBookingsBtn}>
                                View My Bookings
                            </button>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    const selectedBankDetails = bankAccounts.find(b => b.id === selectedBank)

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <h1>Complete Payment</h1>

                    {error && (
                        <div className={styles.error}>
                            <span>⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className={styles.paymentGrid}>
                        {/* Booking Summary */}
                        <div className={styles.summary}>
                            <h2>Booking Details</h2>
                            <div className={styles.summaryContent}>
                                <div className={styles.summaryRow}>
                                    <span>Sport</span>
                                    <span>{booking?.court?.sport?.icon} {booking?.court?.sport?.name}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Venue</span>
                                    <span>{booking?.court?.venue?.name}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Court</span>
                                    <span>{booking?.court?.name}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Date</span>
                                    <span>{booking?.booking_date}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Time</span>
                                    <span>{booking?.booking_time}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Duration</span>
                                    <span>{booking?.duration_minutes} min</span>
                                </div>
                            </div>
                            <div className={styles.totalRow}>
                                <span>Total Amount</span>
                                <span>PKR {booking?.total_amount}</span>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Bank Selection */}
                            <div className={styles.formGroup}>
                                <label>Select Bank Account</label>
                                <div className={styles.bankOptions}>
                                    {bankAccounts.map(bank => (
                                        <button
                                            key={bank.id}
                                            type="button"
                                            className={`${styles.bankOption} ${selectedBank === bank.id ? styles.selected : ''}`}
                                            onClick={() => setSelectedBank(bank.id)}
                                        >
                                            <span className={styles.bankName}>{bank.bank_name}</span>
                                            <span className={styles.bankTitle}>{bank.account_title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bank Details */}
                            {selectedBankDetails && (
                                <div className={styles.bankDetails}>
                                    <h3>Transfer to:</h3>
                                    <div className={styles.detailRow}>
                                        <span>Bank</span>
                                        <span>{selectedBankDetails.bank_name}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span>Account Title</span>
                                        <span>{selectedBankDetails.account_title}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span>Account Number</span>
                                        <span className={styles.copyable}>{selectedBankDetails.account_number}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span>IBAN</span>
                                        <span className={styles.copyable}>{selectedBankDetails.iban}</span>
                                    </div>
                                </div>
                            )}

                            {/* WhatsApp Number */}
                            <div className={styles.formGroup}>
                                <label>Your WhatsApp Number *</label>
                                <input
                                    type="tel"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                    placeholder="+92 300 1234567"
                                    required
                                />
                                <span className={styles.hint}>We&apos;ll contact you for verification</span>
                            </div>

                            {/* Screenshot URL (optional) */}
                            <div className={styles.formGroup}>
                                <label>Payment Screenshot URL (Optional)</label>
                                <input
                                    type="url"
                                    value={screenshotUrl}
                                    onChange={(e) => setScreenshotUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                                <span className={styles.hint}>Or share via WhatsApp after submission</span>
                            </div>

                            <button type="submit" disabled={submitting} className={styles.submitBtn}>
                                {submitting ? 'Submitting...' : '📤 Submit Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}
