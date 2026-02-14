export interface Location {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: number
}

export interface LocationContext {
    isAtWork: boolean
    isAtHome: boolean
    isCommuting: boolean
    currentPlace: "work" | "home" | "unknown"
}

// Known locations (you"ll customize these)
const KNOWN_LOCATIONS = {
    // Your wife"s work location (get from Google Maps)
    work: {
        lat: 14.072503804285322,
        lng: 121.31170192424233,
        radius: 200 // meters
    },
    // Your home location
    home: {
        lat: 0, // REPLACE
        lng: 0, // REPLACE
        radius: 100 // meters
    }
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3 // Earth"s radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
}

// Check if user is at a known location
export function detectLocationContext(location: Location): LocationContext {
    const { latitude, longitude } = location

    const distanceToWork = calculateDistance(
        latitude,
        longitude,
        KNOWN_LOCATIONS.work.lat,
        KNOWN_LOCATIONS.work.lng
    )

    const distanceToHome = calculateDistance(
        latitude,
        longitude,
        KNOWN_LOCATIONS.home.lat,
        KNOWN_LOCATIONS.home.lng
    )

    const isAtWork = distanceToWork <= KNOWN_LOCATIONS.work.radius
    const isAtHome = distanceToHome <= KNOWN_LOCATIONS.home.radius
    const isCommuting = !isAtWork && !isAtHome

    let currentPlace: "work" | "home" | "unknown" = "unknown"
    if (isAtWork) currentPlace = "work"
    else if (isAtHome) currentPlace = "home"

    return {
        isAtWork,
        isAtHome,
        isCommuting,
        currentPlace
    }
}

// Get current location (with permission)
export async function getCurrentLocation(): Promise<Location | null> {
    return new Promise((resolve) => {
        if (!("geolocation" in navigator)) {
            console.warn("Geolocation not supported")
            resolve(null)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                })
            },
            (error) => {
                console.error("Geolocation error:", error)
                resolve(null)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        )
    })
}

// Watch location continuously (for background updates)
export function watchLocation(
    callback: (location: Location, context: LocationContext) => void
): number | null {
    if (!("geolocation" in navigator)) {
        return null
    }

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            const location: Location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
            }

            const context = detectLocationContext(location)
            callback(location, context)
        },
        (error) => {
            console.error("Location watch error:", error)
        },
        {
            enableHighAccuracy: false, // Battery-friendly
            timeout: 30000,
            maximumAge: 600000 // 10 minutes - reduces battery drain
        }
    )

    return watchId
}

// Stop watching location
export function stopWatchingLocation(watchId: number) {
    if ("geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId)
    }
}

// Save location to database for analytics
export async function saveLocationUpdate(
    userId: string,
    location: Location,
    context: LocationContext
) {
    try {
        await fetch("/api/location/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                location,
                context
            })
        })
    } catch (error) {
        console.error("Failed to save location:", error)
    }
}
