'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import styles from '../admin.module.css'

interface SystemConfig {
    id: string
    commission_percentage: number
    booking_cancellation_window_hours: number
    match_acceptance_window_minutes: number
    base_price_hourly: number
    platform_fee_fixed: number
    maintenance_mode: boolean
}

export default function AdminConfigPage() {
    const [config, setConfig] = useState<SystemConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('system_config')
            .select('*')
            .single()

        if (data) setConfig(data)
        setLoading(false)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!config) return

        setSaving(true)
        setMessage('')

        const supabase = createClient()
        // Omit id and timestamps from update
        const { id, ...updates } = config

        const { error } = await supabase
            .from('system_config')
            .update(updates)
            .eq('id', id)

        if (error) {
            setMessage('Error saving settings')
        } else {
            setMessage('Settings saved successfully')
        }
        setSaving(false)
    }

    const handleChange = (field: keyof SystemConfig, value: any) => {
        if (!config) return
        setConfig({ ...config, [field]: value })
    }

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>System Configuration</h1>
                        <p>Global settings for fees, timings, and platform rules</p>
                    </div>

                    <div className={styles.formCard}>
                        {loading ? (
                            <div className={styles.loading}>Loading settings...</div>
                        ) : config ? (
                            <form onSubmit={handleSave} className={styles.configForm}>
                                <div className={styles.formSection}>
                                    <h3>Financial Settings</h3>
                                    <div className={styles.formGroup}>
                                        <label>Commission Percentage (%)</label>
                                        <input
                                            type="number"
                                            value={config.commission_percentage}
                                            onChange={(e) => handleChange('commission_percentage', parseFloat(e.target.value))}
                                            step="0.1"
                                        />
                                        <small>Percentage taken from each booking</small>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Platform Fee (Fixed PKR)</label>
                                        <input
                                            type="number"
                                            value={config.platform_fee_fixed}
                                            onChange={(e) => handleChange('platform_fee_fixed', parseInt(e.target.value))}
                                        />
                                        <small>Fixed fee added to each booking</small>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Base Hourly Price (Default)</label>
                                        <input
                                            type="number"
                                            value={config.base_price_hourly}
                                            onChange={(e) => handleChange('base_price_hourly', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formSection}>
                                    <h3>Time Windows</h3>
                                    <div className={styles.formGroup}>
                                        <label>Cancellation Window (Hours)</label>
                                        <input
                                            type="number"
                                            value={config.booking_cancellation_window_hours}
                                            onChange={(e) => handleChange('booking_cancellation_window_hours', parseInt(e.target.value))}
                                        />
                                        <small>Minimum hours before booking to allow cancellation</small>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Match Acceptance Window (Minutes)</label>
                                        <input
                                            type="number"
                                            value={config.match_acceptance_window_minutes}
                                            onChange={(e) => handleChange('match_acceptance_window_minutes', parseInt(e.target.value))}
                                        />
                                        <small>Time allowed to accept a match invitation</small>
                                    </div>
                                </div>

                                <div className={styles.formSection}>
                                    <h3>System Status</h3>
                                    <div className={styles.checkboxGroup}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={config.maintenance_mode}
                                                onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                            />
                                            Maintenance Mode
                                        </label>
                                        <small>If enabled, non-admin users cannot access the platform</small>
                                    </div>
                                </div>

                                <div className={styles.formActions}>
                                    <button type="submit" className={styles.btnPrimary} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    {message && (
                                        <span className={message.includes('Error') ? styles.errorText : styles.successText}>
                                            {message}
                                        </span>
                                    )}
                                </div>
                            </form>
                        ) : (
                            <div className={styles.errorText}>Failed to load configuration</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
