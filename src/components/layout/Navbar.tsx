'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import styles from './Navbar.module.css'
import { useMatchmaking } from '@/context/MatchmakingContext'

export default function Navbar() {
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<string>('player')
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { inQueue, matchFound } = useMatchmaking()

    useEffect(() => {
        const supabase = createClient()
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single()
                if (data) setRole(data.role)
            }
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const publicLinks = [
        { href: '/', label: 'Home' },
        { href: '/sports', label: 'Sports' },
        { href: '/venues', label: 'Venues' },
    ]

    const playerLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/matchmaking', label: 'Find Match' },
        { href: '/matches', label: 'My Matches' },
        { href: '/bookings', label: 'Bookings' },
    ]

    const adminLinks = [
        { href: '/admin', label: 'Admin Panel' },
    ]

    const vendorLinks = [
        { href: '/vendor', label: 'Vendor Dashboard' },
    ]

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>🎯</span>
                    <span className={styles.logoText}>SportMatch</span>
                </Link>

                <button
                    className={styles.menuToggle}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span className={styles.hamburger}></span>
                </button>

                <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
                    {publicLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {user && (
                        <>
                            {playerLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {role === 'vendor' && vendorLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`${styles.navLink} ${pathname.startsWith(link.href) ? styles.navLinkActive : ''}`}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {role === 'admin' && adminLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`${styles.navLink} ${pathname.startsWith(link.href) ? styles.navLinkActive : ''}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </>
                    )}
                </div>

                <div className={styles.navActions}>
                    {user ? (
                        <div className={styles.userMenu}>
                            {inQueue && pathname !== '/matchmaking' && (
                                <Link href="/matchmaking" className={styles.searchingBadge}>
                                    <span className={styles.pulseDot}></span>
                                    <span>Searching...</span>
                                </Link>
                            )}
                            {matchFound && pathname !== '/matchmaking' && (
                                <Link href="/matchmaking" className={styles.matchFoundBadge}>
                                    <span>🎉 Match Found!</span>
                                </Link>
                            )}
                            <Link href="/profile" className={styles.profileLink}>
                                <div className={styles.avatar}>
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                            </Link>
                            <button onClick={handleSignOut} className={styles.signOutBtn}>
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className={styles.authButtons}>
                            <Link href="/auth/login" className={styles.loginBtn}>
                                Log In
                            </Link>
                            <Link href="/auth/signup" className={styles.signupBtn}>
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}

// Add these styles to your Navbar.module.css via a proper CSS file edit or append here if valid, 
// but wait, I can only edit the file. I am editing Navbar.tsx which is TSX.
// I must edit Navbar.module.css separately. 
// I will skip adding CSS here and do it in a separate tool call.
