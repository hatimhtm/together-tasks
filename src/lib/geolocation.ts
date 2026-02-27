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

// Known locations (configurable via environment variables)
const getKnownLocations = () => ({
    work: {
        lat: Number(process.env.NEXT_PUBLIC_WORK_LAT) || 0,
        lng: Number(process.env.NEXT_PUBLIC_WORK_LNG) || 0,
        radius: Number(process.env.NEXT_PUBLIC_WORK_RADIUS) || 200 // meters
    },
    home: {
        lat: Number(process.env.NEXT_PUBLIC_HOME_LAT) || 0,
        lng: Number(process.env.NEXT_PUBLIC_HOME_LNG) || 0,
        radius: Number(process.env.NEXT_PUBLIC_HOME_RADIUS) || 100 // meters
    }
})

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
    const knownLocations = getKnownLocations()

    const distanceToWork = calculateDistance(
        latitude,
        longitude,
        knownLocations.work.lat,
        knownLocations.work.lng
    )

    const distanceToHome = calculateDistance(
        latitude,
        longitude,
        knownLocations.home.lat,
        knownLocations.home.lng
    )

    const isAtWork = distanceToWork <= knownLocations.work.radius
    const isAtHome = distanceToHome <= knownLocations.home.radius
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
        console.log("Local static build: location update tracked locally.", { userId, location, context })
        // Implement native capacitor background tracking later via plugin
    } catch (error) {
        console.error("Failed to save location:", error)
    }
}
