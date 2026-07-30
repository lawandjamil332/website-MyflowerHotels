/**
 * The shell every message from this site is poured into.
 *
 * Email is not the web and this file is written accordingly. Tables carry the
 * layout because Outlook still lays out with them; every rule is inline
 * because Gmail strips a <style> block the moment a message is forwarded; no
 * font is fetched, no script runs, no image is required for the message to
 * make sense. The card is 100% wide up to 600px — never a flat 600, which
 * hangs off the side of every phone it is read on.
 *
 * It also has to work in three languages, two of which read right to left —
 * so direction and text alignment are parameters here rather than assumptions
 * baked into each block.
 *
 * Structure is one piece of stationery rather than a stack of loose panels: a
 * dark masthead, a white sheet, a quiet footer. That is what the difference
 * between a receipt and a letter actually comes down to.
 */

export type Dir = 'ltr' | 'rtl'

const INK = '#1c1a17'
const SOFT = '#57514a'
const MUTED = '#8a8378'
const LINE = '#e7e2d9'
const CARD = '#ffffff'
const PAGE = '#f1ede4'
const BRAND = '#0f2f4a'
const GOLD = '#b08d4f'
const SERIF = `Georgia,'Times New Roman',Times,serif`

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

const start = (dir: Dir) => (dir === 'rtl' ? 'right' : 'left')
const end = (dir: Dir) => (dir === 'rtl' ? 'left' : 'right')

/** One labelled line. Label quiet and small, value doing the talking. */
export const row = (label: string, value: string, dir: Dir, opts: { strong?: boolean } = {}) =>
  `<tr>
    <td style="padding:0 0 12px 0;text-align:${start(dir)};font-family:${SERIF};font-size:12px;line-height:1.5;color:${MUTED};width:34%;vertical-align:top;">${label}</td>
    <td style="padding:0 0 12px 0;text-align:${start(dir)};font-family:${SERIF};font-size:${opts.strong ? '15px' : '14px'};line-height:1.55;color:${opts.strong ? INK : SOFT};${opts.strong ? 'font-weight:bold;' : ''}vertical-align:top;">${value}</td>
  </tr>`

/** A titled block on the sheet, separated by a rule rather than a box. */
export const panel = (title: string, inner: string, dir: Dir) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
    <tr><td style="padding:0 0 14px 0;text-align:${start(dir)};font-family:${SERIF};font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:${GOLD};">${title}</td></tr>
    <tr><td style="padding:0 0 26px 0;">${inner}</td></tr>
  </table>`

/** A hairline between sections, so the sheet has rhythm without boxes. */
export const rule = () =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr><td style="border-top:1px solid ${LINE};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr></table>
   <div style="height:26px;line-height:26px;font-size:0;">&nbsp;</div>`

/**
 * A button that is a table, because a styled <a> alone collapses in Outlook.
 * Full width on purpose: at a phone's width a row of side-by-side buttons
 * wraps into a ragged staircase, and a confirmation is read on a phone.
 */
