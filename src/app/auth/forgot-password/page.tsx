'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from '../auth.module.css'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const supabase = createClient()

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            })

            if (error) {
                setError(error.message)
                return
            }

            setSuccess(true)
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
                            <div className={styles.successIcon}>📧</div>
                            <h1 className={styles.title}>Check Your Email</h1>
                            <p className={styles.subtitle}>
                                We&apos;ve sent a password reset link to <strong>{email}</strong>.
                            </p>
                        </div>

                        <div className={styles.authFooter}>
                            <p>
                                <Link href="/auth/login" className={styles.link}>
                                    Back to login
                                </Link>
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
                        <h1 className={styles.title}>Reset Password</h1>
                        <p className={styles.subtitle}>Enter your email to receive a reset link</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <div className={styles.error}>
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
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
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        <p>
                            Remember your password?{' '}
                            <Link href="/auth/login" className={styles.link}>
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
