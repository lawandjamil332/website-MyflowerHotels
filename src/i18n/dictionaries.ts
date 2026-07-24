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
export type Dictionary = {
  nav: { branches: string; rooms: string; about: string; contact: string }
  home: {
    chooseBranch: string
    chooseBranchLead: string
    featuredRooms: string
    viewAllRooms: string
  }
  branch: {
    rooms: string
    amenities: string
    gallery: string
    location: string
    checkIn: string
    checkOut: string
    getDirections: string
    enquire: string
    bookNow: string
    noRooms: string
  }
  room: {
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
  bed: Record<'single' | 'double' | 'twin' | 'king' | 'suite', string>
  amenity: Record<string, string>
  common: {
    whatsapp: string
    call: string
    email: string
    language: string
    viewDetails: string
    skipToContent: string
  }
}

const en: Dictionary = {
  nav: { branches: 'Our hotels', rooms: 'Rooms', about: 'About', contact: 'Contact' },
  home: {
    chooseBranch: 'Three hotels in Erbil',
    chooseBranchLead: 'Choose the one that suits your stay.',
    featuredRooms: 'Rooms',
    viewAllRooms: 'View all rooms',
  },
  branch: {
    rooms: 'Rooms at this hotel',
    amenities: 'What this hotel offers',
    gallery: 'Gallery',
    location: 'Where to find us',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    getDirections: 'Get directions',
    enquire: 'Enquire about a stay',
    bookNow: 'Book instantly',
    noRooms: 'Rooms for this hotel are being added.',
  },
  room: {
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
  },
}

const ku: Dictionary = {
  nav: { branches: 'هۆتێلەکانمان', rooms: 'ژوورەکان', about: 'دەربارە', contact: 'پەیوەندی' },
  home: {
    chooseBranch: 'سێ هۆتێل لە هەولێر',
    chooseBranchLead: 'ئەوەی گونجاوە بۆ مانەوەت هەڵبژێرە.',
    featuredRooms: 'ژوورەکان',
    viewAllRooms: 'بینینی هەموو ژوورەکان',
  },
  branch: {
    rooms: 'ژوورەکانی ئەم هۆتێلە',
    amenities: 'ئەم هۆتێلە چی پێشکەش دەکات',
    gallery: 'وێنەکان',
    location: 'شوێنمان',
    checkIn: 'چوونەژوورەوە',
    checkOut: 'چوونەدەرەوە',
    getDirections: 'ڕێنمایی بۆ گەیشتن',
    enquire: 'داواکاری بۆ مانەوە',
    bookNow: 'حیجزی خێرا',
    noRooms: 'ژوورەکانی ئەم هۆتێلە زیاد دەکرێن.',
  },
  room: {
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
  },
}

const ar: Dictionary = {
  nav: { branches: 'فنادقنا', rooms: 'الغرف', about: 'من نحن', contact: 'اتصل بنا' },
  home: {
    chooseBranch: 'ثلاثة فنادق في أربيل',
    chooseBranchLead: 'اختر ما يناسب إقامتك.',
    featuredRooms: 'الغرف',
    viewAllRooms: 'عرض جميع الغرف',
  },
  branch: {
    rooms: 'غرف هذا الفندق',
    amenities: 'ما يقدمه هذا الفندق',
    gallery: 'معرض الصور',
    location: 'موقعنا',
    checkIn: 'تسجيل الوصول',
    checkOut: 'تسجيل المغادرة',
    getDirections: 'الحصول على الاتجاهات',
    enquire: 'استفسر عن الإقامة',
    bookNow: 'احجز فوراً',
    noRooms: 'تتم إضافة غرف هذا الفندق.',
  },
  room: {
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
  },
}

const dictionaries: Record<Locale, Dictionary> = { en, ku, ar }

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale] ?? en
