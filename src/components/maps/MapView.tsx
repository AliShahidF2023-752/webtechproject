'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './MapView.module.css'

interface Venue {
    id: string
    name: string
    address: string
    city: string
    location_lat: number
    location_lng: number
}

interface MapViewProps {
    center: [number, number]
    zoom: number
    venues: Venue[]
    radius: number
    selectedVenue?: string
    onVenueSelect?: (id: string) => void
}

export default function MapView({
    center,
    zoom,
    venues,
    radius,
    selectedVenue,
    onVenueSelect
}: MapViewProps) {
    const mapRef = useRef<L.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const markersRef = useRef<L.Marker[]>([])
    const circleRef = useRef<L.Circle | null>(null)

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        // Initialize map
        mapRef.current = L.map(mapContainerRef.current).setView(center, zoom)

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current)

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    // Update center when it changes
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.setView(center, zoom)
        }
    }, [center, zoom])

    // Update radius circle
    useEffect(() => {
        if (!mapRef.current) return

        // Remove existing circle
        if (circleRef.current) {
            circleRef.current.remove()
        }

        // Add new circle
        circleRef.current = L.circle(center, {
            radius: radius * 1000, // Convert km to meters
            color: '#00d9ff',
            fillColor: '#00d9ff',
            fillOpacity: 0.1,
            weight: 2
        }).addTo(mapRef.current)

    }, [center, radius])

    // Update venue markers
    useEffect(() => {
        if (!mapRef.current) return

        // Remove existing markers
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []

        // Custom marker icon
        const defaultIcon = L.divIcon({
            className: styles.markerIcon,
            html: `<div class="${styles.marker}">🏟️</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        })

        const selectedIcon = L.divIcon({
            className: styles.markerIcon,
            html: `<div class="${styles.marker} ${styles.markerSelected}">🏟️</div>`,
            iconSize: [50, 50],
            iconAnchor: [25, 50]
        })

        // Add markers for venues
        venues.forEach(venue => {
            const marker = L.marker(
                [venue.location_lat, venue.location_lng],
                {
                    icon: venue.id === selectedVenue ? selectedIcon : defaultIcon
                }
            ).addTo(mapRef.current!)

            // Add popup
            marker.bindPopup(`
        <div class="${styles.popup}">
          <h3>${venue.name}</h3>
          <p>${venue.address}</p>
          <p>${venue.city}</p>
        </div>
      `)

            // Handle click
            marker.on('click', () => {
                onVenueSelect?.(venue.id)
            })

            markersRef.current.push(marker)
        })

        // Add user location marker
        const userMarker = L.divIcon({
            className: styles.markerIcon,
            html: `<div class="${styles.userMarker}">📍</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        })

        const userLocationMarker = L.marker(center, { icon: userMarker })
            .addTo(mapRef.current)
            .bindPopup('Your location')

        markersRef.current.push(userLocationMarker)

    }, [venues, selectedVenue, center, onVenueSelect])

    return (
        <div className={styles.mapWrapper}>
            <div ref={mapContainerRef} className={styles.map} />
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span>📍</span> Your Location
                </div>
                <div className={styles.legendItem}>
                    <span>🏟️</span> Venue ({venues.length} in range)
                </div>
            </div>
        </div>
    )
}
