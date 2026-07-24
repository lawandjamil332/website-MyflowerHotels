import * as migration_20260724_190205_initial from './20260724_190205_initial';

export const migrations = [
  {
    up: migration_20260724_190205_initial.up,
    down: migration_20260724_190205_initial.down,
    name: '20260724_190205_initial'
  },
];
