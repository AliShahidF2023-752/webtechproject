import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>🎯 Skill-Based Matchmaking</div>
            <h1 className={styles.heroTitle}>
              Find Your Perfect
              <span className={styles.heroHighlight}> Sports Partner</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Join Pakistan&apos;s first intelligent sports matchmaking platform.
              Get matched with players of your skill level for Table Tennis and Badminton.
            </p>
            <div className={styles.heroCta}>
              <Link href="/auth/signup" className={styles.ctaPrimary}>
                Get Started Free
              </Link>
              <Link href="/venues" className={styles.ctaSecondary}>
                Explore Venues
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.statValue}>1000+</span>
                <span className={styles.statLabel}>Active Players</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.statValue}>50+</span>
                <span className={styles.statLabel}>Venues</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.statValue}>5000+</span>
                <span className={styles.statLabel}>Matches Played</span>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.matchPreview}>
                <div className={styles.sport}>🏓 Table Tennis</div>
                <div className={styles.players}>
                  <div className={styles.player}>
                    <div className={styles.playerAvatar}>A</div>
                    <div className={styles.playerInfo}>
                      <span className={styles.playerName}>Ahmed</span>
                      <span className={styles.playerRating}>⭐ 1450</span>
                    </div>
                  </div>
                  <div className={styles.vs}>VS</div>
                  <div className={styles.player}>
                    <div className={styles.playerAvatar}>S</div>
                    <div className={styles.playerInfo}>
                      <span className={styles.playerName}>Sara</span>
                      <span className={styles.playerRating}>⭐ 1420</span>
                    </div>
                  </div>
                </div>
                <div className={styles.matchDetails}>
                  <span>📍 Lahore Sports Complex</span>
                  <span>🕐 Today, 5:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <h2>How It Works</h2>
            <p>Get matched in 3 simple steps</p>
          </div>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>👤</div>
              <h3>Create Your Profile</h3>
              <p>Set up your profile with skill level, availability, and preferred venues. Our ELO rating system ensures fair matches.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎯</div>
              <h3>Find Your Match</h3>
              <p>Use our Uber-style map interface to find players near you with similar skill levels and book a venue instantly.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🏆</div>
              <h3>Play & Grow</h3>
              <p>Play matches, rate opponents, and watch your ELO rating grow. Build your reputation in the community.</p>
            </div>
          </div>
        </section>

        {/* Sports Section */}
        <section className={styles.sports}>
          <div className={styles.sectionHeader}>
            <h2>Supported Sports</h2>
            <p>Start with our Phase 1 sports</p>
          </div>
          <div className={styles.sportGrid}>
            <div className={styles.sportCard}>
              <div className={styles.sportIcon}>🏓</div>
              <h3>Table Tennis</h3>
              <p>Fast-paced 1v1 matches on professional tables across Pakistan</p>
              <Link href="/matchmaking?sport=table-tennis" className={styles.sportLink}>
                Find Players →
              </Link>
            </div>
            <div className={styles.sportCard}>
              <div className={styles.sportIcon}>🏸</div>
              <h3>Badminton</h3>
              <p>Singles matches at air-conditioned indoor courts</p>
              <Link href="/matchmaking?sport=badminton" className={styles.sportLink}>
                Find Players →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <div className={styles.ctaCard}>
            <h2>Ready to Find Your Match?</h2>
            <p>Join thousands of players already using SportMatch across Pakistan</p>
            <Link href="/auth/signup" className={styles.ctaButton}>
              Create Free Account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
