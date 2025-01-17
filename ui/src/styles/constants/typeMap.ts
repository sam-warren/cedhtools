export const cardTypeMap: Record<string, string> = {
  'other': 'not in deck',
  '1': 'battles',
  '2': 'planeswalkers',
  '3': 'creatures',
  '4': 'sorceries',
  '5': 'instants',
  '6': 'artifacts',
  '7': 'enchantments',
  '8': 'lands',
} as const;
