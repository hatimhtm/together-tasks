export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="bg-surface text-on-surface font-body min-h-screen flex items-center justify-center relative overflow-hidden selection:bg-primary/30">
            {/* Ambient Background Decorations */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
                
                {/* Romantic Glow */}
                <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, rgba(255, 177, 199, 0.15) 0%, rgba(22, 19, 17, 0) 70%)'}}></div>
                
                {/* Floating Elements */}
                <div className="absolute top-20 left-10 opacity-20 transform -rotate-12">
                    <span className="material-symbols-outlined text-secondary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
                <div className="absolute bottom-40 right-20 opacity-10 transform rotate-45 scale-150">
                    <span className="material-symbols-outlined text-primary text-9xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
                <div className="absolute top-1/2 left-1/4 opacity-5 transform rotate-12 scale-75">
                    <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
            </div>

            <main className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center justify-center min-h-screen">
                {children}
            </main>
        </div>
    )
}
