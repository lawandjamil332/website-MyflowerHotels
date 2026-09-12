import type { ReactNode } from 'react'

import type { GuideSection } from '@/i18n/guides'
import { cn } from '@/utilities/ui'
import { Reveal } from './Reveal'
import { sectionY, shell } from './ui'

/**
 * The body of a guide page: one question, answered, then the working.
 *
 * Set as a single column of prose rather than in the bands of photographs and
 * cards the rest of the site uses. These pages are read, not browsed — somebody
 * arrives on one from a search for the question in its heading, and what they
 * want is the answer and then the evidence, in that order, in one column they
 * can run down. A rail of hotel cards between two paragraphs would be the site
 * interrupting its own argument to sell a room.
 *
 * The measure is capped well short of the page shell. A line of text much over
 * seventy-five characters is measurably harder to come back to at the start of
 * the next line, and these pages carry more continuous prose than anything else
 * on the site.
 */

/**
 * `**bold**`, and nothing else.
 *
 * The landscape page lists companies with their names in bold, which is one
 * formatting need across three languages — not a reason to put a markdown
 * renderer in the bundle, and certainly not a reason to accept raw HTML from a
 * translation string. Anything that is not a matched pair of asterisks is left
 * as the literal characters.
 */
const emphasise = (text: string): ReactNode[] =>
  text.split('**').map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-ink">
        {part}
      </strong>
    ) : (
      part
    ),
  )

export function GuideArticle({
  sections,
  extras,
  children,
}: {
  sections: GuideSection[]
  /**
   * Blocks to place after a given section, by its index.
   *
   * The tables — the hotels, the distances — are built from the database and
   * belong inside the argument rather than after it, and they are the one thing
   * on these pages that cannot come out of a translation file.
   */
  extras?: Record<number, ReactNode>
  /** Anything closing the article: the checked stamp, links onward. */
  children?: ReactNode
}) {
  return (
    <section className={cn(shell, sectionY)}>
      <div className="max-w-[46rem]">
        {sections.map((section, i) => (
          <div key={section.heading} className={i === 0 ? undefined : 'mt-12'}>
            <Reveal>
              <h2 className="font-display text-[1.6rem] leading-tight text-balance text-ink sm:text-[1.9rem]">
                {section.heading}
              </h2>
            </Reveal>
            {section.paragraphs.map((paragraph, p) => (
              <Reveal key={p} delay={60 + p * 60}>
                <p className="mt-5 text-[1.02rem] leading-[1.75] text-muted-ink sm:text-[1.06rem]">
                  {emphasise(paragraph)}
                </p>
              </Reveal>
            ))}
            {extras?.[i]}
          </div>
        ))}
        {children}
      </div>
    </section>
  )
}

/**
 * The opening answer, set apart from everything under it.
 *
 * Its own treatment because of what it is for: it is the paragraph a search
 * engine or an assistant lifts whole, and the one a reader who is not going to
 * read the page still reads. Larger than the body, in the ink colour rather
 * than the muted one, and above the first heading rather than under it.
 */
export function GuideLead({ children }: { children: ReactNode }) {
  return (
    <section className={cn(shell, 'pt-11 sm:pt-14 lg:pt-16')}>
      <Reveal immediate className="max-w-[46rem]">
        <p className="text-[1.12rem] leading-[1.7] text-ink-soft sm:text-[1.2rem]">{children}</p>
      </Reveal>
    </section>
  )
}
