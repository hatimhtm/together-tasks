import { Capacitor } from "@capacitor/core"
import { APP_VERSION, LATEST_RELEASE_API, RELEASES_PAGE } from "./version"

export type Platform = "android" | "ios" | "mac" | "web"

// Tauri (desktop) injects globals into window; Capacitor reports the native shell.
export function getPlatform(): Platform {
    if (typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)) {
        return "mac"
    }
    try {
        const p = Capacitor.getPlatform()
        if (p === "android") return "android"
        if (p === "ios") return "ios"
    } catch {
        // Capacitor not present (plain web) — fall through.
    }
    return "web"
}

export interface UpdateInfo {
    version: string
    notes: string
    // Direct platform-appropriate download (APK / DMG), or null on web where we just reload.
    downloadUrl: string | null
    releasePage: string
}

// Returns >0 if a > b, 0 if equal, <0 if a < b. Tolerates "1.2" vs "1.2.0".
function compareSemver(a: string, b: string): number {
    const pa = a.split(".").map((n) => parseInt(n, 10) || 0)
    const pb = b.split(".").map((n) => parseInt(n, 10) || 0)
    for (let i = 0; i < 3; i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0)
        if (diff !== 0) return diff
    }
    return 0
}

// Returns the latest release if it's newer than the running build, else null.
export async function checkForUpdate(): Promise<UpdateInfo | null> {
    let data: any
    try {
        const res = await fetch(LATEST_RELEASE_API, {
            headers: { Accept: "application/vnd.github+json" },
            cache: "no-store",
        })
        if (!res.ok) return null
        data = await res.json()
    } catch {
        return null
    }

    const latest = String(data?.tag_name || "").replace(/^v/, "")
    if (!latest || compareSemver(latest, APP_VERSION) <= 0) return null

    const platform = getPlatform()
    const assets: Array<{ name: string; browser_download_url: string }> = data.assets || []
    const find = (re: RegExp) => assets.find((a) => re.test(a.name))?.browser_download_url || null

    let downloadUrl: string | null = null
    if (platform === "android") {
        downloadUrl = find(/universal\.apk$/i) || find(/arm64\.apk$/i) || find(/\.apk$/i)
    } else if (platform === "mac") {
        downloadUrl = find(/\.dmg$/i)
    }

    return {
        version: latest,
        notes: typeof data.body === "string" ? data.body : "",
        downloadUrl,
        releasePage: data.html_url || RELEASES_PAGE,
    }
}

// Kicks off the install. On native we open the download (the OS handles the
// APK installer / DMG mount); on web/PWA we reload to pick up the new bundle.
export function applyUpdate(info: UpdateInfo): void {
    const platform = getPlatform()
    if (platform === "web") {
        if (typeof window !== "undefined") window.location.reload()
        return
    }
    const target = info.downloadUrl || info.releasePage
    if (typeof window !== "undefined") window.open(target, "_blank")
}

// Manual "check for updates" trigger — Settings dispatches this; the mounted
// UpdateChecker listens and runs the same flow as the launch check.
export const CHECK_UPDATE_EVENT = "togethertasks:check-update"
export function requestUpdateCheck() {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CHECK_UPDATE_EVENT))
}
