'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import styles from './setup.module.css'

interface Sport {
    id: string
    name: string
    icon: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function ProfileSetupPage() {
    const router = useRouter()
    const hasChecked = useRef(false)

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [sports, setSports] = useState<Sport[]>([])
    const [checkingProfile, setCheckingProfile] = useState(true)

    // Check if user already has a profile - only run once
    useEffect(() => {
        if (hasChecked.current) return
        hasChecked.current = true

        const checkExistingProfile = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    window.location.href = '/auth/login'
                    return
                }

                const { data: profile } = await supabase
                    .from('player_profiles')
                    .select('is_profile_complete')
                    .eq('user_id', user.id)
                    .single()

                if (profile?.is_profile_complete) {
                    // Profile already complete, redirect to dashboard
                    window.location.href = '/dashboard'
                    return
                }

                setCheckingProfile(false)
            } catch (err) {
                console.error('Error checking profile:', err)
                setCheckingProfile(false)
            }
        }
        checkExistingProfile()
    }, [])

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        gender: 'any' as 'male' | 'female' | 'any',
        age: '',
        whatsapp_number: '',
        price_range_min: 300,
        price_range_max: 1000,
        selectedSports: [] as string[],
        availability: [] as { day: number; start_hour: number; end_hour: number }[],
    })

    useEffect(() => {
        const loadSports = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('sports')
                .select('id, name, icon')
                .eq('is_active', true)
            if (data) setSports(data)
        }
        loadSports()
    }, [])

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const toggleSport = (sportId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedSports: prev.selectedSports.includes(sportId)
                ? prev.selectedSports.filter(id => id !== sportId)
                : [...prev.selectedSports, sportId]
        }))
    }

    const toggleAvailability = (day: number, hour: number) => {
        setFormData(prev => {
            const existing = prev.availability.find(a => a.day === day && a.start_hour === hour)
            if (existing) {
                return {
                    ...prev,
                    availability: prev.availability.filter(a => !(a.day === day && a.start_hour === hour))
                }
            }
            return {
                ...prev,
                availability: [...prev.availability, { day, start_hour: hour, end_hour: hour + 1 }]
            }
        })
    }

    const isAvailable = (day: number, hour: number) => {
        return formData.availability.some(a => a.day === day && a.start_hour === hour)
    }

    const handleSubmit = async () => {
        setError('')
        setLoading(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                window.location.href = '/auth/login'
                return
            }

            // Create or update player profile (upsert to handle partial profiles)
            const { error: profileError } = await supabase
                .from('player_profiles')
                .upsert({
                    user_id: user.id,
                    name: formData.name,
                    username: formData.username.toLowerCase().replace(/\s+/g, '_'),
                    gender: formData.gender,
                    age: formData.age ? parseInt(formData.age) : null,
                    whatsapp_number: formData.whatsapp_number || null,
                    price_range_min: formData.price_range_min,
                    price_range_max: formData.price_range_max,
                    availability: formData.availability,
                    is_profile_complete: true,
                }, { onConflict: 'user_id' })

            if (profileError) throw profileError

            // Add selected sports (upsert to avoid duplicates)
            if (formData.selectedSports.length > 0) {
                const sportEntries = formData.selectedSports.map(sport_id => ({
                    user_id: user.id,
                    sport_id,
                    elo_rating: 1200,
                }))

                const { error: sportsError } = await supabase
                    .from('player_sports')
                    .upsert(sportEntries, { onConflict: 'user_id,sport_id' })

                if (sportsError) throw sportsError
            }

            window.location.href = '/dashboard'
        } catch (err: any) {
            setError(err.message || 'Failed to save profile')
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => {
        if (step === 1 && (!formData.name || !formData.username)) {
            setError('Please fill in your name and username')
            return
        }
        if (step === 2 && formData.selectedSports.length === 0) {
            setError('Please select at least one sport')
            return
        }
        setError('')
        setStep(step + 1)
    }

    const prevStep = () => {
        setError('')
        setStep(step - 1)
    }

    if (checkingProfile) {
        return (
            <>
                <Navbar />
                <div className={styles.page}>
                    <div className={styles.container}>
                        <div className={styles.header}>
                            <h1>Loading...</h1>
                            <p>Checking your profile status</p>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Complete Your Profile</h1>
                        <p>Set up your player profile to start finding matches</p>
                    </div>

                    <div className={styles.progress}>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${(step / 4) * 100}%` }} />
                        </div>
                        <div className={styles.steps}>
                            <span className={step >= 1 ? styles.stepActive : ''}>Basic Info</span>
                            <span className={step >= 2 ? styles.stepActive : ''}>Sports</span>
                            <span className={step >= 3 ? styles.stepActive : ''}>Availability</span>
                            <span className={step >= 4 ? styles.stepActive : ''}>Preferences</span>
                        </div>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            <span>⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className={styles.formContainer}>
                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <div className={styles.step}>
                                <h2>Basic Information</h2>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Username *</label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => handleChange('username', e.target.value)}
                                            placeholder="Choose a username"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => handleChange('gender', e.target.value)}
                                        >
                                            <option value="any">Prefer not to say</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Age (Optional)</label>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => handleChange('age', e.target.value)}
                                            placeholder="Your age"
                                            min={10}
                                            max={100}
                                        />
                                    </div>
                                    <div className={styles.formGroup + ' ' + styles.fullWidth}>
                                        <label>WhatsApp Number (Optional)</label>
                                        <input
                                            type="tel"
                                            value={formData.whatsapp_number}
                                            onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                                            placeholder="e.g. 923001234567"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Sports */}
                        {step === 2 && (
                            <div className={styles.step}>
                                <h2>Select Your Sports</h2>
                                <p className={styles.stepDesc}>Choose the sports you want to play</p>
                                <div className={styles.sportGrid}>
                                    {sports.map(sport => (
                                        <button
                                            key={sport.id}
                                            type="button"
                                            className={`${styles.sportCard} ${formData.selectedSports.includes(sport.id) ? styles.sportCardSelected : ''}`}
                                            onClick={() => toggleSport(sport.id)}
                                        >
                                            <span className={styles.sportIcon}>{sport.icon || '🎯'}</span>
                                            <span className={styles.sportName}>{sport.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Availability */}
                        {step === 3 && (
                            <div className={styles.step}>
                                <h2>Your Availability</h2>
                                <p className={styles.stepDesc}>Click on time slots when you&apos;re available to play</p>
                                <div className={styles.availabilityGrid}>
                                    <div className={styles.availabilityHeader}>
                                        <div className={styles.timeLabel}></div>
                                        {DAYS.map(day => (
                                            <div key={day} className={styles.dayLabel}>{day}</div>
                                        ))}
                                    </div>
                                    <div className={styles.availabilityBody}>
                                        {HOURS.filter(h => h >= 6 && h <= 22).map(hour => (
                                            <div key={hour} className={styles.hourRow}>
                                                <div className={styles.timeLabel}>
                                                    {hour.toString().padStart(2, '0')}:00
                                                </div>
                                                {DAYS.map((_, dayIndex) => (
                                                    <button
                                                        key={dayIndex}
                                                        type="button"
                                                        className={`${styles.slotCell} ${isAvailable(dayIndex, hour) ? styles.slotActive : ''}`}
                                                        onClick={() => toggleAvailability(dayIndex, hour)}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Preferences */}
                        {step === 4 && (
                            <div className={styles.step}>
                                <h2>Match Preferences</h2>
                                <p className={styles.stepDesc}>Set your preferences for finding matches</p>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup + ' ' + styles.fullWidth}>
                                        <label>Price Range (PKR per hour)</label>
                                        <div className={styles.rangeInputs}>
                                            <input
                                                type="number"
                                                value={formData.price_range_min}
                                                onChange={(e) => handleChange('price_range_min', parseInt(e.target.value))}
                                                placeholder="Min"
                                                min={0}
                                            />
                                            <span>to</span>
                                            <input
                                                type="number"
                                                value={formData.price_range_max}
                                                onChange={(e) => handleChange('price_range_max', parseInt(e.target.value))}
                                                placeholder="Max"
                                                min={0}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.summary}>
                                    <h3>Profile Summary</h3>
                                    <div className={styles.summaryGrid}>
                                        <div><strong>Name:</strong> {formData.name}</div>
                                        <div><strong>Username:</strong> @{formData.username}</div>
                                        <div><strong>Sports:</strong> {formData.selectedSports.length} selected</div>
                                        <div><strong>Availability:</strong> {formData.availability.length} slots</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.actions}>
                        {step > 1 && (
                            <button type="button" onClick={prevStep} className={styles.btnSecondary}>
                                Back
                            </button>
                        )}
                        {step < 4 ? (
                            <button type="button" onClick={nextStep} className={styles.btnPrimary}>
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className={styles.btnPrimary}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Complete Setup'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
