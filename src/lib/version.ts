// Single source of truth for the app version + where updates come from.
// Bump APP_VERSION in lockstep with the git tag you release (e.g. tag v2.5.0 → "2.5.0").
export const APP_VERSION = "3.0.4"

// Public GitHub repo the in-app updater reads releases from.
export const GITHUB_REPO = "hatimhtm/together-tasks"
export const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
export const RELEASES_PAGE = `https://github.com/${GITHUB_REPO}/releases/latest`
