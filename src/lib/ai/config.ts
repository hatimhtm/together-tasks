// Single source of truth for Gemini wiring.
//
// In a Capacitor static export there is NO server, so only NEXT_PUBLIC_* env
// vars survive into the bundle. The non-public GEMINI_API_KEY is stripped at
// build time and resolves to undefined on device — which is why AI silently
// died in the native builds. Always resolve through here.
export const GEMINI_MODEL = 'gemini-2.5-flash'

export function resolveGeminiKey(): string {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
}

export function geminiGenerateUrl(model: string = GEMINI_MODEL): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
}
