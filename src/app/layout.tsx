import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import Providers from "@/components/providers"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Together Tasks",
  description: "A premium shared task manager for couples",
  manifest: "/manifest.json",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let themeClass = ""
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("theme")
      .eq("id", user.id)
      .single()
    if (profile?.theme && profile.theme !== 'system') {
      themeClass = `theme-${profile.theme}`
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          outfit.className,
          "antialiased min-h-screen relative selection:bg-primary/30",
          themeClass
        )}
      >
        {/* Animated Aurora Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-background transition-colors duration-1000">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pink-500/20 blur-[120px] mix-blend-screen animate-blob" />
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[150px] mix-blend-screen animate-blob animation-delay-4000" />
          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        </div>

        <Providers>
          <div className="min-h-screen text-foreground overflow-x-hidden relative z-0">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
