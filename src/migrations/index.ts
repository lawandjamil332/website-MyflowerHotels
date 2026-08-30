import * as migration_20260724_190205_initial from './20260724_190205_initial'
import * as migration_20260724_224314_branches_rooms_enquiries from './20260724_224314_branches_rooms_enquiries'
import * as migration_20260724_225255_site_settings from './20260724_225255_site_settings'
import * as migration_20260725_102759_branch_contact_and_brand_details from './20260725_102759_branch_contact_and_brand_details'
import * as migration_20260725_103525_branch_opening_status from './20260725_103525_branch_opening_status'
import * as migration_20260725_110500_seed_hotels from './20260725_110500_seed_hotels'
import * as migration_20260725_160439_branch_check_in_any_time from './20260725_160439_branch_check_in_any_time'
import * as migration_20260725_221500_seed_photos from './20260725_221500_seed_photos'
import * as migration_20260725_230500_photos_multi_select from './20260725_230500_photos_multi_select'
import * as migration_20260727_070000_postgres_file_storage from './20260727_070000_postgres_file_storage'
import * as migration_20260727_075000_settings_iqd_per_usd from './20260727_075000_settings_iqd_per_usd'
import * as migration_20260727_078000_offers from './20260727_078000_offers'
import * as migration_20260727_079000_bookings from './20260727_079000_bookings'
import * as migration_20260727_079500_guests_and_points from './20260727_079500_guests_and_points'
import * as migration_20260727_079700_booking_idempotency from './20260727_079700_booking_idempotency'
import * as migration_20260727_079800_media_alt_optional from './20260727_079800_media_alt_optional'
import * as migration_20260727_079900_room_layout from './20260727_079900_room_layout'
import * as migration_20260727_079950_low_stock_threshold from './20260727_079950_low_stock_threshold'
import * as migration_20260727_080000_seed_photos from './20260727_080000_seed_photos'
import * as migration_20260727_090000_branch_social_and_maps from './20260727_090000_branch_social_and_maps'
import * as migration_20260727_100000_repin_branches from './20260727_100000_repin_branches'
import * as migration_20260727_110000_fourth_hotel_phones from './20260727_110000_fourth_hotel_phones'
import * as migration_20260727_120000_first_hotel_second_line from './20260727_120000_first_hotel_second_line'
import * as migration_20260728_080100_reviews from './20260728_080100_reviews'
import * as migration_20260730_130000_booking_locale from './20260730_130000_booking_locale'
import * as migration_20260730_150000_breakfast_amenity from './20260730_150000_breakfast_amenity'
import * as migration_20260815_120000_review_requested from './20260815_120000_review_requested'
import * as migration_20260815_140000_branch_nearby from './20260815_140000_branch_nearby'
import * as migration_20260815_150000_pin_and_link_hotels from './20260815_150000_pin_and_link_hotels'
import * as migration_20260815_160000_booking_reputation from './20260815_160000_booking_reputation'
import * as migration_20260815_170000_branch_names_ku_ar from './20260815_170000_branch_names_ku_ar'
import * as migration_20260815_180000_branch_address_ku_ar from './20260815_180000_branch_address_ku_ar'
import * as migration_20260815_190000_room_names_ku_ar from './20260815_190000_room_names_ku_ar'
import * as migration_20260826_100000_branch_tripadvisor from './20260826_100000_branch_tripadvisor'
import * as migration_20260826_110000_fourth_hotel_open from './20260826_110000_fourth_hotel_open'
import * as migration_20260826_120000_rates_valid_until from './20260826_120000_rates_valid_until'
import * as migration_20260826_130000_branch_google_place_id from './20260826_130000_branch_google_place_id'
import * as migration_20260826_140000_local_claim_checked from './20260826_140000_local_claim_checked'
import * as migration_20260826_150000_branch_postal_code from './20260826_150000_branch_postal_code'
import * as migration_20260830_090000_room_rates from './20260830_090000_room_rates'
import * as migration_20260830_100000_room_rates_min_stay from './20260830_100000_room_rates_min_stay'

