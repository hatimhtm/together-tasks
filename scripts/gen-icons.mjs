// Regenerates every app icon from the Together Tasks mark (orange squircle,
// white heart, orange check). Run: node scripts/gen-icons.mjs
import sharp from "sharp"
import { mkdir, writeFile, readdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")

const HEART = `M256 366C150 291 118 219 118 177C118 139 148 110 186 110C212 110 238 126 256 151C274 126 300 110 326 110C364 110 394 139 394 177C394 219 362 291 256 366Z`
const CHECK = `M201 228L240 268L317 188`
const GRAD = `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffb24d"/><stop offset="100%" stop-color="#ff6a1f"/></linearGradient>`

// Full app icon — rounded-square gradient + white heart + orange check.
const FULL = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs>${GRAD}</defs><rect width="512" height="512" rx="116" fill="url(#g)"/><path d="${HEART}" fill="#ffffff"/><path d="${CHECK}" stroke="#ff6a1f" stroke-width="34" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
// Adaptive foreground — heart+check only, scaled to ~70% so it sits in the safe zone.
const FG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g transform="translate(256 256) scale(0.7) translate(-256 -256)"><path d="${HEART}" fill="#ffffff"/><path d="${CHECK}" stroke="#ff6a1f" stroke-width="34" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`
// Adaptive background — full-bleed gradient (system masks the shape).
const BG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs>${GRAD}</defs><rect width="512" height="512" fill="url(#g)"/></svg>`
// Launch splash — dark canvas with the centered mark (shown CENTER_CROP, so a
// square image works for both portrait and landscape).
const SPLASH = `<svg width="1280" height="1280" viewBox="0 0 1280 1280" xmlns="http://www.w3.org/2000/svg"><defs>${GRAD}</defs><rect width="1280" height="1280" fill="#0a0a0a"/><g transform="translate(640 640) scale(0.62) translate(-256 -256)"><rect width="512" height="512" rx="116" fill="url(#g)"/><path d="${HEART}" fill="#ffffff"/><path d="${CHECK}" stroke="#ff6a1f" stroke-width="34" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`

async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    const files = []
    for (const e of entries) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) files.push(...await walk(full))
        else files.push(full)
    }
    return files
}

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
const webp = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).webp().toBuffer()

async function out(rel, buf) {
    const p = path.join(root, rel)
    await mkdir(path.dirname(p), { recursive: true })
    await writeFile(p, buf)
    console.log("wrote", rel)
}

const LEGACY = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
const ADAPT = { ldpi: 81, mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }
const PWA = [48, 72, 96, 128, 192, 256, 512]

async function main() {
    // Web / favicon / Tauri source
    await out("public/icon.svg", Buffer.from(FULL))
    await out("public/logo.svg", Buffer.from(FULL))
    await out("public/icon.png", await png(FULL, 512))
    await out("src/app/apple-icon.png", await png(FULL, 180))

    // PWA manifest icons
    for (const s of PWA) await out(`icons/icon-${s}.webp`, await webp(FULL, s))

    // Android launcher icons (only if the android project is present)
    if (existsSync(path.join(root, "android/app/src/main/res"))) {
        for (const [d, s] of Object.entries(LEGACY)) {
            const full = await png(FULL, s)
            await out(`android/app/src/main/res/mipmap-${d}/ic_launcher.png`, full)
            await out(`android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, full)
        }
        for (const [d, s] of Object.entries(ADAPT)) {
            await out(`android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, await png(FG, s))
            await out(`android/app/src/main/res/mipmap-${d}/ic_launcher_background.png`, await png(BG, s))
        }
        // Overwrite every splash.png (all densities + port/land + night variants) with the new mark.
        const splashBuf = await sharp(Buffer.from(SPLASH)).png().toBuffer()
        const resDir = path.join(root, "android/app/src/main/res")
        for (const f of await walk(resDir)) {
            if (path.basename(f) === "splash.png") { await writeFile(f, splashBuf); console.log("wrote", path.relative(root, f)) }
        }
    }
    console.log("done")
}
main()
