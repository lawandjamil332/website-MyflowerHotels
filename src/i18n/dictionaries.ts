import type { Locale } from './config'

/**
 * Interface text. Anything a guest reads that is not entered in the admin
 * panel lives here, so the Kurdish and Arabic versions are never a
 * half-translated mixture of scripts.
 *
 * Content typed into the admin panel (branch names, descriptions, room
 * details) is translated there instead — see `localization` in the Payload
 * config.
 */
export type Assurance = { title: string; body: string }

export type Dictionary = {
  nav: { home: string; branches: string; rooms: string; about: string; contact: string }
  home: {
    heroEyebrow: string
    heroLead: string
    exploreCollection: string
    scrollCue: string
    collectionEyebrow: string
    chooseBranch: string
    interlude: string
    creditGuestsValue: string
    creditGuests: string
    creditHotels: string
    creditSince: string
    creditStars: string
    creditReception: string
    chooseBranchLead: string
    introEyebrow: string
    introTitle: string
    introBody: string
    offersTitle: string
    offersEverywhere: string
    offersLead: string
    assuranceTitle: string
    assurance: Assurance[]
    roomsEyebrow: string
    featuredRooms: string
    roomsLead: string
    viewAllRooms: string
    ctaEyebrow: string
    ctaTitle: string
    ctaLead: string
  }
  branch: {
    openingSoon: string
    openingBody: string
    overviewEyebrow: string
    stayEyebrow: string
    galleryEyebrow: string
    locationEyebrow: string
    contactTitle: string
    rooms: string
    amenities: string
    gallery: string
    location: string
    checkIn: string
    checkOut: string
    anyTime: string
    getDirections: string
    enquire: string
    bookNow: string
    noRooms: string
  }
  room: {
    detailsEyebrow: string
    galleryEyebrow: string
    from: string
    perNight: string
    guests: string
    bedType: string
    size: string
    amenities: string
    enquire: string
    backToBranch: string
    unavailable: string
  }
  about: { eyebrow: string; lead: string; body1: string; body2: string }
  search: {
    title: string
    hotel: string
    anyHotel: string
    arriving: string
    leaving: string
    guests: string
    submit: string
  }
  roomsPage: {
    eyebrow: string
    title: string
    lead: string
    filterHotel: string
    filterGuests: string
    filterBed: string
    any: string
    apply: string
    clear: string
    results: string
    none: string
  }
  form: {
    eyebrow: string
    title: string
    lead: string
    name: string
    phone: string
    email: string
    optional: string
    checkIn: string
    checkOut: string
    guests: string
    message: string
    submit: string
    sending: string
    successTitle: string
    successBody: string
    errorRequired: string
    errorGeneric: string
    orWhatsApp: string
  }
  contact: { eyebrow: string; lead: string }
  account: {
    signIn: string
    signUp: string
    signOut: string
    myBookings: string
    email: string
    password: string
    haveAccount: string
    noAccount: string
    points: string
    pointsLead: string
    pending: string
    noBookings: string
    badLogin: string
    taken: string
    createTitle: string
    createLead: string
    upcoming: string
    past: string
  }
  booking: {
    title: string
    lead: string
    nights: string
    roomsLeft: string
    none: string
    changeDates: string
    noRoomsYet: string
    reserve: string
    confirmTitle: string
    confirmLead: string
    payAtHotel: string
    submit: string
    sending: string
    doneTitle: string
    doneLead: string
    reference: string
    total: string
    errorDates: string
    errorGuests: string
    errorGone: string
    errorGeneric: string
  }
  bed: Record<'single' | 'double' | 'twin' | 'king' | 'suite', string>
  amenity: Record<string, string>
  common: {
    whatsapp: string
    call: string
    email: string
    language: string
    viewDetails: string
    skipToContent: string
    reserve: string
    menu: string
    close: string
  }
}