export const migrations = [
  {
    up: migration_20260724_190205_initial.up,
    down: migration_20260724_190205_initial.down,
    name: '20260724_190205_initial',
  },
  {
    up: migration_20260724_224314_branches_rooms_enquiries.up,
    down: migration_20260724_224314_branches_rooms_enquiries.down,
    name: '20260724_224314_branches_rooms_enquiries',
  },
  {
    up: migration_20260724_225255_site_settings.up,
    down: migration_20260724_225255_site_settings.down,
    name: '20260724_225255_site_settings',
  },
  {
    up: migration_20260725_102759_branch_contact_and_brand_details.up,
    down: migration_20260725_102759_branch_contact_and_brand_details.down,
    name: '20260725_102759_branch_contact_and_brand_details',
  },
  {
    up: migration_20260725_103525_branch_opening_status.up,
    down: migration_20260725_103525_branch_opening_status.down,
    name: '20260725_103525_branch_opening_status',
  },
  {
    up: migration_20260725_110500_seed_hotels.up,
    down: migration_20260725_110500_seed_hotels.down,
    name: '20260725_110500_seed_hotels',
  },
  {
    up: migration_20260725_160439_branch_check_in_any_time.up,
    down: migration_20260725_160439_branch_check_in_any_time.down,
    name: '20260725_160439_branch_check_in_any_time',
  },
  {
    up: migration_20260725_221500_seed_photos.up,
    down: migration_20260725_221500_seed_photos.down,
    name: '20260725_221500_seed_photos',
  },
  {
    up: migration_20260725_230500_photos_multi_select.up,
    down: migration_20260725_230500_photos_multi_select.down,
    name: '20260725_230500_photos_multi_select',
  },
  {
    up: migration_20260727_070000_postgres_file_storage.up,
    down: migration_20260727_070000_postgres_file_storage.down,
    name: '20260727_070000_postgres_file_storage',
  },
  {
    up: migration_20260727_075000_settings_iqd_per_usd.up,
    down: migration_20260727_075000_settings_iqd_per_usd.down,
    name: '20260727_075000_settings_iqd_per_usd',
  },
  {
    up: migration_20260727_078000_offers.up,
    down: migration_20260727_078000_offers.down,
    name: '20260727_078000_offers',
  },
  {
    up: migration_20260727_079000_bookings.up,
    down: migration_20260727_079000_bookings.down,
    name: '20260727_079000_bookings',
  },
  {
    up: migration_20260727_079500_guests_and_points.up,
    down: migration_20260727_079500_guests_and_points.down,
    name: '20260727_079500_guests_and_points',
  },
  {
    up: migration_20260727_079700_booking_idempotency.up,
    down: migration_20260727_079700_booking_idempotency.down,
    name: '20260727_079700_booking_idempotency',
  },
  {
    up: migration_20260727_079800_media_alt_optional.up,
    down: migration_20260727_079800_media_alt_optional.down,
    name: '20260727_079800_media_alt_optional',
  },
  {
    up: migration_20260727_079900_room_layout.up,
    down: migration_20260727_079900_room_layout.down,
    name: '20260727_079900_room_layout',
  },
  {
    up: migration_20260727_079950_low_stock_threshold.up,
    down: migration_20260727_079950_low_stock_threshold.down,
    name: '20260727_079950_low_stock_threshold',
  },
  // Content seeds run last, after every schema migration — see the note in
  // 20260727_080000_seed_photos for what goes wrong when they do not.
  {
    up: migration_20260727_080000_seed_photos.up,
    down: migration_20260727_080000_seed_photos.down,
    name: '20260727_080000_seed_photos',
  },
  {
    up: migration_20260727_090000_branch_social_and_maps.up,
    down: migration_20260727_090000_branch_social_and_maps.down,
    name: '20260727_090000_branch_social_and_maps',
  },
  {
    up: migration_20260727_100000_repin_branches.up,
    down: migration_20260727_100000_repin_branches.down,
    name: '20260727_100000_repin_branches',
  },
  {
    up: migration_20260727_110000_fourth_hotel_phones.up,
    down: migration_20260727_110000_fourth_hotel_phones.down,
    name: '20260727_110000_fourth_hotel_phones',
  },
  {
    up: migration_20260727_120000_first_hotel_second_line.up,
    down: migration_20260727_120000_first_hotel_second_line.down,
    name: '20260727_120000_first_hotel_second_line',
  },
  {
    up: migration_20260728_080100_reviews.up,
    down: migration_20260728_080100_reviews.down,
    name: '20260728_080100_reviews',
  },
  {
    up: migration_20260730_130000_booking_locale.up,
    down: migration_20260730_130000_booking_locale.down,
    name: '20260730_130000_booking_locale',
  },
  {
    up: migration_20260730_150000_breakfast_amenity.up,
    down: migration_20260730_150000_breakfast_amenity.down,
    name: '20260730_150000_breakfast_amenity',
  },
  {
    up: migration_20260815_120000_review_requested.up,
    down: migration_20260815_120000_review_requested.down,
    name: '20260815_120000_review_requested',
  },
  {
    up: migration_20260815_140000_branch_nearby.up,
    down: migration_20260815_140000_branch_nearby.down,
    name: '20260815_140000_branch_nearby',
  },
  {
    up: migration_20260815_150000_pin_and_link_hotels.up,
    down: migration_20260815_150000_pin_and_link_hotels.down,
    name: '20260815_150000_pin_and_link_hotels',
  },
  {
    up: migration_20260815_160000_booking_reputation.up,
    down: migration_20260815_160000_booking_reputation.down,
    name: '20260815_160000_booking_reputation',
  },
  {
    up: migration_20260815_170000_branch_names_ku_ar.up,
    down: migration_20260815_170000_branch_names_ku_ar.down,
    name: '20260815_170000_branch_names_ku_ar',
  },
  {
    up: migration_20260815_180000_branch_address_ku_ar.up,
    down: migration_20260815_180000_branch_address_ku_ar.down,
    name: '20260815_180000_branch_address_ku_ar',
  },
  {
    up: migration_20260815_190000_room_names_ku_ar.up,
    down: migration_20260815_190000_room_names_ku_ar.down,
    name: '20260815_190000_room_names_ku_ar',
  },
  {
    up: migration_20260826_100000_branch_tripadvisor.up,
    down: migration_20260826_100000_branch_tripadvisor.down,
    name: '20260826_100000_branch_tripadvisor',
  },
  {
    up: migration_20260826_110000_fourth_hotel_open.up,
    down: migration_20260826_110000_fourth_hotel_open.down,
    name: '20260826_110000_fourth_hotel_open',
  },
  {
    up: migration_20260826_120000_rates_valid_until.up,
    down: migration_20260826_120000_rates_valid_until.down,
    name: '20260826_120000_rates_valid_until',
  },
  {
    up: migration_20260826_130000_branch_google_place_id.up,
    down: migration_20260826_130000_branch_google_place_id.down,
    name: '20260826_130000_branch_google_place_id',
  },
  {
    up: migration_20260826_140000_local_claim_checked.up,
    down: migration_20260826_140000_local_claim_checked.down,
    name: '20260826_140000_local_claim_checked',
  },
  {
    up: migration_20260826_150000_branch_postal_code.up,
    down: migration_20260826_150000_branch_postal_code.down,
    name: '20260826_150000_branch_postal_code',
  },
  {
    up: migration_20260830_090000_room_rates.up,
    down: migration_20260830_090000_room_rates.down,
    name: '20260830_090000_room_rates',
  },
  {
    up: migration_20260830_100000_room_rates_min_stay.up,
    down: migration_20260830_100000_room_rates_min_stay.down,
    name: '20260830_100000_room_rates_min_stay',
  },
]
