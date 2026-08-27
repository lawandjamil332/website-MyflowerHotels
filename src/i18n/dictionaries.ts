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
    /** Carries `{count}` — the hotels actually open, not the four that exist. */
    creditGuests: string
    creditHotels: string
    /** Shown under the hotel count while one of them has not opened yet. */
    creditHotelsNote: string
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
    ratedOn: string
    ratedOnChecked: string
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
    otherHotels: string
  }
  room: {
    detailsEyebrow: string
    galleryEyebrow: string
    from: string
    perNight: string
    guests: string
    bedType: string
    size: string
    bedroom: string
    bedrooms: string
    hall: string
    halls: string
    bathroom: string
    bathrooms: string
    kitchen: string
    layout: string
    amenities: string
    enquire: string
    backToBranch: string
    unavailable: string
    /** The composed paragraph, used only where nothing has been written by hand. */
    summarySleeps: string
    summarySleepsBed: string
    summaryLayout: string
    summarySize: string
    summaryWhere: string
    summaryPrice: string
    summaryPay: string
  }
  about: {
    eyebrow: string
    lead: string
    body1: string
    body2: string
    identityLead: string
    identityOpened: string
    identityOneCity: string
    identityManyCities: string
  }
  branchesPage: {
    eyebrow: string
    title: string
    lead: string
    glanceTitle: string
    glanceLead: string
    gridTitle: string
    colHotel: string
    colWhere: string
    colPhone: string
    colFrom: string
    colStatus: string
    statusOpen: string
    statusSoon: string
    perNight: string
    view: string
    metaDescription: string
  }
  search: {
    title: string
    hotel: string
    anyHotel: string
    needDates: string
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
    /** Label and placeholder for the free-text room search. */
    search: string
    searchPlaceholder: string
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
    gateTitle: string
    gateLead: string
    forgot: string
    forgotLead: string
    sendReset: string
    resetSent: string
    backToSignIn: string
    setPassword: string
    resetLead: string
    resetNoToken: string
    weak: string
    show: string
    hide: string
    passwordHint: string
    phoneHint: string
    history: string
    noHistory: string
    earnLead: string
    earns: string
    keepItTitle: string
    keepItLead: string
    keepIt: string
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
    savePdf: string
    title: string
    lead: string
    nights: string
    roomsLeft: string
    onlyLeft: string
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
    manageTitle: string
    manageLead: string
    yourReference: string
    findIt: string
    notFound: string
    tooMany: string
    cancel: string
    cancelled: string
    tooLate: string
    confirmCancel: string
    errorDates: string
    errorGuests: string
    errorGone: string
    errorGeneric: string
  }
  faq: {
    title: string
    checkInQ: string
    checkInAnyA: string
    checkInAtA: string
    checkOutQ: string
    checkOutA: string
    payQ: string
    payA: string
    cancelQ: string
    cancelA: string
    whereQ: string
    whereA: string
    priceQ: string
    priceA: string
    familyQ: string
    familyA: string
    breakfastQ: string
    breakfastA: string
    powerQ: string
    powerA: string
    wifiQ: string
    wifiA: string
    parkingQ: string
    parkingA: string
    contactQ: string
    contactA: string
    pointsQ: string
    pointsA: string
    roomTitle: string
    roomSleepsQ: string
    roomSleepsA: string
    roomSleepsLayoutA: string
    roomIncludesQ: string
    roomIncludesA: string
    roomPriceQ: string
    roomPriceA: string
    roomBookQ: string
    roomBookA: string
    roomBookPhoneA: string
    groupTitle: string
    countQ: string
    countA: string
    chooseQ: string
    chooseA: string
    groupContactQ: string
    groupContactA: string
    ownedQ: string
    ownedA: string
    erbilQ: string
    erbilA: string
  }
  email: {
    confirmEyebrow: string
    confirmTitle: string
    confirmLead: string
    refLabel: string
    stayTitle: string
    hotelTitle: string
    guestTitle: string
    knowTitle: string
    lHotel: string
    lRoom: string
    lArriving: string
    lLeaving: string
    lNights: string
    lGuests: string
    lQuoted: string
    lAddress: string
    lPhone: string
    lName: string
    lEmail: string
    lNotes: string
    lLanguage: string
    lCheckIn: string
    lCheckOut: string
    payNotice: string
    cancelNotice: string
    deskNotice: string
    btnManage: string
    btnDirections: string
    btnWhatsApp: string
    footerGuest: string
    footerHotel: string
    subjGuest: string
    subjHotel: string
    preGuest: string
    preHotel: string
    newEyebrow: string
    newTitle: string
    newLead: string
    cxEyebrow: string
    cxTitle: string
    cxLead: string
    cxNotice: string
    cxHotelTitle: string
    cxHotelLead: string
    subjGuestCx: string
    subjHotelCx: string
    preGuestCx: string
    preHotelCx: string
    lRate: string
    lTotal: string
    lStayLength: string
    freeUntil: string
    btnCalendar: string
    btnPass: string
    footerContact: string
    footerWhy: string
    payAtHotel: string
    checkInAny: string
    cancelSelf: string
  }
  errors: {
    eyebrow: string
    title: string
    body: string
    retry: string
    home: string
    reference: string
  }
  seo: {
    hotelIn: string
    hotelsIn: string
    /** The city's name in this language — "Erbil", "هەولێر", "أربيل". */
    locality: string
    /** The wider region, likewise. */
    region: string
    /** The country, named in this language. */
    country: string
    bookDirect: string
    /** Carries `{year}`. Goes in the homepage title after the city. */
    ownedSince: string
    /** "Hotel group in" — what the About page is actually competing for. */
    hotelGroupIn: string
    /** Carries `{count}` and `{city}`. The About page's search summary. */
    groupDescription: string
  }
  reviews: {
    title: string
    fromCount: string
    verified: string
    leaveTitle: string
    leaveLead: string
    send: string
    thanks: string
    moderated: string
    already: string
    guestsSay: string
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
    creditGuests: 'Guests welcomed across our {count} hotels',
    creditHotels: 'Hotels in Erbil',
    creditHotelsNote: '{open} open, {soon} opening soon',
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
    ratedOn: 'Rated {score}/10 by {count} guests on Booking.com',
    ratedOnChecked: 'as of {date}',
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
    otherHotels: 'Our other hotels',
  },
  room: {
    detailsEyebrow: 'The room',
    galleryEyebrow: 'In pictures',
    from: 'From',
    perNight: 'per night',
    guests: 'Sleeps',
    bedType: 'Bed',
    bedroom: 'bedroom',
    bedrooms: 'bedrooms',
    hall: 'hall',
    halls: 'halls',
    bathroom: 'bathroom',
    bathrooms: 'bathrooms',
    kitchen: 'Kitchen',
    layout: 'Layout',
    size: 'Size',
    amenities: 'In this room',
    enquire: 'Enquire about this room',
    backToBranch: 'Back to the hotel',
    unavailable: 'Currently unavailable',
    summarySleeps: '{room} sleeps up to {guests}.',
    summarySleepsBed: '{room} sleeps up to {guests}, in a {bed} bed.',
    summaryLayout: 'The layout is {layout}.',
    summarySize: 'It measures {size} m².',
    summaryWhere: 'It is at {hotel}, {where}, in {city}.',
    summaryPrice:
      'From {price} a night, paid at the hotel when you arrive — no card is taken to hold the room and there is no booking fee.',
    summaryPay:
      'You pay at the hotel when you arrive — no card is taken to hold the room and there is no booking fee.',
  },
  about: {
    eyebrow: 'About the group',
    lead: '{count} hotels in Erbil, run by one family.',
    body1:
      'We opened our first hotel in Erbil to look after the travellers who come here for work, for family, and for the city itself. Others followed, each in a different part of town, each run the same way.',
    body2:
      'We are not a chain. The same people who own these hotels are the ones you will meet at the desk. If something is not right during your stay, tell us and it is put right that day.',
    identityLead: 'My Flower Hotels is an independent, Iraqi-owned group, run by one family.',
    identityOpened: 'We opened our first hotel in {city} in {year}.',
    identityOneCity:
      'Today we run {count}, all of them in {city}, {country} — the same owners, the same standard, {count} addresses.',
    identityManyCities: 'Today we run {count} across {country}, in {cities}.',
  },
  branchesPage: {
    eyebrow: 'Our hotels',
    title: '{count} hotels in Erbil',
    lead: 'Every My Flower hotel, what each one is near, and what a room costs.',
    glanceTitle: 'The hotels at a glance',
    glanceLead: 'The same table a guest would ask us for on the phone.',
    gridTitle: 'Choose your hotel',
    colHotel: 'Hotel',
    colWhere: 'Where it is',
    colPhone: 'Telephone',
    colFrom: 'Rooms from',
    colStatus: 'Status',
    statusOpen: 'Open',
    statusSoon: 'Opening soon',
    perNight: 'per night',
    view: 'View hotel',
    metaDescription:
      '{count} My Flower hotels in Erbil, Iraq — addresses, telephone numbers, room prices and what each one is near. Independent and Iraqi-owned.',
  },
  search: {
    title: 'Plan your stay',
    hotel: 'Hotel',
    anyHotel: 'Any hotel',
    needDates: 'Please choose the nights you are staying.',
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
    search: 'Search',
    searchPlaceholder: 'Room, hotel or what is in it',
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
    gateTitle: 'Sign in or create an account',
    gateLead: 'Keep your bookings in one place and collect points on every stay.',
    forgot: 'I have forgotten my password',
    forgotLead: 'Enter your email address and we will send you a link to set a new password.',
    sendReset: 'Send the link',
    resetSent: 'If that address has an account, the link is on its way. It expires in an hour.',
    backToSignIn: 'Back to sign in',
    setPassword: 'Choose a new password',
    resetLead: 'Pick something you will remember. You will be signed in straight away.',
    resetNoToken:
      'This page needs the link from your email. Please open it from the message we sent.',
    weak: 'Please use at least 8 characters.',
    show: 'Show',
    hide: 'Hide',
    passwordHint: 'At least 8 characters. A short phrase works better than a short word.',
    phoneHint:
      'The number you book with, so stays you made before opening an account come with you.',
    history: 'Points history',
    noHistory: 'Points appear here after your first completed stay.',
    earnLead: 'Points are added once the stay is finished.',
    earns: 'Earns',
    keepItTitle: 'Keep this booking',
    keepItLead: 'Set a password and this stay, and every one after it, is saved to your account.',
    keepIt: 'Create my account',
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
    savePdf: 'Save as PDF',
    title: 'Rooms free for your dates',
    lead: 'Choose a room. Nothing is charged now — you pay at the hotel.',
    nights: 'nights',
    roomsLeft: 'left',
    onlyLeft: 'Only {count} left',
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
    manageTitle: 'Find your booking',
    manageLead: 'Enter your reference and the phone number you booked with.',
    yourReference: 'Booking reference',
    findIt: 'Find booking',
    notFound: 'No booking matches that reference and number.',
    tooMany: 'Too many tries. Please wait a few minutes, or call the hotel.',
    cancel: 'Cancel this booking',
    cancelled: 'This booking is cancelled. The room has gone back into stock.',
    tooLate: 'This one cannot be cancelled here — please call the hotel.',
    confirmCancel: 'Cancelling cannot be undone.',
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
  faq: {
    title: 'Questions guests ask',
    checkInQ: 'What time can I check in at {hotel}?',
    checkInAnyA:
      'Any time. Reception at {hotel} is staffed 24 hours, so you can arrive on a night flight or an early bus and your room will be ready for you.',
    checkInAtA: 'Check-in at {hotel} is from {time}.',
    checkOutQ: 'What time is check-out?',
    checkOutA:
      'Check-out is at {time}. If you need a later departure, ask at the desk on the day and we will do what we can.',
    payQ: 'Do I have to pay online to book?',
    payA: 'No. Booking here takes a name and a phone number, and you pay at the hotel when you arrive. We do not ask for a card and nothing is charged in advance.',
    cancelQ: 'Can I cancel my booking?',
    cancelA:
      'Yes, free of charge, any time before the day you arrive. Use "Find your booking" with your reference and the number you booked with, and the room is released straight away.',
    whereQ: 'Where is {hotel}?',
    whereA: '{hotel} is on {where}, in {city}. The exact pin and directions are on this page.',
    priceQ: 'How much is a room at {hotel}?',
    priceA:
      'Rooms at {hotel} start from {price} a night. The price you see when you search your dates is the price you pay at the desk — there is no booking fee.',
    familyQ: 'Do you have rooms for families at {hotel}?',
    familyA:
      'Yes. {hotel} has apartment-style units with separate bedrooms and a hall, which suit families and longer stays better than a single large room. The layout of each is listed with the room.',
    breakfastQ: 'Is breakfast included?',
    breakfastA:
      'Yes. Breakfast is served every morning at {hotel} and is included in the room — there is nothing extra to pay for it at the desk.',
    powerQ: 'Does the power stay on?',
    powerA:
      'Yes. {hotel} runs on full generator backup, so the lift, the air conditioning and the Wi-Fi keep working through a city outage.',
    wifiQ: 'Is there Wi-Fi?',
    wifiA: 'Yes, Wi-Fi throughout {hotel}, included in the room and with no charge or time limit.',
    parkingQ: 'Is there parking?',
    parkingA: 'Yes, {hotel} has parking for guests.',
    contactQ: 'How do I reach {hotel} fastest?',
    contactA:
      'WhatsApp on {phone} reaches the front desk directly and is usually answered within minutes, day or night. The same number takes ordinary calls.',
    pointsQ: 'Do I earn anything by booking direct?',
    pointsA:
      'Yes. Open a free account and every completed stay earns points towards future stays. Points are added after you have stayed, not when you book.',
    roomTitle: 'Questions about this room',
    roomSleepsQ: 'How many people can stay in {room}?',
    roomSleepsA: '{room} takes up to {guests}.',
    roomSleepsLayoutA:
      '{room} takes up to {guests}, and is laid out as {layout} — so a family or a longer stay is not sharing one room.',
    roomIncludesQ: 'What is included in {room}?',
    roomIncludesA: '{list}. Included in the price, with nothing added at the desk.',
    roomPriceQ: 'How much is {room} per night?',
    roomPriceA:
      '{room} starts from {price} a night. Search your dates on this page and the price you are shown is the price you pay at the hotel.',
    roomBookQ: 'How do I book {room}?',
    roomBookA:
      'Choose your dates on this page and confirm with a name and a phone number. You will get a reference straight away, and you can cancel it yourself free of charge any time before you arrive.',
    roomBookPhoneA:
      'Choose your dates on this page and confirm with a name and a phone number — you will get a reference straight away. If you would rather speak to someone, WhatsApp or call {phone}.',
    groupTitle: 'Questions about the group',
    countQ: 'How many My Flower hotels are there?',
    countA: 'There are {count}, all in {city}: {list}.',
    chooseQ: 'Which one should I stay at?',
    chooseA:
      'They are in different parts of {city}, so the one to choose is usually whichever is nearest to where you need to be. Each hotel has its own page listing its rooms, its prices and its exact location on the map.',
    ownedQ: 'Who owns My Flower Hotels?',
    ownedA:
      'It is independent and Iraqi-owned, run by one family rather than operated under a foreign brand. Most hotel names in this country with more than one property are international operators managing a building for its owners; this is not one of those.',
    erbilQ: 'Where should I stay in {city}?',
    erbilA:
      'That depends on what you are near. We run {count} hotels in {city} — {list} — so the useful question is which part of the city you need to be in. Each hotel page lists its street, its rooms and its exact position on the map.',
    groupContactQ: 'How do I reach you?',
    groupContactA:
      'WhatsApp or call {phone}. It reaches us directly, day or night, and it is the fastest way to ask about any of the hotels.',
  },
  email: {
    confirmEyebrow: 'Reservation confirmed',
    confirmTitle: 'Your room is booked, {name}',
    confirmLead:
      'Thank you for booking directly with us. Everything you need is below — the only thing worth keeping is the reference.',
    refLabel: 'Your reference',
    stayTitle: 'Your stay',
    hotelTitle: 'The hotel',
    guestTitle: 'Guest',
    knowTitle: 'Good to know',
    lHotel: 'Hotel',
    lRoom: 'Room',
    lArriving: 'Arriving',
    lLeaving: 'Leaving',
    lNights: 'Nights',
    lGuests: 'Guests',
    lQuoted: 'Quoted',
    lAddress: 'Address',
    lPhone: 'Phone',
    lName: 'Name',
    lEmail: 'Email',
    lNotes: 'Notes',
    lLanguage: 'Booked in',
    lCheckIn: 'Check-in from',
    lCheckOut: 'Check-out by',
    payNotice:
      '<strong>Nothing has been charged.</strong> You pay at the hotel when you arrive — cash or card, whichever suits you.',
    cancelNotice:
      '<strong>Free cancellation</strong> any time before the day you arrive, and you can do it yourself from the link below.',
    deskNotice: 'At the desk, give your name or read out the reference above. That is all we need.',
    btnManage: 'View or cancel this booking',
    btnDirections: 'Get directions',
    btnWhatsApp: 'Message us on WhatsApp',
    footerGuest:
      'We are looking forward to having you. If anything about this booking is wrong, reply to this email or send us a WhatsApp — a person reads both.',
    footerHotel: 'Sent by the website when a guest books. The booking is already in the admin panel.',
    subjGuest: 'Your booking at {hotel} — {ref}',
    subjHotel: 'New booking {ref} — {hotel} — {date}',
    preGuest: '{ref} · {arriving} · {nights}',
    preHotel: '{guest} · {room} · {arriving}',
    newEyebrow: 'New booking',
    newTitle: 'New booking at {hotel}',
    newLead: 'A guest has booked through the website. The room is already out of stock for these nights.',
    cxEyebrow: 'Booking cancelled',
    cxTitle: 'Your booking is cancelled',
    cxLead: 'This is your record of it. There is nothing to pay, and nothing further to do.',
    cxNotice:
      'If you did not cancel this, call us straight away and we will put it back if the room is still free.',
    cxHotelTitle: 'Cancelled — {hotel}',
    cxHotelLead:
      'The guest cancelled this on the website. The room is back on sale — take it out of the book.',
    subjGuestCx: 'Cancelled — {ref} — {hotel}',
    subjHotelCx: 'CANCELLED {ref} — {hotel} — {date}',
    preGuestCx: '{ref} cancelled. Nothing to pay.',
    preHotelCx: '{guest} · {room} · {arriving} — room back on sale',
    lRate: 'Per night',
    lTotal: 'Total',
    lStayLength: '{count} nights',
    freeUntil: 'Free to cancel until {date}',
    btnCalendar: 'Add to my calendar',
    btnPass: 'View or print your confirmation',
    footerContact: '{hotel}<br>{address}<br>{phone}',
    footerWhy: 'You are receiving this because this address was given when the booking was made.',
    payAtHotel: 'Payable at the hotel',
    checkInAny: 'Reception open 24 hours',
    cancelSelf: '— and you can do it yourself, from the button below.',
  },
  errors: {
    eyebrow: 'Something went wrong',
    title: 'This page did not load',
    body: 'The fault is ours, not yours. Try again — and if it keeps happening, ring the hotel and we will take your booking over the phone.',
    retry: 'Try again',
    home: 'Back to the homepage',
    reference: 'Reference',
  },
  seo: {
    hotelIn: 'Hotel in',
    hotelsIn: 'Hotels in',
    locality: 'Erbil',
    region: 'Kurdistan Region, Iraq',
    country: 'Iraq',
    bookDirect: 'Book direct and pay at the hotel',
    ownedSince: 'Iraqi-owned since {year}',
    hotelGroupIn: 'Iraqi-owned hotel group in',
    groupDescription:
      'An independent, family-run hotel group with {count} hotels in {city} — Iraqi-owned, ' +
      'not a foreign brand. Addresses, rooms and rates for every hotel, and booking direct ' +
      'with no card and no fee.',
  },
  reviews: {
    title: 'What guests said',
    fromCount: 'from {count} reviews',
    verified: 'Verified stay',
    leaveTitle: 'How was your stay?',
    leaveLead: 'You stayed with us, so your review carries a verified mark.',
    send: 'Send my review',
    thanks: 'Thank you — we have it. It appears once we have read it.',
    moderated: 'Reviews are read before they are published.',
    already: 'This stay has already been reviewed, or is not finished yet.',
    guestsSay: 'What our guests say',
  },
  bed: { single: 'Single', double: 'Double', twin: 'Twin', king: 'King', suite: 'Suite' },
  amenity: {
    wifi: 'Wi-Fi',
    breakfast: 'Breakfast',
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
    creditGuests: 'میوان لە {count} هۆتێلماندا پێشوازیمان لێکردوون',
    creditHotels: 'هۆتێل لە هەولێر',
    creditHotelsNote: '{open} کراوەن، {soon} بەم زووانە دەکرێتەوە',
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
    ratedOn: 'نمرەی {score}/10 لەلایەن {count} میوانەوە لە Booking.com',
    ratedOnChecked: 'تا {date}',
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
    otherHotels: 'هۆتێلەکانی تریمان',
  },
  room: {
    detailsEyebrow: 'ژوورەکە',
    galleryEyebrow: 'بە وێنە',
    from: 'لە',
    perNight: 'بۆ شەوێک',
    guests: 'گونجاوە بۆ',
    bedType: 'جێگا',
    bedroom: 'ژووری نوستن',
    bedrooms: 'ژووری نوستن',
    hall: 'هۆڵ',
    halls: 'هۆڵ',
    bathroom: 'حەمام',
    bathrooms: 'حەمام',
    kitchen: 'چێشتخانە',
    layout: 'پێکهاتە',
    size: 'قەبارە',
    amenities: 'لەم ژوورەدا',
    enquire: 'داواکاری دەربارەی ئەم ژوورە',
    backToBranch: 'گەڕانەوە بۆ هۆتێل',
    unavailable: 'لە ئێستادا بەردەست نییە',
    summarySleeps: '{room} هەتا {guests} وەردەگرێت.',
    summarySleepsBed: '{room} هەتا {guests} وەردەگرێت، لەگەڵ قەرەوێڵەی {bed}.',
    summaryLayout: 'پێکهاتووە لە {layout}.',
    summarySize: 'ڕووبەرەکەی {size} م².',
    summaryWhere: 'لە {hotel} دایە، {where}، لە {city}.',
    summaryPrice:
      'لە {price} بۆ شەوێک دەست پێدەکات، لە هۆتێلەکەدا دەدرێت کاتێک دەگەیت — هیچ کارتێک وەرناگیرێت بۆ گرتنی ژوورەکە و هیچ کرێی حیجزکردن نییە.',
    summaryPay:
      'لە هۆتێلەکەدا دەدەیت کاتێک دەگەیت — هیچ کارتێک وەرناگیرێت بۆ گرتنی ژوورەکە و هیچ کرێی حیجزکردن نییە.',
  },
  about: {
    eyebrow: 'دەربارەی کۆمەڵەکە',
    lead: '{count} هۆتێل لە هەولێر، بەڕێوەبراو لەلایەن یەک خێزانەوە.',
    body1:
      'یەکەم هۆتێلمان لە هەولێر کردەوە بۆ چاودێریکردنی ئەو گەشتیارانەی بۆ کار، بۆ خێزان و بۆ خودی شارەکە دێن. هۆتێلی تر دوای ئەوان هاتن، هەریەکە لە بەشێکی جیاوازی شار، هەموویان بە یەک شێواز بەڕێوە دەبرێن.',
    body2:
      'ئێمە زنجیرەیەک نین. هەمان ئەو کەسانەی خاوەنی ئەم هۆتێلانەن، ئەوانەن کە لە پێشوازی دەیانبینیت. ئەگەر شتێک لە کاتی مانەوەکەتدا ڕێک نەبوو، پێمان بڵێ و هەر ئەو ڕۆژە چاک دەکرێتەوە.',
    identityLead:
      'هۆتێلەکانی ماي فلاوەر گرووپێکی سەربەخۆی عێراقییە، لەلایەن یەک خێزانەوە بەڕێوە دەبرێت.',
    identityOpened: 'یەکەم هۆتێلمان لە ساڵی {year} لە {city} کردەوە.',
    identityOneCity:
      'ئەمڕۆ {count} هۆتێلمان هەیە، هەموویان لە {city}، {country} — هەمان خاوەن، هەمان ئاست، {count} ناونیشان.',
    identityManyCities: 'ئەمڕۆ {count} هۆتێلمان هەیە بەسەر {country} دا، لە {cities}.',
  },
  branchesPage: {
    eyebrow: 'هۆتێلەکانمان',
    title: '{count} هۆتێل لە هەولێر',
    lead: 'هەموو هۆتێلەکانی ماي فلاوەر، هەریەکەیان لە نزیک چییەوەیە، و نرخی ژوورەکان.',
    glanceTitle: 'هۆتێلەکان بە کورتی',
    glanceLead: 'هەمان ئەو زانیارییەی میوان بە تەلەفۆن داوای دەکات.',
    gridTitle: 'هۆتێلەکەت هەڵبژێرە',
    colHotel: 'هۆتێل',
    colWhere: 'شوێنەکەی',
    colPhone: 'تەلەفۆن',
    colFrom: 'ژوور لە',
    colStatus: 'دۆخ',
    statusOpen: 'کراوەیە',
    statusSoon: 'بەم زووانە دەکرێتەوە',
    perNight: 'بۆ هەر شەوێک',
    view: 'هۆتێلەکە ببینە',
    metaDescription:
      'هەموو {count} هۆتێلی ماي فلاوەر لە هەولێر، عێراق — ناونیشان، ژمارەی تەلەفۆن، نرخی ژوورەکان و هەریەکەیان لە نزیک چییەوەیە. سەربەخۆ و خاوەندارێتی عێراقی.',
  },
  search: {
    title: 'مانەوەکەت پلان بکە',
    hotel: 'هۆتێل',
    anyHotel: 'هەر هۆتێلێک',
    needDates: 'تکایە ئەو شەوانە هەڵبژێرە کە دەمێنیتەوە.',
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
    search: 'گەڕان',
    searchPlaceholder: 'ژوور، هۆتێل، یان ئەوەی تێیدایە',
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
    gateTitle: 'بچۆ ژوورەوە یان هەژمارێک دروست بکە',
    gateLead: 'حیجزەکانت لە یەک شوێن بپارێزە و لە هەر مانەوەیەک خاڵ کۆبکەرەوە.',
    forgot: 'وشەی نهێنیم لەبیر چووە',
    forgotLead: 'ئیمەیڵەکەت بنووسە و بەستەرێکت بۆ دەنێرین بۆ دانانی وشەی نهێنی نوێ.',
    sendReset: 'بەستەرەکە بنێرە',
    resetSent: 'ئەگەر ئەو ئیمەیڵە هەژماری هەبێت، بەستەرەکە لە ڕێگاوەیە. دوای کاتژمێرێک بەسەردەچێت.',
    backToSignIn: 'گەڕانەوە بۆ چوونەژوورەوە',
    setPassword: 'وشەی نهێنیی نوێ هەڵبژێرە',
    resetLead: 'شتێک هەڵبژێرە کە لەبیرت دەمێنێت. ڕاستەوخۆ دەچیتە ژوورەوە.',
    resetNoToken: 'ئەم پەڕەیە پێویستی بە بەستەرەکەی ئیمەیڵەکەتە. تکایە لە نامەکەوە بیکەرەوە.',
    weak: 'تکایە بەلایەنی کەمەوە ٨ پیت بەکاربهێنە.',
    show: 'پیشاندان',
    hide: 'شاردنەوە',
    passwordHint: 'بەلایەنی کەمەوە ٨ پیت. ڕستەیەکی کورت باشترە لە وشەیەکی کورت.',
    phoneHint: 'ئەو ژمارەیەی پێی حیجز دەکەیت، تا ئەو مانەوانەی پێش هەژمارەکەت لەگەڵت بێن.',
    history: 'مێژووی خاڵەکان',
    noHistory: 'خاڵەکان لێرە دەردەکەون دوای یەکەم مانەوەی تەواوبوو.',
    earnLead: 'خاڵەکان دوای تەواوبوونی مانەوەکە زیاد دەکرێن.',
    earns: 'دەیهێنێت',
    keepItTitle: 'ئەم حیجزە بپارێزە',
    keepItLead:
      'وشەیەکی نهێنی دابنێ و ئەم مانەوەیە، و هەموو ئەوانەی دوای، لە هەژمارەکەت دەپارێزرێن.',
    keepIt: 'هەژمارەکەم دروست بکە',
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
    savePdf: 'وەک PDF پاشەکەوتی بکە',
    title: 'ژوورە بەردەستەکان بۆ ڕۆژەکانت',
    lead: 'ژوورێک هەڵبژێرە. ئێستا هیچ پارەیەک وەرناگیرێت — لە هۆتێلەکە دەدەیت.',
    nights: 'شەو',
    roomsLeft: 'ماوە',
    onlyLeft: 'تەنها {count} ماوە',
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
    manageTitle: 'حیجزەکەت بدۆزەرەوە',
    manageLead: 'ژمارەی حیجز و ئەو ژمارە تەلەفۆنە بنووسە کە پێی حیجزت کرد.',
    yourReference: 'ژمارەی حیجز',
    findIt: 'دۆزینەوەی حیجز',
    notFound: 'هیچ حیجزێک بەم ژمارانە نەدۆزرایەوە.',
    tooMany: 'زۆر هەوڵت دا. تکایە چەند خولەکێک چاوەڕێ بکە، یان پەیوەندی بە هۆتێلەوە بکە.',
    cancel: 'هەڵوەشاندنەوەی ئەم حیجزە',
    cancelled: 'ئەم حیجزە هەڵوەشێنرایەوە. ژوورەکە گەڕایەوە بۆ بەردەستبوون.',
    tooLate: 'ئەمە لێرە هەڵناوەشێتەوە — تکایە پەیوەندی بە هۆتێلەکەوە بکە.',
    confirmCancel: 'هەڵوەشاندنەوە ناگەڕێتەوە.',
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
  faq: {
    title: 'پرسیارە باوەکانی میوانان',
    checkInQ: 'لە {hotel} لە چ کاتێک دەتوانم بچمە ژوورەوە؟',
    checkInAnyA:
      'هەر کاتێک. پێشوازی لە {hotel} 24 کاتژمێر کارا دەبێت، بۆیە بە فڕۆکەی شەوانە یان پاسی بەیانی زوو بگەیت، ژوورەکەت ئامادەیە.',
    checkInAtA: 'چوونەژوورەوە لە {hotel} لە {time}ـەوە دەستپێدەکات.',
    checkOutQ: 'کاتی چوونەدەرەوە کەیە؟',
    checkOutA:
      'چوونەدەرەوە لە {time}ـە. ئەگەر پێویستت بە درەنگتر بوو، هەمان ڕۆژ لە پێشوازی داوای بکە و ئەوەی لە دەستمان بێت دەیکەین.',
    payQ: 'پێویستە پێشوەخت پارە بدەم بۆ حیجزکردن؟',
    payA: 'نەخێر. حیجزکردن لێرە تەنها ناو و ژمارەی تەلەفۆن دەوێت، و لە هۆتێلەکە پارە دەدەیت کاتێک دەگەیت. داوای کارتی بانکی ناکەین و هیچ پارەیەک پێشوەخت وەرناگیرێت.',
    cancelQ: 'دەتوانم حیجزەکەم هەڵبوەشێنمەوە؟',
    cancelA:
      'بەڵێ، بەخۆڕایی، هەر کاتێک پێش ئەو ڕۆژەی دێیت. لە «حیجزەکەت بدۆزەرەوە» ژمارەی حیجز و ئەو ژمارەیەی پێی حیجزت کرد بنووسە، ژوورەکە یەکسەر ئازاد دەبێت.',
    whereQ: '{hotel} لە کوێیە؟',
    whereA: '{hotel} لە {where}ـە، لە {city}. نیشانەی وردی شوێن و ڕێنمایی لەم پەڕەیەدایە.',
    priceQ: 'نرخی ژوور لە {hotel} چەندە؟',
    priceA:
      'ژوورەکانی {hotel} لە {price}ـەوە دەستپێدەکەن بۆ شەوێک. ئەو نرخەی لە کاتی گەڕان دەیبینیت هەمان ئەو نرخەیە لە پێشوازی دەیدەیت — هیچ کرێیەکی زیادە نییە.',
    familyQ: 'لە {hotel} ژووری خێزانی هەیە؟',
    familyA:
      'بەڵێ. {hotel} یەکەی شوقەیی هەیە بە ژووری نوستنی جیاواز و هۆڵ، کە بۆ خێزان و مانەوەی درێژخایەن گونجاوترن لە یەک ژووری گەورە. پێکهاتەی هەریەکەیان لەگەڵ ژوورەکەدا نووسراوە.',
    breakfastQ: 'ئایا نانی بەیانی لەگەڵدایە؟',
    breakfastA:
      'بەڵێ. نانی بەیانی هەموو بەیانییەک لە {hotel} پێشکەش دەکرێت و لە نرخی ژوورەکەدا هەژمار کراوە — هیچ شتێکی زیادە لە پێشوازیدا نادەیت.',
    powerQ: 'کارەبا نابڕێت؟',
    powerA:
      'بەڵێ. {hotel} مۆلێدەی تەواوی هەیە، بۆیە ئاسانسۆر و کۆندیشن و وایفای لە کاتی کوژانەوەی کارەبای شار بەردەوام دەبن.',
    wifiQ: 'وایفای هەیە؟',
    wifiA: 'بەڵێ، وایفای لە هەموو {hotel}، لەگەڵ ژوورەکەدایە و بێ کرێ و بێ سنووری کات.',
    parkingQ: 'شوێنی وەستانی ئۆتۆمبێل هەیە؟',
    parkingA: 'بەڵێ، {hotel} شوێنی وەستانی ئۆتۆمبێلی هەیە بۆ میوانان.',
    contactQ: 'چۆن زووترین پەیوەندی بە {hotel} بکەم؟',
    contactA:
      'واتساپ لەسەر {phone} ڕاستەوخۆ دەگاتە پێشوازی و زۆرجار لە ماوەی چەند خولەکێکدا وەڵام دەدرێتەوە، شەو و ڕۆژ. هەمان ژمارە پەیوەندی ئاساییش وەردەگرێت.',
    pointsQ: 'ئایا بە حیجزی ڕاستەوخۆ شتێک بەدەست دەهێنم؟',
    pointsA:
      'بەڵێ. هەژمارێکی بێبەرامبەر بکەرەوە و هەر مانەوەیەکی تەواوبوو خاڵت بۆ کۆدەکاتەوە بۆ مانەوەکانی داهاتوو. خاڵەکان دوای مانەوەکە زیاد دەکرێن، نەک لە کاتی حیجزکردن.',
    roomTitle: 'پرسیار دەربارەی ئەم ژوورە',
    roomSleepsQ: 'چەند کەس دەتوانن لە {room} بمێننەوە؟',
    roomSleepsA: '{room} هەتا {guests} وەردەگرێت.',
    roomSleepsLayoutA:
      '{room} هەتا {guests} وەردەگرێت و پێکهاتووە لە {layout} — بۆیە خێزان یان مانەوەی درێژخایەن پێویست ناکات هەموویان لە یەک ژوور بن.',
    roomIncludesQ: 'چی لە {room} دا هەیە؟',
    roomIncludesA: '{list}. لە نرخەکەدا هەژمار کراوە و هیچ شتێکی زیادە لە پێشوازیدا زیاد ناکرێت.',
    roomPriceQ: 'نرخی {room} بۆ شەوێک چەندە؟',
    roomPriceA:
      '{room} لە {price} بۆ شەوێک دەست پێدەکات. بەرواری خۆت لەم لاپەڕەیەدا بگەڕێ و ئەو نرخەی پیشانت دەدرێت هەمان ئەو نرخەیە کە لە هۆتێلەکەدا دەیدەیت.',
    roomBookQ: 'چۆن {room} حیجز بکەم؟',
    roomBookA:
      'بەرواری خۆت لەم لاپەڕەیەدا هەڵبژێرە و بە ناو و ژمارەی مۆبایل پشتڕاستی بکەرەوە. یەکسەر ژمارەی حیجز وەردەگریت، و دەتوانیت خۆت بێبەرامبەر هەڵیبوەشێنیتەوە پێش ئەو ڕۆژەی دێیت.',
    roomBookPhoneA:
      'بەرواری خۆت لەم لاپەڕەیەدا هەڵبژێرە و بە ناو و ژمارەی مۆبایل پشتڕاستی بکەرەوە — یەکسەر ژمارەی حیجز وەردەگریت. ئەگەر پێت باشترە قسە لەگەڵ کەسێک بکەیت، واتساپ یان پەیوەندی بکە بە {phone}.',
    groupTitle: 'پرسیار دەربارەی گرووپەکە',
    countQ: 'چەند هۆتێلی ماي فلاوەر هەیە؟',
    countA: '{count} هەیە، هەموویان لە {city}: {list}.',
    chooseQ: 'لە کامیاندا بمێنمەوە؟',
    chooseA:
      'لە بەشە جیاوازەکانی {city} دان، بۆیە باشترین هەڵبژاردن زۆرجار ئەوەیە کە نزیکترە لەو شوێنەی پێویستت پێیەتی. هەر هۆتێلێک لاپەڕەی خۆی هەیە کە ژوورەکان، نرخەکان و شوێنی وردی لەسەر نەخشە پیشان دەدات.',
    ownedQ: 'خاوەنی هۆتێلەکانی ماي فلاوەر کێیە؟',
    ownedA:
      'سەربەخۆیە و خاوەنەکەی عێراقییە، لەلایەن یەک خێزانەوە بەڕێوە دەبرێت، نەک لەژێر ناوێکی بیانیدا. زۆربەی ئەو ناوانەی لەم وڵاتەدا زیاتر لە یەک هۆتێلیان هەیە کۆمپانیای نێودەوڵەتین کە بینایەک بۆ خاوەنەکەی بەڕێوە دەبەن؛ ئەمە لەوانە نییە.',
    erbilQ: 'لە {city} لە کوێ بمێنمەوە؟',
    erbilA:
      'ئەوە بەوە بەندە کە پێویستە لە نزیک چی بیت. {count} هۆتێلمان لە {city} هەیە — {list} — بۆیە پرسیارە بەکەڵکەکە ئەوەیە کە پێویستە لە کام بەشی شارەکەدا بیت. هەر لاپەڕەیەکی هۆتێل شەقام و ژوورەکان و شوێنی وردی لەسەر نەخشە پیشان دەدات.',
    groupContactQ: 'چۆن پەیوەندیتان پێوە بکەم؟',
    groupContactA:
      'واتساپ یان پەیوەندی بکە بە {phone}. ڕاستەوخۆ دەگاتە ئێمە، شەو و ڕۆژ، و خێراترین ڕێگایە بۆ پرسیار دەربارەی هەر کام لە هۆتێلەکان.',
  },
  email: {
    confirmEyebrow: 'حیجزەکە پشتڕاستکرایەوە',
    confirmTitle: 'ژوورەکەت حیجز کرا، {name}',
    confirmLead:
      'سوپاس بۆ حیجزکردنی ڕاستەوخۆ لەگەڵمان. هەموو ئەوەی پێویستت پێیەتی لە خوارەوەیە — تەنها شتێک کە دەبێت بیهێڵیتەوە ژمارەی حیجزە.',
    refLabel: 'ژمارەی حیجزت',
    stayTitle: 'مانەوەکەت',
    hotelTitle: 'هۆتێل',
    guestTitle: 'میوان',
    knowTitle: 'باشە بزانرێت',
    lHotel: 'هۆتێل',
    lRoom: 'ژوور',
    lArriving: 'گەیشتن',
    lLeaving: 'ڕۆیشتن',
    lNights: 'شەو',
    lGuests: 'میوان',
    lQuoted: 'نرخی خەملێنراو',
    lAddress: 'ناونیشان',
    lPhone: 'تەلەفۆن',
    lName: 'ناو',
    lEmail: 'ئیمەیل',
    lNotes: 'تێبینی',
    lLanguage: 'حیجزکراوە بە',
    lCheckIn: 'چوونەژوورەوە لە',
    lCheckOut: 'چوونەدەرەوە پێش',
    payNotice:
      '<strong>هیچ بڕێک وەرنەگیراوە.</strong> لە هۆتێلەکەدا دەدەیت کاتێک دەگەیت — کاش یان کارت، هەرکامت پێ باشە.',
    cancelNotice:
      '<strong>هەڵوەشاندنەوەی بێبەرامبەر</strong> لە هەر کاتێکدا پێش ئەو ڕۆژەی دێیت، و خۆت دەتوانیت لە بەستەرەکەی خوارەوە بیکەیت.',
    deskNotice: 'لە پێشوازیدا، ناوت بڵێ یان ژمارەی حیجزی سەرەوە بخوێنەوە. هەر ئەوەندە پێویستە.',
    btnManage: 'بینین یان هەڵوەشاندنەوەی ئەم حیجزە',
    btnDirections: 'ڕێنمایی ڕێگا',
    btnWhatsApp: 'نامە بنێرە بە واتساپ',
    footerGuest:
      'بە خۆشحاڵییەوە چاوەڕێت دەکەین. ئەگەر شتێک لەم حیجزەدا هەڵە بوو، وەڵامی ئەم ئیمەیلە بدەرەوە یان واتساپێکمان بۆ بنێرە — کەسێک هەردووکیان دەخوێنێتەوە.',
    footerHotel: 'لە لایەن ماڵپەڕەکە نێردراوە کاتێک میوانێک حیجز دەکات. حیجزەکە پێشتر لە پانێڵی بەڕێوەبردندایە.',
    subjGuest: 'حیجزەکەت لە {hotel} — {ref}',
    subjHotel: 'حیجزی نوێ {ref} — {hotel} — {date}',
    preGuest: '{ref} · {arriving} · {nights}',
    preHotel: '{guest} · {room} · {arriving}',
    newEyebrow: 'حیجزی نوێ',
    newTitle: 'حیجزی نوێ لە {hotel}',
    newLead: 'میوانێک لە ڕێگەی ماڵپەڕەوە حیجزی کردووە. ژوورەکە بۆ ئەم شەوانە لە بەردەستدا نییە.',
    cxEyebrow: 'حیجز هەڵوەشێنرایەوە',
    cxTitle: 'حیجزەکەت هەڵوەشێنرایەوە',
    cxLead: 'ئەمە تۆمارەکەی تۆیە. هیچ شتێک بۆ دان نییە و هیچ کارێکی تر پێویست نییە.',
    cxNotice:
      'ئەگەر تۆ ئەمە هەڵنەوەشێنراوەتەوە، یەکسەر پەیوەندیمان پێوە بکە و ئەگەر ژوورەکە هێشتا بەردەست بێت دەیگەڕێنینەوە.',
    cxHotelTitle: 'هەڵوەشێنرایەوە — {hotel}',
    cxHotelLead:
      'میوانەکە لە ماڵپەڕەکەدا هەڵیوەشاندەوە. ژوورەکە گەڕاوەتەوە بۆ فرۆشتن — لە دەفتەرەکە لابەرە.',
    subjGuestCx: 'هەڵوەشێنرایەوە — {ref} — {hotel}',
    subjHotelCx: 'هەڵوەشێنرایەوە {ref} — {hotel} — {date}',
    preGuestCx: '{ref} هەڵوەشێنرایەوە. هیچ بۆ دان نییە.',
    preHotelCx: '{guest} · {room} · {arriving} — ژوور گەڕاوەتەوە بۆ فرۆشتن',
    lRate: 'بۆ شەوێک',
    lTotal: 'کۆی گشتی',
    lStayLength: '{count} شەو',
    freeUntil: 'بێبەرامبەر دەتوانرێت هەڵبوەشێنرێتەوە هەتا {date}',
    btnCalendar: 'زیادی بکە بۆ ڕۆژژمێرەکەم',
    btnPass: 'بینین یان چاپکردنی پشتڕاستکردنەوەکەت',
    footerContact: '{hotel}<br>{address}<br>{phone}',
    footerWhy: 'ئەم نامەیەت پێگەیشت چونکە ئەم ناونیشانە لە کاتی حیجزکردندا دراوە.',
    payAtHotel: 'لە هۆتێلەکەدا دەدرێت',
    checkInAny: 'پێشوازی 24 کاتژمێر کراوەیە',
    cancelSelf: '— و خۆت دەتوانیت لە دوگمەی خوارەوە بیکەیت.',
  },
  errors: {
    eyebrow: 'شتێک هەڵە بوو',
    title: 'ئەم لاپەڕەیە بار نەبوو',
    body: 'هەڵەکە لای ئێمەیە، نەک لای تۆ. دووبارە هەوڵ بدەرەوە — و ئەگەر بەردەوام بوو، پەیوەندی بە هۆتێلەکەوە بکە و بە تەلەفۆن حیجزەکەت وەردەگرین.',
    retry: 'دووبارە هەوڵ بدەرەوە',
    home: 'گەڕانەوە بۆ لاپەڕەی سەرەکی',
    reference: 'ژمارەی هەڵە',
  },
  seo: {
    hotelIn: 'هۆتێل لە',
    hotelsIn: 'هۆتێلەکان لە',
    locality: 'هەولێر',
    region: 'هەرێمی کوردستان، عێراق',
    country: 'عێراق',
    bookDirect: 'ڕاستەوخۆ حیجز بکە و لە هۆتێلەکە پارە بدە',
    ownedSince: 'خاوەندارێتی عێراقی لە {year}ەوە',
    hotelGroupIn: 'گرووپی هۆتێلی عێراقی لە',
    groupDescription:
      'گرووپێکی هۆتێلی سەربەخۆی خێزانی بە {count} هۆتێل لە {city} — خاوەندارێتی عێراقی، ' +
      'نەک براندێکی بیانی. ناونیشان، ژوور و نرخی هەموو هۆتێلەکان، و حیجزی ڕاستەوخۆ ' +
      'بەبێ کارت و بەبێ کرێ.',
  },
  reviews: {
    title: 'میوانەکان چییان وت',
    fromCount: 'لە {count} پێداچوونەوە',
    verified: 'مانەوەی پشتڕاستکراو',
    leaveTitle: 'مانەوەکەت چۆن بوو؟',
    leaveLead: 'تۆ لای ئێمە مایتەوە، بۆیە پێداچوونەوەکەت نیشانەی پشتڕاستکردنەوەی هەیە.',
    send: 'پێداچوونەوەکەم بنێرە',
    thanks: 'سوپاس — وەرمانگرت. دوای خوێندنەوەی دەردەکەوێت.',
    moderated: 'پێداچوونەوەکان پێش بڵاوکردنەوە دەخوێنرێنەوە.',
    already: 'ئەم مانەوەیە پێشتر پێداچوونەوەی بۆ کراوە، یان هێشتا تەواو نەبووە.',
    guestsSay: 'میوانەکانمان چی دەڵێن',
  },
  bed: { single: 'تاکە', double: 'دوانە', twin: 'دوو جێگا', king: 'شاهانە', suite: 'سویت' },
  amenity: {
    wifi: 'وای‌فای',
    breakfast: 'نانی بەیانی',
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
    creditGuests: 'ضيف استقبلناهم في فنادقنا ال{count}',
    creditHotels: 'فنادق في أربيل',
    creditHotelsNote: '{open} مفتوحة، {soon} يفتتح قريباً',
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
    ratedOn: 'تقييم {score}/10 من {count} ضيفاً على Booking.com',
    ratedOnChecked: 'حتى {date}',
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
    otherHotels: 'فنادقنا الأخرى',
  },
  room: {
    detailsEyebrow: 'الغرفة',
    galleryEyebrow: 'بالصور',
    from: 'ابتداءً من',
    perNight: 'لليلة',
    guests: 'تتسع لـ',
    bedType: 'السرير',
    bedroom: 'غرفة نوم',
    bedrooms: 'غرف نوم',
    hall: 'صالة',
    halls: 'صالات',
    bathroom: 'حمام',
    bathrooms: 'حمامات',
    kitchen: 'مطبخ',
    layout: 'التقسيم',
    size: 'المساحة',
    amenities: 'في هذه الغرفة',
    enquire: 'استفسر عن هذه الغرفة',
    backToBranch: 'العودة إلى الفندق',
    unavailable: 'غير متاحة حالياً',
    summarySleeps: 'تتسع {room} حتى {guests}.',
    summarySleepsBed: 'تتسع {room} حتى {guests}، بسرير {bed}.',
    summaryLayout: 'تتكوّن من {layout}.',
    summarySize: 'مساحتها {size} م².',
    summaryWhere: 'تقع في {hotel}، {where}، في {city}.',
    summaryPrice:
      'تبدأ من {price} في الليلة، تُدفع في الفندق عند الوصول — لا تُؤخذ بطاقة لحجز الغرفة ولا توجد رسوم حجز.',
    summaryPay:
      'تدفع في الفندق عند الوصول — لا تُؤخذ بطاقة لحجز الغرفة ولا توجد رسوم حجز.',
  },
  about: {
    eyebrow: 'عن المجموعة',
    lead: '{count} فنادق في أربيل، تديرها عائلة واحدة.',
    body1:
      'افتتحنا فندقنا الأول في أربيل لاستقبال المسافرين القادمين للعمل أو لزيارة الأهل أو لرؤية المدينة نفسها. ثم تبعته فنادق أخرى، كل واحد في حيّ مختلف، وكلها تُدار بالطريقة نفسها.',
    body2:
      'نحن لسنا سلسلة فنادق. أصحاب هذه الفنادق هم أنفسهم من ستقابلهم عند الاستقبال. وإذا لم يكن شيء على ما يرام أثناء إقامتك، أخبرنا ويُعالَج في اليوم نفسه.',
    identityLead: 'فنادق ماي فلاور مجموعة عراقية مستقلة تديرها عائلة واحدة.',
    identityOpened: 'افتتحنا أول فنادقنا في {city} عام {year}.',
    identityOneCity:
      'ونُدير اليوم {count} فنادق، جميعها في {city}، {country} — المُلّاك أنفسهم، والمستوى نفسه، و{count} عناوين.',
    identityManyCities: 'ونُدير اليوم {count} فنادق في أنحاء {country}، في {cities}.',
  },
  branchesPage: {
    eyebrow: 'فنادقنا',
    title: '{count} فنادق في أربيل',
    lead: 'كل فنادق ماي فلاور، وما يقع بالقرب من كل واحد منها، وأسعار الغرف.',
    glanceTitle: 'الفنادق في لمحة',
    glanceLead: 'المعلومات نفسها التي يطلبها الضيف منّا على الهاتف.',
    gridTitle: 'اختر فندقك',
    colHotel: 'الفندق',
    colWhere: 'الموقع',
    colPhone: 'الهاتف',
    colFrom: 'الغرف من',
    colStatus: 'الحالة',
    statusOpen: 'مفتوح',
    statusSoon: 'يفتتح قريباً',
    perNight: 'في الليلة',
    view: 'عرض الفندق',
    metaDescription:
      '{count} فنادق ماي فلاور في أربيل، العراق — العناوين وأرقام الهاتف وأسعار الغرف وما يقع بالقرب من كل فندق. مجموعة عراقية مستقلة.',
  },
  search: {
    title: 'خطط لإقامتك',
    hotel: 'الفندق',
    anyHotel: 'أي فندق',
    needDates: 'يرجى اختيار ليالي إقامتك.',
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
    search: 'بحث',
    searchPlaceholder: 'الغرفة أو الفندق أو ما فيها',
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
    gateTitle: 'سجّل الدخول أو أنشئ حساباً',
    gateLead: 'احفظ حجوزاتك في مكان واحد واجمع النقاط مع كل إقامة.',
    forgot: 'نسيت كلمة المرور',
    forgotLead: 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.',
    sendReset: 'أرسل الرابط',
    resetSent: 'إذا كان لهذا البريد حساب، فالرابط في طريقه إليك. تنتهي صلاحيته خلال ساعة.',
    backToSignIn: 'العودة إلى تسجيل الدخول',
    setPassword: 'اختر كلمة مرور جديدة',
    resetLead: 'اختر شيئاً تتذكره. سيتم تسجيل دخولك مباشرة.',
    resetNoToken: 'تحتاج هذه الصفحة إلى الرابط من بريدك. يرجى فتحه من الرسالة التي أرسلناها.',
    weak: 'يرجى استخدام 8 أحرف على الأقل.',
    show: 'إظهار',
    hide: 'إخفاء',
    passwordHint: '8 أحرف على الأقل. عبارة قصيرة أفضل من كلمة قصيرة.',
    phoneHint: 'الرقم الذي تحجز به، لتأتي معك الإقامات التي تمت قبل إنشاء الحساب.',
    history: 'سجل النقاط',
    noHistory: 'تظهر النقاط هنا بعد أول إقامة مكتملة.',
    earnLead: 'تُضاف النقاط بعد انتهاء الإقامة.',
    earns: 'يكسب',
    keepItTitle: 'احتفظ بهذا الحجز',
    keepItLead: 'عيّن كلمة مرور وسيُحفظ هذا الحجز، وكل ما بعده، في حسابك.',
    keepIt: 'أنشئ حسابي',
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
    savePdf: 'حفظ بصيغة PDF',
    title: 'الغرف المتاحة في تواريخك',
    lead: 'اختر غرفة. لا يُدفع شيء الآن — الدفع في الفندق.',
    nights: 'ليالٍ',
    roomsLeft: 'متبقية',
    onlyLeft: 'بقيت {count} فقط',
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
    manageTitle: 'ابحث عن حجزك',
    manageLead: 'أدخل رقم الحجز ورقم الهاتف الذي حجزت به.',
    yourReference: 'رقم الحجز',
    findIt: 'بحث عن الحجز',
    notFound: 'لا يوجد حجز مطابق لهذا الرقم وهذا الهاتف.',
    tooMany: 'محاولات كثيرة. يرجى الانتظار بضع دقائق، أو الاتصال بالفندق.',
    cancel: 'إلغاء هذا الحجز',
    cancelled: 'تم إلغاء الحجز. عادت الغرفة إلى التوفر.',
    tooLate: 'لا يمكن إلغاء هذا هنا — يرجى الاتصال بالفندق.',
    confirmCancel: 'لا يمكن التراجع عن الإلغاء.',
    errorDates: 'يرجى التحقق من التواريخ — ربما مضت بينما كانت هذه الصفحة مفتوحة.',
    errorGuests: 'هذه الغرفة لا تتسع لهذا العدد. الرجاء اختيار غرفة أكبر.',
    errorGone: 'حُجزت هذه التواريخ أثناء اختيارك. الرجاء الاختيار من جديد.',
    errorGeneric: 'لم تتم العملية. راسلنا على واتساب وسنحجز لك يدويًا.',
  },
  contact: {
    eyebrow: 'تواصل معنا',
    lead: 'تواصل مباشرة مع أي من فنادقنا. واتساب هو الأسرع في الرد.',
  },
  faq: {
    title: 'أسئلة يسألها الضيوف',
    checkInQ: 'متى يمكنني تسجيل الوصول في {hotel}؟',
    checkInAnyA:
      'في أي وقت. الاستقبال في {hotel} يعمل 24 ساعة، فسواء وصلت برحلة ليلية أو بحافلة مبكرة ستجد غرفتك جاهزة.',
    checkInAtA: 'تسجيل الوصول في {hotel} من {time}.',
    checkOutQ: 'متى موعد المغادرة؟',
    checkOutA:
      'المغادرة في {time}. إذا احتجت وقتاً أطول، اسأل في الاستقبال في اليوم نفسه وسنبذل ما بوسعنا.',
    payQ: 'هل يجب الدفع مسبقاً عبر الإنترنت؟',
    payA: 'لا. الحجز هنا يحتاج اسماً ورقم هاتف فقط، وتدفع في الفندق عند وصولك. لا نطلب بطاقة ولا يُخصم أي مبلغ مسبقاً.',
    cancelQ: 'هل يمكنني إلغاء الحجز؟',
    cancelA:
      'نعم، مجاناً، في أي وقت قبل يوم وصولك. استخدم «ابحث عن حجزك» برقم الحجز والهاتف الذي حجزت به، وتعود الغرفة للتوفر فوراً.',
    whereQ: 'أين يقع {hotel}؟',
    whereA: 'يقع {hotel} في {where}، في {city}. الموقع الدقيق والاتجاهات موجودة في هذه الصفحة.',
    priceQ: 'كم سعر الغرفة في {hotel}؟',
    priceA:
      'تبدأ غرف {hotel} من {price} لليلة. السعر الذي تراه عند البحث عن تواريخك هو ما تدفعه في الاستقبال — بدون رسوم حجز.',
    familyQ: 'هل توجد غرف عائلية في {hotel}؟',
    familyA:
      'نعم. في {hotel} وحدات على شكل شقق بغرف نوم منفصلة وصالة، وهي أنسب للعائلات وللإقامات الطويلة من غرفة واحدة كبيرة. تقسيم كل وحدة مذكور مع الغرفة.',
    breakfastQ: 'هل الفطور مشمول؟',
    breakfastA:
      'نعم. يُقدَّم الفطور كل صباح في {hotel} وهو مشمول ضمن سعر الغرفة — لا تدفع عنه شيئاً إضافياً عند الاستقبال.',
    powerQ: 'هل تبقى الكهرباء مستمرة؟',
    powerA:
      'نعم. يعمل {hotel} بمولد احتياطي كامل، فيستمر المصعد والتكييف والإنترنت أثناء انقطاع كهرباء المدينة.',
    wifiQ: 'هل يوجد واي فاي؟',
    wifiA: 'نعم، واي فاي في كامل {hotel}، مشمول مع الغرفة وبدون رسوم أو حد زمني.',
    parkingQ: 'هل يوجد موقف سيارات؟',
    parkingA: 'نعم، يوفر {hotel} موقفاً للضيوف.',
    contactQ: 'ما أسرع طريقة للتواصل مع {hotel}؟',
    contactA:
      'واتساب على {phone} يصل إلى الاستقبال مباشرة ويُرد عليه عادة خلال دقائق، ليلاً أو نهاراً. الرقم نفسه يستقبل المكالمات العادية.',
    pointsQ: 'هل أستفيد شيئاً بالحجز المباشر؟',
    pointsA:
      'نعم. أنشئ حساباً مجانياً وكل إقامة مكتملة تجمع نقاطاً لإقامات لاحقة. تُضاف النقاط بعد الإقامة وليس عند الحجز.',
    roomTitle: 'أسئلة عن هذه الغرفة',
    roomSleepsQ: 'كم شخصاً تتسع له {room}؟',
    roomSleepsA: 'تتسع {room} حتى {guests}.',
    roomSleepsLayoutA:
      'تتسع {room} حتى {guests}، وتتكوّن من {layout} — فلا تضطر العائلة أو الإقامة الطويلة إلى غرفة واحدة.',
    roomIncludesQ: 'ماذا يشمل حجز {room}؟',
    roomIncludesA: '{list}. كل ذلك ضمن السعر، ولا يُضاف شيء عند الاستقبال.',
    roomPriceQ: 'كم سعر {room} في الليلة؟',
    roomPriceA:
      'تبدأ {room} من {price} في الليلة. ابحث بتواريخك في هذه الصفحة، والسعر الذي يظهر لك هو ما تدفعه في الفندق.',
    roomBookQ: 'كيف أحجز {room}؟',
    roomBookA:
      'اختر تواريخك في هذه الصفحة وأكّد الحجز باسم ورقم هاتف. يصلك رقم الحجز فوراً، ويمكنك إلغاؤه بنفسك مجاناً في أي وقت قبل يوم الوصول.',
    roomBookPhoneA:
      'اختر تواريخك في هذه الصفحة وأكّد الحجز باسم ورقم هاتف — يصلك رقم الحجز فوراً. وإن كنت تفضّل التحدث إلى أحد، راسلنا على واتساب أو اتصل على {phone}.',
    groupTitle: 'أسئلة عن المجموعة',
    countQ: 'كم فندقاً لدى ماي فلاور؟',
    countA: 'لدينا {count}، جميعها في {city}: {list}.',
    chooseQ: 'في أيها أقيم؟',
    chooseA:
      'هي في مناطق مختلفة من {city}، لذا الأنسب عادةً هو الأقرب إلى المكان الذي تحتاج أن تكون فيه. لكل فندق صفحته التي تعرض غرفه وأسعاره وموقعه بالضبط على الخريطة.',
    ownedQ: 'من يملك فنادق ماي فلاور؟',
    ownedA:
      'مجموعة مستقلة مملوكة عراقياً، تديرها عائلة واحدة، وليست تحت إدارة علامة أجنبية. معظم الأسماء الفندقية في هذا البلد التي تملك أكثر من فندق هي شركات عالمية تُدير مبنى نيابة عن مالكه؛ هذه ليست منها.',
    erbilQ: 'أين أقيم في {city}؟',
    erbilA:
      'يعتمد على المكان الذي تريد أن تكون قريباً منه. لدينا {count} فنادق في {city} — {list} — فالسؤال المفيد هو أي جزء من المدينة تحتاجه. صفحة كل فندق تعرض شارعه وغرفه وموقعه بدقة على الخريطة.',
    groupContactQ: 'كيف أتواصل معكم؟',
    groupContactA:
      'راسلنا على واتساب أو اتصل على {phone}. يصل إلينا مباشرة ليلاً أو نهاراً، وهو أسرع طريقة للسؤال عن أي من الفنادق.',
  },
  email: {
    confirmEyebrow: 'تم تأكيد الحجز',
    confirmTitle: 'تم حجز غرفتك، {name}',
    confirmLead:
      'شكراً لحجزك معنا مباشرة. كل ما تحتاجه أدناه — والشيء الوحيد الجدير بالحفظ هو رقم الحجز.',
    refLabel: 'رقم حجزك',
    stayTitle: 'إقامتك',
    hotelTitle: 'الفندق',
    guestTitle: 'الضيف',
    knowTitle: 'معلومات مهمة',
    lHotel: 'الفندق',
    lRoom: 'الغرفة',
    lArriving: 'الوصول',
    lLeaving: 'المغادرة',
    lNights: 'الليالي',
    lGuests: 'عدد الضيوف',
    lQuoted: 'السعر المقدَّر',
    lAddress: 'العنوان',
    lPhone: 'الهاتف',
    lName: 'الاسم',
    lEmail: 'البريد',
    lNotes: 'ملاحظات',
    lLanguage: 'حُجز بلغة',
    lCheckIn: 'الدخول من',
    lCheckOut: 'الخروج قبل',
    payNotice:
      '<strong>لم يُخصم أي مبلغ.</strong> تدفع في الفندق عند وصولك — نقداً أو بالبطاقة، كما يناسبك.',
    cancelNotice:
      '<strong>إلغاء مجاني</strong> في أي وقت قبل يوم الوصول، ويمكنك ذلك بنفسك من الرابط أدناه.',
    deskNotice: 'عند الاستقبال، اذكر اسمك أو رقم الحجز أعلاه. هذا كل ما نحتاجه.',
    btnManage: 'عرض الحجز أو إلغاؤه',
    btnDirections: 'الحصول على الاتجاهات',
    btnWhatsApp: 'راسلنا على واتساب',
    footerGuest:
      'نتطلع لاستقبالك. إن كان أي شيء في هذا الحجز غير صحيح، ردّ على هذا البريد أو راسلنا على واتساب — يقرأهما شخص حقيقي.',
    footerHotel: 'أُرسل من الموقع عند حجز ضيف. الحجز موجود بالفعل في لوحة الإدارة.',
    subjGuest: 'حجزك في {hotel} — {ref}',
    subjHotel: 'حجز جديد {ref} — {hotel} — {date}',
    preGuest: '{ref} · {arriving} · {nights}',
    preHotel: '{guest} · {room} · {arriving}',
    newEyebrow: 'حجز جديد',
    newTitle: 'حجز جديد في {hotel}',
    newLead: 'حجز ضيف من خلال الموقع. الغرفة خارج المتاح لهذه الليالي.',
    cxEyebrow: 'أُلغي الحجز',
    cxTitle: 'تم إلغاء حجزك',
    cxLead: 'هذا سجلك بذلك. لا شيء للدفع، ولا شيء آخر عليك فعله.',
    cxNotice:
      'إن لم تكن أنت من ألغى الحجز، اتصل بنا فوراً وسنعيده إن كانت الغرفة ما زالت متاحة.',
    cxHotelTitle: 'أُلغي — {hotel}',
    cxHotelLead: 'ألغى الضيف الحجز من الموقع. الغرفة عادت للبيع — احذفها من الدفتر.',
    subjGuestCx: 'أُلغي — {ref} — {hotel}',
    subjHotelCx: 'أُلغي {ref} — {hotel} — {date}',
    preGuestCx: 'أُلغي {ref}. لا شيء للدفع.',
    preHotelCx: '{guest} · {room} · {arriving} — الغرفة عادت للبيع',
    lRate: 'لليلة',
    lTotal: 'الإجمالي',
    lStayLength: '{count} ليالٍ',
    freeUntil: 'الإلغاء مجاني حتى {date}',
    btnCalendar: 'أضِف إلى التقويم',
    btnPass: 'عرض أو طباعة تأكيد الحجز',
    footerContact: '{hotel}<br>{address}<br>{phone}',
    footerWhy: 'وصلتك هذه الرسالة لأن هذا العنوان أُدخل عند إجراء الحجز.',
    payAtHotel: 'تُدفع في الفندق',
    checkInAny: 'الاستقبال مفتوح 24 ساعة',
    cancelSelf: '— ويمكنك ذلك بنفسك من الزر أدناه.',
  },
  errors: {
    eyebrow: 'حدث خطأ ما',
    title: 'لم تُحمَّل هذه الصفحة',
    body: 'الخطأ منّا لا منك. حاول مرة أخرى — وإن تكرر، اتصل بالفندق وسنأخذ حجزك عبر الهاتف.',
    retry: 'حاول مرة أخرى',
    home: 'العودة إلى الصفحة الرئيسية',
    reference: 'رقم الخطأ',
  },
  seo: {
    hotelIn: 'فندق في',
    hotelsIn: 'فنادق في',
    locality: 'أربيل',
    region: 'إقليم كردستان، العراق',
    country: 'العراق',
    bookDirect: 'احجز مباشرة وادفع في الفندق',
    ownedSince: 'ملكية عراقية منذ {year}',
    hotelGroupIn: 'مجموعة فنادق عراقية في',
    groupDescription:
      'مجموعة فنادق عائلية مستقلة تضم {count} فنادق في {city} — ملكية عراقية، وليست ' +
      'علامة أجنبية. عناوين وغرف وأسعار كل فندق، وحجز مباشر بلا بطاقة وبلا رسوم.',
  },
  reviews: {
    title: 'ماذا قال الضيوف',
    fromCount: 'من {count} تقييم',
    verified: 'إقامة موثقة',
    leaveTitle: 'كيف كانت إقامتك؟',
    leaveLead: 'لقد أقمت لدينا، لذا يحمل تقييمك علامة التوثيق.',
    send: 'أرسل تقييمي',
    thanks: 'شكراً — وصلنا تقييمك. سيظهر بعد قراءته.',
    moderated: 'تُقرأ التقييمات قبل نشرها.',
    already: 'تم تقييم هذه الإقامة من قبل، أو أنها لم تنتهِ بعد.',
    guestsSay: 'ماذا يقول ضيوفنا',
  },
  bed: { single: 'مفرد', double: 'مزدوج', twin: 'سريران', king: 'كينغ', suite: 'جناح' },
  amenity: {
    wifi: 'واي فاي',
    breakfast: 'فطور',
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
