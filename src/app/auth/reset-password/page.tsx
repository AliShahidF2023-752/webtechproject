'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from '../auth.module.css'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        // Check if we have a valid session from the reset link
        const checkSession = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/auth/forgot-password')
            }
        }
        checkSession()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                password: password,
            })

            if (error) {
                setError(error.message)
                return
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className={styles.authPage}>
                <div className={styles.authContainer} style={{ gridTemplateColumns: '1fr' }}>
                    <div className={styles.authCard}>
                        <div className={styles.authHeader}>
                            <Link href="/" className={styles.logo}>
                                <span className={styles.logoIcon}>🎯</span>
                                <span className={styles.logoText}>SportMatch</span>
                            </Link>
                            <div className={styles.successIcon}>✅</div>
                            <h1 className={styles.title}>Password Updated</h1>
                            <p className={styles.subtitle}>
                                Your password has been successfully updated. Redirecting...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.authContainer} style={{ gridTemplateColumns: '1fr' }}>
                <div className={styles.authCard}>
                    <div className={styles.authHeader}>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoIcon}>🎯</span>
                            <span className={styles.logoText}>SportMatch</span>
                        </Link>
                        <h1 className={styles.title}>Set New Password</h1>
                        <p className={styles.subtitle}>Create a new password for your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <div className={styles.error}>
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>New Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                minLength={6}
                                className={styles.input}
                            />
                            <span className={styles.hint}>Must be at least 6 characters</span>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                className={styles.input}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.submitBtn}
                        >
                            {loading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    Updating...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
