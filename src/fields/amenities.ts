import type { Option } from 'payload'

/**
 * Amenities offered by a whole property. Labels are written in English here;
 * the admin panel shows these to staff, while guests see the translated
 * labels rendered by the frontend.
 */
export const branchAmenityOptions: Option[] = [
  { label: 'Wi-Fi', value: 'wifi' },
  { label: 'Parking', value: 'parking' },
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Gym', value: 'gym' },
  { label: 'Pool', value: 'pool' },
  { label: 'Airport shuttle', value: 'airport_shuttle' },
  { label: 'Family rooms', value: 'family_rooms' },
  { label: 'Generator', value: 'generator' },
]

/**
 * Amenities that belong to an individual room. The brief did not enumerate
 * these, so this is a starting set for a city hotel — add or remove freely,
 * but changing a `value` after rooms exist orphans the saved data.
 */
export const roomAmenityOptions: Option[] = [
  { label: 'Air conditioning', value: 'air_conditioning' },
  { label: 'Private bathroom', value: 'private_bathroom' },
  { label: 'Wi-Fi', value: 'wifi' },
  { label: 'Flat-screen TV', value: 'tv' },
  { label: 'Minibar', value: 'minibar' },
  { label: 'Safe', value: 'safe' },
  { label: 'Kettle', value: 'kettle' },
  { label: 'Desk', value: 'desk' },
  { label: 'Balcony', value: 'balcony' },
  { label: 'City view', value: 'city_view' },
  { label: 'Bathtub', value: 'bathtub' },
  { label: 'Room service', value: 'room_service' },
]
