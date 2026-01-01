// Analytics tracking utilities for visitor and interaction data

import { v4 as uuidv4 } from 'uuid'

const SESSION_KEY = 'sportmatch_session_id'

/**
 * Get or create session ID for analytics
 */
export function getSessionId(): string {
    if (typeof window === 'undefined') return ''

    let sessionId = sessionStorage.getItem(SESSION_KEY)
    if (!sessionId) {
        sessionId = uuidv4()
        sessionStorage.setItem(SESSION_KEY, sessionId)
    }
    return sessionId
}

/**
 * Track page view
 */
export async function trackPageView(page: string): Promise<void> {
    if (typeof window === 'undefined') return

    try {
        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'pageview',
                session_id: getSessionId(),
                page,
                referrer: document.referrer,
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString()
            })
        })
    } catch (error) {
        console.error('Failed to track page view:', error)
    }
}

/**
 * Track click event for heatmap
 */
export async function trackClick(
    x: number,
    y: number,
    elementId?: string,
    elementClass?: string
): Promise<void> {
    if (typeof window === 'undefined') return

    try {
        await fetch('/api/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: getSessionId(),
                event_type: 'click',
                element_id: elementId,
                element_class: elementClass,
                x,
                y,
                page: window.location.pathname,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                timestamp: new Date().toISOString()
            })
        })
    } catch (error) {
        console.error('Failed to track click:', error)
    }
}

/**
 * Track scroll depth
 */
export async function trackScroll(depth: number): Promise<void> {
    if (typeof window === 'undefined') return

    try {
        await fetch('/api/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: getSessionId(),
                event_type: 'scroll',
                scroll_depth: depth,
                page: window.location.pathname,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                timestamp: new Date().toISOString()
            })
        })
    } catch (error) {
        console.error('Failed to track scroll:', error)
    }
}

/**
 * Initialize analytics - call once on app mount
 */
export function initAnalytics(): void {
    if (typeof window === 'undefined') return

    // Track initial page view
    trackPageView(window.location.pathname)

    // Track clicks for heatmap
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        trackClick(
            e.clientX,
            e.clientY,
            target.id || undefined,
            target.className || undefined
        )
    })

    // Track scroll depth (debounced)
    let scrollTimeout: NodeJS.Timeout
    let maxScrollDepth = 0

    document.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
            const scrollDepth = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            )
            if (scrollDepth > maxScrollDepth) {
                maxScrollDepth = scrollDepth
                trackScroll(scrollDepth)
            }
        }, 300)
    })

    // Track page views on navigation
    let lastPath = window.location.pathname
    const observer = new MutationObserver(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname
            maxScrollDepth = 0
            trackPageView(lastPath)
        }
    })

    observer.observe(document.body, { childList: true, subtree: true })
}
