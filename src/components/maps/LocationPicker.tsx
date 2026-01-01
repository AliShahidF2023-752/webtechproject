'use client'

import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './LocationPicker.module.css'

interface Location {
    lat: number
    lng: number
    address?: string
    city?: string
}

interface LocationPickerProps {
    initialLocation?: { lat: number, lng: number }
    onLocationSelect: (location: Location) => void
}

export default function LocationPicker({ initialLocation, onLocationSelect }: LocationPickerProps) {
    const mapRef = useRef<L.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const markerRef = useRef<L.Marker | null>(null)
    const [loading, setLoading] = useState(false)

    // Default to Lahore if no initial location
    const defaultCenter: [number, number] = [31.5204, 74.3587]

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        // Initialize map
        const center = initialLocation
            ? [initialLocation.lat, initialLocation.lng] as [number, number]
            : defaultCenter

        mapRef.current = L.map(mapContainerRef.current).setView(center, 13)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current)

        // Custom icon
        const icon = L.divIcon({
            className: styles.markerIcon,
            html: `<div class="${styles.marker}">📍</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        })

        // Add initial marker
        markerRef.current = L.marker(center, {
            icon,
            draggable: true
        }).addTo(mapRef.current)

        // Handle marker drag
        markerRef.current.on('dragend', async () => {
            const pos = markerRef.current?.getLatLng()
            if (pos) {
                await handleLocationUpdate(pos.lat, pos.lng)
            }
        })

        // Handle map click
        mapRef.current.on('click', async (e: L.LeafletMouseEvent) => {
            markerRef.current?.setLatLng(e.latlng)
            await handleLocationUpdate(e.latlng.lat, e.latlng.lng)
        })

        // Initial fetch if we have a location
        if (initialLocation) {
            handleLocationUpdate(initialLocation.lat, initialLocation.lng)
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    const handleLocationUpdate = async (lat: number, lng: number) => {
        setLoading(true)
        try {
            // Reverse geocoding using Nominatim
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            )
            const data = await response.json()

            const city = data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                data.address?.state_district ||
                'Unknown City'

            const address = [
                data.address?.road,
                data.address?.suburb,
                data.address?.neighbourhood
            ].filter(Boolean).join(', ') || data.display_name.split(',')[0]

            onLocationSelect({
                lat,
                lng,
                address,
                city
            })
        } catch (error) {
            console.error('Error fetching address:', error)
            // Still update coords even if address fetch fails
            onLocationSelect({ lat, lng })
        } finally {
            setLoading(false)
        }
    }

    const handleCurrentLocation = () => {
        if ('geolocation' in navigator) {
            setLoading(true)
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords
                    if (mapRef.current && markerRef.current) {
                        mapRef.current.setView([latitude, longitude], 15)
                        markerRef.current.setLatLng([latitude, longitude])
                        await handleLocationUpdate(latitude, longitude)
                    }
                    setLoading(false)
                },
                (error) => {
                    console.error('Error getting location:', error)
                    let errorMessage = 'Could not get your location.'
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location permission denied. Please enable it in browser settings.'
                            break
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable.'
                            break
                        case error.TIMEOUT:
                            errorMessage = 'The request to get user location timed out.'
                            break
                        default:
                            errorMessage = `An unknown error occurred: ${error.message}`
                    }
                    alert(errorMessage)
                    setLoading(false)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            )
        } else {
            alert('Geolocation is not supported by your browser')
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <button
                    type="button"
                    onClick={handleCurrentLocation}
                    className={styles.btnLocation}
                    disabled={loading}
                >
                    {loading ? '📍 Locating...' : '📍 Use Current Location'}
                </button>
                {loading && <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Fetching address...</span>}
            </div>

            <div className={styles.mapWrapper}>
                <div ref={mapContainerRef} className={styles.map} />
                {loading && <div className={styles.loadingOverlay}>Updating location...</div>}
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                * Click map or drag marker to adjust location
            </div>
        </div>
    )
}
