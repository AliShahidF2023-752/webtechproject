'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './ReportForm.module.css'

interface ReportFormProps {
    reportedUserId: string
    reportedUserName: string
    matchId?: string
    onCancel?: () => void
}

export default function ReportForm({
    reportedUserId,
    reportedUserName,
    matchId,
    onCancel
}: ReportFormProps) {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [reason, setReason] = useState('')
    const [details, setDetails] = useState('')
    const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])

    const reportReasons = [
        'Inappropriate behavior',
        'No-show without notice',
        'Cheating or unfair play',
        'Harassment or threats',
        'False rating/feedback',
        'Other'
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason) {
            setError('Please select a reason')
            return
        }

        setLoading(true)
        setError('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            const { error: reportError } = await supabase
                .from('reports')
                .insert({
                    reported_by: user.id,
                    reported_user: reportedUserId,
                    match_id: matchId || null,
                    reason: `${reason}${details ? `: ${details}` : ''}`,
                    evidence_urls: evidenceUrls,
                    status: 'pending'
                })

            if (reportError) throw reportError

            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to submit report')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className={styles.success}>
                <span className={styles.successIcon}>✅</span>
                <h3>Report Submitted</h3>
                <p>Thank you for your report. Our team will review it within 24-48 hours.</p>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h2>Report {reportedUserName}</h2>
            <p className={styles.subtitle}>Help us maintain a fair and respectful community</p>

            {error && (
                <div className={styles.error}>
                    <span>⚠️</span>
                    {error}
                </div>
            )}

            {/* Reason Selection */}
            <div className={styles.section}>
                <label className={styles.label}>Reason for Report *</label>
                <div className={styles.reasonGrid}>
                    {reportReasons.map(r => (
                        <button
                            key={r}
                            type="button"
                            className={`${styles.reasonBtn} ${reason === r ? styles.selected : ''}`}
                            onClick={() => setReason(r)}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Details */}
            <div className={styles.section}>
                <label className={styles.label}>Additional Details</label>
                <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Please provide specific details about the incident..."
                    className={styles.textarea}
                    rows={4}
                />
            </div>

            {/* Evidence Note */}
            <div className={styles.section}>
                <label className={styles.label}>Evidence (Optional)</label>
                <p className={styles.hint}>
                    If you have evidence (screenshots, etc.), please share via WhatsApp with our admin team.
                </p>
                <a
                    href="https://wa.me/923001234567?text=I%20want%20to%20submit%20evidence%20for%20a%20report"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.whatsappLink}
                >
                    📱 Share Evidence via WhatsApp
                </a>
            </div>

            <div className={styles.actions}>
                {onCancel && (
                    <button type="button" onClick={onCancel} className={styles.cancelBtn}>
                        Cancel
                    </button>
                )}
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Report'}
                </button>
            </div>
        </form>
    )
}
