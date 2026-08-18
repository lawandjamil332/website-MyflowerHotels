/**
 * What a link to this site looks like when somebody sends it to somebody else.
 *
 * Which, for this hotel, is mostly WhatsApp. A guest asks a friend where to
 * stay in Erbil and pastes a hotel page into a chat, and what arrives is
 * either a photograph with a headline under it or a grey box — and that is
 * decided entirely by tags nobody ever looks at.
 *
 * Three things were wrong and all three are asserted here. The pages built
 * their Open Graph block by hand and so never got `type`, `site_name` or a
 * locale. The image was passed as a bare URL, so a share target had to fetch
 * it before it knew what shape it was, and WhatsApp draws the small square
 * thumbnail rather than the large card while it does not know. And the Arabic
 * homepage card carried an Arabic headline over an English sentence, because
 * its openGraph block set no description and fell through to the English one.
 */

let failed = 0
const ok = (name, cond, note = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${note ? `  — ${note}` : ''}`)
  if (!cond) failed++
}

const base = process.env.BASE_URL || 'http://localhost:3000'

const tags = async (path) => {
  const html = await (await fetch(base + path)).text()
  const out = {}
  for (const m of html.matchAll(/<meta property="(og:[^"]+)" content="([^"]*)"/g)) {
    if (out[m[1]]) out[m[1]] += `|${m[2]}`
    else out[m[1]] = m[2]
  }
  return out
}

// Arabic script, used to tell a translated card from an English one.
const arabic = /[؀-ۿݐ-ݿ]/

for (const [locale, path, expectLocale] of [
  ['en', '/en/branches/my-flower-3', 'en_GB'],
  ['ar', '/ar/branches/my-flower-3', 'ar_IQ'],
  ['ku', '/ku/branches/my-flower-3', 'ckb_IQ'],
]) {
  const t = await tags(path)
  ok(`${locale} card has a title`, !!t['og:title'], t['og:title'])
  ok(`${locale} card has a description`, !!t['og:description'])
  ok(`${locale} card names the site`, !!t['og:site_name'])
  ok(`${locale} card declares its type`, t['og:type'] === 'website', t['og:type'])
  ok(`${locale} card declares its language`, t['og:locale'] === expectLocale, t['og:locale'])
  // The pair that decides thumbnail versus large card.
  ok(`${locale} card states the image size`, t['og:image:width'] === '1200' && t['og:image:height'] === '630', `${t['og:image:width']}x${t['og:image:height']}`)
  ok(`${locale} card describes the image`, !!t['og:image:alt'])
  ok(`${locale} card names the other two languages`, (t['og:locale:alternate'] ?? '').split('|').length === 2, t['og:locale:alternate'])

  if (locale !== 'en') {
    ok(`${locale} card is written in ${locale}`, arabic.test(t['og:title'] ?? ''), t['og:title'])
    // Latin commas in right-to-left prose: the same small wrongness as a Latin
    // hotel name, on the sentence a friend actually reads in the chat.
    ok(`${locale} card is punctuated in ${locale}`, !/[^\s],\s/.test(t['og:description'] ?? ''), t['og:description'])
  }
}

// The homepage, where the description fell through to English.
for (const [locale, expectArabic] of [['ar', true], ['ku', true], ['en', false]]) {
  const t = await tags(`/${locale}`)
  const desc = t['og:description'] ?? ''
  ok(`the ${locale} homepage card has its own words`, !!desc)
  ok(
    `and they are in ${locale}`,
    arabic.test(desc) === expectArabic,
    desc.slice(0, 56),
  )
}

// The image has to actually exist, and stay small enough to be fetched by a
// chat app on an Iraqi mobile connection.
{
  const t = await tags('/en/branches/my-flower-3')
  const url = new URL(t['og:image']).pathname
  const res = await fetch(base + url)
  const bytes = Number(res.headers.get('content-length') || 0)
  ok('the share image loads', res.ok, `HTTP ${res.status}`)
  ok('and is a picture', (res.headers.get('content-type') || '').startsWith('image/'))
  // WhatsApp gives up on large preview images; 300KB is the usual ceiling.
  ok('and is small enough to preview', bytes > 0 && bytes < 300_000, `${Math.round(bytes / 1024)} KB`)
}

console.log(`\n${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
