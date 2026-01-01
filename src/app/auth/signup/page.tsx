'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from '../auth.module.css'

export default function SignupPage() {
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSignup = async (e: React.FormEvent) => {
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
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
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
                <div className={styles.authContainer}>
                    <div className={styles.authCard}>
                        <div className={styles.authHeader}>
                            <Link href="/" className={styles.logo}>
                                <span className={styles.logoIcon}>🎯</span>
                                <span className={styles.logoText}>SportMatch</span>
                            </Link>
                            <div className={styles.successIcon}>✉️</div>
                            <h1 className={styles.title}>Check Your Email</h1>
                            <p className={styles.subtitle}>
                                We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                                Click the link in the email to activate your account.
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
            <div className={styles.authContainer}>
                <div className={styles.authCard}>
                    <div className={styles.authHeader}>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoIcon}>🎯</span>
                            <span className={styles.logoText}>SportMatch</span>
                        </Link>
                        <h1 className={styles.title}>Create Account</h1>
                        <p className={styles.subtitle}>Start finding your perfect match</p>
                    </div>

                    <form onSubmit={handleSignup} className={styles.form}>
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

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
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
                                placeholder="Confirm your password"
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
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>

                        <p className={styles.terms}>
                            By signing up, you agree to our{' '}
                            <Link href="/terms">Terms of Service</Link> and{' '}
                            <Link href="/privacy">Privacy Policy</Link>
                        </p>
                    </form>

                    <div className={styles.authFooter}>
                        <p>
                            Already have an account?{' '}
                            <Link href="/auth/login" className={styles.link}>
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                <div className={styles.decorative}>
                    <div className={styles.decorativeContent}>
                        <h2>Join the Community</h2>
                        <p>Create your profile, set your skill level, and get matched with players of similar ability.</p>
                        <ul className={styles.features}>
                            <li>🏓 Table Tennis & Badminton</li>
                            <li>📊 ELO Rating System</li>
                            <li>🗺️ Find Nearby Venues</li>
                            <li>💬 In-App Chat</li>
                            <li>⭐ Rate & Review Players</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
