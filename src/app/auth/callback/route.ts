import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // If a specific redirect was requested, use it
            if (next) {
                return NextResponse.redirect(`${origin}${next}`)
            }

            // Otherwise, check if user has completed their profile
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('player_profiles')
                    .select('is_profile_complete')
                    .eq('user_id', user.id)
                    .single()

                // If profile exists and is complete, go to dashboard
                if (profile?.is_profile_complete) {
                    return NextResponse.redirect(`${origin}/dashboard`)
                }
            }

            // No profile or incomplete profile, go to setup
            return NextResponse.redirect(`${origin}/profile/setup`)
        }
    }

    // Return to login with error
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
