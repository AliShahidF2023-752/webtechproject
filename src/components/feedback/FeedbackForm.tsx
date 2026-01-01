'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './FeedbackForm.module.css'

interface FeedbackFormProps {
    matchId: string
    opponentId: string
    opponentName: string
    onComplete?: () => void
}

export default function FeedbackForm({
    matchId,
    opponentId,
    opponentName,
    onComplete
}: FeedbackFormProps) {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Match result
    const [didWin, setDidWin] = useState<boolean | null>(null)

    // Behavior ratings (1-5)
    const [tone, setTone] = useState(3)
    const [aggressiveness, setAggressiveness] = useState(3)
    const [sportsmanship, setSportsmanship] = useState(3)

    // Optional comment
    const [comment, setComment] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (didWin === null) {
            setError('Please select the match result')
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

            // Submit feedback
            const { error: feedbackError } = await supabase
                .from('match_feedback')
                .insert({
                    match_id: matchId,
                    from_user_id: user.id,
                    to_user_id: opponentId,
                    tone_rating: tone,
                    aggressiveness_rating: aggressiveness,
                    sportsmanship_rating: sportsmanship,
                    comment: comment || null,
                    reported_winner: didWin ? user.id : opponentId
                })

            if (feedbackError) throw feedbackError

            // Update match result
            await supabase
                .from('matches')
                .update({
                    status: 'completed',
                    winner_id: didWin ? user.id : opponentId
                })
                .eq('id', matchId)

            // Trigger ELO recalculation (via database function or edge function)
            await supabase.rpc('update_elo_after_match', {
                p_match_id: matchId,
                p_winner_id: didWin ? user.id : opponentId
            })

            onComplete?.()
            router.push('/matches')
        } catch (err: any) {
            setError(err.message || 'Failed to submit feedback')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h2>Rate Your Match with {opponentName}</h2>

            {error && (
                <div className={styles.error}>
                    <span>⚠️</span>
                    {error}
                </div>
            )}

            {/* Match Result */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}>Match Result *</label>
                <div className={styles.resultButtons}>
                    <button
                        type="button"
                        className={`${styles.resultBtn} ${didWin === true ? styles.selected : ''}`}
                        onClick={() => setDidWin(true)}
                    >
                        🏆 I Won
                    </button>
                    <button
                        type="button"
                        className={`${styles.resultBtn} ${didWin === false ? styles.selected : ''}`}
                        onClick={() => setDidWin(false)}
                    >
                        😔 I Lost
                    </button>
                </div>
            </div>

            {/* Behavior Ratings */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}>Rate {opponentName}&apos;s Behavior</label>

                <div className={styles.rating}>
                    <span className={styles.ratingLabel}>Tone (Communication)</span>
                    <div className={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                className={`${styles.star} ${tone >= star ? styles.filled : ''}`}
                                onClick={() => setTone(star)}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.rating}>
                    <span className={styles.ratingLabel}>Aggressiveness (Play Style)</span>
                    <div className={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                className={`${styles.star} ${aggressiveness >= star ? styles.filled : ''}`}
                                onClick={() => setAggressiveness(star)}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.rating}>
                    <span className={styles.ratingLabel}>Sportsmanship</span>
                    <div className={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                className={`${styles.star} ${sportsmanship >= star ? styles.filled : ''}`}
                                onClick={() => setSportsmanship(star)}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Comment */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}>Additional Comments (Optional)</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    className={styles.textarea}
                    rows={3}
                />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
        </form>
    )
}
