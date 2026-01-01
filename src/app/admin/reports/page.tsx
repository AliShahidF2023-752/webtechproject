import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import styles from '../admin.module.css'

export default async function AdminReportsPage() {
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

    const { data: reports } = await supabase
        .from('reports')
        .select(`
      *,
      reporter:users!reported_by(email, player_profiles(name)),
      reported:users!reported_user(email, player_profiles(name))
    `)
        .order('created_at', { ascending: false })

    const pendingReports = reports?.filter((r: { status: string }) => r.status === 'pending') || []
    const resolvedReports = reports?.filter((r: { status: string }) => r.status !== 'pending') || []

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Reports Management</h1>
                        <p>Review and manage player reports</p>
                    </div>

                    {/* Pending Reports */}
                    <section className={styles.section}>
                        <h2>Pending Reports ({pendingReports.length})</h2>
                        {pendingReports.length > 0 ? (
                            <div className={styles.reportsList}>
                                {pendingReports.map((report: { id: string; reason: string; created_at: string; reporter: { email: string; player_profiles: { name: string }[] }; reported: { email: string; player_profiles: { name: string }[] } }) => (
                                    <div key={report.id} className={styles.reportCard}>
                                        <div className={styles.reportHeader}>
                                            <span className={styles.reportBadge}>⚠️ Pending</span>
                                            <span className={styles.reportDate}>
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className={styles.reportContent}>
                                            <div className={styles.reportUsers}>
                                                <div>
                                                    <span className={styles.label}>Reporter:</span>
                                                    <span>{report.reporter?.player_profiles?.[0]?.name || report.reporter?.email}</span>
                                                </div>
                                                <div>
                                                    <span className={styles.label}>Reported:</span>
                                                    <span>{report.reported?.player_profiles?.[0]?.name || report.reported?.email}</span>
                                                </div>
                                            </div>
                                            <p className={styles.reportReason}>{report.reason}</p>
                                        </div>
                                        <div className={styles.reportActions}>
                                            <form action={`/api/admin/reports/${report.id}/resolve`} method="POST">
                                                <input type="hidden" name="action" value="warn" />
                                                <button type="submit" className={styles.warnBtn}>⚠️ Warn</button>
                                            </form>
                                            <form action={`/api/admin/reports/${report.id}/resolve`} method="POST">
                                                <input type="hidden" name="action" value="ban" />
                                                <button type="submit" className={styles.banBtn}>🚫 Ban</button>
                                            </form>
                                            <form action={`/api/admin/reports/${report.id}/resolve`} method="POST">
                                                <input type="hidden" name="action" value="dismiss" />
                                                <button type="submit" className={styles.dismissBtn}>✓ Dismiss</button>
                                            </form>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span>✅</span>
                                <p>No pending reports</p>
                            </div>
                        )}
                    </section>

                    {/* Resolved Reports */}
                    <section className={styles.section}>
                        <h2>Resolved Reports</h2>
                        {resolvedReports.length > 0 ? (
                            <div className={styles.historyTable}>
                                <div className={styles.tableHeader}>
                                    <span>Date</span>
                                    <span>Reporter</span>
                                    <span>Reported</span>
                                    <span>Status</span>
                                </div>
                                {resolvedReports.slice(0, 20).map((report: { id: string; created_at: string; status: string; reporter: { player_profiles: { name: string }[] }; reported: { player_profiles: { name: string }[] } }) => (
                                    <div key={report.id} className={styles.tableRow}>
                                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                        <span>{report.reporter?.player_profiles?.[0]?.name || 'Unknown'}</span>
                                        <span>{report.reported?.player_profiles?.[0]?.name || 'Unknown'}</span>
                                        <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                                            {report.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span>📋</span>
                                <p>No resolved reports</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    )
}
