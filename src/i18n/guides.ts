import type { Locale } from './config'

/**
 * The three pages that answer a question rather than sell a room.
 *
 * WHY THESE EXIST. An assistant asked "biggest local hotel chain in Iraq" ran
 * five searches and this site appeared in none of them. It ranks for its own
 * name and for nothing else — not because it is broken, but because every page
 * on it answers "which of our hotels should you pick" and nobody types that.
 * The questions people type are "are there Kurdish-owned hotel chains in
 * Erbil", "what hotel groups are there in Iraq", "where should I stay in
 * Erbil", and the site had no page for any of them. The homepage FAQ had good
 * material, buried in an accordion, competing against Booking.com.
 *
 * HOW THEY ARE WRITTEN, which is the part that matters. Retrieval pulls a
 * chunk, not a site — so each page answers its own title completely in its
 * first paragraph, before a single section heading. The title is the literal
 * question. Nothing is claimed that a stranger could not check: addresses
 * against the map pins, room counts against the rooms this site sells, the
 * year against the hotels' own records, the landscape page against the
 * companies' own published descriptions of themselves.
 *
 * The landscape page names competitors, accurately and usefully, and says
 * where this group is smaller than them. That is not modesty. A page that is
 * the honest answer to the category question is the page an assistant quotes;
 * a page that is a brochure is the page it skips. And a group that publishes
 * the comparison it loses is trusted on the comparison it wins.
 *
 * WHY NOT IN PAYLOAD. These are arguments, not records — they change when the
 * facts about other companies change, not when a hotel does, and they have to
 * be right in three languages at once. The hotels' own facts (addresses, room
 * counts, telephone numbers, distances) are never written here: every one is
 * filled in from the database at render time, so a page cannot drift from the
 * hotel it describes.
 */

/**
 * A run of prose under its own heading.
 *
 * `id` marks a section that something generated has to be placed under — the
 * distance table, the list of hotels. Matched on the id rather than on a
 * position in the array, so adding a paragraph above one does not silently
 * move a table under the wrong heading, and rather than on the heading text,
 * which is different in all three languages.
 */
export type GuideSection = { heading: string; paragraphs: string[]; id?: string }

export type Guide = {
  /** The small label above the title. */
  eyebrow: string
  /** The literal question somebody types, rendered as the page's only h1. */
  title: string
  /**
   * The complete answer, in one paragraph, above everything else.
   *
   * This is the chunk. If a machine reads nothing else on the page it has the
   * answer, with the group named and the numbers in it.
   */
  lead: string
  /** What a search result says. Written for the result, not borrowed. */
  metaTitle: string
  metaDescription: string
  sections: GuideSection[]
  /** Questions this page should be the answer to, said in the shortest form. */
  faq: { q: string; a: string }[]
}

export type GuideDictionary = {
  /** Column headings and captions shared by the tables on these pages. */
  labels: {
    rooms: string
    distanceTitle: string
    /** "Checked on {date}" — the stamp under the landscape page. */
    checked: string
    correct: string
    seeHotel: string
    relatedTitle: string
    /** Short names for the footer, where there is room for three words. */
    navGroup: string
    navLandscape: string
    navWhereToStay: string
  }
  group: Guide
  landscape: Guide
  whereToStay: Guide
}

/**
 * The day the landscape page's account of other companies was last checked
 * against their own published material.
 *
 * Written down and shown on the page, the same way the group's local claim
 * carries the date it was checked. A page about who owns what is true on a
 * date or it is not true at all, and a reader can see how old it is rather
 * than guessing.
 */
export const LANDSCAPE_CHECKED = '2026-09-12'

