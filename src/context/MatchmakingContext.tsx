'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface QueueEntry {
    id: string
    user_id: string
    sport_id: string
    venue_id: string | null
    status: string
    preferred_date: string
    preferred_time: string
    sport?: {
        name: string
        icon: string
    }
    venue?: {
        name: string
    }
}

interface MatchmakingContextType {
    inQueue: boolean
    queueId: string | null
    queueData: QueueEntry | null
    matchFound: boolean
    matchData: any | null
    loading: boolean
    error: string | null
    joinQueue: (data: {
        sportId: string
        venueId: string | null
        date: string
        time: string
        ratingTolerance: number
        genderPreference: string
        lat?: number
        lng?: number
        radiusKm?: number
    }) => Promise<void>
    leaveQueue: () => Promise<void>
    declineMatch: () => Promise<void>
    dismissMatch: () => void
}

const MatchmakingContext = createContext<MatchmakingContextType | undefined>(undefined)

export function MatchmakingProvider({ children }: { children: ReactNode }) {
    const router = useRouter()
    const [inQueue, setInQueue] = useState(false)
    const [queueId, setQueueId] = useState<string | null>(null)
    const [queueData, setQueueData] = useState<QueueEntry | null>(null)
    const [matchFound, setMatchFound] = useState(false)
    const [matchData, setMatchData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Check for existing active queue on mount
    useEffect(() => {
        const checkActiveQueue = async () => {
            console.log('Checking active queue...')
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    console.log('No user found for queue check')
                    return
                }
                console.log('User found:', user.id)

                const { data: activeEntry, error } = await supabase
                    .from('matchmaking_queue')
                    .select(`
                        *,
                        sport:sports(name, icon),
                        venue:venues(name),
                        match:matches(
                            *,
                            sport:sports(name, icon),
                            venue:venues(name),
                            court:courts(name, hourly_rate)
                        )
                    `)
                    .eq('user_id', user.id)
                    .in('status', ['waiting', 'matched'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching queue:', error)
                }

                console.log('Active entry found:', activeEntry)

                if (activeEntry) {
                    setQueueId(activeEntry.id)
                    setQueueData(activeEntry)

                    if (activeEntry.status === 'matched') {
                        console.log('Restoring matched state')
                        setMatchFound(true)
                        setInQueue(false)
                        const match = activeEntry.match
                        if (match) {
                            setMatchData({
                                ...match,
                                date: match.scheduled_date,
                                time: match.scheduled_time
                            })
                        } else {
                            setMatchData({ ...activeEntry, status: 'matched' })
                        }
                    } else {
                        console.log('Restoring waiting state')
                        setInQueue(true)
                    }

                    subscribeToQueue(activeEntry.id)
                } else {
                    console.log('No active queue entry found')
                }
            } catch (err) {
                console.error('Error checking active queue:', err)
            }
        }

        checkActiveQueue()
    }, [])

    const subscribeToQueue = (entryId: string) => {
        const supabase = createClient()
        const channel = supabase
            .channel(`queue:${entryId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'matchmaking_queue',
                    filter: `id=eq.${entryId}`
                },
                async (payload) => {
                    console.log('Queue update received:', payload)
                    if (payload.new.status === 'matched') {
                        setMatchFound(true)
                        setInQueue(false)
                        // Fetch descriptive match details
                        const { data: matchDetails } = await supabase
                            .from('matches')
                            .select(`
                                *,
                                sport:sports(name, icon),
                                venue:venues(name),
                                court:courts(name, hourly_rate)
                            `)
                            .eq('id', payload.new.match_id)
                            .single()

                        if (matchDetails) {
                            setMatchData({
                                ...matchDetails,
                                date: matchDetails.scheduled_date,
                                time: matchDetails.scheduled_time
                            })
                        } else {
                            setMatchData({
                                ...queueData,
                                status: 'matched'
                            })
                        }
                    } else if (payload.new.status === 'cancelled' || payload.new.status === 'expired') {
                        setInQueue(false)
                        setQueueId(null)
                        setQueueData(null)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    const joinQueue = async (data: {
        sportId: string
        venueId: string | null
        date: string
        time: string
        ratingTolerance: number
        genderPreference: string
        lat?: number
        lng?: number
        radiusKm?: number
    }) => {
        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/auth/login')
                return
            }

            // Create queue entry - the trigger fires DURING this insert
            // If a match is found, status will be 'matched' in the response
            const { data: newEntry, error: insertError } = await supabase
                .from('matchmaking_queue')
                .insert({
                    user_id: user.id,
                    sport_id: data.sportId,
                    venue_id: data.venueId || null,
                    preferred_date: data.date,
                    preferred_time: data.time,
                    gender_preference: data.genderPreference,
                    rating_tolerance: data.ratingTolerance,
                    location_lat: data.lat || null,
                    location_lng: data.lng || null,
                    radius_km: data.radiusKm || 10,
                    status: 'waiting'
                })
                .select(`
                    *,
                    sport:sports(name, icon),
                    venue:venues(name)
                `)
                .single()

            if (insertError) throw insertError

            setQueueId(newEntry.id)
            setQueueData(newEntry)

            // Check if already matched (trigger ran synchronously)
            // Need to re-fetch since trigger updates happen after our select
            const { data: updatedEntry } = await supabase
                .from('matchmaking_queue')
                .select(`
                    *,
                    sport:sports(name, icon),
                    venue:venues(name),
                    match:matches(
                        *,
                        sport:sports(name, icon),
                        venue:venues(name),
                        court:courts(name, hourly_rate)
                    )
                `)
                .eq('id', newEntry.id)
                .single()

            if (updatedEntry?.status === 'matched') {
                // Instant match found!
                console.log('Instant match found!')
                setMatchFound(true)
                setInQueue(false)
                if (updatedEntry.match) {
                    setMatchData({
                        ...updatedEntry.match,
                        date: updatedEntry.match.scheduled_date,
                        time: updatedEntry.match.scheduled_time
                    })
                } else {
                    setMatchData({ ...updatedEntry, status: 'matched' })
                }
            } else {
                // Still waiting, subscribe for updates
                setInQueue(true)
                subscribeToQueue(newEntry.id)
            }

        } catch (err: any) {
            console.error('Join queue error:', err)
            setError(err.message || 'Failed to join queue')
        } finally {
            setLoading(false)
        }
    }


    const leaveQueue = async () => {
        if (!queueId) return

        setLoading(true)
        try {
            const supabase = createClient()
            await supabase
                .from('matchmaking_queue')
                .update({ status: 'cancelled' })
                .eq('id', queueId)

            setInQueue(false)
            setQueueId(null)
            setQueueData(null)
        } catch (err: any) {
            console.error('Leave queue error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const declineMatch = async () => {
        if (!matchData?.id) return

        setLoading(true)
        try {
            const supabase = createClient()

            // 1. Cancel the match
            const { error: matchError } = await supabase
                .from('matches')
                .update({ status: 'cancelled' })
                .eq('id', matchData.id)

            if (matchError) throw matchError

            // 2. Clear local state
            setMatchFound(false)
            setMatchData(null)
            setInQueue(false)
            setQueueId(null)
            setQueueData(null)

        } catch (err: any) {
            console.error('Decline match error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const dismissMatch = () => {
        setMatchFound(false)
        setMatchData(null)
    }

    return (
        <MatchmakingContext.Provider value={{
            inQueue,
            queueId,
            queueData,
            matchFound,
            matchData,
            loading,
            error,
            joinQueue,
            leaveQueue,
            declineMatch,
            dismissMatch
        }}>
            {children}
        </MatchmakingContext.Provider>
    )
}

export function useMatchmaking() {
    const context = useContext(MatchmakingContext)
    if (context === undefined) {
        throw new Error('useMatchmaking must be used within a MatchmakingProvider')
    }
    return context
}
