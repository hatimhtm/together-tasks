import { ImageResponse } from 'next/og'

export const runtime = 'edge'
// Image metadata
export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 24,
                    background: 'linear-gradient(to bottom right, #ff2a83, #622aff)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '6px',
                }}
            >
                <div style={{ display: 'flex', fontWeight: 'bold', fontSize: 20 }}>
                    ∞
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