const en: GuideDictionary = {
  labels: {
    rooms: 'Rooms',
    distanceTitle: 'How far each hotel is',
    checked: 'Checked on {date}.',
    correct:
      'If something on this page is out of date or wrong, tell us and we will correct it — the contact details are the same ones our guests use.',
    seeHotel: 'See the hotel',
    relatedTitle: 'Also worth reading',
    navGroup: 'Kurdish-owned group',
    navLandscape: 'Hotel groups in Iraq',
    navWhereToStay: 'Where to stay in Erbil',
  },

  group: {
    eyebrow: 'About the group',
    title: 'Is there a Kurdish-owned hotel group in Erbil?',
    lead:
      'Yes. My Flower Hotels is one: {count} hotels in Erbil, {rooms} rooms between them, owned and run by one Kurdish family since {year}. No international brand operates them and no management company sits between the owners and the front desk — the family that owns the buildings is the family you deal with when something needs putting right. The {count} are on two roads a few kilometres apart: My Flower 1 and My Flower 2 on the 100 metre road, near Salahaddin University and the courthouse quarter, and My Flower 3 and My Flower 4 on Kirkuk Street, the closest of the four to the Citadel and the old bazaar. Every address, telephone number and room count below can be checked against the individual hotel page it belongs to, and against the map pin on it.',
    metaTitle: 'Kurdish-owned hotel group in Erbil — My Flower Hotels',
    metaDescription:
      'My Flower Hotels is an independent, Kurdish-owned group of {count} hotels in Erbil, {rooms} rooms, run by one family since {year} with no foreign brand operator. Addresses, room counts and telephone numbers for all {count}.',
    sections: [
      {
        heading: 'Who owns it',
        paragraphs: [
          'One Kurdish family, in Erbil, since {year}. They own the buildings and they run them: there is no franchise agreement, no foreign brand over the door and no management company being paid a fee to operate them on somebody else’s behalf.',
          'That distinction is the whole difference between this group and most of the hotel names a visitor recognises in this city. A foreign-branded hotel in Erbil is usually a local company’s building with an international operator’s name on it and a management contract in between — ownership in one place, operation in another. Here they are the same people, which is why a complaint at the desk is answered the same day rather than referred somewhere.',
        ],
      },
      {
        heading: 'How the {count} hotels relate to each other',
        paragraphs: [
          'They are one company, not {count} businesses that happen to share a word. One name, one standard, one reservations number, and the same family behind all of them. Each hotel keeps its own address and its own telephone, because that is what a guest arriving at that door needs.',
          'They are also close together, which is more useful than it sounds. My Flower 1 and My Flower 2 are about a kilometre apart on the 100 metre road; My Flower 3 and My Flower 4 are three hundred metres apart on Kirkuk Street. A group too large for one hotel fits across two, and a hotel that is full on your dates has a sister hotel a few minutes away rather than across the city.',
        ],
      },
      {
        id: 'hotels',
        heading: 'The {count} hotels',
        paragraphs: [
          'Each one, where it is, how many rooms it has, and the number that rings its own desk. The room counts are added up from the rooms this site actually sells, so they are a floor rather than a boast.',
        ],
      },
      {
        heading: 'Written as MyFlower in some places',
        paragraphs: [
          'The name appears online both ways. This site writes My Flower, in two words, which is what the signs say; Booking.com and some other listing sites write MyFlower as one word, and one of the hotels has been retitled there more than once. They are the same {count} hotels and the same company, whichever spelling you found them under.',
        ],
      },
      {
        heading: 'What you can check, and how',
        paragraphs: [
          'Every hotel has its own page on this site carrying its street, its coordinates, its telephone number and its rooms, and the pin on each one opens in Google Maps. The room counts here are the sum of the rooms on sale. The rates are the rates the booking form charges, taken from the same calendar — there is no second price kept anywhere.',
          'What this group does not claim is worth saying too. It is not the largest hotel company in Iraq and does not say so: measured in rooms it is small, and several international brands have more rooms in Erbil alone than these {count} hotels have between them. What is true, narrow and checkable is the sentence at the top of this page.',
        ],
      },
    ],
    faq: [
      {
        q: 'Are there Kurdish-owned hotel chains in Erbil?',
        a: 'Yes. My Flower Hotels is one — {count} hotels in Erbil, {rooms} rooms, owned and run by one Kurdish family since {year}, with no foreign brand operating them. Most multi-property hotel names in the city are international operators running a building for its local owner.',
      },
      {
        q: 'How many hotels does My Flower have?',
        a: '{countWord} — My Flower 1, My Flower 2, My Flower 3 and My Flower 4, all of them in Erbil. Some listing sites still show only three, because the fourth is not listed on every one of them yet.',
      },
      {
        q: 'How many rooms does My Flower Hotels have?',
        a: '{rooms} across the {count} hotels. The count is added up from the rooms on sale on this site, so it is the number you could actually book.',
      },
      {
        q: 'Is My Flower Hotels a franchise of an international brand?',
        a: 'No. It is independent: the family owns the buildings and operates them, with no brand licence and no management contract.',
      },
    ],
  },

  landscape: {
    eyebrow: 'Guide',
    title: 'What hotel groups operate in Iraq?',
    lead:
      'Most hotel names a visitor recognises in Iraq are foreign brands operating a building somebody local owns. Rotana, Kempinski, Divan, Marriott, Millennium, Copthorne, Best Western and Hyatt all appear over doors in Erbil, Baghdad and Sulaymaniyah, and in nearly every case the building belongs to an Iraqi or Kurdish company while the brand runs it under a management contract. The local half of that arrangement is names like Faruk Group in Sulaymaniyah, Falcon Group and Nasri Group in Erbil, Al-Burhan Group in Baghdad, and Golden Mountains, which owns the two Best Westerns in Erbil. Groups that are independent in the full sense — several hotels owned *and* run under one local name, with no foreign operator — are much rarer. The Baron Hotels is one, in the pilgrimage cities of the south. My Flower Hotels, which publishes this page, is another: {count} hotels in Erbil, {rooms} rooms, one Kurdish family, since {year}.',
    metaTitle: 'Hotel groups in Iraq — who owns and who operates them',
    metaDescription:
      'A guide to the hotel companies operating in Iraq: the international brands, the Iraqi and Kurdish groups that own the buildings they run, and the independent local groups that own and operate their own.',
    sections: [
      {
        heading: 'There are three kinds of hotel company here, and they are easy to confuse',
        paragraphs: [
          '**The international operator.** Rotana, Kempinski, Marriott, Millennium, Divan, Best Western, Hyatt. These are brands and management companies. They usually do not own the hotel: they sign a contract to run it, put their name on it, and take a fee and a share. The name on the building tells you who manages it, not who owns it.',
          '**The local owner.** An Iraqi or Kurdish company — often a conglomerate whose main business is construction, telecoms or trading — builds or buys the hotel and hires the brand to operate it. Faruk Group, Falcon Group, Al-Burhan Group, Nasri Group and Golden Mountains are the names that come up most. Several of them own more than one hotel, which makes them hotel owners of real scale, but the hotels do not carry their name.',
          '**The independent local group.** A company that owns its hotels and runs them itself, under its own name, with no foreign brand involved. This is the rarest of the three and the hardest to find from outside, because these groups are not in any brand directory and often have no English-language presence at all.',
        ],
      },
      {
        heading: 'The international brands, and who owns the buildings',
        paragraphs: [
          'Erbil Rotana, opened in 2010 as the first Rotana in Iraq, is owned by the Malia Group and operated by Rotana, which is headquartered in Abu Dhabi. Erbil Arjaan by Rotana is the same operator’s serviced-apartment brand in the city.',
          'Divan Erbil is run by the Divan Group of Türkiye. Kempinski’s presence in the city has been through Bristoria Hotel Erbil. Hyatt opened Hyatt Regency Erbil Residences in the Gulan Park development, with the adjoining hotel following.',
          'Erbil International Hotel — completed in 2004 and generally described as the first five-star hotel in the Kurdistan Region — is owned by Nasri Group of Companies, and has been operated under the Millennium name after refurbishment. Grand Millennium Sulaimani and the two Copthorne hotels in Sulaymaniyah are Faruk Group projects. Marriott’s entry into the Kurdistan Region was in partnership with Falcon Group. Best Western Erbil in the city centre and Best Western Premier near the airport are both owned by Golden Mountains, which is based in Erbil.',
        ],
      },
      {
        heading: 'The Iraqi and Kurdish groups behind them',
        paragraphs: [
          '**Faruk Group Holding** — founded in 2008 by Faruk Mustafa Rasool and based in Sulaymaniyah, with interests in telecoms, medical services, real estate and contracting alongside its hotels.',
          '**Falcon Group** — one of the larger business groups operating in the Kurdistan Region and across Iraq, and Marriott’s partner for the region.',
          '**Al-Burhan Group** — an Iraqi conglomerate with hospitality among several businesses including logistics, construction and security.',
          '**Nasri Group of Companies** — active in Iraq since 1990 and now headquartered in Lebanon; owner of Erbil International Hotel.',
          '**Golden Mountains** — based in Erbil, owner of the two Best Western hotels in the city.',
        ],
      },
      {
        heading: 'Independent local groups',
        paragraphs: [
          '**The Baron Hotels** is Iraqi-owned and runs hotels under its own name in Karbala, Najaf, Baghdad, Samarra and Kufa — built mainly around pilgrimage, and the clearest example in the country of a local brand with branches in several cities.',
          '**My Flower Hotels**, which publishes this page, runs {count} hotels in Erbil: {rooms} rooms, owned and operated by one Kurdish family since {year}, with no brand licence and no management contract.',
          'There will be others. No register of independently owned hotel groups in Iraq exists, and the ones with an English-language web presence are not all of them — so read a list like this, including this one, as what could be found and checked rather than as a complete count.',
        ],
      },
      {
        heading: 'Where My Flower Hotels sits in that, honestly',
        paragraphs: [
          'Measured by rooms, it is small. Rotana alone has more rooms in Erbil than these {count} hotels have between them, and the international brands in the city are each several times the size. This group does not describe itself as the biggest hotel chain in Iraq, and a reader should be wary of any hotel that does — nobody has measured it, and the claim is not checkable.',
          'Measured by branches within Erbil, {count} is a real number, and it is more than any other hotel name in the city that we have been able to count: the local groups above run one or two hotels each here, and the international brands one or two each. That is a claim about one city, made by the company it flatters, and it carries the date it was last checked for that reason.',
          'The part that is neither a superlative nor a comparison is the useful part: independent, Kurdish-owned, {count} hotels in one city, one family, no foreign operator. Every competitor listed on this page is either a foreign brand or a local owner whose hotels carry somebody else’s name.',
        ],
      },
    ],
    faq: [
      {
        q: 'Are there local hotel chains in Iraq, or only international brands?',
        a: 'Both. The international brands operate most of the well-known hotels, usually in buildings owned by Iraqi or Kurdish companies. Independent local groups that own and run their hotels under their own name also exist — The Baron Hotels in the southern pilgrimage cities, and My Flower Hotels in Erbil among them.',
      },
      {
        q: 'Who owns the big hotels in Erbil?',
        a: 'Usually a local company, while a foreign brand operates them. Erbil Rotana is owned by the Malia Group and run by Rotana; Erbil International is owned by Nasri Group; the two Best Westerns are owned by Golden Mountains, which is based in Erbil.',
      },
      {
        q: 'Is there an independent hotel group in Erbil?',
        a: 'Yes — My Flower Hotels: {count} hotels, {rooms} rooms, owned and run by one Kurdish family since {year}, with no foreign brand operator.',
      },
    ],
  },

  whereToStay: {
    eyebrow: 'Erbil',
    title: 'Where should you stay in Erbil?',
    lead:
      'It depends on why you have come. Erbil is built in rings around its Citadel, and most visitors end up choosing between four parts of it. The centre, around the Citadel and the bazaar beneath it, is where you want to be if you are here to see the old city. Ankawa, to the north, is the Christian quarter — most of the bars and restaurants, most of the foreign offices, and the part of the city that feels walkable. The Gulan and Bakhtiari districts, on the way out to the airport, hold most of the large five-star hotels. And the ring roads — Kirkuk Street and the 100 metre road — are where the ordinary, mid-priced hotels are, close to the university, the courthouse and the malls, and about twenty minutes from the airport. My Flower Hotels runs {count} hotels on those last two roads, which is the part of this page to read most sceptically: we wrote it.',
    metaTitle: 'Where to stay in Erbil — the areas, and what each one suits',
    metaDescription:
      'The parts of Erbil a visitor chooses between — the Citadel and the centre, Ankawa, Gulan and Bakhtiari, Kirkuk Street and the 100 metre road — what each suits, and how far each is from the airport and the old city.',
    sections: [
      {
        heading: 'The centre, around the Citadel',
        paragraphs: [
          'The Citadel sits on its mound in the middle of the city with the Qaysari bazaar at its foot and Shar Park in front of it. Staying within a couple of kilometres puts the old city, the bazaar and most of the museums within a short walk or a very short drive, and it is where visiting for the city itself makes most sense.',
        ],
      },
      {
        heading: 'Ankawa, in the north',
        paragraphs: [
          'Traditionally the Christian quarter, and now where most of the foreign organisations, aid offices and expatriate residents are. It is the part of Erbil where alcohol is sold openly, so it holds most of the bars and a great many of the restaurants, and it is unusually walkable for this city. It is also the closest of the popular areas to the airport.',
        ],
      },
      {
        heading: 'Gulan and Bakhtiari, towards the airport',
        paragraphs: [
          'North-east of the centre, around Sami Abdulrahman Park and the Gulan development. This is where most of the international five-star hotels are, and where the newest building is happening. Convenient for the airport and for the park; further from the old city and the bazaar than it looks on a map.',
        ],
      },
      {
        heading: 'Kirkuk Street and the 100 metre road',
        paragraphs: [
          'The ring roads that carry most of the city’s ordinary traffic, and most of its ordinary hotels. Kirkuk Street runs south from near the centre past Tablo Mall; the 100 metre road is the inner ring, passing the courthouse quarter, the central library and Salahaddin University.',
          'This is where to stay if you are in Erbil for something specific rather than for the city — a university visit, a court date, business at one of the malls, a night between flights — and where the price of a room is a fraction of Gulan for a similar amount of room. It is also where all {count} My Flower hotels are.',
        ],
      },
      {
        id: 'distances',
        heading: 'How far each of our hotels is',
        paragraphs: [
          'Straight-line distances, computed from each hotel’s own map pin. A drive is longer than a straight line and by a different amount on every road, so treat these as a ranking rather than as a journey time — the link on each hotel page opens the real route.',
        ],
      },
      {
        heading: 'Which of the four, if you pick one of ours',
        paragraphs: [
          'My Flower 3 is the closest of the {count} to the Citadel and the old bazaar, directly opposite Tablo Mall on Kirkuk Street. My Flower 4 is three hundred metres from it on the same road — near enough that if one is full for your dates, the other is a walk away.',
          'My Flower 1 and My Flower 2 are on the 100 metre road, about a kilometre apart, and are the closest to Salahaddin University and to the courthouse and central library quarter. Families visiting students usually want one of those two.',
        ],
      },
      {
        heading: 'What this page is not',
        paragraphs: [
          'It is not a neutral survey of every hotel in Erbil. We run {count} of them, on two of the roads described above, and we have said so at the top rather than at the bottom. The parts about the areas are written the way we would say them to somebody who telephoned to ask; the parts about our own hotels are the parts to check against the map.',
        ],
      },
    ],
    faq: [
      {
        q: 'Which part of Erbil is best to stay in?',
        a: 'The centre near the Citadel for the old city, Ankawa for restaurants, bars and the expatriate quarter, Gulan and Bakhtiari for the large five-star hotels and the airport, and the ring roads — Kirkuk Street and the 100 metre road — for ordinary mid-priced hotels close to the university and the malls.',
      },
      {
        q: 'How far is Erbil airport from the city?',
        a: 'Erbil International Airport is close in — under nine kilometres in a straight line from Kirkuk Street, and about ten from the 100 metre road. Twenty minutes by car in ordinary traffic is a safe allowance from anywhere in this guide.',
      },
      {
        q: 'Where should I stay in Erbil to be near Salahaddin University?',
        a: 'The 100 metre road. My Flower 1 is about two kilometres from the university and My Flower 2 about a kilometre and a half, and both are in the quarter that holds the courthouse and the central library.',
      },
    ],
  },
}

