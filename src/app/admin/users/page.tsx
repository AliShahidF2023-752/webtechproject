import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import styles from '../admin.module.css'

export default async function AdminUsersPage() {
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

    const { data: users } = await supabase
        .from('users')
        .select(`
      *,
      player_profiles(name, elo_rating, wins, losses),
      behavior_metrics(overall_score)
    `)
        .order('created_at', { ascending: false })

    const playerCount = users?.filter((u: { role: string }) => u.role === 'player').length || 0
    const vendorCount = users?.filter((u: { role: string }) => u.role === 'vendor').length || 0
    const adminCount = users?.filter((u: { role: string }) => u.role === 'admin').length || 0

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>User Management</h1>
                        <p>Manage players, vendors, and administrators</p>
                    </div>

                    {/* User Stats */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>🎮</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{playerCount}</span>
                                <span className={styles.statLabel}>Players</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>🏟️</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{vendorCount}</span>
                                <span className={styles.statLabel}>Vendors</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>👑</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{adminCount}</span>
                                <span className={styles.statLabel}>Admins</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statIcon}>📊</span>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{users?.length || 0}</span>
                                <span className={styles.statLabel}>Total Users</span>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <section className={styles.section}>
                        <h2>All Users</h2>
                        <div className={styles.usersTable}>
                            <div className={styles.tableHeader}>
                                <span>Name</span>
                                <span>Email</span>
                                <span>Role</span>
                                <span>Rating</span>
                                <span>Status</span>
                                <span>Actions</span>
                            </div>
                            {users?.map((u: { id: string; email: string; role: string; is_active: boolean; player_profiles: { name: string; elo_rating: number }[] | null }) => (
                                <div key={u.id} className={styles.tableRow}>
                                    <span>{u.player_profiles?.[0]?.name || 'N/A'}</span>
                                    <span>{u.email}</span>
                                    <span className={`${styles.roleBadge} ${styles[u.role]}`}>{u.role}</span>
                                    <span>{u.player_profiles?.[0]?.elo_rating || '-'}</span>
                                    <span className={u.is_active ? styles.active : styles.inactive}>
                                        {u.is_active ? '✓ Active' : '✗ Inactive'}
                                    </span>
                                    <div className={styles.rowActions}>
                                        <form action={`/api/admin/users/${u.id}/toggle`} method="POST">
                                            <button type="submit" className={styles.toggleBtn}>
                                                {u.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
}
