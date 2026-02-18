import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Providers from "@/components/providers"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

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
          inter.className,
          "antialiased min-h-screen",
          themeClass
        )}
      >
        <Providers>
          <div className="min-h-screen text-foreground overflow-x-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
