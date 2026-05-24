import type { Metadata, Viewport } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import Providers from "@/components/providers"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })

export const metadata: Metadata = {
  title: "Together Tasks",
  description: "A premium shared task manager for couples",
  manifest: "/manifest.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  // Required for env(safe-area-inset-*) to report non-zero on notched devices.
  viewportFit: "cover",
}

const VALID_THEMES = ['daylight', 'midnight', 'burgundy', 'aurora', 'obsidian', 'ocean', 'rose']
// Map ids from older builds onto the current set so a saved theme never falls through to bare :root.
const LEGACY_THEME_MAP: Record<string, string> = { light: 'daylight', dark: 'midnight', floral: 'rose', creamy: 'daylight' }

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let dbTheme = "obsidian"
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("theme")
      .eq("id", user.id)
      .single()
    const saved = profile?.theme
    if (saved && saved !== 'system') {
      dbTheme = VALID_THEMES.includes(saved) ? saved : (LEGACY_THEME_MAP[saved] || 'obsidian')
    }
  }

  // We pass suppressHydrationWarning to both html and body to support next-themes properly
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          inter.className,
          inter.variable,
          plusJakarta.variable,
          "antialiased min-h-screen relative selection:bg-primary/30 font-body bg-background text-on-surface"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={dbTheme}
          enableSystem={false}
          themes={['daylight', 'midnight', 'burgundy', 'aurora', 'obsidian', 'ocean', 'rose']}
        >
          {/* Ambient background — uses theme CSS variables so it shifts with every theme */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-background transition-colors duration-700">
            <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/8 blur-[140px] animate-blob" />
            <div className="absolute top-[25%] right-[-15%] w-[50%] h-[50%] rounded-full bg-secondary/8 blur-[140px] animate-blob animation-delay-2000" />
            <div className="absolute bottom-[-20%] left-[15%] w-[55%] h-[55%] rounded-full bg-accent/6 blur-[160px] animate-blob animation-delay-4000" />
          </div>

          <Providers>
            <div className="min-h-screen text-foreground relative z-0">
              {children}
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