const en: Dictionary = {
  nav: {
    home: 'Home',
    branches: 'Our hotels',
    rooms: 'Rooms',
    about: 'About',
    contact: 'Contact',
  },
  home: {
    heroEyebrow: 'Erbil · Kurdistan Region, Iraq',
    heroLead: '{count} hotels, one standard of hospitality.',
    exploreCollection: 'Explore the hotels',
    scrollCue: 'Scroll',
    collectionEyebrow: 'The collection',
    chooseBranch: '{count} hotels in Erbil',
    chooseBranchLead: 'Choose the one that suits your stay.',
    interlude: '{count} addresses in one city.',
    creditGuestsValue: '2 million',
    creditGuests: 'Guests welcomed',
    creditHotels: 'Hotels in Erbil',
    creditSince: 'Welcoming guests since',
    creditStars: 'Star rating',
    creditReception: 'Reception',
    introEyebrow: 'Our hospitality',
    introTitle: 'A family house, kept for guests',
    introBody:
      'We have looked after travellers in Erbil for years. Every hotel in the group is run the same way: clean, quiet, and close to the centre of the city.',
    offersTitle: 'Offers and packages',
    offersEverywhere: 'At every hotel',
    offersLead: 'Current deals across the group. Ask for one by name when you message us.',
    assuranceTitle: 'Why book with us directly',
    assurance: [
      {
        title: 'In the heart of Erbil',
        body: 'Every one of our hotels is within reach of the Citadel, the bazaar and the airport road.',
      },
      {
        title: 'Answered in minutes',
        body: 'A message on WhatsApp reaches the front desk directly, day or night.',
      },
      {
        title: 'Power that stays on',
        body: 'Full generator backup, so the lift, the air conditioning and the Wi-Fi do not stop.',
      },
    ],
    roomsEyebrow: 'Rooms & suites',
    featuredRooms: 'Where you will sleep',
    roomsLead: 'Rooms across every hotel in the group, from quiet singles to family suites.',
    viewAllRooms: 'View all rooms',
    ctaEyebrow: 'Reservations',
    ctaTitle: 'Tell us when you are coming',
    ctaLead: 'Send the dates and the number of guests. We will confirm availability and the rate.',
  },
  branch: {
    openingSoon: 'Opening soon',
    openingBody:
      'This hotel is not open yet. Send us a message and we will tell you as soon as it is taking guests.',
    overviewEyebrow: 'The hotel',
    stayEyebrow: 'Your stay',
    galleryEyebrow: 'In pictures',
    locationEyebrow: 'Location',
    contactTitle: 'Reserve a room',
    rooms: 'Rooms at this hotel',
    amenities: 'What this hotel offers',
    gallery: 'Gallery',
    location: 'Where to find us',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    anyTime: '24 hours',
    getDirections: 'Get directions',
    enquire: 'Enquire about a stay',
    bookNow: 'Book instantly',
    noRooms: 'Rooms for this hotel are being added.',
  },
  room: {
    detailsEyebrow: 'The room',
    galleryEyebrow: 'In pictures',
    from: 'From',
    perNight: 'per night',
    guests: 'Sleeps',
    bedType: 'Bed',
    size: 'Size',
    amenities: 'In this room',
    enquire: 'Enquire about this room',
    backToBranch: 'Back to the hotel',
    unavailable: 'Currently unavailable',
  },
  about: {
    eyebrow: 'About the group',
    lead: '{count} hotels in Erbil, run by one family.',
    body1:
      'We opened our first hotel in Erbil to look after the travellers who come here for work, for family, and for the city itself. Others followed, each in a different part of town, each run the same way.',
    body2:
      'We are not a chain. The same people who own these hotels are the ones you will meet at the desk. If something is not right during your stay, tell us and it is put right that day.',
  },
  search: {
    title: 'Plan your stay',
    hotel: 'Hotel',
    anyHotel: 'Any hotel',
    arriving: 'Arriving',
    leaving: 'Leaving',
    guests: 'Guests',
    submit: 'Check availability',
  },
  roomsPage: {
    eyebrow: 'Rooms & suites',
    title: 'Every room we have',
    lead: 'Filter by hotel, by how many of you there are, or by the bed you want.',
    filterHotel: 'Hotel',
    filterGuests: 'Guests',
    filterBed: 'Bed',
    any: 'Any',
    apply: 'Show rooms',
    clear: 'Clear',
    results: 'rooms',
    none: 'No rooms match that. Try widening the filters, or message us and we will find something.',
  },
  form: {
    eyebrow: 'Reservation enquiry',
    title: 'Ask about a stay',
    lead: 'Tell us the dates and we will confirm what is free and what it costs.',
    name: 'Your name',
    phone: 'Phone or WhatsApp',
    email: 'Email',
    optional: 'optional',
    checkIn: 'Arriving',
    checkOut: 'Leaving',
    guests: 'Guests',
    message: 'Anything we should know',
    submit: 'Send enquiry',
    sending: 'Sending',
    successTitle: 'Thank you — we have it.',
    successBody: 'We will reply to the number you gave us, usually within the hour.',
    errorRequired: 'Please give us a name and a number to reply to.',
    errorGeneric: 'That did not send. Please message us on WhatsApp instead.',
    orWhatsApp: 'Or message us directly',
  },
  account: {
    signIn: 'Sign in',
    signUp: 'Create an account',
    signOut: 'Sign out',
    myBookings: 'My bookings',
    email: 'Email',
    password: 'Password',
    haveAccount: 'Already have an account?',
    noAccount: 'No account yet?',
    points: 'Points',
    pointsLead: 'Points are added after you have stayed.',
    pending: 'after your stay',
    noBookings: 'Nothing booked yet.',
    badLogin: 'That email and password do not match.',
    taken: 'There is already an account with that email.',
    createTitle: 'Keep your bookings in one place',
    createLead: 'An account remembers your details and collects points on every stay.',
    upcoming: 'Coming up',
    past: 'Past stays',
  },
  booking: {
    title: 'Rooms free for your dates',
    lead: 'Choose a room. Nothing is charged now — you pay at the hotel.',
    nights: 'nights',
    roomsLeft: 'left',
    none: 'Nothing is free for those dates. Try different nights, or message us and we will look.',
    changeDates: 'Change dates',
    noRoomsYet:
      'This hotel is not taking online bookings yet. Message us and we will arrange your stay.',
    reserve: 'Reserve this room',
    confirmTitle: 'Confirm your booking',
    confirmLead: 'We only need a name and a number. You pay at the hotel on arrival.',
    payAtHotel: 'Pay at the hotel',
    submit: 'Confirm booking',
    sending: 'Confirming',
    doneTitle: 'Your room is booked.',
    doneLead: 'We have sent the details on. Keep this reference — it is what to quote at the desk.',
    reference: 'Booking reference',
    total: 'Total',
    errorDates: 'Please check the dates — they may have passed while this page was open.',
    errorGuests: 'That room does not sleep that many. Please choose a larger one.',
    errorGone: 'Those dates went while you were deciding. Please pick again.',
    errorGeneric:
      'That did not go through. Please message us on WhatsApp and we will book it by hand.',
  },
  contact: {
    eyebrow: 'Get in touch',
    lead: 'Reach any of our hotels directly. WhatsApp is answered fastest.',
  },
  bed: { single: 'Single', double: 'Double', twin: 'Twin', king: 'King', suite: 'Suite' },
  amenity: {
    wifi: 'Wi-Fi',
    parking: 'Parking',
    restaurant: 'Restaurant',
    gym: 'Gym',
    pool: 'Pool',
    airport_shuttle: 'Airport shuttle',
    family_rooms: 'Family rooms',
    generator: 'Generator',
    air_conditioning: 'Air conditioning',
    private_bathroom: 'Private bathroom',
    tv: 'Flat-screen TV',
    minibar: 'Minibar',
    safe: 'Safe',
    kettle: 'Kettle',
    desk: 'Desk',
    balcony: 'Balcony',
    city_view: 'City view',
    bathtub: 'Bathtub',
    room_service: 'Room service',
  },
  common: {
    whatsapp: 'WhatsApp',
    call: 'Call',
    email: 'Email',
    language: 'Language',
    viewDetails: 'View details',
    skipToContent: 'Skip to content',
    reserve: 'Reserve',
    menu: 'Menu',
    close: 'Close',
  },
}

