import * as migration_20260724_190205_initial from './20260724_190205_initial';
import * as migration_20260724_224314_branches_rooms_enquiries from './20260724_224314_branches_rooms_enquiries';
import * as migration_20260724_225255_site_settings from './20260724_225255_site_settings';
import * as migration_20260725_102759_branch_contact_and_brand_details from './20260725_102759_branch_contact_and_brand_details';
import * as migration_20260725_103525_branch_opening_status from './20260725_103525_branch_opening_status';
import * as migration_20260725_110500_seed_hotels from './20260725_110500_seed_hotels';
import * as migration_20260725_160439_branch_check_in_any_time from './20260725_160439_branch_check_in_any_time';
import * as migration_20260725_221500_seed_photos from './20260725_221500_seed_photos';
import * as migration_20260725_230500_photos_multi_select from './20260725_230500_photos_multi_select';
import * as migration_20260727_070000_postgres_file_storage from './20260727_070000_postgres_file_storage';
import * as migration_20260727_075000_settings_iqd_per_usd from './20260727_075000_settings_iqd_per_usd';
import * as migration_20260727_078000_offers from './20260727_078000_offers';
import * as migration_20260727_079000_bookings from './20260727_079000_bookings';
import * as migration_20260727_080000_seed_photos from './20260727_080000_seed_photos';
import * as migration_20260727_090000_branch_social_and_maps from './20260727_090000_branch_social_and_maps';
import * as migration_20260727_100000_repin_branches from './20260727_100000_repin_branches';
import * as migration_20260727_110000_fourth_hotel_phones from './20260727_110000_fourth_hotel_phones';
import * as migration_20260727_120000_first_hotel_second_line from './20260727_120000_first_hotel_second_line';

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
    name: '20260725_160439_branch_check_in_any_time'
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
];