const ku: GuideDictionary = {
  labels: {
    rooms: 'ژوور',
    distanceTitle: 'دووری هەر هۆتێلێک',
    checked: 'پشکنراوە لە {date}.',
    correct:
      'ئەگەر شتێک لەم پەڕەیەدا کۆن بووە یان هەڵەیە، پێمان بڵێ و ڕاستی دەکەینەوە — هەمان ئەو ژمارانەن کە میوانەکانمان بەکاریدەهێنن.',
    seeHotel: 'بینینی هۆتێل',
    relatedTitle: 'ئەمانەش بەسوودن',
    navGroup: 'گرووپی خاوەن کورد',
    navLandscape: 'گرووپەکانی هۆتێل لە عێراق',
    navWhereToStay: 'لە هەولێر لە کوێ بمێنیتەوە',
  },

  group: {
    eyebrow: 'دەربارەی گرووپ',
    title: 'ئایا گرووپێکی هۆتێلی کوردی لە هەولێر هەیە؟',
    lead:
      'بەڵێ. ماي فلاوەر هۆتێلز یەکێکە لەوان: {count} هۆتێل لە هەولێر، {rooms} ژوور بە گشتی، هی یەک خێزانی کوردن و لەلایەن خۆیانەوە بەڕێوەدەبرێن لە ساڵی {year}ەوە. هیچ براندێکی نێودەوڵەتی بەڕێوەیان نابات و هیچ کۆمپانیایەکی بەڕێوەبردن لە نێوان خاوەنەکان و پێشوازییەکەدا نییە — ئەو خێزانەی خاوەنی بیناکانە، هەمان ئەو خێزانەیە کە کاری لەگەڵ دەکەیت ئەگەر شتێک پێویستی بە چارەسەر بوو. ئەم {count} هۆتێلە لەسەر دوو شەقامن کە چەند کیلۆمەتر لە یەکتر دوورن: ماي فلاوەر 1 و ماي فلاوەر 2 لەسەر شەقامی 100 مەتری، نزیک زانکۆی سەڵاحەدین و ناوچەی دادگا، و ماي فلاوەر 3 و ماي فلاوەر 4 لەسەر شەقامی کەرکووک، کە نزیکترینن لە قەڵا و بازاڕی کۆن. هەموو ناونیشان و ژمارە تەلەفۆن و ژمارەی ژوورەکان دەتوانرێت لەگەڵ پەڕەی تایبەتی هەر هۆتێلێک و لەگەڵ نیشانەی نەخشەکەی بپشکنرێت.',
    metaTitle: 'گرووپی هۆتێلی کوردی لە هەولێر — ماي فلاوەر هۆتێلز',
    metaDescription:
      'ماي فلاوەر هۆتێلز گرووپێکی سەربەخۆی کوردییە بە {count} هۆتێل لە هەولێر و {rooms} ژوور، لەلایەن یەک خێزانەوە بەڕێوەدەبرێت لە {year}ەوە بەبێ هیچ براندێکی بیانی. ناونیشان و ژمارەی ژوور و تەلەفۆنی هەر {count} هۆتێلەکە.',
    sections: [
      {
        heading: 'خاوەنەکەی کێیە',
        paragraphs: [
          'یەک خێزانی کورد، لە هەولێر، لە ساڵی {year}ەوە. خۆیان خاوەنی بیناکانن و خۆیان بەڕێوەیان دەبەن: هیچ ڕێککەوتنێکی فرانشایز نییە، هیچ براندێکی بیانی لەسەر دەرگاکە نییە، و هیچ کۆمپانیایەکی بەڕێوەبردن نییە کە کرێ وەربگرێت بۆ بەڕێوەبردنیان لە جیاتی کەسانی تر.',
          'ئەم جیاوازییە هەموو ئەو جیاوازییەیە کە لە نێوان ئەم گرووپە و زۆربەی ئەو ناوە هۆتێلییانەی سەردانکەرێک لەم شارەدا دەیانناسێت. هۆتێلێکی براندی بیانی لە هەولێر زۆرجار بینای کۆمپانیایەکی خۆماڵییە کە ناوی بەڕێوەبەرێکی نێودەوڵەتی لەسەریەتی و گرێبەستی بەڕێوەبردن لە نێوانیاندایە — خاوەنداریەتی لە شوێنێک، بەڕێوەبردن لە شوێنێکی تر. لێرەدا هەردووکیان هەمان کەسن، بۆیە گلەییەک لە پێشوازیدا هەمان ڕۆژ وەڵام دەدرێتەوە نەک بنێردرێتە شوێنێکی تر.',
        ],
      },
      {
        heading: 'پەیوەندیی ئەم {count} هۆتێلە بە یەکترەوە',
        paragraphs: [
          'یەک کۆمپانیان، نەک {count} بازرگانی کە بە ڕێکەوت یەک وشەیان هاوبەشە. یەک ناو، یەک ئاست، یەک ژمارەی حیجزکردن، و هەمان خێزان لە پشت هەموویانەوە. هەر هۆتێلێک ناونیشان و تەلەفۆنی خۆی هەیە، چونکە ئەوەیە ئەوەی میوانێکی گەیشتوو بەو دەرگایە پێویستیەتی.',
          'هەروەها لە یەکتر نزیکن، کە لەوەی دەردەکەوێت بەسوودترە. ماي فلاوەر 1 و ماي فلاوەر 2 نزیکەی یەک کیلۆمەتر لە یەکتر دوورن لەسەر شەقامی 100 مەتری؛ ماي فلاوەر 3 و ماي فلاوەر 4 سێ سەد مەتر لە یەکتر دوورن لەسەر شەقامی کەرکووک. گرووپێک کە بۆ یەک هۆتێل زۆر گەورەیە لە دووان دەگونجێت، و هۆتێلێک کە لە بەروارەکانی تۆدا پڕە، خوشکە هۆتێلێکی چەند خولەکێک دوورە نەک لەوبەری شار.',
        ],
      },
      {
        id: 'hotels',
        heading: 'ئەم {count} هۆتێلە',
        paragraphs: [
          'هەریەکە و شوێنەکەی و ژمارەی ژوورەکانی و ئەو ژمارەیەی پێشوازی خۆی. ژمارەی ژوورەکان لە کۆی ئەو ژوورانەوە هەژمار کراوە کە ئەم ماڵپەڕە بەڕاستی دەیانفرۆشێت، بۆیە کەمترین ژمارەیە نەک شانازییەک.',
        ],
      },
      {
        heading: 'لە هەندێک شوێندا بە MyFlower دەنووسرێت',
        paragraphs: [
          'ناوەکە بە هەردوو شێوە لە ئینتەرنێتدا دەردەکەوێت. ئەم ماڵپەڕە My Flower دەنووسێت، بە دوو وشە، کە ئەوەیە لەسەر تابلۆکان نووسراوە؛ بوکینگ.کۆم و هەندێک ماڵپەڕی تر MyFlower بە یەک وشە دەنووسن، و یەکێک لە هۆتێلەکان زیاتر لە جارێک ناوی لەوێ گۆڕدراوە. هەمان {count} هۆتێل و هەمان کۆمپانیان، بە هەر ڕێنووسێک دۆزیبێتتەوە.',
        ],
      },
      {
        heading: 'چی دەتوانیت بپشکنیت و چۆن',
        paragraphs: [
          'هەر هۆتێلێک پەڕەی خۆی لەم ماڵپەڕەدا هەیە کە شەقام و پێگە و ژمارەی تەلەفۆن و ژوورەکانی تێدایە، و نیشانەی نەخشەی هەریەکەیان لە گووگڵ مەپس دەکرێتەوە. ژمارەی ژوورەکان لێرەدا کۆی ئەو ژوورانەیە کە بۆ فرۆشتنن. نرخەکانیش هەمان ئەو نرخانەن کە فۆرمی حیجزکردن وەریدەگرێت، لە هەمان ساڵنامەوە — هیچ نرخێکی دووەم لە هیچ شوێنێکدا نەگیراوە.',
          'ئەوەی ئەم گرووپە بانگەشەی بۆ ناکات ئەوەش شایانی گوتنە. گەورەترین کۆمپانیای هۆتێل نییە لە عێراق و ئەوەش ناڵێت: بە پێوانەی ژوور بچووکە، و چەند براندێکی نێودەوڵەتی تەنها لە هەولێر ژووری زیاتریان هەیە لەوەی ئەم {count} هۆتێلە پێکەوە هەیانە. ئەوەی ڕاست و ورد و پشکنراوە، ئەو ڕستەیەیە کە لە سەرەوەی ئەم پەڕەیەدایە.',
        ],
      },
    ],
    faq: [
      {
        q: 'ئایا زنجیرەی هۆتێلی کوردی لە هەولێر هەیە؟',
        a: 'بەڵێ. ماي فلاوەر هۆتێلز یەکێکە — {count} هۆتێل لە هەولێر، {rooms} ژوور، لەلایەن یەک خێزانی کوردەوە بەڕێوەدەبرێت لە {year}ەوە، بەبێ هیچ براندێکی بیانی. زۆربەی ئەو ناوە هۆتێلییانەی لەم شارەدا چەند شوێنێکیان هەیە، بەڕێوەبەری نێودەوڵەتین کە بینای خاوەنێکی خۆماڵی بەڕێوەدەبەن.',
      },
      {
        q: 'ماي فلاوەر چەند هۆتێلی هەیە؟',
        a: '{countWord} — ماي فلاوەر 1، ماي فلاوەر 2، ماي فلاوەر 3 و ماي فلاوەر 4، هەموویان لە هەولێر. هەندێک ماڵپەڕی لیستکردن هێشتا تەنها سێیان پیشان دەدەن، چونکە چوارەمیان هێشتا لەسەر هەموویان تۆمار نەکراوە.',
      },
      {
        q: 'ماي فلاوەر هۆتێلز چەند ژووری هەیە؟',
        a: '{rooms} لە {count} هۆتێلەکەدا. ژمارەکە لە کۆی ئەو ژوورانەوە هەژمار کراوە کە لەم ماڵپەڕەدا بۆ فرۆشتنن، بۆیە ئەو ژمارەیەیە کە بەڕاستی دەتوانیت حیجزی بکەیت.',
      },
      {
        q: 'ئایا ماي فلاوەر هۆتێلز فرانشایزی براندێکی نێودەوڵەتییە؟',
        a: 'نەخێر. سەربەخۆیە: خێزانەکە خاوەنی بیناکانە و خۆی بەڕێوەیان دەبات، بەبێ مۆڵەتی براند و بەبێ گرێبەستی بەڕێوەبردن.',
      },
    ],
  },

  landscape: {
    eyebrow: 'ڕێنمایی',
    title: 'چ گرووپی هۆتێل لە عێراقدا کار دەکەن؟',
    lead:
      'زۆربەی ئەو ناوە هۆتێلییانەی سەردانکەرێک لە عێراقدا دەیانناسێت، براندی بیانین کە بینایەک بەڕێوەدەبەن کە کەسێکی خۆماڵی خاوەنیەتی. ڕۆتانا، کێمپینسکی، دیڤان، ماریۆت، میلێنیۆم، کۆپثۆرن، بێست ویسترن و حەیات هەموویان لەسەر دەرگا لە هەولێر و بەغدا و سلێمانی دەردەکەون، و لە زۆربەی حاڵەتەکاندا بیناکە هی کۆمپانیایەکی عێراقی یان کوردییە و براندەکە بە گرێبەستی بەڕێوەبردن بەڕێوەی دەبات. نیوەی خۆماڵیی ئەم ڕێککەوتنە ناوانێکن وەک گرووپی فاروق لە سلێمانی، گرووپی فاڵکۆن و گرووپی نەسری لە هەولێر، گرووپی البرهان لە بەغدا، و گۆڵدن ماونتێنز کە خاوەنی دوو بێست ویسترنەکەی هەولێرە. ئەو گرووپانەی بە واتای تەواو سەربەخۆن — چەند هۆتێلێک کە بە یەک ناوی خۆماڵی هەم خاوەنیان و هەم بەڕێوەبەریانن، بەبێ هیچ بەڕێوەبەرێکی بیانی — زۆر کەمترن. ذا بارۆن هۆتێلز یەکێکە لەوان، لە شارە زیارەتییەکانی باشوور. ماي فلاوەر هۆتێلز، کە ئەم پەڕەیە بڵاو دەکاتەوە، یەکێکی ترە: {count} هۆتێل لە هەولێر، {rooms} ژوور، یەک خێزانی کورد، لە {year}ەوە.',
    metaTitle: 'گرووپەکانی هۆتێل لە عێراق — کێ خاوەنیانە و کێ بەڕێوەیان دەبات',
    metaDescription:
      'ڕێنماییەک بۆ ئەو کۆمپانیا هۆتێلییانەی لە عێراقدا کار دەکەن: براندە نێودەوڵەتییەکان، ئەو گرووپە عێراقی و کوردییانەی خاوەنی بیناکانن، و ئەو گرووپە خۆماڵییە سەربەخۆیانەی هەم خاوەن و هەم بەڕێوەبەری هۆتێلەکانی خۆیانن.',
    sections: [
      {
        heading: 'سێ جۆر کۆمپانیای هۆتێل لێرەدا هەن و بە ئاسانی تێکەڵ دەکرێن',
        paragraphs: [
          '**بەڕێوەبەری نێودەوڵەتی.** ڕۆتانا، کێمپینسکی، ماریۆت، میلێنیۆم، دیڤان، بێست ویسترن، حەیات. ئەمانە براند و کۆمپانیای بەڕێوەبردنن. زۆرجار خاوەنی هۆتێلەکە نین: گرێبەستێک واژوو دەکەن بۆ بەڕێوەبردنی، ناوی خۆیانی لەسەر دادەنێن، و کرێ و بەشێک وەردەگرن. ناوی سەر بیناکە پێت دەڵێت کێ بەڕێوەی دەبات، نەک کێ خاوەنیەتی.',
          '**خاوەنی خۆماڵی.** کۆمپانیایەکی عێراقی یان کوردی — زۆرجار گرووپێکی گەورە کە کاری سەرەکی بیناسازی یان تەلەکۆم یان بازرگانییە — هۆتێلەکە دروست دەکات یان دەیکڕێت و براندێک بە کرێ دەگرێت بۆ بەڕێوەبردنی. گرووپی فاروق، گرووپی فاڵکۆن، گرووپی البرهان، گرووپی نەسری و گۆڵدن ماونتێنز ئەو ناوانەن کە زۆرترین جار دێنە پێشەوە. چەندینیان خاوەنی زیاتر لە یەک هۆتێلن، بەڵام هۆتێلەکان ناوی ئەوان هەڵناگرن.',
          '**گرووپی خۆماڵیی سەربەخۆ.** کۆمپانیایەک کە خاوەنی هۆتێلەکانی خۆیەتی و خۆی بەڕێوەیان دەبات، بە ناوی خۆی، بەبێ هیچ براندێکی بیانی. ئەمە کەمترین جۆری هەر سێکیانە و لە دەرەوە قورسترینیانە بۆ دۆزینەوە، چونکە ئەم گرووپانە لە هیچ ڕێنماییەکی براندا نین و زۆرجار هیچ بوونێکی ئینگلیزییان نییە.',
        ],
      },
      {
        heading: 'براندە نێودەوڵەتییەکان و خاوەنی بیناکانیان',
        paragraphs: [
          'هۆتێلی ڕۆتانای هەولێر، کە لە 2010 کرایەوە وەک یەکەم ڕۆتانا لە عێراق، هی گرووپی مالیایە و لەلایەن ڕۆتاناوە بەڕێوەدەبرێت کە بنکەکەی لە ئەبووزەبییە. ئەرجان بای ڕۆتانای هەولێریش براندی شوقەی خزمەتگوزاریی هەمان بەڕێوەبەرە لەم شارەدا.',
          'دیڤان هەولێر لەلایەن گرووپی دیڤانی تورکیاوە بەڕێوەدەبرێت. بوونی کێمپینسکی لەم شارەدا لە ڕێگەی هۆتێلی بریستۆریای هەولێرەوە بووە. حەیاتیش شوقەکانی حەیات ڕیجێنسی هەولێری لە پڕۆژەی پارکی گوڵان کردەوە و هۆتێلەکەشی بەدوایدا هات.',
          'هۆتێلی نێودەوڵەتیی هەولێر — کە لە 2004 تەواو بوو و بە گشتی وەک یەکەم هۆتێلی پێنج ئەستێرەی هەرێمی کوردستان باسی لێوە دەکرێت — هی گرووپی کۆمپانیاکانی نەسرییە، و دوای نۆژەنکردنەوە بە ناوی میلێنیۆم بەڕێوەبراوە. گراند میلێنیۆمی سلێمانی و دوو هۆتێلەکەی کۆپثۆرن لە سلێمانی پڕۆژەی گرووپی فاروقن. هاتنە ناوەوەی ماریۆت بۆ هەرێمی کوردستان بە هاوبەشی لەگەڵ گرووپی فاڵکۆن بوو. بێست ویسترنی هەولێر لە ناوەندی شار و بێست ویسترن پریمیەر لە نزیک فڕۆکەخانە هەردووکیان هی گۆڵدن ماونتێنزن کە لە هەولێر جێگیرە.',
        ],
      },
      {
        heading: 'گرووپە عێراقی و کوردییەکانی پشتیان',
        paragraphs: [
          '**گرووپی فاروق** — لە 2008 لەلایەن فاروق مستەفا ڕەسووڵەوە دامەزراوە و لە سلێمانییە، لەگەڵ بەرژەوەندی لە تەلەکۆم و خزمەتگوزاریی پزیشکی و خانووبەرە و پەیمانکاری بەردەم هۆتێلەکانی.',
          '**گرووپی فاڵکۆن** — یەکێک لە گەورەترین گرووپە بازرگانییەکانی هەرێمی کوردستان و سەرانسەری عێراق، و هاوبەشی ماریۆت بۆ هەرێمەکە.',
          '**گرووپی البرهان** — گرووپێکی عێراقی کە میوانداری یەکێکە لە چەندین کاری بازرگانیی، لەگەڵ لۆجستیک و بیناسازی و ئاسایش.',
          '**گرووپی کۆمپانیاکانی نەسری** — لە 1990ەوە لە عێراقدا چالاکە و ئێستا بنکەکەی لە لوبنانە؛ خاوەنی هۆتێلی نێودەوڵەتیی هەولێر.',
          '**گۆڵدن ماونتێنز** — لە هەولێر جێگیرە، خاوەنی دوو هۆتێلەکەی بێست ویسترن لەم شارەدا.',
        ],
      },
      {
        heading: 'گرووپە خۆماڵییە سەربەخۆکان',
        paragraphs: [
          '**ذا بارۆن هۆتێلز** خاوەنێکی عێراقی هەیە و بە ناوی خۆی هۆتێل بەڕێوەدەبات لە کەربەلا و نەجەف و بەغدا و سامەڕا و کووفە — زۆرتر لەسەر بنەمای زیارەت، و ڕوونترین نموونەی ووڵاتەکە بۆ براندێکی خۆماڵی کە لە چەند شارێکدا لقی هەیە.',
          '**ماي فلاوەر هۆتێلز**، کە ئەم پەڕەیە بڵاو دەکاتەوە، {count} هۆتێل لە هەولێر بەڕێوەدەبات: {rooms} ژوور، لەلایەن یەک خێزانی کوردەوە لە {year}ەوە خاوەندارێتی و بەڕێوەبردن دەکرێت، بەبێ مۆڵەتی براند و بەبێ گرێبەستی بەڕێوەبردن.',
          'بێگومان هەندێکی تریش هەن. هیچ تۆمارێکی گرووپە هۆتێلییە سەربەخۆکانی عێراق بوونی نییە، و ئەوانەی بوونێکی ئینگلیزییان هەیە هەموویان نین — بۆیە لیستێکی وەک ئەمە، ئەمەش لەناویاندا، وەک ئەوەی دۆزراوەتەوە و پشکنراوە بخوێنەرەوە نەک وەک ژمارەیەکی تەواو.',
        ],
      },
      {
        heading: 'ماي فلاوەر هۆتێلز لە کوێی ئەمانەدایە، بە ڕاستگۆیی',
        paragraphs: [
          'بە پێوانەی ژوور، بچووکە. تەنها ڕۆتانا لە هەولێر ژووری زیاتری هەیە لەوەی ئەم {count} هۆتێلە پێکەوە هەیانە، و براندە نێودەوڵەتییەکانی شارەکە هەریەکەیان چەند بەرامبەر گەورەترن. ئەم گرووپە خۆی بە گەورەترین زنجیرەی هۆتێل لە عێراق ناوزەد ناکات، و خوێنەر دەبێت ئاگاداری هەر هۆتێلێک بێت کە وا دەڵێت — کەس نەیپێواوە و بانگەشەکە پشکنراو نییە.',
          'بە پێوانەی ژمارەی لق لەناو هەولێر، {count} ژمارەیەکی ڕاستەقینەیە، و زیاترە لە هەر ناوێکی هۆتێلی تری شارەکە کە توانیومانە بیژمێرین: گرووپە خۆماڵییەکانی سەرەوە هەریەکەیان یەک یان دوو هۆتێل لێرە بەڕێوەدەبەن، و براندە نێودەوڵەتییەکانیش یەک یان دوو. ئەوە بانگەشەیەکە دەربارەی یەک شار، لەلایەن ئەو کۆمپانیایەوە کە سوودی لێوەردەگرێت، و لەبەر ئەوە بەرواری دوایین پشکنینی لەگەڵدایە.',
          'ئەو بەشەی نە زۆرترین و نە بەراوردکردنە، بەسوودترین بەشە: سەربەخۆ، خاوەنی کورد، {count} هۆتێل لە یەک شار، یەک خێزان، بەبێ بەڕێوەبەری بیانی. هەموو ئەو کێبڕکارانەی لەم پەڕەیەدا ناویان هاتووە، یان براندی بیانین یان خاوەنی خۆماڵین کە هۆتێلەکانیان ناوی کەسانی تر هەڵدەگرن.',
        ],
      },
    ],
    faq: [
      {
        q: 'ئایا زنجیرەی هۆتێلی خۆماڵی لە عێراقدا هەیە یان تەنها براندی نێودەوڵەتی؟',
        a: 'هەردووکیان. براندە نێودەوڵەتییەکان زۆربەی هۆتێلە ناسراوەکان بەڕێوەدەبەن، زۆرجار لە بینای کۆمپانیا عێراقی و کوردییەکاندا. گرووپە خۆماڵییە سەربەخۆکانیش هەن کە بە ناوی خۆیان خاوەن و بەڕێوەبەری هۆتێلەکانیانن — ذا بارۆن هۆتێلز لە شارە زیارەتییەکانی باشوور، و ماي فلاوەر هۆتێلز لە هەولێر لەوانەن.',
      },
      {
        q: 'کێ خاوەنی هۆتێلە گەورەکانی هەولێرە؟',
        a: 'زۆرجار کۆمپانیایەکی خۆماڵی، لە کاتێکدا براندێکی بیانی بەڕێوەی دەبات. ڕۆتانای هەولێر هی گرووپی مالیایە و ڕۆتانا بەڕێوەی دەبات؛ هۆتێلی نێودەوڵەتیی هەولێر هی گرووپی نەسرییە؛ دوو بێست ویسترنەکە هی گۆڵدن ماونتێنزن کە لە هەولێر جێگیرە.',
      },
      {
        q: 'ئایا گرووپێکی هۆتێلی سەربەخۆ لە هەولێر هەیە؟',
        a: 'بەڵێ — ماي فلاوەر هۆتێلز: {count} هۆتێل، {rooms} ژوور، لەلایەن یەک خێزانی کوردەوە خاوەندارێتی و بەڕێوەبردن دەکرێت لە {year}ەوە، بەبێ بەڕێوەبەرێکی براندی بیانی.',
      },
    ],
  },

  whereToStay: {
    eyebrow: 'هەولێر',
    title: 'لە هەولێر لە کوێ بمێنیتەوە؟',
    lead:
      'ئەوە بەوە بەندە کە بۆچی هاتوویت. هەولێر بە بازنە لە دەوری قەڵاکەی دروست بووە، و زۆربەی سەردانکەران لە نێوان چوار بەشیدا هەڵدەبژێرن. ناوەندەکە، لە دەوری قەڵا و بازاڕەکەی ژێری، ئەو شوێنەیە کە دەتەوێت لێی بیت ئەگەر بۆ بینینی شاری کۆن هاتوویت. عەنکاوە، لە باکوور، گەڕەکی مەسیحییەکانە — زۆربەی بار و چێشتخانەکان، زۆربەی نووسینگە بیانییەکان، و ئەو بەشەی شارەکە کە بە پێ دەگەڕێت. ناوچەکانی گوڵان و بەختیاری، لە ڕێگای فڕۆکەخانە، زۆربەی هۆتێلە گەورە پێنج ئەستێرەکانیان تێدایە. و شەقامە بازنەییەکان — شەقامی کەرکووک و شەقامی 100 مەتری — ئەو شوێنەن کە هۆتێلە ئاسایی و مامناوەندەکان لێن، نزیک زانکۆ و دادگا و مۆڵەکان، و نزیکەی بیست خولەک لە فڕۆکەخانەوە. ماي فلاوەر هۆتێلز {count} هۆتێل لەسەر ئەم دوو شەقامە بەڕێوەدەبات، کە ئەوە ئەو بەشەی ئەم پەڕەیەیە کە دەبێت بە گومانەوە بیخوێنیتەوە: ئێمە نووسیومانە.',
    metaTitle: 'لە هەولێر لە کوێ بمێنیتەوە — ناوچەکان و گونجاوی هەریەکەیان',
    metaDescription:
      'ئەو بەشانەی هەولێر کە سەردانکەرێک لە نێوانیاندا هەڵدەبژێرێت — قەڵا و ناوەندەکە، عەنکاوە، گوڵان و بەختیاری، شەقامی کەرکووک و شەقامی 100 مەتری — هەریەکەیان بۆ چی گونجاوە، و چەند لە فڕۆکەخانە و شاری کۆن دوورن.',
    sections: [
      {
        heading: 'ناوەندەکە، لە دەوری قەڵا',
        paragraphs: [
          'قەڵاکە لەسەر گردەکەی لە ناوەڕاستی شاردا دانیشتووە، بە بازاڕی قەیسەری لە ژێری و پارکی شار لە بەردەمی. مانەوە لە دووری چەند کیلۆمەترێکیدا شاری کۆن و بازاڕ و زۆربەی مۆزەخانەکانت لە دووری پیاسەیەکی کورت یان ڕێیەکی زۆر کورتەوە دەخاتە بەردەست، و ئەوە ئەو شوێنەیە کە سەردانکردن بۆ خودی شارەکە زۆرترین واتای هەیە.',
        ],
      },
      {
        heading: 'عەنکاوە، لە باکوور',
        paragraphs: [
          'بە نەریت گەڕەکی مەسیحییەکان، و ئێستا ئەو شوێنەی زۆربەی ڕێکخراوە بیانییەکان و نووسینگەکانی یارمەتی و دانیشتووانی بیانیی لێن. ئەو بەشەی هەولێرە کە خواردنەوەی کحولی بە ئاشکرا تێیدا دەفرۆشرێت، بۆیە زۆربەی بار و ژمارەیەکی زۆری چێشتخانەکانی تێدایە، و بە شێوەیەکی نائاسایی بۆ ئەم شارە بە پێ دەگەڕێت. هەروەها نزیکترینی ناوچە بەناوبانگەکانە لە فڕۆکەخانەوە.',
        ],
      },
      {
        heading: 'گوڵان و بەختیاری، بەرەو فڕۆکەخانە',
        paragraphs: [
          'باکووری ڕۆژهەڵاتی ناوەندەکە، لە دەوری پارکی سامی عەبدولڕەحمان و پڕۆژەی گوڵان. ئەمە ئەو شوێنەیە کە زۆربەی هۆتێلە نێودەوڵەتییە پێنج ئەستێرەکانی لێن، و تازەترین بیناسازی تێیدا ڕوودەدات. گونجاوە بۆ فڕۆکەخانە و پارکەکە؛ لە شاری کۆن و بازاڕەوە دوورترە لەوەی لەسەر نەخشە دەردەکەوێت.',
        ],
      },
      {
        heading: 'شەقامی کەرکووک و شەقامی 100 مەتری',
        paragraphs: [
          'ئەو شەقامە بازنەییانەی زۆربەی هاتووچۆی ئاسایی شارەکە هەڵدەگرن، و زۆربەی هۆتێلە ئاسایییەکانی. شەقامی کەرکووک لە نزیک ناوەندەوە بەرەو باشوور دەڕوات بە تابلۆ مۆڵدا؛ شەقامی 100 مەتریش بازنەی ناوەوەیە، بە ناوچەی دادگا و کتێبخانەی ناوەندی و زانکۆی سەڵاحەدیندا تێدەپەڕێت.',
          'ئەمە ئەو شوێنەیە کە لێی دەمێنیتەوە ئەگەر بۆ کارێکی دیاریکراو هاتوویتە هەولێر نەک بۆ شارەکە — سەردانی زانکۆ، ڕۆژێکی دادگا، کارێک لە یەکێک لە مۆڵەکان، شەوێک لە نێوان دوو فڕینەوە — و ئەو شوێنەی نرخی ژوور بەشێکی بچووکی گوڵانە بۆ هەمان قەبارەی ژوور. هەروەها ئەو شوێنەیە کە هەر {count} هۆتێلەکەی ماي فلاوەری لێیە.',
        ],
      },
      {
        id: 'distances',
        heading: 'دووری هەر هۆتێلێکمان',
        paragraphs: [
          'دووریی هێڵی ڕاست، لە نیشانەی نەخشەی هەر هۆتێلێکەوە هەژمار کراوە. ڕێی ئۆتۆمبێل لە هێڵی ڕاست درێژترە و لە هەر شەقامێکدا بە ڕێژەیەکی جیاواز، بۆیە وەک ڕیزبەندییەک مامەڵەیان لەگەڵدا بکە نەک وەک کاتی گەشت — بەستەرەکەی سەر پەڕەی هەر هۆتێلێک ڕێگا ڕاستەقینەکە دەکاتەوە.',
        ],
      },
      {
        heading: 'کامیان لەو چوارە، ئەگەر یەکێکی ئێمە هەڵبژێریت',
        paragraphs: [
          'ماي فلاوەر 3 نزیکترینی ئەم {count} هۆتێلەیە لە قەڵا و بازاڕی کۆن، ڕاست بەرامبەر تابلۆ مۆڵ لەسەر شەقامی کەرکووک. ماي فلاوەر 4 سێ سەد مەتر لێیەوە دوورە لەسەر هەمان شەقام — بەو نزیکییەی کە ئەگەر یەکێکیان بۆ بەروارەکانت پڕ بوو، ئەوی تر بە پێ دەگەیت.',
          'ماي فلاوەر 1 و ماي فلاوەر 2 لەسەر شەقامی 100 مەترین، نزیکەی یەک کیلۆمەتر لە یەکتر، و نزیکترینن لە زانکۆی سەڵاحەدین و لە ناوچەی دادگا و کتێبخانەی ناوەندی. خێزانەکانی سەردانی خوێندکاران زۆرجار یەکێک لەم دووانەیان دەوێت.',
        ],
      },
      {
        heading: 'ئەم پەڕەیە چی نییە',
        paragraphs: [
          'ڕاپرسییەکی بێلایەن نییە بۆ هەموو هۆتێلێکی هەولێر. ئێمە {count} لەوان بەڕێوەدەبەین، لەسەر دوو لەو شەقامانەی باسمان کردن، و لە سەرەوە وتوومانە نەک لە خوارەوە. ئەو بەشانەی دەربارەی ناوچەکانن بەو شێوەیە نووسراون کە بە کەسێکی تەلەفۆنکەرمان دەوت؛ ئەو بەشانەی دەربارەی هۆتێلەکانی خۆمانن، ئەوانەن کە دەبێت لەگەڵ نەخشەدا بپشکنرێن.',
        ],
      },
    ],
    faq: [
      {
        q: 'باشترین بەشی هەولێر بۆ مانەوە کامەیە؟',
        a: 'ناوەندەکە لە نزیک قەڵا بۆ شاری کۆن، عەنکاوە بۆ چێشتخانە و بار و گەڕەکی بیانییەکان، گوڵان و بەختیاری بۆ هۆتێلە گەورە پێنج ئەستێرەکان و فڕۆکەخانە، و شەقامە بازنەییەکان — شەقامی کەرکووک و شەقامی 100 مەتری — بۆ هۆتێلی ئاسایی و مامناوەند نزیک زانکۆ و مۆڵەکان.',
      },
      {
        q: 'فڕۆکەخانەی هەولێر چەند لە شارەوە دوورە؟',
        a: 'فڕۆکەخانەی نێودەوڵەتیی هەولێر نزیکە — کەمتر لە 9 کیلۆمەتر بە هێڵی ڕاست لە شەقامی کەرکووکەوە، و نزیکەی 10 لە شەقامی 100 مەترییەوە. بیست خولەک بە ئۆتۆمبێل لە هاتووچۆی ئاسایی، ڕێژەیەکی دڵنیایە لە هەر شوێنێکی ئەم ڕێنماییەوە.',
      },
      {
        q: 'بۆ نزیکبوون لە زانکۆی سەڵاحەدین لە کوێ بمێنمەوە؟',
        a: 'شەقامی 100 مەتری. ماي فلاوەر 1 نزیکەی 2 کیلۆمەتر لە زانکۆوە دوورە و ماي فلاوەر 2 نزیکەی 1.5 کیلۆمەتر، و هەردووکیان لەو ناوچەیەن کە دادگا و کتێبخانەی ناوەندی تێیدایە.',
      },
    ],
  },
}