const ku: Dictionary = {
  nav: {
    home: 'سەرەتا',
    branches: 'هۆتێلەکانمان',
    rooms: 'ژوورەکان',
    about: 'دەربارە',
    contact: 'پەیوەندی',
  },
  home: {
    heroEyebrow: 'هەولێر · هەرێمی کوردستان، عێراق',
    heroLead: '{count} هۆتێل، یەک ئاستی میوانداری.',
    exploreCollection: 'هۆتێلەکان ببینە',
    scrollCue: 'بۆ خوارەوە',
    collectionEyebrow: 'کۆمەڵەکەمان',
    chooseBranch: '{count} هۆتێل لە هەولێر',
    chooseBranchLead: 'ئەوەی گونجاوە بۆ مانەوەت هەڵبژێرە.',
    interlude: '{count} ناونیشان لە یەک شاردا.',
    creditGuestsValue: '2 ملیۆن',
    creditGuests: 'میوان پێشوازیمان لێکردوون',
    creditHotels: 'هۆتێل لە هەولێر',
    creditSince: 'پێشوازی لە میوان لە',
    creditStars: 'پلەی ئەستێرە',
    creditReception: 'پێشوازی',
    introEyebrow: 'میوانداریمان',
    introTitle: 'ماڵێکی خێزانی، بۆ میوان',
    introBody:
      'ساڵانێکە لە هەولێر چاودێری گەشتیارەکان دەکەین. هەموو هۆتێلەکانمان بە یەک شێواز بەڕێوە دەبرێن: پاک، ئارام و نزیک لە ناوەندی شار.',
    offersTitle: 'داشکاندن و پاکێجەکان',
    offersEverywhere: 'لە هەموو هۆتێلەکاندا',
    offersLead:
      'ئەو ڕێککەوتنانەی ئێستا لە هۆتێلەکاندا هەن. کاتێک پەیوەندیمان پێوە دەکەیت بە ناوی داوای بکە.',
    assuranceTitle: 'بۆچی ڕاستەوخۆ لەگەڵمان جێگە بگریت',
    assurance: [
      {
        title: 'لە دڵی هەولێر',
        body: 'هەموو هۆتێلەکانمان نزیکن لە قەڵات، بازاڕ و ڕێگای فڕۆکەخانە.',
      },
      {
        title: 'وەڵام لە چەند خولەکێکدا',
        body: 'نامەیەک لە واتساپ ڕاستەوخۆ دەگاتە پێشوازی، بە شەو و بە ڕۆژ.',
      },
      {
        title: 'کارەبای بەردەوام',
        body: 'مۆلیدەی تەواو، بۆ ئەوەی ئاسانسۆر و کۆندیشن و وای‌فای نەوەستن.',
      },
    ],
    roomsEyebrow: 'ژوور و سویتەکان',
    featuredRooms: 'شوێنی مانەوەت',
    roomsLead: 'ژوورەکانی هەموو هۆتێلەکانمان، لە ژووری تاکەکەسییەوە تا سویتی خێزانی.',
    viewAllRooms: 'بینینی هەموو ژوورەکان',
    ctaEyebrow: 'حیجزکردن',
    ctaTitle: 'پێمان بڵێ کەی دێیت',
    ctaLead: 'ڕێککەوت و ژمارەی میوانەکان بنێرە. بەردەستبوون و نرخەکەت بۆ پشتڕاست دەکەینەوە.',
  },
  branch: {
    openingSoon: 'بەم زووانە دەکرێتەوە',
    openingBody:
      'ئەم هۆتێلە هێشتا نەکراوەتەوە. نامەیەکمان بۆ بنێرە و هەرکە میوانی وەرگرت ئاگادارت دەکەینەوە.',
    overviewEyebrow: 'هۆتێلەکە',
    stayEyebrow: 'مانەوەکەت',
    galleryEyebrow: 'بە وێنە',
    locationEyebrow: 'شوێن',
    contactTitle: 'ژوورێک حیجز بکە',
    rooms: 'ژوورەکانی ئەم هۆتێلە',
    amenities: 'ئەم هۆتێلە چی پێشکەش دەکات',
    gallery: 'وێنەکان',
    location: 'شوێنمان',
    checkIn: 'چوونەژوورەوە',
    checkOut: 'چوونەدەرەوە',
    anyTime: '24 کاتژمێر',
    getDirections: 'ڕێنمایی بۆ گەیشتن',
    enquire: 'داواکاری بۆ مانەوە',
    bookNow: 'حیجزی خێرا',
    noRooms: 'ژوورەکانی ئەم هۆتێلە زیاد دەکرێن.',
  },
  room: {
    detailsEyebrow: 'ژوورەکە',
    galleryEyebrow: 'بە وێنە',
    from: 'لە',
    perNight: 'بۆ شەوێک',
    guests: 'گونجاوە بۆ',
    bedType: 'جێگا',
    size: 'قەبارە',
    amenities: 'لەم ژوورەدا',
    enquire: 'داواکاری دەربارەی ئەم ژوورە',
    backToBranch: 'گەڕانەوە بۆ هۆتێل',
    unavailable: 'لە ئێستادا بەردەست نییە',
  },
  about: {
    eyebrow: 'دەربارەی کۆمەڵەکە',
    lead: '{count} هۆتێل لە هەولێر، بەڕێوەبراو لەلایەن یەک خێزانەوە.',
    body1:
      'یەکەم هۆتێلمان لە هەولێر کردەوە بۆ چاودێریکردنی ئەو گەشتیارانەی بۆ کار، بۆ خێزان و بۆ خودی شارەکە دێن. هۆتێلی تر دوای ئەوان هاتن، هەریەکە لە بەشێکی جیاوازی شار، هەموویان بە یەک شێواز بەڕێوە دەبرێن.',
    body2:
      'ئێمە زنجیرەیەک نین. هەمان ئەو کەسانەی خاوەنی ئەم هۆتێلانەن، ئەوانەن کە لە پێشوازی دەیانبینیت. ئەگەر شتێک لە کاتی مانەوەکەتدا ڕێک نەبوو، پێمان بڵێ و هەر ئەو ڕۆژە چاک دەکرێتەوە.',
  },
  search: {
    title: 'مانەوەکەت پلان بکە',
    hotel: 'هۆتێل',
    anyHotel: 'هەر هۆتێلێک',
    arriving: 'گەیشتن',
    leaving: 'ڕۆیشتن',
    guests: 'میوان',
    submit: 'بەردەستبوون ببینە',
  },
  roomsPage: {
    eyebrow: 'ژوور و سویتەکان',
    title: 'هەموو ژوورەکانمان',
    lead: 'بەپێی هۆتێل، ژمارەی میوان، یان جۆری جێگا پاڵێو بکە.',
    filterHotel: 'هۆتێل',
    filterGuests: 'میوان',
    filterBed: 'جێگا',
    any: 'هەموو',
    apply: 'ژوورەکان پیشان بدە',
    clear: 'سڕینەوە',
    results: 'ژوور',
    none: 'هیچ ژوورێک نەدۆزرایەوە. پاڵاوتنەکان فراوانتر بکە، یان نامەمان بۆ بنێرە و شتێکت بۆ دەدۆزینەوە.',
  },
  form: {
    eyebrow: 'داواکاری حیجز',
    title: 'دەربارەی مانەوە بپرسە',
    lead: 'ڕێککەوتەکانمان پێ بڵێ و ئێمە بەردەستبوون و نرخ پشتڕاست دەکەینەوە.',
    name: 'ناوت',
    phone: 'تەلەفۆن یان واتساپ',
    email: 'ئیمەیل',
    optional: 'ئارەزوومەندانە',
    checkIn: 'گەیشتن',
    checkOut: 'ڕۆیشتن',
    guests: 'میوان',
    message: 'شتێک هەیە بزانین',
    submit: 'ناردنی داواکاری',
    sending: 'دەنێردرێت',
    successTitle: 'سوپاس — وەرمانگرت.',
    successBody: 'لەسەر ئەو ژمارەیەی دات وەڵامت دەدەینەوە، زۆرجار لە ماوەی کاتژمێرێکدا.',
    errorRequired: 'تکایە ناو و ژمارەیەکمان بدەرێ بۆ وەڵامدانەوە.',
    errorGeneric: 'نەنێردرا. تکایە لە جیاتی ئەوە لە واتساپ نامەمان بۆ بنێرە.',
    orWhatsApp: 'یان ڕاستەوخۆ نامەمان بۆ بنێرە',
  },
  account: {
    signIn: 'چوونەژوورەوە',
    signUp: 'دروستکردنی هەژمار',
    signOut: 'دەرچوون',
    myBookings: 'حیجزەکانم',
    email: 'ئیمەیل',
    password: 'وشەی نهێنی',
    haveAccount: 'هەژمارت هەیە؟',
    noAccount: 'هێشتا هەژمارت نییە؟',
    points: 'خاڵەکان',
    pointsLead: 'خاڵەکان دوای مانەوەکەت زیاد دەکرێن.',
    pending: 'دوای مانەوەکەت',
    noBookings: 'هێشتا هیچ حیجزێک نییە.',
    badLogin: 'ئیمەیل و وشەی نهێنی یەک ناگرنەوە.',
    taken: 'هەژمارێک بەم ئیمەیلە هەیە.',
    createTitle: 'حیجزەکانت لە یەک شوێندا',
    createLead: 'هەژمار زانیارییەکانت دەپارێزێت و لە هەر مانەوەیەکدا خاڵ کۆدەکاتەوە.',
    upcoming: 'داهاتوو',
    past: 'مانەوەی پێشوو',
  },
  booking: {
    title: 'ژوورە بەردەستەکان بۆ ڕۆژەکانت',
    lead: 'ژوورێک هەڵبژێرە. ئێستا هیچ پارەیەک وەرناگیرێت — لە هۆتێلەکە دەدەیت.',
    nights: 'شەو',
    roomsLeft: 'ماوە',
    none: 'هیچ ژوورێک بەردەست نییە بۆ ئەو ڕۆژانە. ڕۆژی تر تاقی بکەرەوە، یان پەیوەندیمان پێوە بکە.',
    changeDates: 'گۆڕینی ڕۆژەکان',
    noRoomsYet:
      'ئەم هۆتێلە هێشتا حیجزی ئۆنلاین وەرناگرێت. پەیوەندیمان پێوە بکە و مانەوەکەت ڕێک دەخەین.',
    reserve: 'ئەم ژوورە بگرە',
    confirmTitle: 'دڵنیاکردنەوەی حیجزەکەت',
    confirmLead: 'تەنها ناو و ژمارەیەکمان پێویستە. لە کاتی گەیشتن لە هۆتێلەکە دەدەیت.',
    payAtHotel: 'پارەدان لە هۆتێلەکە',
    submit: 'دڵنیاکردنەوەی حیجز',
    sending: 'دڵنیا دەکرێتەوە',
    doneTitle: 'ژوورەکەت گیرا.',
    doneLead: 'زانیارییەکانمان ناردووە. ئەم ژمارەیە بپارێزە — لە پێشوازی پێویستت پێیەتی.',
    reference: 'ژمارەی حیجز',
    total: 'کۆی گشتی',
    errorDates: 'تکایە ڕۆژەکان بپشکنە — لەوانەیە تێپەڕیبن لە کاتێکدا ئەم پەڕەیە کراوە بوو.',
    errorGuests: 'ئەم ژوورە ئەوەندە کەس جێی نابێتەوە. تکایە ژوورێکی گەورەتر هەڵبژێرە.',
    errorGone: 'ئەو ڕۆژانە گیران لە کاتی بڕیاردانت. تکایە دووبارە هەڵبژێرە.',
    errorGeneric:
      'سەرکەوتوو نەبوو. تکایە لە واتساپ پەیوەندیمان پێوە بکە و بە دەست حیجزت بۆ دەکەین.',
  },
  contact: {
    eyebrow: 'پەیوەندیمان پێوە بکە',
    lead: 'ڕاستەوخۆ پەیوەندی بە هەر یەکێک لە هۆتێلەکانمانەوە بکە. واتساپ خێراترین وەڵام دەداتەوە.',
  },
  bed: { single: 'تاکە', double: 'دوانە', twin: 'دوو جێگا', king: 'شاهانە', suite: 'سویت' },
  amenity: {
    wifi: 'وای‌فای',
    parking: 'پارکینگ',
    restaurant: 'چێشتخانە',
    gym: 'هۆڵی وەرزش',
    pool: 'مەلەوانگە',
    airport_shuttle: 'گواستنەوەی فڕۆکەخانە',
    family_rooms: 'ژووری خێزانی',
    generator: 'مۆلیدە',
    air_conditioning: 'کۆندیشن',
    private_bathroom: 'حەمامی تایبەت',
    tv: 'تەلەڤیزیۆن',
    minibar: 'مینی‌بار',
    safe: 'قاسەی پارێزراو',
    kettle: 'کوارە',
    desk: 'مێزی کار',
    balcony: 'بەلکۆن',
    city_view: 'دیمەنی شار',
    bathtub: 'حەوزی خۆشتن',
    room_service: 'خزمەتگوزاری ژوور',
  },
  common: {
    whatsapp: 'واتساپ',
    call: 'پەیوەندی',
    email: 'ئیمەیل',
    language: 'زمان',
    viewDetails: 'بینینی وردەکاری',
    skipToContent: 'بازدان بۆ ناوەڕۆک',
    reserve: 'حیجز',
    menu: 'لیست',
    close: 'داخستن',
  },
}