export const button = (href: string, label: string, tone: 'dark' | 'green' | 'quiet' = 'dark') => {
  const bg = tone === 'green' ? '#1f8f4e' : tone === 'quiet' ? CARD : BRAND
  const fg = tone === 'quiet' ? INK : '#ffffff'
  const border = tone === 'quiet' ? `border:1px solid ${LINE};` : ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;margin:0 0 10px 0;">
    <tr><td align="center" bgcolor="${bg}" style="background:${bg};border-radius:6px;${border}">
      <a href="${esc(href)}" style="display:block;padding:14px 20px;font-family:${SERIF};font-size:15px;color:${fg};text-decoration:none;text-align:center;">${label}</a>
    </td></tr>
  </table>`
}

/** The reference, given the size it earns — it is why the message is kept. */
export const referenceBlock = (label: string, reference: string, dir: Dir) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${BRAND};border-radius:8px;" bgcolor="${BRAND}">
    <tr><td align="center" style="padding:24px 18px;">
      <div style="font-family:${SERIF};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a9bed0;padding-bottom:8px;">${label}</div>
      <div dir="ltr" style="font-family:${SERIF};font-size:32px;letter-spacing:3px;color:#ffffff;">${esc(reference)}</div>
    </td></tr>
  </table>
  <div style="height:26px;line-height:26px;font-size:0;">&nbsp;</div>`

/**
 * Arrival and departure, side by side.
 *
 * The two facts a guest re-opens the message to check, so they are given a
 * block of their own instead of two more rows in a list of ten. Two cells
 * rather than a nested grid: in right-to-left they swap over on their own,
 * which is correct, and no client has to be trusted with anything cleverer.
 */
export const stayDates = (
  dir: Dir,
  a: { label: string; date: string; note?: string | null },
  b: { label: string; date: string; note?: string | null },
  middle?: string | null,
) => {
  const cell = (c: { label: string; date: string; note?: string | null }) =>
    `<td width="50%" style="padding:18px 16px;vertical-align:top;text-align:${start(dir)};">
      <div style="font-family:${SERIF};font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:${GOLD};padding-bottom:7px;">${c.label}</div>
      <div style="font-family:${SERIF};font-size:16px;line-height:1.4;color:${INK};font-weight:bold;">${c.date}</div>
      ${c.note ? `<div style="font-family:${SERIF};font-size:12px;line-height:1.5;color:${MUTED};padding-top:5px;">${c.note}</div>` : ''}
    </td>`
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#faf8f3;border:1px solid ${LINE};border-radius:8px;" bgcolor="#faf8f3">
    <tr>${cell(a)}${cell(b)}</tr>
    ${
      middle
        ? `<tr><td colspan="2" style="border-top:1px solid ${LINE};padding:11px 16px;text-align:center;font-family:${SERIF};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${SOFT};">${middle}</td></tr>`
        : ''
    }
  </table>
  <div style="height:26px;line-height:26px;font-size:0;">&nbsp;</div>`
}

/** A short paragraph of plain prose. */
export const para = (text: string, dir: Dir) =>
  `<p style="margin:0 0 18px 0;text-align:${start(dir)};font-family:${SERIF};font-size:15px;line-height:1.75;color:${SOFT};">${text}</p>`

/** The reassurance band: no card taken, free cancellation. */
export const noticeBand = (lines: string[], dir: Dir) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#fbf7ed;border:1px solid #ecdfc4;border-radius:8px;" bgcolor="#fbf7ed">
    <tr><td style="padding:18px 20px;text-align:${start(dir)};">
      ${lines
        .map(
          (line, i) =>
            `<p style="margin:0 0 ${i === lines.length - 1 ? '0' : '10px'} 0;font-family:${SERIF};font-size:14px;line-height:1.65;color:${INK};">${line}</p>`,
        )
        .join('')}
    </td></tr>
  </table>
  <div style="height:26px;line-height:26px;font-size:0;">&nbsp;</div>`

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
  eyebrow,
  title,
  body,
  footerLines,
}: {
  dir: Dir
  siteName: string
  preheader: string
  heroUrl?: string | null
  eyebrow: string
  title: string
  body: string
  /** Contact line, then the quiet line explaining why this arrived. */
  footerLines: string[]
}): string =>
  `<!doctype html>
<html dir="${dir}" lang="${dir === 'rtl' ? 'ar' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};-webkit-text-size-adjust:100%;" bgcolor="${PAGE}">
<div style="display:none;font-size:1px;color:${PAGE};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${PAGE};" bgcolor="${PAGE}">
  <tr><td align="center" style="padding:24px 12px 32px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;max-width:600px;">

      <!-- Masthead. Reversed out of the navy so the name reads as a mark
           rather than as the first line of the letter. -->
      <tr><td align="center" bgcolor="${BRAND}" style="background:${BRAND};border-radius:8px 8px 0 0;padding:26px 20px;">
        <div style="font-family:${SERIF};font-size:19px;letter-spacing:4px;text-transform:uppercase;color:#ffffff;">${esc(siteName)}</div>
        <div style="font-family:${SERIF};font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:${GOLD};padding-top:8px;">${esc(eyebrow)}</div>
      </td></tr>

      ${
        heroUrl
          ? // alt is deliberately empty. A picture that fails to load should
            // leave nothing behind — with alt text, a broken image becomes a
            // grey box carrying the hotel's name, which reads as a fault in
            // the message rather than as a picture that did not arrive.
            `<tr><td style="font-size:0;line-height:0;"><img src="${esc(heroUrl)}" width="600" height="315" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>`
          : ''
      }

      <!-- The sheet. -->
      <tr><td bgcolor="${CARD}" style="background:${CARD};padding:34px 26px 30px 26px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
        <h1 style="margin:0 0 16px 0;text-align:${start(dir)};font-family:${SERIF};font-weight:normal;font-size:25px;line-height:1.35;color:${INK};">${title}</h1>
        ${body}
      </td></tr>

      <!-- Footer, on the page rather than the sheet. -->
      <tr><td bgcolor="${CARD}" style="background:${CARD};padding:0 26px 26px 26px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};border-bottom:1px solid ${LINE};border-radius:0 0 8px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
          <tr><td style="border-top:1px solid ${LINE};padding-top:20px;text-align:${start(dir)};">
            ${footerLines
              .map(
                (line, i) =>
                  `<p style="margin:0 0 ${i === footerLines.length - 1 ? '0' : '9px'} 0;font-family:${SERIF};font-size:${i === 0 ? '13px' : '11px'};line-height:1.65;color:${i === 0 ? SOFT : MUTED};">${line}</p>`,
              )
              .join('')}
          </td></tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

export { start as textStart, end as textEnd }
