import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * The picture that appears when a link to this site is pasted into WhatsApp.
 *
 * In this market that is the link — the brief says so plainly — and the default
 * was a stock image shipped with the Payload template. This draws a branded
 * card instead: ink ground, the lotus in brass, the hotel's name set in the
 * same serif the site uses.
 *
 * Built per request from ?title= and ?eyebrow=, so every hotel and every room
 * gets its own card without anyone opening an image editor.
 */
export const runtime = 'nodejs'

const font = async (file: string) =>
  readFile(path.join(process.cwd(), 'node_modules/@fontsource', file))

/** The group's own flower, inlined so the renderer needs no network. */
const markDataUri = async () => {
  const png = await readFile(path.join(process.cwd(), 'public', 'mark.png'))
  return `data:image/png;base64,${png.toString('base64')}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = (searchParams.get('title') || 'My Flower Hotels').slice(0, 80)
  const eyebrow = (searchParams.get('eyebrow') || 'Erbil · Kurdistan Region, Iraq').slice(0, 60)

  try {
    const [display, body, mark] = await Promise.all([
      font('cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff'),
      font('ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff'),
      markDataUri(),
    ])

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#1a1714',
            padding: '72px 80px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} alt="" width={86} height={86} />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontFamily: 'Plex',
                fontSize: 22,
                letterSpacing: 6,
                textTransform: 'uppercase',
                color: '#c2a06a',
                marginBottom: 28,
              }}
            >
              {eyebrow}
            </div>
            <div
              style={{
                fontFamily: 'Cormorant',
                fontSize: title.length > 34 ? 84 : 108,
                lineHeight: 1.03,
                color: '#f7f4ef',
                maxWidth: 980,
              }}
            >
              {title}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Cormorant', data: display, style: 'normal', weight: 500 },
          { name: 'Plex', data: body, style: 'normal', weight: 400 },
        ],
        headers: { 'cache-control': 'public, max-age=3600, s-maxage=86400' },
      },
    )
  } catch {
    // A share card is decoration; never let it 500 a page's metadata.
    return new Response(null, { status: 204 })
  }
}
