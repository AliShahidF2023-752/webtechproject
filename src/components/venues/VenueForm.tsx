'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './VenueForm.module.css'

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(
    () => import('@/components/maps/LocationPicker'),
    { ssr: false }
)

interface VenueFormProps {
    redirectPath: string
    isVendor?: boolean
}

export default function VenueForm({ redirectPath, isVendor = false }: VenueFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        description: '',
        location_lat: 31.5204,
        location_lng: 74.3587,
        rules: '',
        commission_percentage: 10
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value
        setFormData({ ...formData, [e.target.name]: value })
    }

    const handleLocationSelect = (location: { lat: number, lng: number, address?: string, city?: string }) => {
        setFormData(prev => ({
            ...prev,
            location_lat: location.lat,
            location_lng: location.lng,
            city: location.city || prev.city,
            address: location.address || prev.address
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const supabase = createClient()

            // Get user if vendor
            let vendor_id = null
            if (isVendor) {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('Not authenticated')
                vendor_id = user.id
            }

            const venueData: any = {
                ...formData,
                is_active: false // Default to pending
            }

            if (vendor_id) {
                venueData.vendor_id = vendor_id
            }

            const { error: insertError } = await supabase
                .from('venues')
                .insert(venueData)

            if (insertError) throw insertError

            router.push(redirectPath)
        } catch (err: any) {
            setError(err.message || 'Failed to create venue')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
                {/* Left Column: Details */}
                <div className={styles.column}>
                    <h3 className={styles.sectionTitle}>Venue Details</h3>

                    <div className={styles.formGroup}>
                        <label>Venue Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. City Sports Complex"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>City *</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            placeholder="Auto-filled from map or type city"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Address *</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            placeholder="Auto-filled from map"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Brief description of facilities"
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Venue Rules</label>
                        <textarea
                            name="rules"
                            value={formData.rules}
                            onChange={handleChange}
                            rows={3}
                            placeholder="e.g. No food allowed, Wear non-marking shoes"
                            className={styles.textarea}
                        />
                    </div>

                    {!isVendor && (
                        <div className={styles.formGroup}>
                            <label>Commission Percentage (%)</label>
                            <input
                                type="number"
                                name="commission_percentage"
                                value={formData.commission_percentage}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                step="0.1"
                                className={styles.input}
                            />
                        </div>
                    )}
                </div>

                {/* Right Column: Map */}
                <div className={styles.column}>
                    <h3 className={styles.sectionTitle}>Location</h3>
                    <div className={styles.mapContainer}>
                        <LocationPicker
                            initialLocation={{ lat: formData.location_lat, lng: formData.location_lng }}
                            onLocationSelect={handleLocationSelect}
                        />
                    </div>

                    <div className={styles.coords}>
                        <div className={styles.coordItem}>
                            <span>Latitude:</span>
                            <code>{formData.location_lat.toFixed(6)}</code>
                        </div>
                        <div className={styles.coordItem}>
                            <span>Longitude:</span>
                            <code>{formData.location_lng.toFixed(6)}</code>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actions}>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className={styles.btnSecondary}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : (isVendor ? 'Submit for Approval' : 'Create Venue')}
                </button>
            </div>
        </form>
    )
}
