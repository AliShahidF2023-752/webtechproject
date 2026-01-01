'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from '../auth.module.css'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect') || '/dashboard'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const supabase = createClient()

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
                return
            }

            router.push(redirect)
            router.refresh()
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
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
                        <h1 className={styles.title}>Welcome Back</h1>
                        <p className={styles.subtitle}>Sign in to find your next match</p>
                    </div>

                    <form onSubmit={handleLogin} className={styles.form}>
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
                                placeholder="Enter your password"
                                required
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formOptions}>
                            <Link href="/auth/forgot-password" className={styles.forgotLink}>
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.submitBtn}
                        >
                            {loading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        <p>
                            Don&apos;t have an account?{' '}
                            <Link href="/auth/signup" className={styles.link}>
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>

                <div className={styles.decorative}>
                    <div className={styles.decorativeContent}>
                        <h2>Find Your Perfect Match</h2>
                        <p>Join thousands of players finding skill-matched opponents for Table Tennis and Badminton across Pakistan.</p>
                        <div className={styles.stats}>
                            <div className={styles.stat}>
                                <span className={styles.statNumber}>1000+</span>
                                <span className={styles.statLabel}>Active Players</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statNumber}>50+</span>
                                <span className={styles.statLabel}>Venues</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statNumber}>2</span>
                                <span className={styles.statLabel}>Sports</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function LoginLoading() {
    return (
        <div className={styles.authPage}>
            <div className={styles.authContainer} style={{ gridTemplateColumns: '1fr' }}>
                <div className={styles.authCard}>
                    <div className={styles.authHeader}>
                        <div className={styles.logo}>
                            <span className={styles.logoIcon}>🎯</span>
                            <span className={styles.logoText}>SportMatch</span>
                        </div>
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    )
}
