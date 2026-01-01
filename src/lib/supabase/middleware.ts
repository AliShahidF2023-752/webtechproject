import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refreshing the auth token
    let user = null
    try {
        const {
            data: { user: supabaseUser },
        } = await supabase.auth.getUser()
        user = supabaseUser
    } catch (err) {
        console.error('Middleware Auth Error:', err)
        // If auth fails due to network/etc, we treat as not logged in
    }

    // Protected routes
    const protectedPaths = ['/dashboard', '/profile', '/matchmaking', '/matches', '/bookings', '/chat', '/vendor', '/admin']
    const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

    if (isProtectedPath && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    // Auth pages - redirect to dashboard if already logged in
    const authPaths = ['/auth/login', '/auth/signup']
    const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

    if (isAuthPath && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