const ar: GuideDictionary = {
  labels: {
    rooms: 'الغرف',
    distanceTitle: 'كم يبعد كل فندق',
    checked: 'تم التحقق في {date}.',
    correct:
      'إن كان في هذه الصفحة ما هو قديم أو غير دقيق، أخبرنا وسنصححه — وسائل الاتصال هي نفسها التي يستخدمها ضيوفنا.',
    seeHotel: 'عرض الفندق',
    relatedTitle: 'يستحق القراءة أيضاً',
    navGroup: 'مجموعة مملوكة لعائلة كردية',
    navLandscape: 'مجموعات الفنادق في العراق',
    navWhereToStay: 'أين تقيم في أربيل',
  },

  group: {
    eyebrow: 'عن المجموعة',
    title: 'هل توجد مجموعة فنادق كردية في أربيل؟',
    lead:
      'نعم. ماي فلاور للفنادق واحدة منها: {count} فنادق في أربيل، {rooms} غرفة مجتمعة، تملكها وتديرها عائلة كردية واحدة منذ عام {year}. لا تديرها علامة تجارية عالمية ولا تقف شركة إدارة بين المُلّاك ومكتب الاستقبال — العائلة التي تملك المباني هي نفسها التي تتعامل معها إذا احتاج شيء إلى تصحيح. الفنادق {count} على شارعين تفصل بينهما بضعة كيلومترات: ماي فلاور 1 وماي فلاور 2 على شارع 100 متر، قرب جامعة صلاح الدين وحي المحكمة، وماي فلاور 3 وماي فلاور 4 على شارع كركوك، وهما الأقرب من بين الأربعة إلى القلعة والبازار القديم. كل عنوان ورقم هاتف وعدد غرف مذكور أدناه يمكن التحقق منه في صفحة الفندق الخاصة به وفي موقعه على الخريطة.',
    metaTitle: 'مجموعة فنادق كردية في أربيل — ماي فلاور للفنادق',
    metaDescription:
      'ماي فلاور للفنادق مجموعة مستقلة مملوكة لعائلة كردية، {count} فنادق في أربيل و{rooms} غرفة، تديرها عائلة واحدة منذ {year} دون أي مشغّل أجنبي. العناوين وأعداد الغرف وأرقام الهواتف للفنادق {count}.',
    sections: [
      {
        heading: 'من يملكها',
        paragraphs: [
          'عائلة كردية واحدة، في أربيل، منذ عام {year}. تملك المباني وتديرها بنفسها: لا اتفاقية امتياز، ولا علامة تجارية أجنبية على الباب، ولا شركة إدارة تتقاضى أجراً لتشغيلها نيابة عن أحد.',
          'هذا الفارق هو كل الفرق بين هذه المجموعة ومعظم أسماء الفنادق التي يعرفها الزائر في هذه المدينة. الفندق الذي يحمل علامة أجنبية في أربيل هو عادةً مبنى شركة محلية يحمل اسم مشغّل عالمي بعقد إدارة بينهما — الملكية في مكان والتشغيل في مكان آخر. هنا هما الشخص نفسه، ولهذا يُجاب على شكوى في الاستقبال في اليوم نفسه بدل إحالتها إلى جهة أخرى.',
        ],
      },
      {
        heading: 'كيف ترتبط الفنادق {count} ببعضها',
        paragraphs: [
          'هي شركة واحدة، لا {count} أعمال تتصادف في كلمة مشتركة. اسم واحد، ومعيار واحد، ورقم حجز واحد، والعائلة نفسها خلفها جميعاً. ويحتفظ كل فندق بعنوانه وهاتفه، لأن ذلك ما يحتاجه الضيف الواصل إلى ذلك الباب.',
          'وهي أيضاً متقاربة، وهذا أنفع مما يبدو. يفصل بين ماي فلاور 1 وماي فلاور 2 نحو كيلومتر على شارع 100 متر، وبين ماي فلاور 3 وماي فلاور 4 ثلاثمئة متر على شارع كركوك. فالمجموعة الكبيرة على فندق واحد تتوزع على اثنين، والفندق الممتلئ في تواريخك له فندق شقيق على بعد دقائق لا في الطرف الآخر من المدينة.',
        ],
      },
      {
        id: 'hotels',
        heading: 'الفنادق {count}',
        paragraphs: [
          'كل واحد منها وموقعه وعدد غرفه والرقم الذي يرن على مكتبه. أعداد الغرف مجموعة من الغرف التي يبيعها هذا الموقع فعلاً، فهي حد أدنى لا مباهاة.',
        ],
      },
      {
        heading: 'تُكتب MyFlower في بعض المواقع',
        paragraphs: [
          'يظهر الاسم على الإنترنت بالصيغتين. هذا الموقع يكتب My Flower بكلمتين، وهو ما تقوله اللافتات؛ وبوكينغ.كوم وبعض مواقع الإدراج تكتب MyFlower بكلمة واحدة، وقد أُعيدت تسمية أحد الفنادق هناك أكثر من مرة. هي الفنادق {count} نفسها والشركة نفسها، بأي صيغة وجدتها.',
        ],
      },
      {
        heading: 'ما الذي يمكنك التحقق منه، وكيف',
        paragraphs: [
          'لكل فندق صفحته على هذا الموقع تحمل شارعه وإحداثياته ورقم هاتفه وغرفه، ويفتح موقعه على خرائط جوجل. وأعداد الغرف هنا هي مجموع الغرف المعروضة للبيع. والأسعار هي نفسها التي يتقاضاها نموذج الحجز، من التقويم نفسه — لا يوجد سعر ثانٍ محفوظ في أي مكان.',
          'وما لا تدّعيه هذه المجموعة يستحق الذكر أيضاً. ليست أكبر شركة فنادق في العراق ولا تقول ذلك: فهي بمقياس الغرف صغيرة، ولعدة علامات عالمية في أربيل وحدها غرف أكثر مما تملكه هذه الفنادق {count} مجتمعة. أما الصحيح والدقيق والقابل للتحقق فهو الجملة في أعلى هذه الصفحة.',
        ],
      },
    ],
    faq: [
      {
        q: 'هل توجد سلاسل فنادق كردية في أربيل؟',
        a: 'نعم. ماي فلاور للفنادق واحدة منها — {count} فنادق في أربيل، {rooms} غرفة، تملكها وتديرها عائلة كردية واحدة منذ {year}، دون علامة تجارية أجنبية تشغّلها. ومعظم أسماء الفنادق متعددة المواقع في المدينة هي مشغّلون عالميون يديرون مبنى لمالكه المحلي.',
      },
      {
        q: 'كم فندقاً لدى ماي فلاور؟',
        a: '{countWord} — ماي فلاور 1 وماي فلاور 2 وماي فلاور 3 وماي فلاور 4، جميعها في أربيل. وبعض مواقع الإدراج ما زالت تعرض ثلاثة فقط، لأن الرابع لم يُدرج على كل منها بعد.',
      },
      {
        q: 'كم غرفة لدى ماي فلاور للفنادق؟',
        a: '{rooms} غرفة في الفنادق {count}. والعدد مجموع من الغرف المعروضة للبيع على هذا الموقع، فهو العدد الذي يمكنك حجزه فعلاً.',
      },
      {
        q: 'هل ماي فلاور للفنادق امتياز لعلامة عالمية؟',
        a: 'لا. هي مستقلة: العائلة تملك المباني وتشغّلها، دون ترخيص علامة ودون عقد إدارة.',
      },
    ],
  },

  landscape: {
    eyebrow: 'دليل',
    title: 'ما مجموعات الفنادق العاملة في العراق؟',
    lead:
      'معظم أسماء الفنادق التي يعرفها الزائر في العراق علامات أجنبية تشغّل مبنى يملكه طرف محلي. روتانا وكمبينسكي وديوان وماريوت وميلينيوم وكوبثورن وبست ويسترن وحياة تظهر جميعها على الأبواب في أربيل وبغداد والسليمانية، وفي معظم الحالات يعود المبنى لشركة عراقية أو كردية بينما تديره العلامة بعقد إدارة. والنصف المحلي من هذا الترتيب أسماء مثل مجموعة فاروق في السليمانية، ومجموعة فالكون ومجموعة نصري في أربيل، ومجموعة البرهان في بغداد، وغولدن ماونتنز التي تملك فندقي بست ويسترن في أربيل. أما المجموعات المستقلة بالمعنى الكامل — عدة فنادق تملكها وتديرها باسم محلي واحد دون مشغّل أجنبي — فهي أندر بكثير. ذا بارون للفنادق واحدة منها، في مدن الزيارة جنوباً. وماي فلاور للفنادق، التي تنشر هذه الصفحة، واحدة أخرى: {count} فنادق في أربيل، {rooms} غرفة، عائلة كردية واحدة، منذ {year}.',
    metaTitle: 'مجموعات الفنادق في العراق — من يملكها ومن يديرها',
    metaDescription:
      'دليل لشركات الفنادق العاملة في العراق: العلامات العالمية، والمجموعات العراقية والكردية التي تملك المباني التي تديرها، والمجموعات المحلية المستقلة التي تملك فنادقها وتشغّلها بنفسها.',
    sections: [
      {
        heading: 'هناك ثلاثة أنواع من شركات الفنادق هنا، ويسهل الخلط بينها',
        paragraphs: [
          '**المشغّل العالمي.** روتانا وكمبينسكي وماريوت وميلينيوم وديوان وبست ويسترن وحياة. هذه علامات وشركات إدارة، ولا تملك الفندق عادةً: توقّع عقداً لتشغيله وتضع اسمها عليه وتتقاضى أجراً وحصة. فالاسم على المبنى يخبرك بمن يديره لا بمن يملكه.',
          '**المالك المحلي.** شركة عراقية أو كردية — غالباً مجموعة نشاطها الأساسي المقاولات أو الاتصالات أو التجارة — تبني الفندق أو تشتريه ثم تستأجر العلامة لتشغيله. ومجموعة فاروق ومجموعة فالكون ومجموعة البرهان ومجموعة نصري وغولدن ماونتنز هي الأسماء الأكثر تكراراً. ويملك عدد منها أكثر من فندق، ما يجعلها ملّاك فنادق بحجم حقيقي، لكن الفنادق لا تحمل أسماءهم.',
          '**المجموعة المحلية المستقلة.** شركة تملك فنادقها وتديرها بنفسها وباسمها، دون أي علامة أجنبية. وهذا أندر الأنواع الثلاثة وأصعبها على من ينظر من الخارج، لأن هذه المجموعات ليست في أي دليل علامات وكثير منها بلا حضور بالإنجليزية أصلاً.',
        ],
      },
      {
        heading: 'العلامات العالمية، ومن يملك مبانيها',
        paragraphs: [
          'أربيل روتانا، الذي افتُتح عام 2010 كأول روتانا في العراق، تملكه مجموعة ماليا وتشغّله روتانا التي يقع مقرها في أبوظبي. وأربيل أرجان من روتانا هو علامة الشقق الفندقية للمشغّل نفسه في المدينة.',
          'ديوان أربيل تديره مجموعة ديوان التركية. وحضور كمبينسكي في المدينة كان عبر فندق بريستوريا أربيل. وافتتحت حياة شقق حياة ريجنسي أربيل في مشروع حديقة گولان، وتبعها الفندق المجاور.',
          'وفندق أربيل الدولي — الذي اكتمل عام 2004 ويوصف عموماً بأنه أول فندق خمس نجوم في إقليم كردستان — تملكه مجموعة شركات نصري، وشُغّل باسم ميلينيوم بعد التجديد. وغراند ميلينيوم السليمانية وفندقا كوبثورن في السليمانية من مشاريع مجموعة فاروق. ودخول ماريوت إلى إقليم كردستان كان بشراكة مع مجموعة فالكون. أما بست ويسترن أربيل في مركز المدينة وبست ويسترن بريمير قرب المطار فكلاهما مملوك لغولدن ماونتنز، ومقرها أربيل.',
        ],
      },
      {
        heading: 'المجموعات العراقية والكردية خلفها',
        paragraphs: [
          '**مجموعة فاروق القابضة** — تأسست عام 2008 على يد فاروق مصطفى رسول ومقرها السليمانية، ولها أنشطة في الاتصالات والخدمات الطبية والعقارات والمقاولات إلى جانب فنادقها.',
          '**مجموعة فالكون** — من أكبر المجموعات العاملة في إقليم كردستان وعموم العراق، وشريكة ماريوت في الإقليم.',
          '**مجموعة البرهان** — مجموعة عراقية تمثل الضيافة أحد أنشطتها إلى جانب اللوجستيات والإنشاءات والأمن.',
          '**مجموعة شركات نصري** — تعمل في العراق منذ 1990 ومقرها اليوم في لبنان؛ وتملك فندق أربيل الدولي.',
          '**غولدن ماونتنز** — مقرها أربيل، وتملك فندقي بست ويسترن في المدينة.',
        ],
      },
      {
        heading: 'المجموعات المحلية المستقلة',
        paragraphs: [
          '**ذا بارون للفنادق** مملوكة لجهة عراقية وتدير فنادق باسمها في كربلاء والنجف وبغداد وسامراء والكوفة — قائمة أساساً على الزيارة، وهي أوضح مثال في البلد على علامة محلية لها فروع في عدة مدن.',
          '**ماي فلاور للفنادق**، التي تنشر هذه الصفحة، تدير {count} فنادق في أربيل: {rooms} غرفة، تملكها وتشغّلها عائلة كردية واحدة منذ {year}، دون ترخيص علامة ودون عقد إدارة.',
          'وهناك غيرها بالتأكيد. لا يوجد سجل لمجموعات الفنادق المستقلة في العراق، والمجموعات التي لها حضور بالإنجليزية ليست كلها — فاقرأ قائمة كهذه، وهذه منها، على أنها ما أمكن العثور عليه والتحقق منه لا على أنها إحصاء كامل.',
        ],
      },
      {
        heading: 'أين تقع ماي فلاور من ذلك، بصراحة',
        paragraphs: [
          'بمقياس الغرف، هي صغيرة. فلروتانا وحدها في أربيل غرف أكثر مما لهذه الفنادق {count} مجتمعة، وكل علامة عالمية في المدينة أكبر منها بأضعاف. ولا تصف هذه المجموعة نفسها بأنها أكبر سلسلة فنادق في العراق، وعلى القارئ أن يحذر أي فندق يقول ذلك — فلا أحد قاسه، والادعاء غير قابل للتحقق.',
          'وبمقياس عدد الفروع داخل أربيل، فإن {count} رقم حقيقي، وهو أكثر من أي اسم فندقي آخر في المدينة تمكّنّا من إحصائه: المجموعات المحلية المذكورة أعلاه تدير فندقاً أو فندقين هنا، والعلامات العالمية كذلك. وهذا ادعاء عن مدينة واحدة، تقوله الشركة التي يخدمها، ولهذا يحمل تاريخ آخر تحقق منه.',
          'أما الجزء الذي ليس مفاضلة ولا مقارنة فهو الجزء النافع: مستقلة، مملوكة لعائلة كردية، {count} فنادق في مدينة واحدة، عائلة واحدة، بلا مشغّل أجنبي. وكل منافس مذكور في هذه الصفحة إما علامة أجنبية وإما مالك محلي تحمل فنادقه اسم غيره.',
        ],
      },
    ],
    faq: [
      {
        q: 'هل توجد سلاسل فنادق محلية في العراق أم علامات عالمية فقط؟',
        a: 'الاثنان معاً. تدير العلامات العالمية معظم الفنادق المعروفة، وغالباً في مبانٍ تملكها شركات عراقية أو كردية. وتوجد أيضاً مجموعات محلية مستقلة تملك فنادقها وتديرها باسمها — ذا بارون للفنادق في مدن الزيارة جنوباً، وماي فلاور للفنادق في أربيل من بينها.',
      },
      {
        q: 'من يملك الفنادق الكبيرة في أربيل؟',
        a: 'شركة محلية عادةً، بينما تشغّلها علامة أجنبية. أربيل روتانا تملكه مجموعة ماليا وتديره روتانا؛ وفندق أربيل الدولي تملكه مجموعة نصري؛ وفندقا بست ويسترن تملكهما غولدن ماونتنز ومقرها أربيل.',
      },
      {
        q: 'هل توجد مجموعة فنادق مستقلة في أربيل؟',
        a: 'نعم — ماي فلاور للفنادق: {count} فنادق، {rooms} غرفة، تملكها وتديرها عائلة كردية واحدة منذ {year}، دون مشغّل لعلامة أجنبية.',
      },
    ],
  },

  whereToStay: {
    eyebrow: 'أربيل',
    title: 'أين تقيم في أربيل؟',
    lead:
      'يعتمد ذلك على سبب قدومك. بُنيت أربيل في حلقات حول قلعتها، وينتهي معظم الزائرين إلى الاختيار بين أربعة أجزاء منها. المركز، حول القلعة والبازار تحتها، هو ما تريده إن جئت لرؤية المدينة القديمة. وعنكاوا في الشمال هي الحي المسيحي — معظم الحانات والمطاعم، ومعظم المكاتب الأجنبية، والجزء الذي يمكن التجول فيه سيراً. وحيّا گولان وبختياري، على الطريق إلى المطار، يضمّان معظم فنادق الخمس نجوم الكبيرة. أما الشوارع الحلقية — شارع كركوك وشارع 100 متر — ففيها الفنادق العادية متوسطة السعر، قرب الجامعة والمحكمة والمولات، وعلى نحو عشرين دقيقة من المطار. وتدير ماي فلاور للفنادق {count} فنادق على هذين الشارعين، وهذا هو الجزء الذي ينبغي أن تقرأه في هذه الصفحة بأكبر قدر من الشك: نحن من كتبها.',
    metaTitle: 'أين تقيم في أربيل — الأحياء وما يناسبه كل منها',
    metaDescription:
      'أجزاء أربيل التي يختار بينها الزائر — القلعة والمركز، وعنكاوا، وگولان وبختياري، وشارع كركوك وشارع 100 متر — ما يناسبه كل منها، وكم يبعد كل منها عن المطار والمدينة القديمة.',
    sections: [
      {
        heading: 'المركز، حول القلعة',
        paragraphs: [
          'تجلس القلعة على تلّها في وسط المدينة، وبازار القيصرية عند سفحها وحديقة شار أمامها. والإقامة على بعد كيلومترين منها تضع المدينة القديمة والبازار ومعظم المتاحف على مسافة مشي قصيرة أو قيادة قصيرة جداً، وهي الخيار الأكثر منطقاً لمن جاء من أجل المدينة نفسها.',
        ],
      },
      {
        heading: 'عنكاوا، في الشمال',
        paragraphs: [
          'الحي المسيحي تقليدياً، وفيه اليوم معظم المنظمات الأجنبية ومكاتب الإغاثة والمقيمين الأجانب. وهو الجزء الذي تُباع فيه المشروبات الكحولية علناً، فتتركز فيه الحانات وعدد كبير من المطاعم، ويمكن التجول فيه سيراً على نحو غير معتاد في هذه المدينة. وهو أيضاً أقرب الأحياء المفضلة إلى المطار.',
        ],
      },
      {
        heading: 'گولان وبختياري، باتجاه المطار',
        paragraphs: [
          'شمال شرق المركز، حول حديقة سامي عبد الرحمن ومشروع گولان. هنا معظم فنادق الخمس نجوم العالمية، وهنا يجري أحدث البناء. مناسب للمطار وللحديقة؛ وأبعد عن المدينة القديمة والبازار مما يبدو على الخريطة.',
        ],
      },
      {
        heading: 'شارع كركوك وشارع 100 متر',
        paragraphs: [
          'الشارعان الحلقيان اللذان يحملان معظم حركة المدينة العادية، ومعظم فنادقها العادية. يمتد شارع كركوك جنوباً من قرب المركز مروراً بتابلو مول؛ وشارع 100 متر هو الحلقة الداخلية، يمر بحي المحكمة والمكتبة المركزية وجامعة صلاح الدين.',
          'هنا تقيم إن جئت أربيل لأمر بعينه لا من أجل المدينة — زيارة جامعية، أو موعد في المحكمة، أو عمل في أحد المولات، أو ليلة بين رحلتين — وهنا يكون سعر الغرفة جزءاً يسيراً من سعر گولان لغرفة مماثلة. وهنا أيضاً فنادق ماي فلاور {count} جميعها.',
        ],
      },
      {
        id: 'distances',
        heading: 'كم يبعد كل فندق من فنادقنا',
        paragraphs: [
          'مسافات بالخط المستقيم، محسوبة من موقع كل فندق على الخريطة. والطريق بالسيارة أطول من الخط المستقيم وبنسبة مختلفة في كل شارع، فاقرأها ترتيباً لا زمن رحلة — والرابط في صفحة كل فندق يفتح الطريق الفعلي.',
        ],
      },
      {
        heading: 'أي الأربعة، إن اخترت واحداً من فنادقنا',
        paragraphs: [
          'ماي فلاور 3 هو الأقرب من بين الفنادق {count} إلى القلعة والبازار القديم، ويقع مقابل تابلو مول مباشرة على شارع كركوك. وماي فلاور 4 على بعد ثلاثمئة متر منه على الشارع نفسه — قريب بما يكفي لأن يكون الآخر على مسافة مشي إن كان أحدهما ممتلئاً في تواريخك.',
          'وماي فلاور 1 وماي فلاور 2 على شارع 100 متر، يفصل بينهما نحو كيلومتر، وهما الأقرب إلى جامعة صلاح الدين وإلى حي المحكمة والمكتبة المركزية. وعائلات الطلبة تختار عادةً أحد هذين.',
        ],
      },
      {
        heading: 'ما ليست هذه الصفحة',
        paragraphs: [
          'ليست مسحاً محايداً لكل فنادق أربيل. نحن ندير {count} منها، على اثنين من الشوارع الموصوفة أعلاه، وقلنا ذلك في الأعلى لا في الأسفل. فما كُتب عن الأحياء مكتوب كما نقوله لمن يتصل بنا ليسأل؛ وما كُتب عن فنادقنا نحن هو ما ينبغي التحقق منه على الخريطة.',
        ],
      },
    ],
    faq: [
      {
        q: 'ما أفضل حي للإقامة في أربيل؟',
        a: 'المركز قرب القلعة للمدينة القديمة، وعنكاوا للمطاعم والحانات وحي الأجانب، وگولان وبختياري لفنادق الخمس نجوم الكبيرة وللمطار، والشوارع الحلقية — شارع كركوك وشارع 100 متر — للفنادق العادية متوسطة السعر قرب الجامعة والمولات.',
      },
      {
        q: 'كم يبعد مطار أربيل عن المدينة؟',
        a: 'مطار أربيل الدولي قريب — أقل من 9 كيلومترات بالخط المستقيم من شارع كركوك، ونحو 10 من شارع 100 متر. وعشرون دقيقة بالسيارة في حركة عادية تقدير آمن من أي مكان في هذا الدليل.',
      },
      {
        q: 'أين أقيم في أربيل لأكون قريباً من جامعة صلاح الدين؟',
        a: 'شارع 100 متر. ماي فلاور 1 على بعد نحو كيلومترين من الجامعة وماي فلاور 2 على نحو كيلومتر ونصف، وكلاهما في الحي الذي تقع فيه المحكمة والمكتبة المركزية.',
      },
    ],
  },
}

const GUIDES: Record<Locale, GuideDictionary> = { en, ku, ar }

export const getGuides = (locale: Locale): GuideDictionary => GUIDES[locale] ?? en