const ar: Dictionary = {
  nav: {
    home: 'الرئيسية',
    branches: 'فنادقنا',
    rooms: 'الغرف',
    about: 'من نحن',
    contact: 'اتصل بنا',
  },
  home: {
    heroEyebrow: 'أربيل · إقليم كردستان، العراق',
    heroLead: '{count} فنادق، ومعيار واحد للضيافة.',
    exploreCollection: 'تصفّح الفنادق',
    scrollCue: 'مرّر',
    collectionEyebrow: 'مجموعتنا',
    chooseBranch: '{count} فنادق في أربيل',
    chooseBranchLead: 'اختر ما يناسب إقامتك.',
    interlude: '{count} عناوين في مدينة واحدة.',
    creditGuestsValue: '2 مليون',
    creditGuests: 'ضيف استقبلناهم',
    creditHotels: 'فنادق في أربيل',
    creditSince: 'نستقبل الضيوف منذ',
    creditStars: 'تصنيف النجوم',
    creditReception: 'الاستقبال',
    introEyebrow: 'ضيافتنا',
    introTitle: 'بيت عائلي، مفتوح للضيوف',
    introBody:
      'نستقبل المسافرين في أربيل منذ سنوات. كل فنادق المجموعة تُدار بالطريقة نفسها: النظافة والهدوء والقرب من قلب المدينة.',
    offersTitle: 'العروض والباقات',
    offersEverywhere: 'في جميع الفنادق',
    offersLead: 'العروض الحالية في مجموعتنا. اذكر اسم العرض عند مراسلتنا.',
    assuranceTitle: 'لماذا تحجز معنا مباشرة',
    assurance: [
      {
        title: 'في قلب أربيل',
        body: 'كل فنادقنا قريبة من القلعة والبازار وطريق المطار.',
      },
      {
        title: 'ردّ خلال دقائق',
        body: 'رسالة على واتساب تصل إلى الاستقبال مباشرة، ليلاً ونهاراً.',
      },
      {
        title: 'كهرباء لا تنقطع',
        body: 'مولّد احتياطي كامل، ليبقى المصعد والتكييف والواي فاي يعمل دون انقطاع.',
      },
    ],
    roomsEyebrow: 'الغرف والأجنحة',
    featuredRooms: 'حيث تقيم',
    roomsLead: 'غرف في كل فنادق المجموعة، من الغرف المفردة الهادئة إلى الأجنحة العائلية.',
    viewAllRooms: 'عرض جميع الغرف',
    ctaEyebrow: 'الحجوزات',
    ctaTitle: 'أخبرنا بموعد قدومك',
    ctaLead: 'أرسل التواريخ وعدد الضيوف، ونؤكد لك التوفر والسعر.',
  },
  branch: {
    openingSoon: 'يفتتح قريباً',
    openingBody: 'هذا الفندق لم يفتتح بعد. راسلنا وسنخبرك فور بدء استقباله للنزلاء.',
    overviewEyebrow: 'الفندق',
    stayEyebrow: 'إقامتك',
    galleryEyebrow: 'بالصور',
    locationEyebrow: 'الموقع',
    contactTitle: 'احجز غرفة',
    rooms: 'غرف هذا الفندق',
    amenities: 'ما يقدمه هذا الفندق',
    gallery: 'معرض الصور',
    location: 'موقعنا',
    checkIn: 'تسجيل الوصول',
    checkOut: 'تسجيل المغادرة',
    anyTime: '24 ساعة',
    getDirections: 'الحصول على الاتجاهات',
    enquire: 'استفسر عن الإقامة',
    bookNow: 'احجز فوراً',
    noRooms: 'تتم إضافة غرف هذا الفندق.',
  },
  room: {
    detailsEyebrow: 'الغرفة',
    galleryEyebrow: 'بالصور',
    from: 'ابتداءً من',
    perNight: 'لليلة',
    guests: 'تتسع لـ',
    bedType: 'السرير',
    size: 'المساحة',
    amenities: 'في هذه الغرفة',
    enquire: 'استفسر عن هذه الغرفة',
    backToBranch: 'العودة إلى الفندق',
    unavailable: 'غير متاحة حالياً',
  },
  about: {
    eyebrow: 'عن المجموعة',
    lead: '{count} فنادق في أربيل، تديرها عائلة واحدة.',
    body1:
      'افتتحنا فندقنا الأول في أربيل لاستقبال المسافرين القادمين للعمل أو لزيارة الأهل أو لرؤية المدينة نفسها. ثم تبعته فنادق أخرى، كل واحد في حيّ مختلف، وكلها تُدار بالطريقة نفسها.',
    body2:
      'نحن لسنا سلسلة فنادق. أصحاب هذه الفنادق هم أنفسهم من ستقابلهم عند الاستقبال. وإذا لم يكن شيء على ما يرام أثناء إقامتك، أخبرنا ويُعالَج في اليوم نفسه.',
  },
  search: {
    title: 'خطط لإقامتك',
    hotel: 'الفندق',
    anyHotel: 'أي فندق',
    arriving: 'الوصول',
    leaving: 'المغادرة',
    guests: 'عدد الضيوف',
    submit: 'تحقق من التوفر',
  },
  roomsPage: {
    eyebrow: 'الغرف والأجنحة',
    title: 'كل غرفنا',
    lead: 'صفِّ حسب الفندق أو عدد الضيوف أو نوع السرير.',
    filterHotel: 'الفندق',
    filterGuests: 'عدد الضيوف',
    filterBed: 'السرير',
    any: 'الكل',
    apply: 'اعرض الغرف',
    clear: 'مسح',
    results: 'غرفة',
    none: 'لا توجد غرف مطابقة. وسّع خيارات التصفية، أو راسلنا وسنجد لك ما يناسبك.',
  },
  form: {
    eyebrow: 'طلب حجز',
    title: 'استفسر عن الإقامة',
    lead: 'أخبرنا بالتواريخ ونؤكد لك المتاح والسعر.',
    name: 'الاسم',
    phone: 'الهاتف أو واتساب',
    email: 'البريد الإلكتروني',
    optional: 'اختياري',
    checkIn: 'الوصول',
    checkOut: 'المغادرة',
    guests: 'عدد الضيوف',
    message: 'أي شيء يجب أن نعرفه',
    submit: 'إرسال الطلب',
    sending: 'جارٍ الإرسال',
    successTitle: 'شكراً — وصلنا طلبك.',
    successBody: 'سنرد على الرقم الذي أعطيتنا إياه، عادةً خلال ساعة.',
    errorRequired: 'من فضلك اكتب الاسم ورقماً نرد عليه.',
    errorGeneric: 'لم يتم الإرسال. راسلنا على واتساب من فضلك.',
    orWhatsApp: 'أو راسلنا مباشرة',
  },
  account: {
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    signOut: 'تسجيل الخروج',
    myBookings: 'حجوزاتي',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    haveAccount: 'لديك حساب بالفعل؟',
    noAccount: 'ليس لديك حساب؟',
    points: 'النقاط',
    pointsLead: 'تُضاف النقاط بعد انتهاء إقامتك.',
    pending: 'بعد إقامتك',
    noBookings: 'لا توجد حجوزات بعد.',
    badLogin: 'البريد الإلكتروني وكلمة المرور غير متطابقين.',
    taken: 'يوجد حساب بهذا البريد الإلكتروني.',
    createTitle: 'احفظ حجوزاتك في مكان واحد',
    createLead: 'الحساب يحفظ بياناتك ويجمع النقاط مع كل إقامة.',
    upcoming: 'القادمة',
    past: 'الإقامات السابقة',
  },
  booking: {
    title: 'الغرف المتاحة في تواريخك',
    lead: 'اختر غرفة. لا يُدفع شيء الآن — الدفع في الفندق.',
    nights: 'ليالٍ',
    roomsLeft: 'متبقية',
    none: 'لا تتوفر غرف في هذه التواريخ. جرّب ليالي أخرى، أو راسلنا وسنبحث لك.',
    changeDates: 'تغيير التواريخ',
    noRoomsYet: 'هذا الفندق لا يستقبل الحجز عبر الإنترنت بعد. راسلنا وسنرتب إقامتك.',
    reserve: 'احجز هذه الغرفة',
    confirmTitle: 'تأكيد الحجز',
    confirmLead: 'نحتاج الاسم ورقم الهاتف فقط. الدفع في الفندق عند الوصول.',
    payAtHotel: 'الدفع في الفندق',
    submit: 'تأكيد الحجز',
    sending: 'جارٍ التأكيد',
    doneTitle: 'تم حجز غرفتك.',
    doneLead: 'أرسلنا التفاصيل. احتفظ بهذا الرقم — هو ما تذكره عند الاستقبال.',
    reference: 'رقم الحجز',
    total: 'الإجمالي',
    errorDates: 'يرجى التحقق من التواريخ — ربما مضت بينما كانت هذه الصفحة مفتوحة.',
    errorGuests: 'هذه الغرفة لا تتسع لهذا العدد. الرجاء اختيار غرفة أكبر.',
    errorGone: 'حُجزت هذه التواريخ أثناء اختيارك. الرجاء الاختيار من جديد.',
    errorGeneric: 'لم تتم العملية. راسلنا على واتساب وسنحجز لك يدويًا.',
  },
  contact: {
    eyebrow: 'تواصل معنا',
    lead: 'تواصل مباشرة مع أي من فنادقنا. واتساب هو الأسرع في الرد.',
  },
  bed: { single: 'مفرد', double: 'مزدوج', twin: 'سريران', king: 'كينغ', suite: 'جناح' },
  amenity: {
    wifi: 'واي فاي',
    parking: 'موقف سيارات',
    restaurant: 'مطعم',
    gym: 'صالة رياضية',
    pool: 'مسبح',
    airport_shuttle: 'خدمة نقل المطار',
    family_rooms: 'غرف عائلية',
    generator: 'مولد كهرباء',
    air_conditioning: 'تكييف',
    private_bathroom: 'حمام خاص',
    tv: 'تلفزيون',
    minibar: 'ميني بار',
    safe: 'خزنة',
    kettle: 'غلاية',
    desk: 'مكتب',
    balcony: 'شرفة',
    city_view: 'إطلالة على المدينة',
    bathtub: 'بانيو',
    room_service: 'خدمة الغرف',
  },
  common: {
    whatsapp: 'واتساب',
    call: 'اتصال',
    email: 'بريد إلكتروني',
    language: 'اللغة',
    viewDetails: 'عرض التفاصيل',
    skipToContent: 'تخطي إلى المحتوى',
    reserve: 'احجز',
    menu: 'القائمة',
    close: 'إغلاق',
  },
}

const dictionaries: Record<Locale, Dictionary> = { en, ku, ar }

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale] ?? en
