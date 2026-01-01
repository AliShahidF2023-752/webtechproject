import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import styles from '../admin.module.css'

export default async function AdminPaymentsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'admin') {
        redirect('/dashboard')
    }

    const { data: payments } = await supabase
        .from('payments')
        .select(`
      *,
      booking:bookings(
        booking_date,
        booking_time,
        total_amount,
        court:courts(name, venue:venues(name)),
        user:users(email, player_profiles(name))
      ),
      bank_account:bank_accounts(bank_name, account_title)
    `)
        .order('created_at', { ascending: false })

    const pendingPayments = payments?.filter((p: { status: string }) => p.status === 'submitted') || []
    const processedPayments = payments?.filter((p: { status: string }) => p.status !== 'pending' && p.status !== 'submitted') || []

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Payment Verification</h1>
                        <p>Verify bank transfer payments</p>
                    </div>

                    {/* Pending Payments */}
                    <section className={styles.section}>
                        <h2>Pending Verification ({pendingPayments.length})</h2>
                        {pendingPayments.length > 0 ? (
                            <div className={styles.paymentsList}>
                                {pendingPayments.map((payment: { id: string; amount: number; screenshot_url: string | null; whatsapp_number: string | null; created_at: string; booking: { booking_date: string; court: { name: string; venue: { name: string } } | null; user: { email: string; player_profiles: { name: string }[] } | null } | null; bank_account: { bank_name: string; account_title: string } | null }) => (
                                    <div key={payment.id} className={styles.paymentCard}>
                                        <div className={styles.paymentHeader}>
                                            <span className={styles.paymentAmount}>PKR {payment.amount}</span>
                                            <span className={styles.paymentDate}>
                                                {new Date(payment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className={styles.paymentDetails}>
                                            <div className={styles.paymentRow}>
                                                <span className={styles.label}>Player:</span>
                                                <span>{payment.booking?.user?.player_profiles?.[0]?.name || payment.booking?.user?.email}</span>
                                            </div>
                                            <div className={styles.paymentRow}>
                                                <span className={styles.label}>Venue:</span>
                                                <span>{payment.booking?.court?.venue?.name}</span>
                                            </div>
                                            <div className={styles.paymentRow}>
                                                <span className={styles.label}>Court:</span>
                                                <span>{payment.booking?.court?.name}</span>
                                            </div>
                                            <div className={styles.paymentRow}>
                                                <span className={styles.label}>Date:</span>
                                                <span>{payment.booking?.booking_date}</span>
                                            </div>
                                            <div className={styles.paymentRow}>
                                                <span className={styles.label}>Bank:</span>
                                                <span>{payment.bank_account?.bank_name} - {payment.bank_account?.account_title}</span>
                                            </div>
                                            {payment.whatsapp_number && (
                                                <div className={styles.paymentRow}>
                                                    <span className={styles.label}>WhatsApp:</span>
                                                    <a
                                                        href={`https://wa.me/${payment.whatsapp_number}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.whatsappLink}
                                                    >
                                                        {payment.whatsapp_number}
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {payment.screenshot_url && (
                                            <div className={styles.screenshotPreview}>
                                                <a href={payment.screenshot_url} target="_blank" rel="noopener noreferrer">
                                                    View Screenshot
                                                </a>
                                            </div>
                                        )}

                                        <div className={styles.paymentActions}>
                                            <form action={`/api/admin/payments/${payment.id}/verify`} method="POST">
                                                <input type="hidden" name="action" value="verify" />
                                                <button type="submit" className={styles.verifyBtn}>✓ Verify</button>
                                            </form>
                                            <form action={`/api/admin/payments/${payment.id}/verify`} method="POST">
                                                <input type="hidden" name="action" value="reject" />
                                                <button type="submit" className={styles.rejectBtn}>✗ Reject</button>
                                            </form>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span>✅</span>
                                <p>No pending payments to verify</p>
                            </div>
                        )}
                    </section>

                    {/* Processed Payments */}
                    <section className={styles.section}>
                        <h2>Payment History</h2>
                        {processedPayments.length > 0 ? (
                            <div className={styles.historyTable}>
                                <div className={styles.tableHeader}>
                                    <span>Date</span>
                                    <span>Player</span>
                                    <span>Amount</span>
                                    <span>Status</span>
                                </div>
                                {processedPayments.slice(0, 20).map((payment: { id: string; amount: number; status: string; created_at: string; booking: { user: { player_profiles: { name: string }[] } | null } | null }) => (
                                    <div key={payment.id} className={styles.tableRow}>
                                        <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                                        <span>{payment.booking?.user?.player_profiles?.[0]?.name || 'Unknown'}</span>
                                        <span>PKR {payment.amount}</span>
                                        <span className={`${styles.statusBadge} ${styles[payment.status]}`}>
                                            {payment.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span>📋</span>
                                <p>No payment history</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    )
}
