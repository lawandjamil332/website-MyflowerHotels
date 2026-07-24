import * as migration_20260724_190205_initial from './20260724_190205_initial';
import * as migration_20260724_224314_branches_rooms_enquiries from './20260724_224314_branches_rooms_enquiries';
import * as migration_20260724_225255_site_settings from './20260724_225255_site_settings';

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
    name: '20260724_225255_site_settings'
  },
];
