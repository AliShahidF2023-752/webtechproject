'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import styles from '../admin.module.css'

interface Venue {
    id: string
    name: string
    city: string
    address: string
    is_active: boolean
    commission_percentage: number
}

export default function AdminVenuesPage() {
    const [venues, setVenues] = useState<Venue[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        loadVenues()
    }, [])

    const loadVenues = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('venues')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setVenues(data)
        setLoading(false)
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        setActionLoading(id)
        const supabase = createClient()
        const { error } = await supabase
            .from('venues')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (!error) {
            setVenues(venues.map(v =>
                v.id === id ? { ...v, is_active: !currentStatus } : v
            ))
        }
        setActionLoading(null)
    }

    const deleteVenue = async (id: string) => {
        if (!confirm('Are you sure you want to delete this venue? This cannot be undone.')) return

        setActionLoading(id)
        const supabase = createClient()
        const { error } = await supabase
            .from('venues')
            .delete()
            .eq('id', id)

        if (!error) {
            setVenues(venues.filter(v => v.id !== id))
        }
        setActionLoading(null)
    }

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Venue Management</h1>
                        <p>Manage and verify sports venues</p>
                    </div>

                    <div className={styles.actionsBar} style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <a href="/admin/venues/new" className={styles.btnPrimary}>
                            + Add New Venue
                        </a>
                    </div>

                    <div className={styles.tableCard}>
                        {loading ? (
                            <div className={styles.loading}>Loading venues...</div>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Location</th>
                                        <th>Commission</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {venues.map(venue => (
                                        <tr key={venue.id}>
                                            <td className={styles.mainCell}>
                                                <span className={styles.primaryText}>{venue.name}</span>
                                            </td>
                                            <td>
                                                <div className={styles.subText}>{venue.address}</div>
                                                <div className={styles.subText}>{venue.city}</div>
                                            </td>
                                            <td>{venue.commission_percentage}%</td>
                                            <td>
                                                <span className={`${styles.badge} ${venue.is_active ? styles.badgeSuccess : styles.badgeWarning}`}>
                                                    {venue.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button
                                                        onClick={() => toggleStatus(venue.id, venue.is_active)}
                                                        disabled={actionLoading === venue.id}
                                                        className={styles.btnSmall}
                                                    >
                                                        {venue.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteVenue(venue.id)}
                                                        disabled={actionLoading === venue.id}
                                                        className={`${styles.btnSmall} ${styles.btnDanger}`}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {venues.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className={styles.emptyText}>No venues found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
