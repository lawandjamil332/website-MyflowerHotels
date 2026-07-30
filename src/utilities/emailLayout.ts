/**
 * The shell every message from this site is poured into.
 *
 * Email is not the web and this file is written accordingly. Tables carry the
 * layout because Outlook still lays out with them; every rule is inline
 * because Gmail strips a <style> block the moment a message is forwarded; no
 * font is fetched, no script runs, no image is required for the message to
 * make sense. Widths are fixed at 600px, the one number every client agrees
 * about.
 *
 * It also has to work in three languages, two of which read right to left —
 * so direction and text alignment are parameters here rather than assumptions
 * baked into each block.
 */

export type Dir = 'ltr' | 'rtl'

const INK = '#1c1a17'
const SOFT = '#5d574e'
const MUTED = '#8a8378'
const LINE = '#e4dfd6'
const CARD = '#ffffff'
const PAGE = '#f4f1ea'
const BRAND = '#0f2f4a'
const GOLD = '#b08d4f'

export const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Escapes, and fences the result off from the sentence around it.
 *
 * "My Flower 1" and "Lawand Jamil" are Latin script sitting inside Kurdish and
 * Arabic sentences, and the rules for laying out mixed direction do not stop at
 * the value — a Latin run at the end of a right-to-left line gets dragged to
 * the far side, taking the comma before it along, so the heading came out as
 * "Lawand Jamil ،ژوورەکەت حیجز کرا".
 *
 * U+2068 and U+2069 are the first-strong isolate and its terminator: they tell
 * the layout to treat what is between them as one opaque object with its own
 * direction, and to leave the sentence around it alone. Plain characters, not
 * markup, so no mail client has to support anything — <bdi> would be the web
 * answer and half of them ignore it.
 */
export const iso = (value: unknown): string => {
  const text = esc(value)
  return text ? `⁨${text}⁩` : text
}

/** One labelled line inside a panel. */
export const row = (label: string, value: string, dir: Dir, opts: { strong?: boolean } = {}) => {
  const start = dir === 'rtl' ? 'right' : 'left'
  return `<tr>
    <td style="padding:0 0 10px 0;text-align:${start};font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.5;color:${MUTED};width:38%;vertical-align:top;">${label}</td>
    <td style="padding:0 0 10px 0;text-align:${start};font-family:Georgia,'Times New Roman',serif;font-size:${opts.strong ? '16px' : '14px'};line-height:1.5;color:${opts.strong ? INK : SOFT};${opts.strong ? 'font-weight:bold;' : ''}vertical-align:top;">${value}</td>
  </tr>`
}

/** A bordered block with a heading — "Reservation summary", "Policies". */
export const panel = (title: string, inner: string, dir: Dir) => {
  const start = dir === 'rtl' ? 'right' : 'left'
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${CARD};border:1px solid ${LINE};border-radius:10px;margin:0 0 16px 0;">
    <tr><td style="padding:22px 24px;">
      <p style="margin:0 0 16px 0;text-align:${start};font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${GOLD};">${title}</p>
      ${inner}
    </td></tr>
  </table>`
}

/** A button that is a table, because a styled <a> alone collapses in Outlook. */
export const button = (href: string, label: string, tone: 'dark' | 'green' = 'dark') => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0 6px 8px 0;display:inline-block;">
    <tr><td style="background:${tone === 'green' ? '#1f8f4e' : BRAND};border-radius:6px;">
      <a href="${esc(href)}" style="display:inline-block;padding:13px 22px;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#ffffff;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`

/**
 * The whole message.
 *
 * `preheader` is the grey line a phone shows next to the subject in the list.
 * Left out, clients grab whatever text comes first — usually the hotel's
 * address or the word "reference" — so it is written deliberately.
 */
export const emailShell = ({
  dir,
  siteName,
  preheader,
  heroUrl,
  heroAlt,
  eyebrow,
  title,
  body,
  footer,
}: {
  dir: Dir
  siteName: string
  preheader: string
  heroUrl?: string | null
  heroAlt?: string
  eyebrow: string
  title: string
  body: string
  footer: string
}): string => {
  const start = dir === 'rtl' ? 'right' : 'left'
  return `<!doctype html>
<html dir="${dir}" lang="${dir === 'rtl' ? 'ar' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};">
<div style="display:none;font-size:1px;color:${PAGE};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${PAGE};">
  <tr><td align="center" style="padding:28px 12px;">
    <!-- 100% up to 600, not a flat 600. Fixed at 600px this was wider than
         every phone it was read on, so the message overflowed sideways, the
         right edge was cut off and the vertical scroll fought back — which is
         what "cannot scroll all the way down" was. -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;max-width:600px;">

      <tr><td align="center" style="padding:0 0 22px 0;">
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:3px;text-transform:uppercase;color:${INK};">${esc(siteName)}</p>
        <p style="margin:6px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">${esc(eyebrow)}</p>
      </td></tr>

      ${
        heroUrl
          ? // alt is deliberately empty. A picture that fails to load should
            // leave nothing behind — with alt text, a broken image becomes a
            // grey box carrying the hotel's name, which reads as a fault in
            // the message rather than as a picture that did not arrive.
            `<tr><td style="padding:0 0 18px 0;">
               <img src="${esc(heroUrl)}" width="600" height="315" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:10px;">
             </td></tr>`
          : ''
      }

      <tr><td style="padding:0 0 18px 0;text-align:${start};">
        <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:26px;line-height:1.3;color:${INK};">${esc(title)}</h1>
      </td></tr>

      <tr><td>${body}</td></tr>

      <tr><td style="padding:14px 4px 0 4px;text-align:${start};">
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.7;color:${MUTED};">${footer}</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

/** The reference, given the size it earns — it is why the message is kept. */
export const referenceBlock = (label: string, reference: string, dir: Dir) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${BRAND};border-radius:10px;margin:0 0 16px 0;">
    <tr><td align="center" style="padding:26px 20px;">
      <p style="margin:0 0 8px 0;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.72);">${label}</p>
      <p dir="ltr" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;letter-spacing:3px;color:#ffffff;">${esc(reference)}</p>
    </td></tr>
  </table>`

/** A short paragraph of plain prose between panels. */
export const para = (text: string, dir: Dir) => {
  const start = dir === 'rtl' ? 'right' : 'left'
  return `<p style="margin:0 0 16px 0;padding:0 4px;text-align:${start};font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:${SOFT};">${text}</p>`
}

/** The reassurance band: no card taken, free cancellation. */
export const noticeBand = (lines: string[], dir: Dir) => {
  const start = dir === 'rtl' ? 'right' : 'left'
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#fbf7ee;border:1px solid #ecdfc4;border-radius:10px;margin:0 0 16px 0;">
    <tr><td style="padding:18px 24px;text-align:${start};">
      ${lines
        .map(
          (line) =>
            `<p style="margin:0 0 8px 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.6;color:${INK};">${line}</p>`,
        )
        .join('')}
    </td></tr>
  </table>`
}
