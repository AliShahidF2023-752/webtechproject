import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoIcon}>🎯</span>
                            <span className={styles.logoText}>SportMatch</span>
                        </Link>
                        <p className={styles.tagline}>
                            Find your perfect sports partner. Play fair, play matched.
                        </p>
                    </div>

                    <div className={styles.links}>
                        <h4 className={styles.linksTitle}>Sports</h4>
                        <Link href="/sports" className={styles.link}>Table Tennis</Link>
                        <Link href="/sports" className={styles.link}>Badminton</Link>
                        <Link href="/venues" className={styles.link}>Find Venues</Link>
                    </div>

                    <div className={styles.links}>
                        <h4 className={styles.linksTitle}>Platform</h4>
                        <Link href="/matchmaking" className={styles.link}>Matchmaking</Link>
                        <Link href="/about" className={styles.link}>How It Works</Link>
                        <Link href="/pricing" className={styles.link}>Pricing</Link>
                    </div>

                    <div className={styles.links}>
                        <h4 className={styles.linksTitle}>Support</h4>
                        <Link href="/contact" className={styles.link}>Contact Us</Link>
                        <Link href="/faq" className={styles.link}>FAQ</Link>
                        <Link href="/terms" className={styles.link}>Terms</Link>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {currentYear} SportMatch. All rights reserved.
                    </p>
                    <div className={styles.social}>
                        <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                            WhatsApp
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                            Instagram
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
