/**
 * The other ways this hotel's name gets written.
 *
 * The name has a space in it, and half the internet does not put it there.
 * Booking.com carries these hotels as "MyFlower 1 Hotel" and "MyFlower 3
 * Hotel" — one word, "Hotel" on the end — where the sign outside, this
 * website and the WhatsApp replies all say "My Flower 1". The two Booking.com
 * listings do not even agree with each other on the URL.
 *
 * A search engine has no way to know those are the same building. It is not
 * being obtuse: "MyFlower" and "My Flower" are different strings, and hotels
 * with similar names in the same city are common enough that guessing would
 * be worse. So it reads one brand as several unrelated properties, which is
 * exactly why nothing describes this as a group of four, and why the 1,558
 * reviews sitting on one of those listings do nothing for the other three.
 *
 * `sameAs` already points at the listings, which is the strong signal. This is
 * the cheap one that costs nothing and works even where no link exists: state
 * the spellings outright, in the field made for exactly this.
 *
 * Only orthography. Nothing here is a claim about anything — every variant is
 * the same words with the space moved or the word "Hotel" added, which is the
 * only kind of alias that can be generated safely. Names that are not written
 * in Latin letters get none, because the transformations below are meaningless
 * against Arabic or Kurdish and would produce nonsense.
 */
export const nameVariants = (name?: string | null): string[] => {
  const canonical = (name ?? '').trim()
  if (!canonical) return []

  // "My Flower 3" — two or more Latin words, optionally ending in a number.
  // Anything else is left alone rather than mangled.
  if (!/^[A-Za-z][A-Za-z\s]*\d*$/.test(canonical)) return []

  const words = canonical.split(/\s+/)
  if (words.length < 2) return []

  const squashed = canonical.replace(/\s+/g, '')
  // "My Flower 3" → "MyFlower 3": the brand run together, the number kept
  // apart, which is precisely how Booking.com spells it.
  const brandSquashed = /\d$/.test(canonical)
    ? `${words.slice(0, -1).join('')} ${words[words.length - 1]}`
    : squashed

  const variants = [
    brandSquashed,
    `${brandSquashed} Hotel`,
    `${canonical} Hotel`,
    `Hotel ${canonical}`,
  ]

  // Deduplicated, and never repeating the name it is an alias for.
  return [...new Set(variants)].filter((v) => v && v !== canonical)
}
