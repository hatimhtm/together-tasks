"use client"

import { useEffect, useState } from "react"
import {
    getCurrentLocation,
    watchLocation,
    stopWatchingLocation,
    detectLocationContext,
    saveLocationUpdate
} from "@/lib/geolocation"
import { MapPin } from "lucide-react"

export function LocationTracker({ userId }: { userId: string }) {
    const [currentContext, setCurrentContext] = useState<string>("unknown")
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)

    useEffect(() => {
        // Request location permission on mount
        requestLocationPermission()

        // Start watching location
        const watchId = watchLocation((location, context) => {
            setCurrentContext(context.currentPlace)

            // Save to database
            saveLocationUpdate(userId, location, context)

            console.log("Location context:", context.currentPlace)
        })

        // Cleanup on unmount
        return () => {
            if (watchId) stopWatchingLocation(watchId)
        }
    }, [userId])

    const requestLocationPermission = async () => {
        try {
            const location = await getCurrentLocation()
            if (location) {
                setHasPermission(true)
                const context = detectLocationContext(location)
                setCurrentContext(context.currentPlace)
            } else {
                setHasPermission(false)
            }
        } catch {
            setHasPermission(false)
        }
    }

    // Visual indicator (optional - can be hidden)
    if (hasPermission === false) {
        return (
            <div className="fixed bottom-4 left-4 text-xs text-white/40 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location disabled
            </div>
        )
    }

    return (
        <div className="fixed bottom-4 left-4 text-xs text-white/40 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {currentContext === "work" && "🏢 At work"}
            {currentContext === "home" && "🏠 At home"}
            {currentContext === "unknown" && "📍 Location active"}
        </div>
    )
}
