// Database types for Supabase

export type UserRole = 'player' | 'vendor' | 'admin'
export type Gender = 'male' | 'female' | 'any'
export type MatchStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'rejected'
export type PaymentMethod = 'bank_transfer' | 'on_site'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'
export type PenaltyType = 'warning' | 'rating_penalty' | 'temp_ban' | 'permanent_ban'
export type QueueStatus = 'waiting' | 'matched' | 'expired' | 'cancelled'

export interface User {
    id: string
    email: string
    role: UserRole
    created_at: string
    updated_at: string
}

export interface PlayerProfile {
    id: string
    user_id: string
    name: string
    username: string
    avatar_url: string | null
    gender: Gender
    age: number | null
    elo_rating: number
    wins: number
    losses: number
    availability: AvailabilitySlot[]
    price_range_min: number
    price_range_max: number
    whatsapp_number: string | null
    instagram: string | null
    is_profile_complete: boolean
    created_at: string
    updated_at: string
}

export interface AvailabilitySlot {
    day: number // 0-6 (Sunday-Saturday)
    start_hour: number // 0-23
    end_hour: number // 0-23
}

export interface BehaviorMetrics {
    id: string
    user_id: string
    tone: number // 1-5
    aggressiveness: number // 1-5
    sportsmanship: number // 1-5
    total_ratings: number
    created_at: string
    updated_at: string
}

export interface Sport {
    id: string
    name: string
    players_required: number
    icon: string
    is_active: boolean
    created_at: string
}

export interface PlayerSport {
    id: string
    user_id: string
    sport_id: string
    elo_rating: number
    sport?: Sport
}

export interface Venue {
    id: string
    name: string
    description: string | null
    address: string
    city: string
    location_lat: number
    location_lng: number
    images: string[]
    rules: string | null
    is_active: boolean
    vendor_id: string | null
    created_at: string
    updated_at: string
    courts?: Court[]
}

export interface Court {
    id: string
    venue_id: string
    sport_id: string
    name: string
    hourly_rate: number
    capacity: number
    is_available: boolean
    created_at: string
    sport?: Sport
}

export interface MatchmakingQueue {
    id: string
    user_id: string
    sport_id: string
    venue_id: string | null
    preferred_time: string
    preferred_date: string
    gender_preference: Gender
    rating_tolerance: number
    status: QueueStatus
    created_at: string
    expires_at: string
    user?: PlayerProfile
    sport?: Sport
    venue?: Venue
}

export interface Match {
    id: string
    sport_id: string
    venue_id: string
    court_id: string
    scheduled_time: string
    scheduled_date: string
    status: MatchStatus
    winner_id: string | null
    created_by: string
    created_at: string
    updated_at: string
    sport?: Sport
    venue?: Venue
    court?: Court
    players?: MatchPlayer[]
}

export interface MatchPlayer {
    id: string
    match_id: string
    user_id: string
    confirmed: boolean
    rating_before: number
    rating_after: number | null
    created_at: string
    user?: PlayerProfile
}

export interface Booking {
    id: string
    match_id: string | null
    court_id: string
    user_id: string
    booking_date: string
    booking_time: string
    total_amount: number
    commission_amount: number
    advance_paid: number
    payment_status: PaymentStatus
    created_at: string
    updated_at: string
    match?: Match
    court?: Court
    user?: PlayerProfile
    payment?: Payment
}

export interface Payment {
    id: string
    booking_id: string
    amount: number
    payment_method: PaymentMethod
    bank_account_id: string | null
    screenshot_url: string | null
    whatsapp_number: string | null
    status: PaymentStatus
    created_at: string
    verified_at: string | null
    verified_by: string | null
}

export interface BankAccount {
    id: string
    bank_name: string
    account_number: string
    account_title: string
    iban: string | null
    is_active: boolean
    created_at: string
}

export interface ChatRoom {
    id: string
    match_id: string
    created_at: string
    messages?: ChatMessage[]
}

export interface ChatMessage {
    id: string
    room_id: string
    user_id: string
    message: string
    created_at: string
    user?: PlayerProfile
}

export interface MatchFeedback {
    id: string
    match_id: string
    from_user_id: string
    to_user_id: string
    skill_accuracy: number // 1-5
    fair_play: number // 1-5
    punctuality: number // 1-5
    behavior_tone: number // 1-5
    behavior_aggressiveness: number // 1-5
    behavior_sportsmanship: number // 1-5
    comments: string | null
    created_at: string
}

export interface Report {
    id: string
    reported_by: string
    reported_user: string
    reason: string
    evidence_urls: string[]
    status: ReportStatus
    admin_notes: string | null
    resolved_at: string | null
    resolved_by: string | null
    created_at: string
}

export interface UserPenalty {
    id: string
    user_id: string
    penalty_type: PenaltyType
    reason: string
    duration_days: number | null
    expires_at: string | null
    created_by: string
    created_at: string
}

export interface VisitorAnalytics {
    id: string
    session_id: string
    page: string
    referrer: string | null
    user_agent: string | null
    ip_address: string | null
    timestamp: string
}

export interface InteractionEvent {
    id: string
    session_id: string
    event_type: 'click' | 'scroll' | 'hover'
    element_id: string | null
    x: number | null
    y: number | null
    scroll_depth: number | null
    page: string
    timestamp: string
}

export interface SystemConfig {
    key: string
    value: string
    updated_by: string | null
    updated_at: string
}

// Utility types for API responses
export interface ApiResponse<T> {
    data: T | null
    error: string | null
}

export interface PaginatedResponse<T> {
    data: T[]
    count: number
    page: number
    limit: number
}

// ELO calculation types
export interface EloUpdate {
    player1NewRating: number
    player2NewRating: number
    player1Change: number
    player2Change: number
}
