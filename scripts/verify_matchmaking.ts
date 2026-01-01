import { createClient } from '@supabase/supabase-js'

// Hardcoded for verification (from .env.local via Step 662)
const supabaseUrl = 'https://mxibgcczqbmraofguost.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aWJnY2N6cWJtcmFvZmd1b3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzkxNTIsImV4cCI6MjA4MTYxNTE1Mn0.WLSLkFCGmMwmQgeWeXPrJsWrLmXHzKRwcCFIW5UJmpk'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testMatchmaking() {
    console.log('Starting Matchmaking Verification...')

    // 1. Create/Login User A
    const emailA = 'user_verif_a_' + Date.now() + '@test.com'
    const password = 'password123'

    // Sign up A
    const { data: authA, error: errA } = await supabase.auth.signUp({
        email: emailA,
        password: password,
    })

    let userA = authA.user
    if (!userA) {
        const { data: loginA } = await supabase.auth.signInWithPassword({ email: emailA, password })
        userA = loginA.user
    }

    if (!userA) {
        // Fallback: Use random ID if auth fails (might fail RLS? No, insert needs valid user usually)
        // But anon key allows sign up usually.
        console.error('Failed to get User A. Signup error:', errA)
        return
    }
    console.log('User A:', userA.id)

    // User A joins queue
    // Fetch valid sport
    const { data: sports } = await supabase.from('sports').select('id').limit(1)
    if (!sports || sports.length === 0) throw new Error('No sports found')
    const sportId = sports[0].id

    const date = new Date().toISOString().split('T')[0]
    const time = '12:00:00'

    console.log('User A joining queue...')
    const { data: entryA, error: qErrA } = await supabase
        .from('matchmaking_queue')
        .insert({
            user_id: userA.id,
            sport_id: sportId,
            preferred_date: date,
            preferred_time: time,
            rating_tolerance: 100,
            gender_preference: 'any',
            status: 'waiting'
        })
        .select()
        .single()

    if (qErrA) {
        console.error('User A Join Error:', qErrA)
        return
        // If error is RLS related, then maybe my anon key setup is strict.
    }
    console.log('User A joined queue:', entryA.id)

    // 2. Create/Login User B
    const emailB = 'user_verif_b_' + Date.now() + '@test.com'
    await supabase.auth.signOut()

    const { data: authB, error: errB } = await supabase.auth.signUp({
        email: emailB,
        password: password,
    })

    let userB = authB.user
    if (!userB) {
        const { data: loginB } = await supabase.auth.signInWithPassword({ email: emailB, password })
        userB = loginB.user
    }

    if (!userB) {
        console.error('Failed to get User B')
        return
    }
    console.log('User B:', userB.id)

    // User B joins same queue
    console.log('User B joining queue...')
    const { data: entryB, error: qErrB } = await supabase
        .from('matchmaking_queue')
        .insert({
            user_id: userB.id,
            sport_id: sportId,
            preferred_date: date,
            preferred_time: time,
            rating_tolerance: 100,
            gender_preference: 'any',
            status: 'waiting'
        })
        .select()
        .single()

    if (qErrB) console.error('User B Join Error:', qErrB)

    console.log('User B joined. Checking statuses...')

    // Wait a moment for trigger
    await new Promise(r => setTimeout(r, 2000))

    // Check status of A
    // Use select matching ID. Note: we are logged in as B, so RLS might prevent seeing A?
    // Usually "read own" policy.
    // If we can't see A, we can check B's status.
    // Matchmaking Logic updates both.

    const { data: checkB } = await supabase
        .from('matchmaking_queue')
        .select('status, match_id')
        .eq('id', entryB.id)
        .single()
    console.log('User B Status:', checkB?.status)

    // We can't see A's status if RLS blocks. But B's status should match.
    if (checkB?.status === 'matched') {
        console.log('SUCCESS: Server-side matching working!')
    } else {
        console.log('FAILURE: User B stuck in waiting. SQL migration NOT applied.')
    }
}

testMatchmaking().catch(console.error)
